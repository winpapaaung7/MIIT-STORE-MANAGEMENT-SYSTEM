import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.js";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const prisma = new PrismaClient({ adapter: new PrismaMariaDb(url) });
const marker = "Requested additional 20 units per non-laptop item per academic year 2026-10-06";
const revisedMarker = "Requested additional 5 units per non-laptop item per academic year 2026-10-06";
try {
  const result = await prisma.$transaction(async (tx) => {
    const rows = await tx.item_detail.findMany({ where: { notes: marker }, include: { qr_code: true, _count: { select: { laptop_rental: true, transfer_item: true } } }, orderBy: { detail_code: "asc" } });
    if (!rows.length) throw new Error("Original 20-unit batch not found; no data changed");
    const groups = new Map<string, typeof rows>();
    for (const row of rows) {
      const key = `${row.item_id}:${row.budget_year_id}`;
      groups.set(key, [...(groups.get(key) ?? []), row]);
    }
    if (groups.size !== 204 || [...groups.values()].some((g) => g.length !== 20)) throw new Error("Original batch differs from the expected 17 items × 12 years × 20; no data changed");
    const removed = [...groups.values()].flatMap((g) => g.slice(5));
    const retained = [...groups.values()].flatMap((g) => g.slice(0, 5));
    if (removed.some((r) => r._count.laptop_rental || r._count.transfer_item || r.status !== "Available" || r.current_room_id !== 1)) throw new Error("Some excess units were used or moved; no data changed");
    const backupDir = path.join(tmpdir(), "miit-inventory-backups");
    await mkdir(backupDir, { recursive: true });
    const backup = path.join(backupDir, `reduce-year-addition-${Date.now()}.json`);
    await writeFile(backup, JSON.stringify(rows, null, 2), { flag: "wx" });
    const ids = removed.map((r) => r.item_detail_id);
    await tx.qr_code.deleteMany({ where: { item_detail_id: { in: ids } } });
    const deleted = await tx.item_detail.deleteMany({ where: { item_detail_id: { in: ids }, notes: marker } });
    if (deleted.count !== 3060) throw new Error("Deletion count mismatch");
    await tx.item_detail.updateMany({ where: { item_detail_id: { in: retained.map((r) => r.item_detail_id) } }, data: { notes: revisedMarker } });
    const verified = await tx.item_detail.groupBy({ by: ["item_id", "budget_year_id"], where: { notes: revisedMarker }, _count: { _all: true } });
    if (verified.length !== 204 || verified.some((g) => g._count._all !== 5)) throw new Error("Final per-year quantities incorrect");
    await tx.activity_log.create({ data: { action: "updated", module: "Inventory", target_type: "Bulk correction", target_name: "Academic-year additions reduced from 20 to 5 per item", actor_name: "System", details: JSON.stringify({ removed: deleted.count, retained: retained.length, groups: groups.size }) } });
    return { removed: deleted.count, retained: retained.length, total: await tx.item_detail.count(), backup };
  }, { maxWait: 10_000, timeout: 300_000 });
  console.log(JSON.stringify(result, null, 2));
} finally { await prisma.$disconnect(); }
