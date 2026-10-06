import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.js";
import { hashPassword } from "../auth/service.js";
import { importActivityLogs, parseActivityLogs } from "./activity-seed.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set");

const seedUserPassword = process.env.SEED_USER_PASSWORD;
if (!seedUserPassword || seedUserPassword.length < 12) {
  throw new Error("Set SEED_USER_PASSWORD to a new password of at least 12 characters before seeding users.");
}

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) });
const seedFile = path.resolve("prisma", "seed-data.json");

type SeedData = any;
const asDate = (value: string | null) => value ? new Date(value) : null;

async function requireEmptyDatabase() {
  const [budgetYears, categories, departments, rooms, semesters, students, users, items, details, qrCodes] = await Promise.all([
    prisma.budget_year.count(), prisma.category.count(), prisma.department.count(), prisma.room.count(),
    prisma.semester.count(), prisma.student.count(), prisma.users.count(), prisma.item.count(),
    prisma.item_detail.count(), prisma.qr_code.count(),
  ]);
  if ([budgetYears, categories, departments, rooms, semesters, students, users, items, details, qrCodes].some(Boolean)) {
    throw new Error("Seed data can only be loaded into an empty database. Do not run this script against a live database.");
  }
}

try {
  await requireEmptyDatabase();
  const data = JSON.parse(await readFile(seedFile, "utf8")) as SeedData;
  const activityLogs = parseActivityLogs(data);
  const passwordHash = await hashPassword(seedUserPassword);

  await prisma.$transaction(async (tx) => {
    for (const role of data.roles) {
      if (role.role_code) {
        await tx.role.upsert({
          where: { role_code: role.role_code },
          update: { role_name: role.role_name },
          create: { role_code: role.role_code, role_name: role.role_name },
        });
      } else {
        await tx.role.upsert({
          where: { role_name: role.role_name },
          update: {},
          create: { role_name: role.role_name },
        });
      }
    }
    await tx.budget_year.createMany({ data: data.budgetYears.map((row: any) => ({ ...row, start_date: asDate(row.start_date), end_date: asDate(row.end_date) })) });
    await tx.category.createMany({ data: data.categories });
    await tx.department.createMany({ data: data.departments });
    await tx.room.createMany({ data: data.rooms });
    await tx.semester.createMany({ data: data.semesters.map((row: any) => ({ ...row, start_date: asDate(row.start_date), end_date: asDate(row.end_date) })) });
    await tx.student.createMany({ data: data.students });
    await tx.item.createMany({ data: data.items.map((row: any) => ({ ...row, created_at: asDate(row.created_at) })) });
    await tx.item_detail.createMany({ data: data.itemDetails.map((row: any) => ({ ...row, purchase_date: asDate(row.purchase_date), created_at: asDate(row.created_at) })) });
    await tx.qr_code.createMany({ data: data.qrCodes.map((row: any) => ({ ...row, generated_at: asDate(row.generated_at) })) });

    const roleIds = new Map((await tx.role.findMany({ select: { role_id: true, role_code: true, role_name: true } })).map((role) => [role.role_code ?? role.role_name, role.role_id]));
    const departmentIds = new Map((await tx.department.findMany({ select: { department_id: true, department_code: true } })).map((department) => [department.department_code, department.department_id]));
    await tx.users.createMany({
      data: data.users.map((row: any) => ({
        user_id: row.user_id,
        full_name: row.full_name,
        username: row.username,
        email: row.email,
        phone: row.phone,
        image_url: row.image_url,
        password_hash: passwordHash,
        role_id: roleIds.get(row.role_code ?? row.role_name),
        department_id: row.department_code ? departmentIds.get(row.department_code) : null,
        status: row.status,
        personal_laptop_status: row.personal_laptop_status,
        language: row.language,
        two_step_enabled: row.two_step_enabled,
      })),
    });
    for (const row of data.users.filter((user: any) => user.department_head_code)) {
      await tx.users.update({ where: { user_id: row.user_id }, data: { department_head_of_id: departmentIds.get(row.department_head_code) } });
    }
    await importActivityLogs(tx, activityLogs);
  }, { timeout: 60_000 });

  console.log(`Loaded ${data.students.length} students, ${data.users.length} users, ${data.items.length} items, and ${data.itemDetails.length} item details.`);
  console.log("All seeded users share SEED_USER_PASSWORD. Change those passwords before allowing sign-in.");
  console.log(`Included ${activityLogs.length} source activity logs. History cannot be restored if the seed file contains none.`);
} finally {
  await prisma.$disconnect();
}
