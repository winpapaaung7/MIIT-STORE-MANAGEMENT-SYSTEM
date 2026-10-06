import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set");

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) });
const apply = process.argv.includes("--apply");

async function main() {
  const itsm = await prisma.department.findFirst({
    where: { OR: [{ department_code: "ITSM" }, { department_name: { contains: "(ITSM)" } }] },
    select: { department_id: true, department_name: true },
  });
  if (!itsm) throw new Error("ITSM department is not configured.");

  let room = await prisma.room.findFirst({
    where: { department_id: itsm.department_id },
    orderBy: { room_id: "asc" },
    select: { room_id: true, building_name: true },
  });

  const laptopWhere = { item: { category: { rental_allowed: true } } };
  const laptops = await prisma.item_detail.findMany({
    where: laptopWhere,
    select: { item_detail_id: true, current_department_id: true, current_room_id: true },
  });
  const needingAssignment = laptops.filter((laptop) => laptop.current_department_id !== itsm.department_id || laptop.current_room_id !== room?.room_id);

  console.log(JSON.stringify({
    mode: apply ? "apply" : "preview",
    targetDepartment: itsm.department_name,
    targetRoom: room?.building_name ?? "Room number not assigned",
    rentalLaptopUnits: laptops.length,
    unitsToAssign: needingAssignment.length,
  }));

  if (!apply || !needingAssignment.length) return;

  await prisma.$transaction(async (tx) => {
    if (!room) {
      room = await tx.room.create({
        data: {
          department_id: itsm.department_id,
          building_name: null,
          description: "Room number not assigned",
          status: true,
        },
        select: { room_id: true, building_name: true },
      });
    }

    const updated = await tx.item_detail.updateMany({
      where: { item_detail_id: { in: needingAssignment.map((laptop) => laptop.item_detail_id) } },
      data: { current_department_id: itsm.department_id, current_room_id: room.room_id },
    });
    await tx.activity_log.create({
      data: {
        action: "transferred",
        module: "Laptop Rental",
        target_type: "Rental laptop location",
        target_name: "Rental laptop inventory assigned to ITSM",
        actor_name: "System",
        details: JSON.stringify({ department: itsm.department_name, room: room.building_name ?? "Room number not assigned", units: updated.count }),
      },
    });
    console.log(JSON.stringify({ updatedUnits: updated.count, department: itsm.department_name, room: room.building_name ?? "Room number not assigned" }));
  });
}

main().finally(() => prisma.$disconnect());
