export type AccessoryStatus = "Available" | "In Use" | "Damaged"
export type Department =
  | "ICT"
  | "ECE"
  | "Civil"
  | "Architecture"
  | "Admin"
  | "Store"
export type FilterChoice = string | null
export type SearchType = "general" | "id" | "academicYear" | "date"
export type TableAction = "edit" | "remark" | "delete"
export type ToolbarAction = "insert" | "export" | "add" | "transfer"

export interface AccessoryItem {
  id: string
  itemName: string
  subCategory: string
  status: AccessoryStatus
  department: Department
  room: string
  academicYear: string
  registeredDate: string
  createdAt: string
  remark: string
}

export interface NewAccessoryForm {
  id: string
  itemName: string
  subCategory: string
  status: AccessoryStatus
  department: Department
  room: string
  academicYear: string
  registeredDate: string
  remark: string
}

export interface ActiveAccessoryAction {
  type: TableAction
  item: AccessoryItem
}
