import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

import ExportButton from "@/components/buttons/ExportButton";
import ImportButton from "@/components/buttons/ImportButton";
import AddItemButton from "@/components/buttons/AddItemButton";
import AddItemModal from "@/components/modals/AddItemModal";
import { type ItemSubmitPayload } from "@/components/modals/ItemModal";
import { Input } from "@/components/ui/input";

import FilterCategories from "./FilterCategories";
import InventoryTable from "./InventoryTable";
import { Search } from "lucide-react";

import {
  dummyCategories,
  dummyInventory,
  type InventoryItem,
} from "./data/inventoryData";
import {
  departmentRoomMap,
  emptyNewAccessoryForm,
  statusClasses,
} from "@/screens/AccessoryDetails/accessoryData";
import {
  type AccessoryStatus,
  type Department,
  type NewAccessoryForm,
} from "@/screens/AccessoryDetails/types";

export default function InventoryPage() {
  const navigate = useNavigate();

  const [inventory, setInventory] = useState<InventoryItem[]>(dummyInventory);

  const [categories, setCategories] = useState([
    "All",
    ...dummyCategories
      .filter((category) => category.name !== "All")
      .map((category) => category.name),
  ]);

  const [selectedCategory, setSelectedCategory] = useState("All");

  const [searchQuery, setSearchQuery] = useState("");

  const [isAddItemOpen, setIsAddItemOpen] = useState(false);

  const [newAccessory, setNewAccessory] = useState<NewAccessoryForm>(
    emptyNewAccessoryForm,
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  // =========================
  // Filter Items
  // =========================

  const filteredInventory = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return inventory.filter((item) => {
      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;

      const matchesSearch =
        !query ||
        [item.id, item.name, item.category, String(item.quantity)].some(
          (value) => value.toLowerCase().includes(query),
        );

      return matchesCategory && matchesSearch;
    });
  }, [inventory, selectedCategory, searchQuery]);

  // =========================
  // Add Category
  // =========================

  const handleAddCategory = (category: string) => {
    const value = category.trim();

    if (!value) return;

    if (categories.some((c) => c.toLowerCase() === value.toLowerCase())) {
      return;
    }

    setCategories((prev) => [...prev, value]);
  };

  // =========================
  // Export Excel
  // =========================

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredInventory);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");

    XLSX.writeFile(workbook, "Inventory.xlsx");
  };

  // =========================
  // Import Excel
  // =========================

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      const data = event.target?.result;

      if (!data) return;

      const workbook = XLSX.read(data, {
        type: "array",
      });

      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      const json = XLSX.utils.sheet_to_json<InventoryItem>(sheet);

      setInventory(json);
    };

    reader.readAsArrayBuffer(file);
  };

  // =========================
  // Add Item
  // =========================

  const handleAddItem = () => {
    setIsAddItemOpen(true);
  };

  const handleAddInventoryItem = (payload: ItemSubmitPayload) => {
    const quantity = Math.max(1, payload.quantity);

    const itemName = payload.itemName.trim();

    if (!itemName) return;

    setInventory((prev) => {
      const existingItem = prev.find(
        (item) =>
          item.name.toLowerCase() === itemName.toLowerCase() &&
          item.category === payload.category,
      );

      if (existingItem) {
        return prev.map((item) =>
          item.id === existingItem.id
            ? {
                ...item,
                image: payload.image || item.image,
                quantity: item.quantity + quantity,
              }
            : item,
        );
      }

      return [
        {
          id: payload.id.trim(),
          name: itemName,
          category: payload.category,
          image: payload.image ?? "",
          quantity,
        },
        ...prev,
      ];
    });

    setNewAccessory({
      ...emptyNewAccessoryForm,
      id: payload.id,
      registeredDate: payload.createdDate,
      remark: "",
    });

    setIsAddItemOpen(false);
  };

  // =========================
  // Delete Item
  // =========================

  const handleDeleteItem = (id: string) => {
    setInventory((prev) => prev.filter((item) => item.id !== id));
  };

  // =========================
  // Edit Item
  // =========================

  const handleEditItem = (updatedItem: InventoryItem) => {
    setInventory((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)),
    );
  };

  const handleOpenItemDetails = (item: InventoryItem) => {
    const params = new URLSearchParams({
      category: item.category,
      item: item.name,
    });

    navigate(`/accessories?${params.toString()}`);
  };

  return (
    <div className="flex h-[calc(100vh-3rem)] min-h-0 w-full min-w-0 flex-col gap-6 overflow-hidden">
      {/* Header */}

      <header className="shrink-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-normal text-slate-950 sm:text-3xl">
              Inventory
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {filteredInventory.length} Items
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ImportButton onClick={handleImport} />

            <ExportButton onClick={handleExport} />

            <AddItemButton onClick={handleAddItem} />
          </div>
        </div>
      </header>

      {/* Category Filter */}

      <FilterCategories
        categories={categories}
        inventory={inventory}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        onAddCategory={handleAddCategory}
      />

      {/* Search */}

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
        onOpenItem={handleOpenItemDetails}
        onDeleteItem={handleDeleteItem}
        onEditItem={handleEditItem}
      />

      <AddItemModal
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        newAccessory={newAccessory}
        categories={categories.filter((category) => category !== "All")}
        statuses={Object.keys(statusClasses) as AccessoryStatus[]}
        departments={Object.keys(departmentRoomMap) as Department[]}
        departmentRoomMap={departmentRoomMap}
        existingInventory={inventory}
        onSubmit={handleAddInventoryItem}
      />
    </div>
  );
}
