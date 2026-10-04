import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set");

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) });
const apply = process.argv.includes("--apply");

try {
  const [rooms, itemDetailsWithRooms, transfersWithRooms] = await Promise.all([
    prisma.room.count(),
    prisma.item_detail.count({ where: { current_room_id: { not: null } } }),
    prisma.transfer.count({ where: { OR: [{ from_room_id: { not: null } }, { to_room_id: { not: null } }] } }),
  ]);

  if (!apply) {
    console.log(`Dry run: ${rooms} room record(s) would be deleted. ${itemDetailsWithRooms} item detail(s) and ${transfersWithRooms} transfer(s) would have their room reference cleared.`);
  } else {
    const result = await prisma.room.deleteMany();
    console.log(`Deleted ${result.count} room record(s). ${itemDetailsWithRooms} item detail(s) and ${transfersWithRooms} transfer(s) now have no room reference.`);
  }
} finally {
  await prisma.$disconnect();
}
