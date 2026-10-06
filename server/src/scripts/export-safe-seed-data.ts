import "dotenv/config";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set");

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) });
const outputFile = path.resolve("prisma", "seed-data.json");

function date(value: Date | null) {
  return value?.toISOString() ?? null;
}

try {
  // Authentication secrets, password hashes, refresh sessions, OTP challenges,
  // rental/transfer history, and activity logs are intentionally not exported.
  const [roles, budgetYears, categories, departments, rooms, semesters, students, users, items, details, qrCodes] = await Promise.all([
    prisma.role.findMany({ orderBy: { role_id: "asc" } }),
    prisma.budget_year.findMany({ orderBy: { budget_year_id: "asc" } }),
    prisma.category.findMany({ orderBy: { category_id: "asc" } }),
    prisma.department.findMany({ orderBy: { department_id: "asc" } }),
    prisma.room.findMany({ orderBy: { room_id: "asc" } }),
    prisma.semester.findMany({ orderBy: { semester_id: "asc" } }),
    prisma.student.findMany({ orderBy: { student_id: "asc" } }),
    prisma.users.findMany({
      orderBy: { user_id: "asc" },
      include: { role: true, department: true, department_head_of: true },
    }),
    prisma.item.findMany({ orderBy: { item_id: "asc" } }),
    prisma.item_detail.findMany({ orderBy: { item_detail_id: "asc" } }),
    prisma.qr_code.findMany({ orderBy: { qr_code_id: "asc" } }),
  ]);

  const seedData = {
    generatedAt: new Date().toISOString(),
    roles,
    budgetYears: budgetYears.map((row) => ({ ...row, start_date: date(row.start_date), end_date: date(row.end_date) })),
    categories,
    departments,
    rooms,
    semesters: semesters.map((row) => ({ ...row, start_date: date(row.start_date), end_date: date(row.end_date) })),
    students,
    users: users.map((row) => ({
      user_id: row.user_id,
      full_name: row.full_name,
      username: row.username,
      email: row.email,
      phone: row.phone,
      image_url: row.image_url,
      role_code: row.role.role_code,
      role_name: row.role.role_name,
      department_code: row.department?.department_code ?? null,
      department_head_code: row.department_head_of?.department_code ?? null,
      status: row.status,
      personal_laptop_status: row.personal_laptop_status,
      language: row.language,
      two_step_enabled: row.two_step_enabled,
    })),
    items: items.map((row) => ({ ...row, created_at: date(row.created_at) })),
    itemDetails: details.map((row) => ({ ...row, purchase_date: date(row.purchase_date), created_at: date(row.created_at) })),
    qrCodes: qrCodes.map((row) => ({ ...row, generated_at: date(row.generated_at) })),
  };

  await writeFile(outputFile, `${JSON.stringify(seedData, null, 2)}\n`, "utf8");
  console.log(`Exported ${students.length} students, ${users.length} users, ${items.length} items, and ${details.length} item details to ${outputFile}.`);
} finally {
  await prisma.$disconnect();
}
