import "dotenv/config";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set");
const prisma = new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) });
try {
  const data = JSON.parse(await readFile(path.resolve("prisma/seed-data.json"), "utf8"));
  const students = data.students;
  if (!Array.isArray(students) || students.length === 0) throw new Error("No replacement students found");
  const ids = new Set(students.map((s: any) => s.student_id));
  if (ids.size !== students.length) throw new Error("Duplicate replacement student IDs");
  const existingCount = await prisma.student.count();
  const rentalCount = await prisma.laptop_rental.count({ where: { student_id: { not: null } } });
  console.log(`Existing students: ${existingCount}; wppa students: ${students.length}; linked rentals: ${rentalCount}`);
  if (!process.argv.includes("--apply")) {
    console.log("Preview only. Use --apply to replace students; --delete-student-rentals also deletes their rental records.");
  } else {
    const deleteRentals = process.argv.includes("--delete-student-rentals");
    if (rentalCount && !deleteRentals) throw new Error("Replacement blocked: explicitly enable --delete-student-rentals to delete linked rentals.");
    const backupDir = path.join(tmpdir(), "miit-student-backups");
    await mkdir(backupDir, { recursive: true });
    const backupFile = path.join(backupDir, `students-${Date.now()}.json`);
    await prisma.$transaction(async (tx) => {
      const rentals = await tx.laptop_rental.findMany({ where: { student_id: { not: null } } });
      if (rentals.length && !deleteRentals) throw new Error("Student rentals appeared; replacement cancelled");
      const existing = await tx.student.findMany();
      const itemIds = [...new Set(rentals.map((rental) => rental.item_detail_id))];
      const items = await tx.item_detail.findMany({ where: { item_detail_id: { in: itemIds } } });
      await writeFile(backupFile, JSON.stringify({ students: existing, rentals, items }, null, 2), { flag: "wx" });
      if (deleteRentals) {
        await tx.laptop_rental.deleteMany({ where: { student_id: { not: null } } });
        // Release only affected laptops that have no other ongoing rental.
        await tx.item_detail.updateMany({
          where: {
            item_detail_id: { in: itemIds },
            status: "In Use",
            laptop_rental: { none: { rental_status: { in: ["pending", "approved", "active", "issued"] } } },
          },
          data: { status: "Available" },
        });
      }
      await tx.student.deleteMany();
      await tx.student.createMany({ data: students });
      if (await tx.student.count() !== students.length) throw new Error("Replacement count mismatch");
    }, { maxWait: 10_000, timeout: 60_000 });
    console.log(`Replaced students with ${students.length} wppa records. Backup: ${backupFile}`);
  }
} finally {
  await prisma.$disconnect();
}
