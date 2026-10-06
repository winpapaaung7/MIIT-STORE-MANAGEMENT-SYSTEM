import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set");

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) });

// A null room number means that a physical location exists but its room
// number has not been assigned by the university yet.
const locations = [
  { name: "Faculty of Information Science (FIS)", code: "FIS", rooms: [null] },
  { name: "Faculty of Computer Science (FCS)", code: "FCS", rooms: [null] },
  { name: "Faculty of Computing (FC)", code: "FC", rooms: ["101"] },
  { name: "Faculty of Computer Systems and Technologies (FCST)", code: "FCST", rooms: [null] },
  { name: "Department of English", code: "DEPTENG", rooms: [null] },
  { name: "Department of Natural Science (NS)", code: "NS", rooms: ["102"] },
  { name: "Information Technology Supporting and Maintenance (ITSM)", code: "ITSM", rooms: [null] },
  { name: "Department of Admin", code: "DEPTADMIN", rooms: [null] },
  { name: "Department of Finance", code: "DEPTFIN", rooms: [null] },
  { name: "Rector Office", code: "RECTOFF", rooms: ["206"] },
  { name: "Pro-Rector Office", code: "PRORECT", rooms: ["207"] },
  { name: "Library", code: "LIBRARY", rooms: [null] },
  { name: "Department of Student Affairs", code: "STUAFF", rooms: ["103"] },
  { name: "Clinic", code: "CLINIC", rooms: [null] },
  { name: "Data Center", code: "DATACENT", rooms: ["106"] },
  { name: "Classroom", code: "CLASSRM", rooms: ["201", "202", "203", "204", "208", "209", "210", "211", "301", "302", "303", "304", "314", "315"] },
  { name: "Store", code: "STORE", rooms: ["105", "205", "305", "316"] },
  { name: "Robotics Lab", code: "ROBOTICS", rooms: ["212"] },
  { name: "Chemistry Laboratory", code: "CHEMLAB", rooms: ["104"] },
  { name: "Computer Lab", code: "COMPLAB", rooms: ["306", "307"] },
  { name: "Arduino Lab", code: "ARDUINOLAB", rooms: ["308", "310"] },
  { name: "Digital Design Lab", code: "DIGITALLAB", rooms: ["309", "311", "313"] },
  { name: "Electric Circuit Lab", code: "ELECCIRLAB", rooms: ["312"] },
] as const;

type Summary = { departmentsCreated: number; roomsCreated: number; roomsReassigned: number; inventoryReassigned: number; transfersReassigned: number };

async function unusedCode(tx: any, preferredCode: string, index: number) {
  if (!await tx.department.findUnique({ where: { department_code: preferredCode } })) return preferredCode;
  for (let attempt = 1; attempt < 100; attempt += 1) {
    const candidate = `LOC${String(index + 1).padStart(2, "0")}${String(attempt).padStart(2, "0")}`;
    if (!await tx.department.findUnique({ where: { department_code: candidate } })) return candidate;
  }
  throw new Error(`Unable to create a department code for ${preferredCode}`);
}

async function main() {
  const summary = await prisma.$transaction(async (tx) => {
    const result: Summary = { departmentsCreated: 0, roomsCreated: 0, roomsReassigned: 0, inventoryReassigned: 0, transfersReassigned: 0 };
    const departmentIds = new Map<string, number>();

    for (const [index, location] of locations.entries()) {
      let department = await tx.department.findFirst({ where: { department_name: location.name } });
      if (!department) {
        department = await tx.department.create({ data: { department_name: location.name, department_code: await unusedCode(tx, location.code, index) } });
        result.departmentsCreated += 1;
      }
      departmentIds.set(location.name, department.department_id);
    }

    for (const location of locations) {
      const departmentId = departmentIds.get(location.name)!;
      for (const roomNumber of location.rooms) {
        const room = roomNumber === null
          ? await tx.room.findFirst({ where: { department_id: departmentId, building_name: null } })
          : await tx.room.findFirst({ where: { building_name: roomNumber } });

        if (!room) {
          const created = await tx.room.create({ data: { department_id: departmentId, building_name: roomNumber, description: roomNumber === null ? "Room number not assigned" : null, status: true } });
          result.roomsCreated += 1;
          if (roomNumber === null) {
            const updated = await tx.item_detail.updateMany({ where: { current_department_id: departmentId, current_room_id: null }, data: { current_room_id: created.room_id } });
            result.inventoryReassigned += updated.count;
          }
          continue;
        }

        if (room.department_id !== departmentId) {
          await tx.room.update({ where: { room_id: room.room_id }, data: { department_id: departmentId } });
          result.roomsReassigned += 1;
        }
        const inventoryUpdate = await tx.item_detail.updateMany({ where: { current_room_id: room.room_id, current_department_id: { not: departmentId } }, data: { current_department_id: departmentId } });
        result.inventoryReassigned += inventoryUpdate.count;
        const [fromUpdate, toUpdate] = await Promise.all([
          tx.transfer.updateMany({ where: { from_room_id: room.room_id, from_department_id: { not: departmentId } }, data: { from_department_id: departmentId } }),
          tx.transfer.updateMany({ where: { to_room_id: room.room_id, to_department_id: { not: departmentId } }, data: { to_department_id: departmentId } }),
        ]);
        result.transfersReassigned += fromUpdate.count + toUpdate.count;
      }
    }

    for (const location of locations.filter((entry) => (entry.rooms as readonly (string | null)[]).includes(null))) {
      const departmentId = departmentIds.get(location.name)!;
      const unnumberedRoom = await tx.room.findFirst({ where: { department_id: departmentId, building_name: null } });
      if (!unnumberedRoom) throw new Error(`Unnumbered location missing for ${location.name}`);
      const updated = await tx.item_detail.updateMany({ where: { current_department_id: departmentId, current_room_id: null }, data: { current_room_id: unnumberedRoom.room_id } });
      result.inventoryReassigned += updated.count;
    }

    if (Object.values(result).some((value) => value > 0)) {
      await tx.activity_log.create({ data: { action: "updated", module: "Department", target_type: "Canonical location sync", target_name: "MIIT department and room mapping", actor_name: "System", details: JSON.stringify(result) } });
    }
    return result;
  });
  console.log(`Location sync complete: ${JSON.stringify(summary)}`);
}

main().finally(() => prisma.$disconnect());
