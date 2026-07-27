import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import type { InventoryItem } from "@/screens/Inventory/data/inventoryData";

export const exportInventory = (items: InventoryItem[]) => {
  const worksheet = XLSX.utils.json_to_sheet(items);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const file = new Blob([excelBuffer], {
    type:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
  });

  saveAs(file, "Inventory.xlsx");
};

export const importInventory = (
  file: File,
  callback: (items: InventoryItem[]) => void
) => {
  const reader = new FileReader();

  reader.onload = (e) => {
    const data = e.target?.result;

    const workbook = XLSX.read(data, {
      type: "array",
    });

    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const items = XLSX.utils.sheet_to_json<InventoryItem>(sheet);

    callback(items);
  };

  reader.readAsArrayBuffer(file);
};