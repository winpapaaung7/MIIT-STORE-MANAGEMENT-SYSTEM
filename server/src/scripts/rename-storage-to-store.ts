import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set");

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) });

try {
  const departments = await prisma.department.findMany({
    where: { department_name: { in: ["Storage", "Store"] } },
    select: { department_id: true, department_name: true },
  });
  const storage = departments.find((department) => department.department_name === "Storage");
  const store = departments.find((department) => department.department_name === "Store");

  if (storage && store) {
    throw new Error("Both Storage and Store departments already exist; rename cancelled to avoid a duplicate.");
  }

  if (storage) {
    const updated = await prisma.department.update({
      where: { department_id: storage.department_id },
      data: { department_name: "Store" },
      select: { department_id: true, department_name: true },
    });
    console.log(`Renamed department ${updated.department_id} to ${updated.department_name}`);
  } else if (store) {
    console.log("Department is already named Store");
  } else {
    throw new Error("Storage department was not found");
  }
} finally {
  await prisma.$disconnect();
}
