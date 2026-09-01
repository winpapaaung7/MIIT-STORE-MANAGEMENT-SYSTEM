import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.js";
import { hashPassword, normalizeEmail } from "../auth/service.js";
import { ROLE_CODES, type RoleCode } from "../auth/types.js";

const name = process.env.CREATE_USER_NAME?.trim() ?? "";
const email = normalizeEmail(process.env.CREATE_USER_EMAIL);
const password = process.env.CREATE_USER_PASSWORD;
const roleCode = process.env.CREATE_USER_ROLE_CODE?.trim().toUpperCase() as RoleCode;
const rawDepartmentId = process.env.CREATE_USER_DEPARTMENT_ID?.trim();
const departmentId = rawDepartmentId ? Number(rawDepartmentId) : null;
const databaseUrl = process.env.DATABASE_URL;
const emailIsValid = /^\S+@\S+\.\S+$/.test(email);
const departmentIsValid = departmentId !== null && Number.isInteger(departmentId) && departmentId > 0;

function fail(message: string): never { console.error(message); process.exit(1); }

if (!databaseUrl || !name || !emailIsValid || typeof password !== "string" || password.length < 12 || !ROLE_CODES.includes(roleCode)) {
  fail("Safe validation/configuration error.");
}
if (roleCode === "DEPARTMENT_HEAD" && !departmentIsValid) fail("Safe validation/configuration error.");
if (roleCode !== "DEPARTMENT_HEAD" && rawDepartmentId) fail("Safe validation/configuration error.");

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) });
try {
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.users.findUnique({ where: { email }, select: { user_id: true } });
    if (existing) return "exists" as const;
    const role = await tx.role.findUnique({ where: { role_code: roleCode } });
    if (!role) return "role-not-found" as const;
    const department = departmentId ? await tx.department.findUnique({ where: { department_id: departmentId } }) : null;
    if (departmentId && !department) return "department-not-found" as const;
    await tx.users.create({ data: { full_name: name, username: email, email, password_hash: await hashPassword(password), role_id: role.role_id, department_id: department?.department_id ?? null, department_head_of_id: roleCode === "DEPARTMENT_HEAD" ? department!.department_id : null, status: "Active" } });
    return "success" as const;
  });
  if (result === "success") console.log("User created successfully.");
  else if (result === "exists") console.log("User already exists.");
  else if (result === "role-not-found") console.log("Role not found.");
  else console.log("Department not found.");
} catch {
  console.error("Safe validation/configuration error.");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
