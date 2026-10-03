import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set");

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) });
const CURRENT_ACADEMIC_YEAR = "2026-2027";
const academicYears = Array.from({ length: 12 }, (_, index) => {
  const startYear = 2015 + index;
  return {
    year_name: `${startYear}-${startYear + 1}`,
    // New records use a July-to-June academic-year window. Existing records
    // retain their dates, so their linked inventory and semesters are untouched.
    start_date: new Date(Date.UTC(startYear, 6, 1)),
    end_date: new Date(Date.UTC(startYear + 1, 5, 30)),
  };
});

try {
  await prisma.$transaction(async (tx) => {
    for (const academicYear of academicYears) {
      const existing = await tx.budget_year.findFirst({
        where: { year_name: academicYear.year_name },
      });
      if (!existing) {
        await tx.budget_year.create({
          data: {
            ...academicYear,
            status: academicYear.year_name === CURRENT_ACADEMIC_YEAR ? "Active" : "Inactive",
          },
        });
      }
    }

    await tx.budget_year.updateMany({
      where: { year_name: { not: CURRENT_ACADEMIC_YEAR }, status: "Active" },
      data: { status: "Inactive" },
    });
    await tx.budget_year.updateMany({
      where: { year_name: CURRENT_ACADEMIC_YEAR },
      data: { status: "Active" },
    });
  });
  console.log(`Academic years 2015-2016 through ${CURRENT_ACADEMIC_YEAR} are available. ${CURRENT_ACADEMIC_YEAR} is active.`);
} finally {
  await prisma.$disconnect();
}
