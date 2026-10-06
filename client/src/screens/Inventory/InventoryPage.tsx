import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

import ExportButton from "@/components/buttons/ExportButton";
import ImportButton from "@/components/buttons/ImportButton";
import AddItemButton from "@/components/buttons/AddItemButton";
import AddItemModal from "@/components/modals/AddItemModal";
import TransferModal from "@/components/modals/TransferModal";
import ScanModal from "@/components/modals/ScanModal";
import QrSheetModal from "@/components/modals/QrSheetModal";
import { type ItemSubmitPayload } from "@/components/modals/ItemModal";
import { Input } from "@/components/ui/input";

import FilterCategories from "./FilterCategories";
import InventoryTable from "./InventoryTable";
import { ArrowLeftRight, FileDown, Search } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";

import { type InventoryItem } from "./data/inventoryData";
import {
  emptyNewAccessoryForm,
  statusClasses,
} from "@/screens/AccessoryDetails/accessoryData";
import {
  type AccessoryStatus,
  type AccessoryItem,
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
  pagination?: { page: number; totalPages: number; total: number };
  message?: string;
}

interface AccessoryDetailsResponse {
  ok: boolean;
  items: {
    id: string;
    item_name: string;
    category_name: string;
    status: AccessoryStatus;
    department: string;
    room: string;
    academic_year: string;
    registered_date: string;
    created_at: string;
    remark: string;
  }[];
  message?: string;
}

interface TransferRequestPayload {
  fromDepartment: string;
  fromRoom: string;
  toDepartment: string;
  toRoom: string;
  itemName: string;
  itemDetailIds: string[];
  transferDate: string;
  remarks?: string | null;
}

interface CreateItemResponse {
  ok: boolean;
  item: ApiInventoryItem & {
    added_quantity?: number;
  };
  qr_codes?: string[];
  item_detail?: {
    department: string;
    room: string;
    academic_year: string;
    status: AccessoryStatus;
    registered_date: string;
    created_at: string;
    remark: string;
  };
  message?: string;
}

interface BulkImportResponse {
  ok: boolean;
  imported_rows: number;
  imported_units: number;
  qr_codes: string[];
  qr_items?: {
    id: string;
    item_name: string;
    category_name: string;
    status: AccessoryStatus;
    department: string;
    room: string;
    academic_year: string;
    registered_date: string;
    created_at: string;
    remark: string;
  }[];
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
    status: "Available" | "Closed" | "Unassigned";
    has_room: boolean;
  }[];
  message?: string;
}

export default function InventoryPage({ departmentName, roomName, embedded = false }: { departmentName?: string; roomName?: string; embedded?: boolean }) {
  const { t } = useLanguage();
  const { accessToken, user } = useAuth();
  const navigate = useNavigate();
  const authHeaders = { Authorization: `Bearer ${accessToken ?? ""}` };
  const isDepartmentHead = user?.role.code === "DEPARTMENT_HEAD";

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
  const [page, setPage] = useState(1), [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const [categoryError, setCategoryError] = useState("");
  const [inventoryError, setInventoryError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");

  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferItems, setTransferItems] = useState<AccessoryItem[]>([]);
  const [qrQueue, setQrQueue] = useState<AccessoryItem[]>([]);

  const [newAccessory, setNewAccessory] = useState<NewAccessoryForm>(
    emptyNewAccessoryForm,
  );

  const storageDepartment = departments.find((department) =>
    ["store", "storage"].includes(department.trim().toLowerCase()),
  ) ?? "";
  const storageDepartmentRoomMap = storageDepartment
    ? { [storageDepartment]: departmentRoomMapState[storageDepartment] ?? [] }
    : {};

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchInventory = async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (selectedCategory !== "All") params.set("category", selectedCategory);
      if (departmentName) params.set("department", departmentName);
      if (roomName) params.set("room", roomName);
      const response = await fetch(`${API_BASE_URL}/api/items?${params}`, { headers: authHeaders });
      const data = (await response.json()) as ItemResponse;
      if (!response.ok || !data.ok) {
        throw new Error(data.message ?? "Failed to load inventory items");
      }
      setInventory(data.items.map(mapApiItem));
      setPagination(data.pagination ?? { page: 1, totalPages: 1, total: data.items.length });
      setInventoryError("");
    } catch (error) {
      setInventoryError(
        error instanceof Error ? error.message : "Failed to load inventory items",
      );
    }
  };

  const fetchTransferItems = async () => {
    if (!embedded || !departmentName) return;

    const params = new URLSearchParams({ page: "1", limit: "1000", department: departmentName });
    if (roomName) params.set("room", roomName);
    const response = await fetch(`${API_BASE_URL}/api/item-details?${params}`, { headers: authHeaders });
    const data = (await response.json()) as AccessoryDetailsResponse;
    if (!response.ok || !data.ok) throw new Error(data.message ?? "Failed to load transferable items");

    setTransferItems(data.items.map((item) => ({
      id: item.id,
      itemName: item.item_name,
      subCategory: item.category_name,
      status: item.status,
      department: item.department as Department,
      room: item.room,
      academicYear: item.academic_year,
      registeredDate: item.registered_date,
      createdAt: item.created_at,
      remark: item.remark,
    })));
  };

  const handleDepartmentTransfer = async (payload: TransferRequestPayload) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/transfers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) return { ok: false, message: data.message ?? "Failed to complete transfer." };

      await Promise.all([fetchInventory(), fetchTransferItems()]);
      window.dispatchEvent(new Event("inventory-transfer-complete"));
      return { ok: true };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : "Failed to complete transfer." };
    }
  };

  // =========================
  // Load Categories
  // =========================

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/categories`, { headers: authHeaders });
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
        const response = await fetch(`${API_BASE_URL}/api/departments`, { headers: authHeaders });
        const data = (await response.json()) as DepartmentApiResponse;

        if (!response.ok || !data.ok) {
          throw new Error(data.message ?? "Failed to load departments");
        }

        const map: Record<string, Set<string>> = {};
        const nextDepartmentIds: Record<string, number> = {};
        const nextRoomIds: Record<string, number> = {};

        for (const department of data.departments) {
          const room = department.classroom || "Room number not assigned";
          if (!map[department.department]) {
            map[department.department] = new Set();
          }
          if (department.has_room) {
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
    void fetchTransferItems().catch((error) => {
      setInventoryError(error instanceof Error ? error.message : "Failed to load transferable items");
    });
  }, [page, selectedCategory, searchQuery, departmentName, roomName]);

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

  const queueGeneratedQrs = (
    data: CreateItemResponse,
    fallback: {
      itemName: string;
      category: string;
      department: string;
      room: string;
      status: AccessoryStatus;
      registeredDate: string;
      remark: string;
    },
  ) => {
    const detail = data.item_detail;
    const generatedItems = (data.qr_codes ?? []).map((code) => ({
      id: code,
      itemName: data.item.item_name,
      subCategory: data.item.category_name,
      status: detail?.status ?? fallback.status,
      department: detail?.department ?? fallback.department,
      room: detail?.room ?? fallback.room,
      academicYear: detail?.academic_year ?? "",
      registeredDate: detail?.registered_date ?? fallback.registeredDate,
      createdAt: detail?.created_at ?? new Date().toISOString(),
      remark: detail?.remark ?? fallback.remark,
      qrCode: code,
    }));

    if (generatedItems.length) {
      setQrQueue((current) => [...current, ...generatedItems]);
    }
  };

  const createInventoryItem = async (input: {
    itemName: string;
    category: string;
    quantity: number;
    department: string;
    room: string;
    status: AccessoryStatus;
    remark: string;
    imageData?: string;
    imageUrl?: string;
    academicYear?: string;
    registeredDate?: string;
  }) => {
    const departmentId = departmentIds[input.department];
    const roomId = roomIds[`${input.department}\u0000${input.room}`];
    const response = await fetch(`${API_BASE_URL}/api/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({
        item_name: input.itemName,
        category_name: input.category,
        category_id: categoryIds[input.category],
        quantity: input.quantity,
        department_id: departmentId,
        room_id: roomId,
        status: input.status,
        remark: input.remark,
        image_data: input.imageData || null,
        image_url: input.imageUrl || null,
        academic_year: input.academicYear || null,
        registered_date: input.registeredDate || null,
      }),
    });
    const data = (await response.json()) as CreateItemResponse & { error?: string };

    if (!response.ok || !data.ok) {
      throw new Error(data.message ?? data.error ?? "Failed to create item");
    }

    return data;
  };

  // =========================
  // Import Excel
  // =========================

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleDownloadImportTemplate = () => {
    const workbook = XLSX.utils.book_new();
    const template = XLSX.utils.aoa_to_sheet([
      [
        "item_name",
        "category_name",
        "quantity",
        "image_url",
        "academic_year",
        "status",
        "registered_date",
        "remark",
      ],
      [
        "Example Laptop",
        "Laptop",
        1,
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=640&auto=format&fit=crop&q=80",
        "2026-2027",
        "Available",
        "2026-10-03",
        "Optional note",
      ],
    ]);
    template["!cols"] = [
      { wch: 28 },
      { wch: 20 },
      { wch: 12 },
      { wch: 48 },
      { wch: 18 },
      { wch: 16 },
      { wch: 18 },
      { wch: 32 },
    ];

    const itemDetailsPreview = XLSX.utils.aoa_to_sheet([
      [
        "item_id",
        "detail_code",
        "qr_code",
        "item_name",
        "category_name",
        "image_url",
        "department",
        "room",
        "academic_year",
        "status",
        "registered_date",
        "created_at",
        "remark",
      ],
      [
        "0001",
        "0001-000001",
        "0001-000001",
        "Example Laptop",
        "Laptop",
        "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=640&auto=format&fit=crop&q=80",
        "Store",
        "Storage",
        "2026-2027",
        "Available",
        "2026-10-03",
        "2026-10-03T00:00:00.000Z",
        "Optional note",
      ],
    ]);
    itemDetailsPreview["!cols"] = [
      { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 28 }, { wch: 20 },
      { wch: 48 }, { wch: 22 }, { wch: 18 }, { wch: 18 }, { wch: 16 },
      { wch: 18 }, { wch: 26 }, { wch: 32 },
    ];

    const instructions = XLSX.utils.aoa_to_sheet([
      ["Field", "Required?", "Exact data to enter"],
      ["item_name", "Yes", "Item name, for example: Dell Latitude 5440"],
      ["category_name", "Yes", "An existing category name, for example: Laptop"],
      ["quantity", "Yes", "A whole number greater than 0, for example: 1"],
      ["image_url", "Optional", "A public image link, for example: https://example.com/laptop.jpg"],
      ["Storage location", "System assigned", "Every imported item is added to Storage. Use Transfer to send it to a department."],
      ["academic_year", "Yes", "Academic year in YYYY-YYYY format, for example: 2026-2027"],
      ["status", "Yes", "Use exactly one of: Available, In Use, Damaged"],
      ["registered_date", "Optional", "Date in YYYY-MM-DD format, for example: 2026-10-03"],
      ["remark", "Optional", "Any short note about the item"],
      ["item_id", "System generated", "Do not add this to Import Items"],
      ["detail_code", "System generated", "Do not add this to Import Items"],
      ["qr_code", "System generated", "Do not add this to Import Items"],
      ["created_at", "System generated", "Do not add this to Import Items"],
      ["Important", "", "Delete the example row before importing your completed file."],
    ]);
    instructions["!cols"] = [{ wch: 22 }, { wch: 20 }, { wch: 82 }];

    XLSX.utils.book_append_sheet(workbook, template, "Import Items");
    XLSX.utils.book_append_sheet(workbook, itemDetailsPreview, "Item Details Preview");
    XLSX.utils.book_append_sheet(workbook, instructions, "Instructions");
    XLSX.writeFile(workbook, "Inventory-Import-Template.xlsx");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (event) => {
      const data = event.target?.result;

      if (!data) return;

      const workbook = XLSX.read(data, {
        type: "array",
      });

      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
      const importedItems = rows.flatMap((row) => {
        const name = String(row.item_name ?? row.name ?? "").trim();
        const category = String(row.category_name ?? row.category ?? "").trim();
        const quantity = Number(row.quantity);

        if (!name || !category || !Number.isFinite(quantity) || quantity < 1) {
          return [];
        }

        return [{
          name,
          category,
          quantity: Math.floor(quantity),
          imageUrl: String(row.image_url ?? row.image ?? "").trim(),
          department: String(row.department ?? "").trim(),
          room: String(row.room ?? "").trim(),
          academicYear: String(row.academic_year ?? "").trim(),
          status: String(row.status ?? "Available").trim() as AccessoryStatus,
          registeredDate: String(row.registered_date ?? "").trim(),
          remark: String(row.remark ?? "").trim(),
        }];
      });

      if (!importedItems.length) {
        setInventoryError("No valid rows were found. Use the Sample File format.");
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/items/import`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({
            items: importedItems.map((item) => ({
              item_name: item.name,
              category_name: item.category,
              quantity: item.quantity,
              image_url: item.imageUrl,
              department: item.department,
              room: item.room,
              academic_year: item.academicYear,
              status: item.status,
              registered_date: item.registeredDate,
              remark: item.remark,
            })),
          }),
        });
        const result = (await response.json()) as BulkImportResponse;
        if (!response.ok || !result.ok) {
          throw new Error(result.message ?? "Unable to import items.");
        }

        await fetchInventory();
        if (result.qr_items?.length) {
          setQrQueue((current) => [
            ...current,
            ...result.qr_items!.map((item) => ({
              id: item.id,
              itemName: item.item_name,
              subCategory: item.category_name,
              status: item.status,
              department: item.department,
              room: item.room,
              academicYear: item.academic_year,
              registeredDate: item.registered_date,
              createdAt: item.created_at,
              remark: item.remark,
              qrCode: item.id,
            })),
          ]);
        }
        setImportSuccess(`${result.imported_rows} item rows (${result.imported_units} physical items) were saved. QR codes were generated.`);
        setInventoryError("");
      } catch (error) {
        setImportSuccess("");
        setInventoryError(error instanceof Error ? error.message : "Unable to import items.");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // =========================
  // Add Item
  // =========================

  const handleAddItem = () => {
    const firstCategory = categories.find((category) => category !== "All");
    const defaultDepartment = storageDepartment;
    const defaultRoom =
      departmentRoomMapState[defaultDepartment]?.[0] ?? "";

    setNewAccessory({
      ...emptyNewAccessoryForm,
      itemName: "",
      subCategory: firstCategory ?? "",
      department: defaultDepartment as Department,
      room: defaultRoom,
      status: "Available",
      remark: "",
    });
    setCategoryError("");
    setIsAddItemOpen(true);
  };

  const openDepartmentAccessoryDetails = (item: InventoryItem) => {
    if (!departmentName) return;
    const params = new URLSearchParams({ department: departmentName, item: item.name });
    navigate(`/accessories?${params.toString()}`);
  };

  const handleAddInventoryItem = async (payload: ItemSubmitPayload) => {
    const quantity = Math.max(1, payload.quantity);
    const itemName = payload.itemName.trim();
    const categoryName = payload.category.trim();

    if (
      !itemName ||
      !categoryName ||
      categoryName === "All" ||
      !payload.room ||
      !["store", "storage"].includes(payload.department.trim().toLowerCase())
    ) {
      setCategoryError("New inventory can only be added to Storage. Transfer it to a department after it is created.");
      return;
    }

    try {
      const data = await createInventoryItem({
        itemName,
        category: categoryName,
        quantity,
        department: payload.department,
        room: payload.room,
        status: payload.status as AccessoryStatus,
        remark: payload.remark,
        imageData: payload.image,
        registeredDate: payload.createdDate,
      });

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

      queueGeneratedQrs(data, {
        itemName,
        category: categoryName,
        department: payload.department,
        room: payload.room,
        status: payload.status as AccessoryStatus,
        registeredDate: payload.createdDate,
        remark: payload.remark,
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
    setInventoryError("");
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
      const message =
        error instanceof Error
          ? error.message
          : "Failed to delete inventory item";
      setInventoryError(message);
      throw new Error(message);
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
    <div className={`inventory-page flex min-h-0 w-full min-w-0 flex-col gap-4 ${embedded ? "overflow-visible" : "h-[calc(100vh-3rem)] gap-6 overflow-hidden"}`}>
      {/* Header */}

      {!embedded && <header className="shrink-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-normal text-slate-950 sm:text-3xl">
              {t("inventory")}
            </h1>

          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!isDepartmentHead && <Button
              type="button"
              variant="outline"
              onClick={handleDownloadImportTemplate}
              className="h-10 gap-2 rounded-xl border-slate-200 bg-white px-4 font-medium text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 hover:shadow-md sm:px-5"
            >
              <FileDown className="h-4 w-4" />
              Sample File
            </Button>}

            {!isDepartmentHead && <ImportButton onClick={handleImport} label={t("import")} />}

            <ExportButton onClick={handleExport} label={t("export")} />

            {!isDepartmentHead && <AddItemButton onClick={handleAddItem} label={t("addItem")} />}
          </div>
        </div>
      </header>}

      {/* Filters mirror the Accessories Details toolbar: actions first, then a full-width search field. */}
      <section className="shrink-0 rounded-lg border border-border bg-card p-3 shadow-sm dark:shadow-none sm:p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <FilterCategories
              categories={categories}
              inventory={inventory}
              selectedCategory={selectedCategory}
              setSelectedCategory={(value) => { setPage(1); setSelectedCategory(value); }}
              onAddCategory={handleAddCategory}
            />
            {embedded && <Button type="button" onClick={() => setIsTransferOpen(true)} className="h-10 gap-2 sm:ml-auto"><ArrowLeftRight className="size-4" />Transfer items</Button>}
          </div>
          <div className="flex h-11 w-full min-w-0 items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 text-left shadow-sm transition hover:bg-slate-50 focus-within:border-slate-900 focus-within:ring-3 focus-within:ring-slate-200">
            <Search className="pointer-events-none size-5 shrink-0 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(event) => { setPage(1); setSearchQuery(event.target.value); }}
              placeholder={t("searchInventory")}
              className="h-full min-w-0 flex-1 border-0 bg-transparent px-0 text-sm font-medium text-slate-950 shadow-none outline-none placeholder:text-slate-500 focus-visible:ring-0"
            />
          </div>
        </div>
      </section>

      {categoryError ? <p className="text-sm font-medium text-red-600">{categoryError}</p> : null}
      {inventoryError ? <p className="text-sm font-medium text-red-600">{inventoryError}</p> : null}
      {importSuccess ? <p className="text-sm font-medium text-emerald-700">{importSuccess}</p> : null}

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
        readOnly={embedded}
        onViewDetails={embedded ? openDepartmentAccessoryDetails : undefined}
      />
      {pagination.totalPages > 1 && <div className="flex items-center justify-between text-sm text-slate-600"><span>Page {pagination.page} of {pagination.totalPages}</span><div className="flex gap-2"><button className="rounded border px-3 py-1 disabled:opacity-50" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button><button className="rounded border px-3 py-1 disabled:opacity-50" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)}>Next</button></div></div>}

      {!embedded && !isDepartmentHead && <AddItemModal
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
        newAccessory={newAccessory}
        categories={categories.filter((category) => category !== "All")}
        categoryIds={categoryIds}
        statuses={Object.keys(statusClasses) as AccessoryStatus[]}
        departments={storageDepartment ? [storageDepartment] as Department[] : []}
        departmentRoomMap={storageDepartmentRoomMap as Record<Department, readonly string[]>}
        departmentIds={departmentIds}
        roomIds={roomIds}
        existingInventory={inventory}
        onSubmit={handleAddInventoryItem}
      />}
      {embedded && departmentName && <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        categories={categories.filter((category) => category !== "All")}
        departments={departments as Department[]}
        departmentRoomMap={departmentRoomMapState as Record<Department, readonly string[]>}
        items={transferItems}
        initialFromDepartment={departmentName}
        onTransfer={handleDepartmentTransfer}
      />}
      <ScanModal
        selectedQrItem={qrQueue.length === 1 ? qrQueue[0] : null}
        onClose={() => setQrQueue((current) => current.slice(1))}
        statusClasses={statusClasses}
      />
      <QrSheetModal
        open={qrQueue.length > 1}
        items={qrQueue}
        onClose={() => setQrQueue([])}
      />
    </div>
  );
}
