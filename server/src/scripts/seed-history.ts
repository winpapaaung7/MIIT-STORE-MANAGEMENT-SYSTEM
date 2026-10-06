import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.js";
import { importActivityLogs, parseActivityLogs } from "./activity-seed.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set");
const data = JSON.parse(await readFile(path.resolve(process.argv[2] ?? "prisma/seed-data.json"), "utf8"));
const logs = parseActivityLogs(data);
if (!logs.length) throw new Error("This file contains no activityLogs. Export history from the source database first; old seed files cannot restore history.");
const prisma = new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) });
try {
  const added = await prisma.$transaction((tx) => importActivityLogs(tx, logs), { maxWait: 10_000, timeout: 60_000 });
  console.log(`Imported ${added} activity logs for Settings history and notifications. Existing entries were preserved.`);
} finally { await prisma.$disconnect(); }
