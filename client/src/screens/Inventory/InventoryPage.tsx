import { useEffect, useMemo, useRef, useState } from "react";
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
import { useLanguage } from "@/context/LanguageContext";

import { type InventoryItem } from "./data/inventoryData";
import {
  emptyNewAccessoryForm,
  statusClasses,
} from "@/screens/AccessoryDetails/accessoryData";
import {
  type AccessoryStatus,
  type Department,
  type NewAccessoryForm,
} from "@/screens/AccessoryDetails/types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

interface CategoryResponse {
  ok: boolean;
  categories: {
    category_id: number;
    category_name: string;
    description: string | null;
    rental_allowed: boolean;
  }[];
  message?: string;
}

interface CreateCategoryResponse {
  ok: boolean;
  category: {
    category_id: number;
    category_name: string;
    description: string | null;
    rental_allowed: boolean;
  };
  message?: string;
}

interface ApiInventoryItem {
  item_id: string;
  item_name: string;
  category_name: string;
  image_url: string | null;
  quantity: number;
}

interface ItemResponse {
  ok: boolean;
  items: ApiInventoryItem[];
  message?: string;
}

interface CreateItemResponse {
  ok: boolean;
  item: ApiInventoryItem & {
    added_quantity?: number;
  };
  message?: string;
}

function mapApiItem(item: ApiInventoryItem): InventoryItem {
  return {
    id: item.item_id,
    name: item.item_name,
    category: item.category_name,
    image:
      item.image_url && item.image_url.startsWith("/")
        ? `${API_BASE_URL}${item.image_url}`
        : (item.image_url ?? ""),
    quantity: item.quantity,
  };
}

interface DepartmentApiResponse {
  ok: boolean;
  departments: {
    id: number;
    department_id: number;
    department: string;
    classroom: string;
    status: "Available" | "Closed";
  }[];
  message?: string;
}

export default function InventoryPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const [categories, setCategories] = useState(["All"]);
  const [categoryIds, setCategoryIds] = useState<Record<string, number>>({});

  const [departments, setDepartments] = useState<string[]>([]);
  const [departmentRoomMapState, setDepartmentRoomMapState] =
    useState<Record<string, readonly string[]>>({});
  const [departmentIds, setDepartmentIds] = useState<Record<string, number>>(
    {},
  );
  const [roomIds, setRoomIds] = useState<Record<string, number>>({});

  const [selectedCategory, setSelectedCategory] = useState("All");

  const [searchQuery, setSearchQuery] = useState("");

  const [categoryError, setCategoryError] = useState("");
  const [inventoryError, setInventoryError] = useState("");

  const [isAddItemOpen, setIsAddItemOpen] = useState(false);

  const [newAccessory, setNewAccessory] = useState<NewAccessoryForm>(
    emptyNewAccessoryForm,
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchInventory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/items`);
      const data = (await response.json()) as ItemResponse;
      if (!response.ok || !data.ok) {
        throw new Error(data.message ?? "Failed to load inventory items");
      }
      setInventory(data.items.map(mapApiItem));
      setInventoryError("");
    } catch (error) {
      setInventoryError(
        error instanceof Error ? error.message : "Failed to load inventory items",
      );
    }
  };

  // =========================
  // Load Categories
  // =========================

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/categories`);
        const data = (await response.json()) as CategoryResponse;

        if (!response.ok || !data.ok) {
          throw new Error(data.message ?? "Failed to load categories");
        }

        setCategories([
          "All",
          ...data.categories.map((category) => category.category_name),
        ]);
        setCategoryIds(
          Object.fromEntries(
            data.categories.map((category) => [
              category.category_name,
              category.category_id,
            ]),
          ),
        );
        setCategoryError("");
      } catch (error) {
        setCategoryError(
          error instanceof Error ? error.message : "Failed to load categories",
        );
      }
    };

    const loadDepartments = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/departments`);
        const data = (await response.json()) as DepartmentApiResponse;

        if (!response.ok || !data.ok) {
          throw new Error(data.message ?? "Failed to load departments");
        }

        const map: Record<string, Set<string>> = {};
        const nextDepartmentIds: Record<string, number> = {};
        const nextRoomIds: Record<string, number> = {};

        for (const department of data.departments) {
          const room = department.classroom;
          if (!map[department.department]) {
            map[department.department] = new Set();
          }
          if (room) {
            map[department.department].add(room);
            nextRoomIds[`${department.department}\u0000${room}`] = department.id;
          }
          nextDepartmentIds[department.department] = department.department_id;
        }

        const departmentList = Object.keys(map);
        const roomMap = Object.fromEntries(
          departmentList.map((name) => [name, Array.from(map[name])]),
        );

        setDepartments(departmentList);
        setDepartmentRoomMapState(roomMap);
        setDepartmentIds(nextDepartmentIds);
        setRoomIds(nextRoomIds);
      } catch (error) {
        setInventoryError(
          error instanceof Error ? error.message : "Failed to load departments",
        );
      }
    };

    const loadInventory = async () => {
      await fetchInventory();
    };

    void loadCategories();
    void loadDepartments();
    void loadInventory();
  }, []);

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

  const handleAddCategory = async (category: string) => {
    const value = category.trim();

    if (!value) return;

    if (categories.some((c) => c.toLowerCase() === value.toLowerCase())) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category_name: value,
          description: null,
          rental_allowed: false,
        }),
      });
      const data = (await response.json()) as CreateCategoryResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.message ?? "Failed to create category");
      }

      setCategories((prev) => [...prev, data.category.category_name]);
      setCategoryIds((prev) => ({
        ...prev,
        [data.category.category_name]: data.category.category_id,
      }));
      setSelectedCategory(data.category.category_name);
      setCategoryError("");
    } catch (error) {
      setCategoryError(
        error instanceof Error ? error.message : "Failed to create category",
      );
    }
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
    const firstCategory = categories.find((category) => category !== "All");
    const defaultDepartment =
      departments.find(
        (department) => department.toLowerCase() === "store",
      ) ?? "";

    setNewAccessory({
      ...emptyNewAccessoryForm,
      itemName: "",
      subCategory: firstCategory ?? "",
      department: defaultDepartment as Department,
      room: departmentRoomMapState[defaultDepartment]?.[0] ?? "",
      status: "Available",
      remark: "",
    });
    setCategoryError("");
    setIsAddItemOpen(true);
  };

  const handleAddInventoryItem = async (payload: ItemSubmitPayload) => {
    const quantity = Math.max(1, payload.quantity);
    const itemName = payload.itemName.trim();
    const categoryName = payload.category.trim();

    if (
      !itemName ||
      !categoryName ||
      categoryName === "All" ||
      !payload.departmentId ||
      !payload.roomId
    ) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          item_name: itemName,
          category_name: categoryName,
          category_id: payload.categoryId,
          quantity,
          department_id: payload.departmentId,
          room_id: payload.roomId,
          remark: payload.remark,
          image_data: payload.image || null,
        }),
      });

      const data = (await response.json()) as CreateItemResponse & {
        error?: string;
      };

      if (!response.ok || !data.ok) {
        throw new Error(data.message ?? data.error ?? "Failed to create item");
      }

      const mappedItem = mapApiItem(data.item);

      setInventory((prev) => {
        const existingItem = prev.find((item) => item.id === mappedItem.id);

        if (existingItem) {
          return prev.map((item) =>
            item.id === existingItem.id ? mappedItem : item,
          );
        }

        return [mappedItem, ...prev];
      });

      setNewAccessory({
        ...emptyNewAccessoryForm,
        id: data.item.item_id,
        subCategory: data.item.category_name,
        department: payload.department as Department,
        room: payload.room,
        registeredDate: payload.createdDate,
        remark: "",
      });

      setCategoryError("");
      setIsAddItemOpen(false);
    } catch (error) {
      setCategoryError(
        error instanceof Error
          ? error.message
          : "Failed to create item. Is the API server running?",
      );
    }
  };

  // =========================
  // Delete Item
  // =========================

  const handleDeleteItem = async (id: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/items/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message ?? "Failed to delete inventory item");
      }

      await fetchInventory();
    } catch (error) {
      setInventoryError(
        error instanceof Error
          ? error.message
          : "Failed to delete inventory item",
      );
    }
  };

  // =========================
  // Edit Item
  // =========================

  const handleEditItem = async (
    updatedItem: InventoryItem & { categoryId?: number },
  ) => {
    if (updatedItem.categoryId) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/items/${encodeURIComponent(updatedItem.id)}/category`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category_id: updatedItem.categoryId }),
          },
        );
        const data = (await response.json()) as CreateItemResponse;

        if (!response.ok || !data.ok) {
          throw new Error(data.message ?? "Failed to update item category");
        }

        updatedItem = { ...updatedItem, category: data.item.category_name };
      } catch (error) {
        setInventoryError(
          error instanceof Error ? error.message : "Failed to update item category",
        );
        return;
      }
    }

    if (updatedItem.image.startsWith("data:image/")) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/items/${encodeURIComponent(updatedItem.id)}/image`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ image_data: updatedItem.image }),
          },
        );
        const data = (await response.json()) as CreateItemResponse;

        if (!response.ok || !data.ok) {
          throw new Error(data.message ?? "Failed to save item image");
        }

        updatedItem = {
          ...updatedItem,
          image: mapApiItem(data.item).image,
        };
      } catch (error) {
        setInventoryError(
          error instanceof Error ? error.message : "Failed to save item image",
        );
        return;
      }
    }

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
    <div className="inventory-page flex h-[calc(100vh-3rem)] min-h-0 w-full min-w-0 flex-col gap-6 overflow-hidden">
      {/* Header */}

      <header className="shrink-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-normal text-slate-950 sm:text-3xl">
              {t("inventory")}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {filteredInventory.length} {t("items")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ImportButton onClick={handleImport} label={t("import")} />

            <ExportButton onClick={handleExport} label={t("export")} />

            <AddItemButton onClick={handleAddItem} label={t("addItem")} />
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

      {categoryError ? (
        <p className="text-sm font-medium text-red-600">{categoryError}</p>
      ) : null}

      {inventoryError ? (
        <p className="text-sm font-medium text-red-600">{inventoryError}</p>
      ) : null}

      {/* Search */}

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("searchInventory")}
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
        categories={Object.entries(categoryIds).map(([name, id]) => ({ id, name }))}
        onOpenItem={handleOpenItemDetails}
        onDeleteItem={handleDeleteItem}
        onEditItem={handleEditItem}
      />

      <AddItemModal
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        newAccessory={newAccessory}
        categories={categories.filter((category) => category !== "All")}
        categoryIds={categoryIds}
        statuses={Object.keys(statusClasses) as AccessoryStatus[]}
        departments={
          departments.filter(
            (department) => department.toLowerCase() === "store",
          ) as Department[]
        }
        departmentRoomMap={
          Object.fromEntries(
            Object.entries(departmentRoomMapState).filter(
              ([department]) => department.toLowerCase() === "store",
            ),
          ) as Record<Department, readonly string[]>
        }
        departmentIds={departmentIds}
        roomIds={roomIds}
        existingInventory={inventory}
        onSubmit={handleAddInventoryItem}
      />
    </div>
  );
}
