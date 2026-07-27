export const transferDepartments = [
  { id: "store", label: "Store" },
  { id: "all", label: "All" },
  { id: "none", label: "None" },
  { id: "ict", label: "ICT" },
  { id: "ece", label: "ECE" },
  { id: "civil", label: "Civil" },
  { id: "architecture", label: "Architecture" },
  { id: "admin", label: "Admin" },
] as const

export type TransferDepartmentId = (typeof transferDepartments)[number]["id"]

export interface TransferRoom {
  id: string
  name: string
  deptId: Exclude<TransferDepartmentId, "all" | "none">
}

export const transferRooms = [
  { id: "store-room", name: "Store Room", deptId: "store" },
  { id: "room-201", name: "Room 201", deptId: "ict" },
  { id: "room-202", name: "Room 202", deptId: "ict" },
  { id: "room-203", name: "Room 203", deptId: "ict" },
  { id: "room-301", name: "Room 301", deptId: "ece" },
  { id: "room-105", name: "Room 105", deptId: "civil" },
  { id: "room-106", name: "Room 106", deptId: "civil" },
  { id: "studio-204", name: "Studio 204", deptId: "architecture" },
  { id: "office-101", name: "Office 101", deptId: "admin" },
  { id: "meeting-room", name: "Meeting Room", deptId: "admin" },
] as const satisfies readonly TransferRoom[]

export const transferCategories = [
  "Computer Accessory",
  "Cable & Connector",
  "Audio Accessory",
  "Power Accessory",
  "Display Accessory",
  "Presentation Accessory",
] as const

export type TransferCategory = (typeof transferCategories)[number]

export const transferItemNamesByCategory: Record<TransferCategory, readonly string[]> = {
  "Computer Accessory": [
    "Logitech Blue Mouse",
    "Dell KM117 Keyboard",
    "USB-C Multiport Hub",
  ],
  "Cable & Connector": [
    "HDMI Cable 1.5m",
    "LAN Cable Cat6",
    "USB Extension Cable",
  ],
  "Audio Accessory": ["Noise Cancelling Headset"],
  "Power Accessory": ["65W Laptop Adapter"],
  "Display Accessory": ["Generic Monitor Mount", "Webcam 1080p"],
  "Presentation Accessory": ["Wireless Presenter"],
}

export interface TransferSerialItem {
  id: string
  serial: string
  itemName: string
}

export const transferSerialItems = [
  { id: "serial-033-000101", serial: "033-000101", itemName: "Logitech Blue Mouse" },
  { id: "serial-023-111111", serial: "023-111111", itemName: "Logitech Blue Mouse" },
  { id: "serial-023-976666", serial: "023-976666", itemName: "Logitech Blue Mouse" },
  { id: "serial-033-000113", serial: "033-000113", itemName: "Logitech Blue Mouse" },
  { id: "serial-033-000114", serial: "033-000114", itemName: "Logitech Blue Mouse" },
  { id: "serial-033-000102", serial: "033-000102", itemName: "Dell KM117 Keyboard" },
  { id: "serial-033-000115", serial: "033-000115", itemName: "Dell KM117 Keyboard" },
  { id: "serial-033-000109", serial: "033-000109", itemName: "USB-C Multiport Hub" },
  { id: "serial-033-000116", serial: "033-000116", itemName: "USB-C Multiport Hub" },
  { id: "serial-021-000103", serial: "021-000103", itemName: "HDMI Cable 1.5m" },
  { id: "serial-021-000117", serial: "021-000117", itemName: "HDMI Cable 1.5m" },
  { id: "serial-021-000104", serial: "021-000104", itemName: "LAN Cable Cat6" },
  { id: "serial-021-000118", serial: "021-000118", itemName: "LAN Cable Cat6" },
  { id: "serial-021-000119", serial: "021-000119", itemName: "LAN Cable Cat6" },
  { id: "serial-021-000112", serial: "021-000112", itemName: "USB Extension Cable" },
  { id: "serial-034-000105", serial: "034-000105", itemName: "Noise Cancelling Headset" },
  { id: "serial-052-000106", serial: "052-000106", itemName: "65W Laptop Adapter" },
  { id: "serial-052-000120", serial: "052-000120", itemName: "65W Laptop Adapter" },
  { id: "serial-065-000108", serial: "065-000108", itemName: "Generic Monitor Mount" },
  { id: "serial-065-000111", serial: "065-000111", itemName: "Webcam 1080p" },
  { id: "serial-076-000110", serial: "076-000110", itemName: "Wireless Presenter" },
  { id: "serial-076-000121", serial: "076-000121", itemName: "Wireless Presenter" },
] as const satisfies readonly TransferSerialItem[]
