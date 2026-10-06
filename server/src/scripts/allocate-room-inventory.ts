import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.js";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const prisma = new PrismaClient({ adapter: new PrismaMariaDb(url) });
// Targets are physical units, except bench tables provide three seating places.
const faculty = { "0001": 2, "0003": 1, "0005": 1, "0007": 1, "0008": 8, "0009": 5, "0010": 2, "0011": 2, "0012": 1, "0013": 1, "0014": 1, "0015": 4, "0017": 2 };
const office = { "0001": 1, "0003": 1, "0005": 1, "0007": 1, "0008": 2, "0009": 2, "0010": 4, "0011": 2, "0012": 1, "0015": 2, "0017": 2 };
const classroom = { "0001": 2, "0003": 1, "0005": 1, "0007": 2, "0008": 3, "0011": 1, "0012": 1, "0013": 1, "0014": 1, "0017": 1, "0018": 9 };
const targets: Record<string, Record<string, number>> = {
  "201": faculty, "202": faculty, "301": faculty, "302": faculty,
  "203": office, "205": { ...office, "0004": 1, "0007": 2, "0013": 1, "0014": 1 },
  "102": { ...office, "0004": 1, "0009": 3, "0010": 2, "0015": 3, "0017": 3 },
  "300": { ...office, "0010": 6, "0011": 3 },
  "303": { "0001": 2, "0003": 2, "0005": 1, "0008": 20, "0009": 2, "0010": 2, "0011": 3, "0012": 2, "0015": 5, "0017": 3 },
  "304": { "0001": 1, "0003": 2, "0004": 2, "0005": 1, "0006": 1, "0009": 1, "0010": 6, "0011": 3, "0012": 1, "0015": 2, "0017": 2 },
  "100": { "0003": 1, "0005": 1, "0009": 2, "0011": 2, "0012": 2, "0015": 2, "0017": 2 },
  "204": classroom, "211": classroom,
};
const output = path.resolve("../reports/room-allocation-2026-10-06");
const eligible = (d: any) => ["Available", "Damaged"].includes(d.status) && !d.laptop_rental.length && !d.transfer_item.length;

try {
  const result = await prisma.$transaction(async (tx) => {
    const rooms = await tx.room.findMany({ include: { department: true }, orderBy: { room_id: "asc" } });
    const store = rooms.find((r) => /^(store|storage)$/i.test(r.department.department_name.trim()) && /^(storage|store)$/i.test(r.building_name?.trim() ?? ""));
    if (!store) throw new Error("Store room not found");
    if (rooms.filter((r) => r.room_id !== store.room_id).some((r) => !r.status || !targets[r.building_name ?? ""])) throw new Error("Unexpected or disabled room; allocation needs review");
    const items = await tx.item.findMany({ select: { item_id: true, item_name: true }, orderBy: { item_id: "asc" } });
    if (process.argv.includes("--apply")) for (const item of items) await tx.$queryRaw`SELECT item_id FROM item WHERE item_id = ${item.item_id} FOR UPDATE`;
    const details = await tx.item_detail.findMany({ select: {
      item_detail_id: true, item_id: true, detail_code: true, current_department_id: true, current_room_id: true, status: true,
      laptop_rental: { where: { rental_status: { in: ["pending", "approved", "active", "issued"] } }, select: { rental_id: true } },
      transfer_item: { where: { transfer: { transfer_status: { in: ["Pending", "pending", "In Transit", "in_transit"] } } }, select: { transfer_item_id: true } },
    }, orderBy: { detail_code: "asc" } });
    const original = details.map((d) => ({ ...d }));
    const moves: { id: number; code: string; itemId: string; from: number; to: number; status: string }[] = [];
    const exceptions: string[] = [];
    const move = (d: typeof details[number], to: typeof rooms[number]) => {
      if (d.current_room_id === null) throw new Error("Unassigned inventory requires review");
      moves.push({ id: d.item_detail_id, code: d.detail_code, itemId: d.item_id, from: d.current_room_id, to: to.room_id, status: d.status });
      d.current_room_id = to.room_id; d.current_department_id = to.department_id;
    };
    // Collect surplus first, making usable assets available to other rooms.
    for (const room of rooms.filter((r) => r.room_id !== store.room_id)) {
      const target = targets[room.building_name!];
      for (const item of items) {
        const present = details.filter((d) => d.current_room_id === room.room_id && d.item_id === item.item_id);
        for (const damaged of present.filter((d) => d.status === "Damaged" && eligible(d))) move(damaged, store);
        const usable = present.filter((d) => d.status !== "Damaged" && d.current_room_id === room.room_id);
        const surplus = Math.max(0, usable.length - (target[item.item_id] ?? 0));
        const movable = usable.filter(eligible).slice(0, surplus);
        for (const d of movable) move(d, store);
        if (movable.length < surplus) exceptions.push(`${room.building_name}: ${item.item_name}, ${surplus - movable.length} excess units retained because in use/reserved.`);
      }
    }
    // Fill each room up to the target; never move active rental units.
    for (const room of rooms.filter((r) => r.room_id !== store.room_id)) {
      for (const [itemId, target] of Object.entries(targets[room.building_name!])) {
        const current = details.filter((d) => d.current_room_id === room.room_id && d.item_id === itemId && d.status !== "Damaged").length;
        const shortage = Math.max(0, target - current);
        const candidates = details.filter((d) => d.current_room_id === store.room_id && d.item_id === itemId && d.status === "Available" && eligible(d)).slice(0, shortage);
        for (const d of candidates) move(d, room);
        if (candidates.length < shortage) exceptions.push(`${room.building_name}: ${itemId}, shortage ${shortage - candidates.length}.`);
      }
    }
    // Collapse intermediate Store hops to one direct transfer per physical unit.
    const effectiveMoves = details.flatMap((d) => {
      const old = original.find((o) => o.item_detail_id === d.item_detail_id)!;
      return old.current_room_id === d.current_room_id ? [] : [{ id: d.item_detail_id, code: d.detail_code, itemId: d.item_id, from: old.current_room_id!, to: d.current_room_id!, status: d.status }];
    });
    const groups = new Map<string, typeof effectiveMoves>();
    for (const m of effectiveMoves) { const key = `${m.from}:${m.to}`; groups.set(key, [...(groups.get(key) ?? []), m]); }
    const summary = rooms.map((room) => ({ roomId: room.room_id, room: room.building_name, department: room.department.department_name,
      before: original.filter((d) => d.current_room_id === room.room_id).length,
      after: details.filter((d) => d.current_room_id === room.room_id).length,
      incoming: effectiveMoves.filter((m) => m.to === room.room_id).length,
      outgoing: effectiveMoves.filter((m) => m.from === room.room_id).length }));
    const report = { generatedAt: new Date().toISOString(), assumptions: "Classrooms: 30 seats (9 three-seat bench tables + 3 chairs). Faculty: 12 seats. Library: 20 reading chairs. Other rooms: conservative office/clinic needs. Physical capacities not measured; database allocations only.", total: details.length, moved: effectiveMoves.length, transfers: groups.size, summary, exceptions, targets };
    await mkdir(output, { recursive: true });
    await writeFile(path.join(output, "allocation-plan.json"), JSON.stringify({ ...report, moves: effectiveMoves }, null, 2));
    if (process.argv.includes("--apply")) {
      const admin = await tx.users.findFirst({ where: { status: "Active", role: { role_code: "ADMIN" } }, select: { user_id: true } });
      if (!admin) throw new Error("No active admin available for transfer attribution");
      const folder = path.join(tmpdir(), "miit-inventory-backups"); await mkdir(folder, { recursive: true });
      const backup = path.join(folder, `room-allocation-${Date.now()}.json`);
      await writeFile(backup, JSON.stringify({ original, report }, null, 2), { flag: "wx" });
      for (const group of groups.values()) {
        const from = rooms.find((r) => r.room_id === group[0].from)!;
        const to = rooms.find((r) => r.room_id === group[0].to)!;
        const now = new Date();
        const code = `TRF-20261006-${randomUUID().slice(0, 8)}`;
        const remarks = "System allocation requested by administrator: room needs balanced; surplus retained in Store.";
        const transfer = await tx.transfer.create({ data: { transfer_code: code, from_department_id: from.department_id, from_room_id: from.room_id, to_department_id: to.department_id, to_room_id: to.room_id, initiated_by: admin.user_id, transfer_date: now, transfer_status: "Completed", remarks,
          transfer_item: { create: group.map((m) => ({ item_detail_id: m.id, condition_before: m.status, item_status: m.status })) } } });
        const updated = await tx.item_detail.updateMany({ where: { item_detail_id: { in: group.map((m) => m.id) }, current_room_id: from.room_id, current_department_id: from.department_id, status: { in: ["Available", "Damaged"] }, laptop_rental: { none: { rental_status: { in: ["pending", "approved", "active", "issued"] } } } }, data: { current_room_id: to.room_id, current_department_id: to.department_id } });
        if (updated.count !== group.length) throw new Error("Location changed during allocation; rolling back");
        await tx.activity_log.create({ data: { action: "transferred", module: "Transfer", target_type: "Item transfer", target_id: String(transfer.transfer_id), target_name: code, actor_name: "System (administrator-requested allocation)", created_at: now,
          details: JSON.stringify({ from_department: from.department.department_name, from_room: from.building_name, to_department: to.department.department_name, to_room: to.building_name, item_count: group.length, item_detail_codes: group.map((m) => m.code).join(", "), transfer_date: now.toISOString(), remarks }) } });
      }
      if (await tx.item_detail.count() !== details.length) throw new Error("Inventory total changed during allocation");
      for (const room of summary) if (await tx.item_detail.count({ where: { current_room_id: room.roomId } }) !== room.after) throw new Error("Room quantity verification failed");
      await writeFile(path.join(output, "completed.json"), JSON.stringify({ ...report, backup }, null, 2));
      return { ...report, backup, applied: true };
    }
    return { ...report, applied: false };
  }, { isolationLevel: "ReadCommitted", maxWait: 30_000, timeout: 300_000 });
  console.log(JSON.stringify(result, null, 2));
} finally { await prisma.$disconnect(); }
