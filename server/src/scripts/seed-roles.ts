import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set");
const prisma = new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) });
const roles = [
  { role_code: "ADMIN", role_name: "Administrator" },
  { role_code: "DEPARTMENT_HEAD", role_name: "Department Head" },
  { role_code: "LAPTOP_RENTAL", role_name: "Laptop Rental" },
] as const;
try {
  // Existing roles are intentionally not modified. This seed only inserts a
  // missing stable role code and preserves all current role IDs and names.
  for (const role of roles) await prisma.role.upsert({ where: { role_code: role.role_code }, update: {}, create: role });
  console.log("Application roles are present.");
} finally { await prisma.$disconnect(); }
