import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set");
const prisma = new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) });
try {
  const roles = await prisma.$queryRaw<Array<{ role_id: number; role_name: string }>>`SELECT role_id, role_name FROM role`;
  const mappings = new Map<string, number[]>();
  for (const role of roles) {
    const code = ({ admin: "ADMIN", administrator: "ADMIN", "department head": "DEPARTMENT_HEAD", "laptop rental": "LAPTOP_RENTAL" } as Record<string, string | undefined>)[role.role_name.trim().toLowerCase()];
    if (code) mappings.set(code, [...(mappings.get(code) ?? []), role.role_id]);
  }
  const conflicts = [...mappings].filter(([, ids]) => ids.length > 1);
  if (conflicts.length) {
    console.error("Migration conflict: multiple legacy roles map to the same stable code:", conflicts);
    process.exitCode = 1;
  } else console.log("Preflight passed. No duplicate legacy role-code mappings found.");
} finally { await prisma.$disconnect(); }
