export interface AcademicYear {
  id: number;
  startDate: Date;
  endDate: Date;
  status: "Active" | "Inactive";
  current: boolean;
}

export interface AcademicYearSemester {
  semester_name: string;
  start_date: string;
  end_date: string;
}
