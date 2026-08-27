export type AccessoryStatus = "Available" | "In Use" | "Damaged";
// Departments come from the live Departments/Rooms API.  Keep this open so
// newly added departments and classrooms work everywhere without a frontend
// code change.
export type Department = string;
export type FilterChoice = string | null;
export type SearchType = "general" | "id" | "academicYear" | "date";
export type TableAction = "edit" | "remark" | "delete";
export type ToolbarAction = "insert" | "export" | "add" | "transfer";

export interface AccessoryItem {
  id: string;
  itemDetailId?: number;
  itemName: string;
  subCategory: string;
  status: AccessoryStatus;
  department: Department;
  room: string;
  academicYear: string;
  registeredDate: string;
  createdAt: string;
  remark: string;
  qrCode?: string;
  borrowerName?: string;
  borrowerId?: string;
}

export interface NewAccessoryForm {
  id: string;
  itemName: string;
  subCategory: string;
  status: AccessoryStatus;
  department: Department;
  room: string;
  academicYear: string;
  registeredDate: string;
  remark: string;
}

export interface ActiveAccessoryAction {
  type: TableAction;
  item: AccessoryItem;
}
