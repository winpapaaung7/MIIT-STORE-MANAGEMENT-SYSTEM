import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set");
const prisma = new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) });
const csv = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`;
const md = (v: unknown) => String(v ?? "").replaceAll("|", "\\|").replaceAll("\n", " ");
try {
  const [rooms, details] = await prisma.$transaction(async (tx) => Promise.all([
    tx.room.findMany({ include: { department: true }, orderBy: { room_id: "asc" } }),
    tx.item_detail.findMany({
      select: { item_detail_id: true, detail_code: true, item_id: true, current_department_id: true, current_room_id: true, status: true,
        item: { select: { item_code: true, item_name: true, category: { select: { category_name: true } } } },
        department: { select: { department_name: true } }, room: { select: { department_id: true, building_name: true } }, budget_year: { select: { year_name: true } },
        laptop_rental: { where: { rental_status: { in: ["pending", "approved", "active", "issued"] } }, select: { rental_id: true, rental_status: true } } },
      orderBy: { detail_code: "asc" },
    }),
  ]), { maxWait: 10_000, timeout: 180_000 });
  const groups: any[] = rooms.map((r) => ({ id: r.room_id, department: r.department.department_name, room: r.building_name ?? "Room number not assigned", enabled: r.status, details: [] }));
  for (const detail of details) {
    let group = detail.current_room_id == null
      ? groups.find((g) => g.id === null && g.departmentId === detail.current_department_id)
      : groups.find((g) => g.id === detail.current_room_id);
    if (!group) {
      group = { id: null, departmentId: detail.current_department_id, department: detail.department?.department_name ?? "No department", room: "No room assigned", enabled: null, details: [] };
      groups.push(group);
    }
    group.details.push(detail);
  }
  groups.sort((a, b) => b.details.length - a.details.length || a.department.localeCompare(b.department));
  const summary = groups.map((g) => ({ roomId: g.id, department: g.department, room: g.room, enabled: g.enabled,
    total: g.details.length,
    available: g.details.filter((d: any) => d.status === "Available").length,
    inUse: g.details.filter((d: any) => d.status === "In Use").length,
    damaged: g.details.filter((d: any) => d.status === "Damaged").length,
    other: g.details.filter((d: any) => !["Available", "In Use", "Damaged"].includes(d.status)).length,
    ongoingRentals: g.details.filter((d: any) => d.laptop_rental.length).length,
  }));
  const mismatches = details.filter((d) => d.room && d.room.department_id !== d.current_department_id);
  const unassigned = details.filter((d) => d.current_room_id === null);
  const generatedAt = new Date().toISOString();
  const lines = ["# Current inventory by room", "", `Snapshot: ${generatedAt}`, "", `Physical units (item_detail rows): ${details.length}. Rooms: ${rooms.length}. Units without a room: ${unassigned.length}. Department/room mismatches: ${mismatches.length}.`, "",
    "| Room ID | Department | Room | Total | Available | In Use | Damaged | Other | Ongoing rental units |", "|---|---|---|---:|---:|---:|---:|---:|---:|---:|"];
  for (const s of summary) lines.push(`| ${s.roomId ?? "—"} | ${md(s.department)} | ${md(s.room)} | ${s.total} | ${s.available} | ${s.inUse} | ${s.damaged} | ${s.other} | ${s.ongoingRentals} |`);
  for (const g of groups) {
    lines.push("", `## ${md(g.department)} / ${md(g.room)} (room ID ${g.id ?? "none"})`, "", `Room enabled: ${g.enabled ?? "not applicable"}. Physical units: ${g.details.length}.`, "", "| Item code | Item | Category | Total | Status counts |", "|---|---|---|---:|---|");
    const items = new Map<string, any>();
    for (const d of g.details) {
      const item = items.get(d.item_id) ?? { code: d.item.item_code, name: d.item.item_name, category: d.item.category.category_name, count: 0, statuses: {} };
      item.count++; item.statuses[d.status] = (item.statuses[d.status] ?? 0) + 1; items.set(d.item_id, item);
    }
    for (const i of items.values()) lines.push(`| ${i.code} | ${md(i.name)} | ${md(i.category)} | ${i.count} | ${md(Object.entries(i.statuses).map(([k,v]) => `${k}: ${v}`).join(", "))} |`);
    if (!g.details.length) lines.push("| — | Empty room | — | 0 | — |");
  }
  lines.push("", "## Location consistency", "");
  for (const d of mismatches) lines.push(`- ${d.detail_code}: item department ${d.department?.department_name ?? "none"}; room ID ${d.current_room_id} belongs to department ID ${d.room?.department_id}.`);
  if (!mismatches.length) lines.push("No department/room mismatches found.");
  const header = ["detail_id", "detail_code", "item_code", "item_name", "category", "department", "room_id", "room", "status", "academic_year", "ongoing_rentals"];
  const records = details.map((d) => [d.item_detail_id, d.detail_code, d.item.item_code, d.item.item_name, d.item.category.category_name, d.department?.department_name, d.current_room_id, d.current_room_id == null ? "No room assigned" : d.room?.building_name ?? "Room number not assigned", d.status, d.budget_year.year_name, d.laptop_rental.map((r) => `${r.rental_id}:${r.rental_status}`).join("; ")]);
  const output = path.resolve("../reports/room-inventory-2026-10-06");
  await mkdir(output, { recursive: true });
  await writeFile(path.join(output, "report.md"), lines.join("\n") + "\n");
  await writeFile(path.join(output, "item-details.csv"), "\ufeff" + [header, ...records].map((r) => r.map(csv).join(",")).join("\r\n"));
  await writeFile(path.join(output, "summary.json"), JSON.stringify({ generatedAt, total: details.length, rooms: rooms.length, unassigned: unassigned.length, mismatchCount: mismatches.length, summary }, null, 2));
  console.log(JSON.stringify({ output, total: details.length, rooms: rooms.length, unassigned: unassigned.length, mismatches: mismatches.length, summary }, null, 2));
} finally { await prisma.$disconnect(); }
