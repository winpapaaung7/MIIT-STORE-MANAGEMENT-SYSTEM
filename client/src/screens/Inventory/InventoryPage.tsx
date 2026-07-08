import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";

import ExportButton from "@/components/buttons/ExportButton";
import ImportButton from "@/components/buttons/ImportButton";
import AddItemButton from "@/components/buttons/AddItemButton";
import { Input } from "@/components/ui/input";

import FilterCategories from "./FilterCategories";
import InventoryTable from "./InventoryTable";
import { Search } from "lucide-react";

import {
  dummyInventory,
  type InventoryItem,
} from "./data/inventoryData";

export default function InventoryPage() {
  const [inventory, setInventory] =
    useState<InventoryItem[]>(dummyInventory);

  const [categories, setCategories] = useState([
    "All",
    "Laptop & Computer",
    "Electronic",
    "Furniture",
    "Cleaning Tools",
  ]);

  const [selectedCategory, setSelectedCategory] =
    useState("All");

  const [searchQuery, setSearchQuery] =
    useState("");

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  // =========================
  // Filter Items
  // =========================

  const filteredInventory = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return inventory.filter((item) => {
      const matchesCategory =
        selectedCategory === "All" ||
        item.category === selectedCategory;

      const matchesSearch =
        !query ||
        [
          item.id,
          item.name,
          item.category,
          String(item.quantity),
        ].some((value) =>
          value
            .toLowerCase()
            .includes(query)
        );

      return matchesCategory && matchesSearch;
    });
  }, [inventory, selectedCategory, searchQuery]);

  // =========================
  // Add Category
  // =========================

  const handleAddCategory = (
    category: string
  ) => {
    const value = category.trim();

    if (!value) return;

    if (
      categories.some(
        (c) =>
          c.toLowerCase() ===
          value.toLowerCase()
      )
    ) {
      return;
    }

    setCategories((prev) => [
      ...prev,
      value,
    ]);
  };

  // =========================
  // Export Excel
  // =========================

  const handleExport = () => {
    const worksheet =
      XLSX.utils.json_to_sheet(
        filteredInventory
      );

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Inventory"
    );

    XLSX.writeFile(
      workbook,
      "Inventory.xlsx"
    );
  };

  // =========================
  // Import Excel
  // =========================

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      e.target.files?.[0];

    if (!file) return;

    const reader =
      new FileReader();

    reader.onload = (event) => {
      const data =
        event.target?.result;

      if (!data) return;

      const workbook =
        XLSX.read(data, {
          type: "array",
        });

      const sheet =
        workbook.Sheets[
          workbook.SheetNames[0]
        ];

      const json =
        XLSX.utils.sheet_to_json<InventoryItem>(
          sheet
        );

      setInventory(json);
    };

    reader.readAsArrayBuffer(file);
  };

  // =========================
  // Add Item
  // =========================

  const handleAddItem = () => {
    console.log("Add Item");
  };

  // =========================
  // Delete Item
  // =========================

  const handleDeleteItem = (
    id: string
  ) => {
    setInventory((prev) =>
      prev.filter(
        (item) => item.id !== id
      )
    );
  };

  // =========================
  // Edit Item
  // =========================

  const handleEditItem = (
    updatedItem: InventoryItem
  ) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.id === updatedItem.id
          ? updatedItem
          : item
      )
    );
  };

  return (
    <div className="flex h-[calc(100vh-3rem)] min-h-0 flex-col gap-6 overflow-hidden">

      {/* Header */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <h1 className="text-3xl font-bold">
            Inventory
          </h1>

          <p className="text-sm text-muted-foreground">
            {filteredInventory.length} Items
          </p>
        </div>

        <div className="flex flex-wrap gap-3">

          <ExportButton
            onClick={handleExport}
          />

          <ImportButton
            onClick={handleImport}
          />

          <AddItemButton
            onClick={handleAddItem}
          />

        </div>

      </div>

      {/* Category Filter */}

      <FilterCategories
        categories={categories}
        inventory={inventory}
        selectedCategory={
          selectedCategory
        }
        setSelectedCategory={
          setSelectedCategory
        }
        onAddCategory={
          handleAddCategory
        }
      />

      {/* Search */}

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

        <Input
          value={searchQuery}
          onChange={(e) =>
            setSearchQuery(e.target.value)
          }
          placeholder="Search inventory..."
          className="h-11 rounded-xl pl-10"
        />
      </div>

      {/* Hidden Import */}

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        hidden
        onChange={handleFileChange}
      />

      {/* Table */}

      <InventoryTable
        items={filteredInventory}
        onDeleteItem={
          handleDeleteItem
        }
        onEditItem={
          handleEditItem
        }
      />

    </div>
  );
}
