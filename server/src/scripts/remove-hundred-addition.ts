import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.js";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const prisma = new PrismaClient({ adapter: new PrismaMariaDb(url) });
const marker = "Requested additional 100 units per non-laptop item 2026-10-06";
const yearMarker = "Requested additional 5 units per non-laptop item per academic year 2026-10-06";
try {
  const result = await prisma.$transaction(async (tx) => {
    const rows = await tx.item_detail.findMany({ where: { notes: marker }, include: { qr_code: true, item: { select: { item_name: true, category: { select: { category_name: true } } } }, _count: { select: { laptop_rental: true, transfer_item: true } } } });
    const counts = new Map<string, number>();
    for (const row of rows) counts.set(row.item_id, (counts.get(row.item_id) ?? 0) + 1);
    if (rows.length !== 1700 || counts.size !== 17 || [...counts.values()].some((n) => n !== 100)) throw new Error("Original 100-unit batch differs from expected; no data changed");
    if (rows.some((r) => /laptop|notebook/i.test(`${r.item.item_name} ${r.item.category.category_name}`) || r._count.laptop_rental || r._count.transfer_item || r.status !== "Available" || r.current_room_id !== 1)) throw new Error("Batch includes excluded, used, or moved units; no data changed");
    const yearCounts = await tx.item_detail.groupBy({ by: ["item_id", "budget_year_id"], where: { notes: yearMarker }, _count: { _all: true } });
    if (yearCounts.length !== 204 || yearCounts.some((g) => g._count._all !== 5)) throw new Error("Five-unit academic-year batch does not match expected; no data changed");
    const backupDir = path.join(tmpdir(), "miit-inventory-backups");
    await mkdir(backupDir, { recursive: true });
    const backup = path.join(backupDir, `remove-hundred-addition-${Date.now()}.json`);
    await writeFile(backup, JSON.stringify(rows, null, 2), { flag: "wx" });
    const ids = rows.map((r) => r.item_detail_id);
    await tx.qr_code.deleteMany({ where: { item_detail_id: { in: ids } } });
    const deleted = await tx.item_detail.deleteMany({ where: { item_detail_id: { in: ids }, notes: marker } });
    if (deleted.count !== 1700) throw new Error("Deletion count mismatch");
    if (await tx.item_detail.count({ where: { notes: yearMarker } }) !== 1020) throw new Error("Academic-year batch count changed unexpectedly");
    await tx.activity_log.create({ data: { action: "deleted", module: "Inventory", target_type: "Bulk correction", target_name: "Removed earlier 100-unit additions per non-laptop item", actor_name: "System", details: JSON.stringify({ removed: deleted.count, preserved_per_year_units: 1020 }) } });
    return { removed: deleted.count, preservedYearAdditions: 1020, total: await tx.item_detail.count(), backup };
  }, { maxWait: 10_000, timeout: 300_000 });
  console.log(JSON.stringify(result, null, 2));
} finally { await prisma.$disconnect(); }
