import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.js";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const prisma = new PrismaClient({ adapter: new PrismaMariaDb(url) });
const perYear = process.argv.includes("--per-year");
const quantity = perYear ? 5 : 100;
const marker = perYear ? "Requested additional 5 units per non-laptop item per academic year 2026-10-06" : "Requested additional 100 units per non-laptop item 2026-10-06";
try {
  const items = await prisma.item.findMany({ include: { category: true, _count: { select: { item_detail: true } } }, orderBy: { item_code: "asc" } });
  const excluded = items.filter((i) => /laptop|notebook/i.test(`${i.item_name} ${i.category.category_name}`));
  const selected = items.filter((i) => !excluded.some((e) => e.item_id === i.item_id));
  const years = await prisma.budget_year.findMany({ where: perYear ? {} : { year_name: "2026-2027" }, orderBy: { start_date: "asc" } });
  if (!years.length) throw new Error("No academic years found");
  console.log(JSON.stringify({ additions: selected.length * quantity * years.length, years: years.map((y) => y.year_name), items: selected.map((i) => ({ code: i.item_code, name: i.item_name, before: i._count.item_detail, after: i._count.item_detail + quantity * years.length })), excluded: excluded.map((i) => i.item_name) }, null, 2));
  if (process.argv.includes("--apply")) {
    await prisma.$transaction(async (tx) => {
      if (await tx.item_detail.count({ where: { notes: marker } })) throw new Error("This addition has already been applied; refusing to add duplicates");
      const rooms = await tx.room.findMany({ include: { department: true } });
      const room = rooms.find((r) => /^(store|storage)$/i.test(r.department.department_name.trim()) && /^(store|storage)$/i.test(r.building_name?.trim() ?? ""));
      if (!room) throw new Error("Store/Storage room missing");
      const oldDetails = await tx.item_detail.findMany({ select: { item_id: true, detail_code: true } });
      const rows = selected.flatMap((item) => {
        const sequences = oldDetails.filter((d) => d.item_id === item.item_id).map((d) => {
          const match = d.detail_code.match(/^\d{4}-(\d{6})$/);
          if (!match) throw new Error(`Unexpected detail code: ${d.detail_code}`);
          return Number(match[1]);
        });
        const max = Math.max(0, ...sequences);
        if (max + quantity * years.length > 999999) throw new Error("Detail code sequence exhausted");
        return years.flatMap((year, yearIndex) => Array.from({ length: quantity }, (_, index) => ({ item_id: item.item_id, detail_code: `${item.item_code}-${String(max + yearIndex * quantity + index + 1).padStart(6, "0")}`, current_department_id: room.department_id, current_room_id: room.room_id, budget_year_id: year.budget_year_id, status: "Available", notes: marker })));
      });
      await tx.item_detail.createMany({ data: rows });
      const created = await tx.item_detail.findMany({ where: { notes: marker }, select: { item_detail_id: true, detail_code: true } });
      if (created.length !== selected.length * quantity * years.length) throw new Error("Added quantity mismatch");
      const counts = await tx.item_detail.groupBy({ by: ["item_id", "budget_year_id"], where: { notes: marker }, _count: { _all: true } });
      if (counts.length !== selected.length * years.length || counts.some((c) => c._count._all !== quantity)) throw new Error("Per-item/year quantity mismatch");
      await tx.qr_code.createMany({ data: created.map((d) => ({ qr_code_id: d.detail_code, item_detail_id: d.item_detail_id, is_active: true })) });
      await tx.activity_log.create({ data: { action: "created", module: "Inventory", target_type: "Bulk addition", target_name: `${quantity} additional units per non-laptop item${perYear ? " per academic year" : ""}`, actor_name: "System", details: JSON.stringify({ quantity: created.length, room_id: room.room_id, academic_years: years.map((y) => y.year_name), item_codes: selected.map((i) => i.item_code) }) } });
      console.log(`Added ${created.length} units and QR records to ${room.building_name}.`);
    }, { maxWait: 10_000, timeout: 300_000 });
  }
} finally { await prisma.$disconnect(); }
