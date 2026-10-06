import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set");

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) });

// This is the authoritative MIIT location list. A null room number is kept
// internally for the Library and is presented as "Unknown" by the API.
const locations = [
  ["101", "Faculty of Computing"],
  ["102", "Natural Science, Electronic and Communication Department"],
  ["103", "Student Affairs Department"],
  ["104", "Chemistry Laboratory"],
  ["105", "Store"],
  ["106", "Data Centre"],
  ["201", "Classroom"], ["202", "Classroom"], ["203", "Classroom"], ["204", "Classroom"],
  ["205", "Store"], ["206", "Rector Office"], ["207", "Pro-Rector Office"],
  ["208", "Classroom"], ["209", "Classroom"], ["210", "Classroom"], ["211", "Classroom"],
  ["212", "Robotics Lab"],
  ["301", "Classroom"], ["302", "Classroom"], ["303", "Classroom"], ["304", "Classroom"],
  ["305", "Store"], ["306", "Computer Lab 1"], ["307", "Computer Lab 2"],
  ["308", "Arduino Lab"], ["309", "Digital Design Lab"], ["310", "Arduino Lab"],
  ["311", "Digital Design Lab"], ["312", "Electric Circuit Lab"], ["313", "Digital Design Lab"],
  ["314", "Classroom"], ["315", "Classroom"], ["316", "Store"],
  [null, "Library"],
] as const;

const departmentCodes = Object.fromEntries(
  Array.from(new Set(locations.map(([, department]) => department))).map(
    (department, index) => [department, `LOC${String(index + 1).padStart(2, "0")}`],
  ),
);

try {
  let createdDepartments = 0;
  let createdRooms = 0;
  let reassignedRooms = 0;

  await prisma.$transaction(async (tx) => {
    const departments = new Map<string, number>();

    for (const departmentName of Object.keys(departmentCodes)) {
      let department = await tx.department.findFirst({
        where: { department_name: departmentName },
      });

      if (!department) {
        department = await tx.department.create({
          data: {
            department_name: departmentName,
            department_code: departmentCodes[departmentName],
          },
        });
        createdDepartments += 1;
      }

      departments.set(departmentName, department.department_id);
    }

    for (const [roomNumber, departmentName] of locations) {
      const departmentId = departments.get(departmentName)!;
      // Room numbers are campus-wide identifiers. If a known room already
      // exists, retain its ID (and linked inventory) while correcting its
      // department. The Library's null number is scoped to Library only.
      const existingRoom = roomNumber === null
        ? await tx.room.findFirst({ where: { department_id: departmentId, building_name: null } })
        : await tx.room.findFirst({ where: { building_name: roomNumber } });

      if (!existingRoom) {
        await tx.room.create({
          data: { department_id: departmentId, building_name: roomNumber, status: true },
        });
        createdRooms += 1;
      } else if (existingRoom.department_id !== departmentId) {
        await tx.room.update({
          where: { room_id: existingRoom.room_id },
          data: { department_id: departmentId },
        });
        reassignedRooms += 1;
      }
    }
  });

  console.log(`Locations synchronized: ${createdDepartments} department(s) and ${createdRooms} room(s) added; ${reassignedRooms} room(s) reassigned.`);
} finally {
  await prisma.$disconnect();
}
