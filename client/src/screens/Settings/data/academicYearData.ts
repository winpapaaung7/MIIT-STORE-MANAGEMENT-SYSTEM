// Dummy Academic Year Data

export interface AcademicYear {

  id: number;

  // Academic Year Date
  startDate: Date;
  endDate: Date;

  // Status
  status: "Active" | "Inactive";

  // Current Academic Year
  current: boolean;

}


// Initial Dummy Data

export const academicYearData: AcademicYear[] = [

  {
    id: 1,

    startDate: new Date("2025-06-01"),

    endDate: new Date("2026-03-31"),

    status: "Inactive",

    current: false,
  },


  {
    id: 2,

    startDate: new Date("2024-06-01"),

    endDate: new Date("2025-03-31"),

    status: "Active",

    current: true,
  },


  

];