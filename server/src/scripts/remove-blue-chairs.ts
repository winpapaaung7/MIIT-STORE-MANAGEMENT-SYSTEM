import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.js";
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const prisma = new PrismaClient({ adapter: new PrismaMariaDb(url) });
try {
  const item = await prisma.item.findUnique({ where: { item_id: "0008" } });
  if (!item || item.item_name.trim().toLowerCase() !== "blue chair") throw new Error("Expected blue chair item 0008 not found");
  const total = await prisma.item_detail.count({ where: { item_id: item.item_id } });
  const eligible = await prisma.item_detail.count({ where: { item_id: item.item_id, status: "Available", current_room_id: 1, laptop_rental: { none: {} }, transfer_item: { none: {} } } });
  console.log(JSON.stringify({ item: item.item_name, itemId: item.item_id, total, eligible, requested: 1500 }));
  if (process.argv.includes("--apply")) {
    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT item_id FROM item WHERE item_id = ${item.item_id} FOR UPDATE`;
      const before = await tx.item_detail.count({ where: { item_id: item.item_id } });
      const rows = await tx.item_detail.findMany({ where: { item_id: item.item_id, status: "Available", current_room_id: 1, laptop_rental: { none: {} }, transfer_item: { none: {} } }, include: { qr_code: true }, orderBy: { detail_code: "desc" }, take: 1500 });
      if (rows.length !== 1500) throw new Error(`Only ${rows.length} eligible units; no deletion performed`);
      const folder = path.join(tmpdir(), "miit-inventory-backups");
      await mkdir(folder, { recursive: true });
      const backup = path.join(folder, `blue-chair-1500-${Date.now()}.json`);
      await writeFile(backup, JSON.stringify({ item, details: rows }, null, 2), { flag: "wx" });
      const ids = rows.map((row) => row.item_detail_id);
      await tx.qr_code.deleteMany({ where: { item_detail_id: { in: ids } } });
      const deleted = await tx.item_detail.deleteMany({ where: { item_detail_id: { in: ids }, item_id: item.item_id, status: "Available", current_room_id: 1, laptop_rental: { none: {} }, transfer_item: { none: {} } } });
      if (deleted.count !== 1500) throw new Error("Deletion count mismatch");
      const after = await tx.item_detail.count({ where: { item_id: item.item_id } });
      if (before - after !== 1500) throw new Error("Final quantity mismatch");
      await tx.activity_log.create({ data: { action: "deleted", module: "Inventory", target_type: "Item details", target_id: item.item_id, target_name: item.item_name, actor_name: "System", created_at: new Date(), details: JSON.stringify({ removed_units: 1500, quantity_before: before, quantity_after: after, first_removed_code: rows.at(-1)?.detail_code, last_removed_code: rows[0].detail_code, source: "Requested inventory correction" }) } });
      return { deleted: deleted.count, before, remaining: after, backup };
    }, { isolationLevel: "ReadCommitted", maxWait: 30_000, timeout: 300_000 });
    console.log(JSON.stringify(result, null, 2));
  }
} finally { await prisma.$disconnect(); }
