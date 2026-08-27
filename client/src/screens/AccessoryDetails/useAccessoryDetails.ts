import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useSearchParams } from "react-router-dom";

import {
  academicYears,
  categories as defaultCategories,
  departmentRoomMap,
  emptyNewAccessoryForm,
  monthNames,
  NONE_FILTER,
  statusClasses,
} from "@/screens/AccessoryDetails/accessoryData";
import {
  formatDate,
  isNoneFilter,
} from "@/screens/AccessoryDetails/accessoryUtils";
import {
  type AccessoryItem,
  type AccessoryStatus,
  type ActiveAccessoryAction,
  type Department,
  type FilterChoice,
  type NewAccessoryForm,
  type SearchType,
  type TableAction,
  type ToolbarAction,
} from "@/screens/AccessoryDetails/types";
import { type ItemSubmitPayload } from "@/components/modals/ItemModal";

function buildDepartmentRoomMap(items: AccessoryItem[]) {
  const map = Object.keys(departmentRoomMap).reduce(
    (result, department) => ({
      ...result,
      [department]: new Set<string>(),
    }),
    {} as Record<Department, Set<string>>,
  );

  for (const item of items) {
    if (!map[item.department]) {
      map[item.department] = new Set();
    }

    if (item.room) {
      map[item.department].add(item.room);
    }
  }

  for (const [department, rooms] of Object.entries(departmentRoomMap)) {
    const departmentKey = department as Department;

    if (!map[departmentKey] || map[departmentKey].size === 0) {
      map[departmentKey] = new Set(rooms);
    }
  }

  return Object.fromEntries(
    Object.entries(map).map(([department, rooms]) => [
      department,
      Array.from(rooms) as readonly string[],
    ]),
  ) as unknown as Record<Department, readonly string[]>;
}

function findDepartmentForRoom(
  room: string,
  roomMap: Record<Department, readonly string[]>,
) {
  return Object.entries(roomMap).find(([, rooms]) => rooms.includes(room))?.[0];
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

interface ApiAccessoryDetail {
  id: string;
  item_detail_id: number;
  item_name: string;
  category_name: string;
  status: string;
  department: string;
  room: string;
  academic_year: string;
  registered_date: string;
  created_at: string;
  remark: string;
  borrower_name?: string | null;
  borrower_id?: string | null;
}

interface AccessoryDetailsResponse {
  ok: boolean;
  items: ApiAccessoryDetail[];
  message?: string;
}

interface AccessoryLookupResponse {
  ok: boolean;
  accessory: ApiAccessoryDetail;
  message?: string;
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

export function useAccessoryDetails() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("category");
  const initialItemName = searchParams.get("item");
  const initialDepartment = searchParams.get("department");
  const initialRoom = searchParams.get("room");
  const insertFileInputRef = useRef<HTMLInputElement | null>(null);
  const [accessoryItems, setAccessoryItems] = useState<AccessoryItem[]>([]);
  const [departmentRoomMapState, setDepartmentRoomMapState] =
    useState<Record<Department, readonly string[]>>(departmentRoomMap);
  const [serverDepartments, setServerDepartments] = useState<Department[]>(
    Object.keys(departmentRoomMap) as Department[],
  );
  const [serverDepartmentRoomMap, setServerDepartmentRoomMap] =
    useState<Record<Department, readonly string[]>>(departmentRoomMap);
  const [serverDepartmentIds, setServerDepartmentIds] = useState<
    Record<string, number>
  >({});
  const [serverRoomIds, setServerRoomIds] = useState<Record<string, number>>(
    {},
  );
  const [categories, setCategories] = useState<string[]>([
    ...defaultCategories,
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("general");
  const [selectedCategory, setSelectedCategory] =
    useState<FilterChoice>(initialCategory);
  const [selectedItemName, setSelectedItemName] =
    useState<FilterChoice>(initialItemName);
  const [selectedDepartment, setSelectedDepartment] =
    useState<FilterChoice>(initialDepartment);
  const [selectedRoom, setSelectedRoom] = useState<FilterChoice>(initialRoom);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<
    string | null
  >(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [dateInput, setDateInput] = useState("");
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [selectedQrItem, setSelectedQrItemState] =
    useState<AccessoryItem | null>(null);
  const [activeAction, setActiveAction] =
    useState<ActiveAccessoryAction | null>(null);
  const [toolbarAction, setToolbarAction] = useState<ToolbarAction | null>(
    null,
  );
  const [insertedFileName, setInsertedFileName] = useState("");
  const [newAccessory, setNewAccessory] = useState<NewAccessoryForm>(
    emptyNewAccessoryForm,
  );
  const [accessoryError, setAccessoryError] = useState("");

  useEffect(() => {
    setDepartmentRoomMapState(buildDepartmentRoomMap(accessoryItems));
  }, [accessoryItems]);

  // The room API is the source of truth, while item locations provide a safe
  // fallback during loading or after a newly completed transfer.
  const transferDepartmentRoomMap = useMemo(() => {
    const roomsByDepartment = new Map<string, Set<string>>();

    for (const [department, rooms] of Object.entries(serverDepartmentRoomMap)) {
      roomsByDepartment.set(department, new Set(rooms));
    }

    for (const item of accessoryItems) {
      if (!item.department || !item.room) continue;
      const rooms = roomsByDepartment.get(item.department) ?? new Set<string>();
      rooms.add(item.room);
      roomsByDepartment.set(item.department, rooms);
    }

    return Object.fromEntries(
      Array.from(roomsByDepartment, ([department, rooms]) => [
        department,
        Array.from(rooms),
      ]),
    ) as Record<Department, readonly string[]>;
  }, [accessoryItems, serverDepartmentRoomMap]);

  const transferDepartments = useMemo(
    () => Object.keys(transferDepartmentRoomMap) as Department[],
    [transferDepartmentRoomMap],
  );

  const rooms = useMemo(() => {
    const allRooms = Array.from(
      new Set([
        ...accessoryItems.map((item) => item.room),
        ...Object.values(serverDepartmentRoomMap).flat(),
      ]),
    );

    if (selectedDepartment && !isNoneFilter(selectedDepartment)) {
      return serverDepartmentRoomMap[selectedDepartment as Department] ?? [];
    }

    return allRooms;
  }, [accessoryItems, selectedDepartment, serverDepartmentRoomMap]);

  const departmentOptions = useMemo(() => {
    if (selectedRoom && !isNoneFilter(selectedRoom)) {
      return Array.from(
        new Set(
          [
            findDepartmentForRoom(selectedRoom, serverDepartmentRoomMap),
            ...accessoryItems
              .filter((item) => item.room === selectedRoom)
              .map((item) => item.department),
          ].filter(Boolean) as Department[],
        ),
      );
    }

    if (serverDepartments.length > 0) {
      return serverDepartments;
    }

    const departments = accessoryItems.map((item) => item.department);

    if (departments.length > 0) {
      return Array.from(new Set(departments)) as Department[];
    }

    return Object.keys(departmentRoomMapState) as Department[];
  }, [
    accessoryItems,
    departmentRoomMapState,
    selectedRoom,
    serverDepartments,
    serverDepartmentRoomMap,
  ]);

  const itemNames = useMemo(() => {
    const categoryAccessories =
      selectedCategory && !isNoneFilter(selectedCategory)
        ? accessoryItems.filter((item) => item.subCategory === selectedCategory)
        : accessoryItems;

    return Array.from(
      new Set(categoryAccessories.map((item) => item.itemName)),
    );
  }, [accessoryItems, selectedCategory]);

  const filteredAccessories = useMemo(() => {
    return accessoryItems.filter((item) => {
      const normalizedSearchQuery = searchQuery.trim().toLowerCase();
      const matchesSearch =
        normalizedSearchQuery.length === 0 ||
        (searchType === "id"
          ? item.id.toLowerCase().includes(normalizedSearchQuery)
          : searchType === "general"
            ? [
                item.id,
                item.itemName,
                item.subCategory,
                item.department,
                item.room,
                item.remark,
              ].some((value) =>
                value.toLowerCase().includes(normalizedSearchQuery),
              )
            : true);
      const matchesAcademicYear =
        !selectedAcademicYear || item.academicYear === selectedAcademicYear;
      const matchesDate =
        !selectedDate || item.registeredDate === formatDate(selectedDate);
      const matchesCategory =
        !selectedCategory ||
        (!isNoneFilter(selectedCategory) &&
          item.subCategory === selectedCategory);
      const matchesItemName =
        !selectedItemName ||
        (!isNoneFilter(selectedItemName) && item.itemName === selectedItemName);
      const matchesDepartment =
        !selectedDepartment ||
        (!isNoneFilter(selectedDepartment) &&
          item.department === selectedDepartment);
      const matchesRoom =
        !selectedRoom ||
        (!isNoneFilter(selectedRoom) && item.room === selectedRoom);

      return (
        matchesSearch &&
        matchesAcademicYear &&
        matchesDate &&
        matchesCategory &&
        matchesItemName &&
        matchesDepartment &&
        matchesRoom
      );
    });
  }, [
    accessoryItems,
    searchQuery,
    searchType,
    selectedAcademicYear,
    selectedCategory,
    selectedDate,
    selectedDepartment,
    selectedItemName,
    selectedRoom,
  ]);

  const hasActiveFilters =
    selectedCategory ||
    selectedItemName ||
    selectedDepartment ||
    selectedRoom ||
    selectedAcademicYear ||
    selectedDate;

  const resetFilters = () => {
    setSearchQuery("");
    setSearchType("general");
    setSelectedAcademicYear(null);
    setSelectedDate(undefined);
    setDateInput("");
    setSelectedCategory(null);
    setSelectedItemName(null);
    setSelectedDepartment(null);
    setSelectedRoom(null);
  };

  const selectDepartment = (department: Department) => {
    setSelectedDepartment(department);
    setSelectedRoom(serverDepartmentRoomMap[department]?.[0] ?? null);
  };

  const selectRoom = (room: FilterChoice) => {
    setSelectedRoom(room);

    if (room && !isNoneFilter(room)) {
      setSelectedDepartment(
        findDepartmentForRoom(room, serverDepartmentRoomMap) ?? null,
      );
      return;
    }

    setSelectedDepartment(null);
  };

  const selectCategory = (category: FilterChoice) => {
    setSelectedCategory(category);
    setSelectedItemName(null);
  };

  const selectSearchType = (type: SearchType) => {
    setSearchType(type);
    setSearchQuery("");
    setSelectedAcademicYear(null);
    setSelectedDate(undefined);
    setDateInput("");
  };

  const loadAccessoryDetails = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/item-details`);
      const data = (await response.json()) as AccessoryDetailsResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.message ?? "Failed to load accessory details");
      }

      setAccessoryItems(
        data.items.map((item) => ({
          id: item.id,
          itemDetailId: item.item_detail_id,
          itemName: item.item_name,
          subCategory: item.category_name,
          status: item.status as AccessoryStatus,
          department: item.department as Department,
          room: item.room,
          academicYear: item.academic_year,
          registeredDate: item.registered_date,
          createdAt: item.created_at,
          remark: item.remark,
        })),
      );

      const uniqueCategories = Array.from(
        new Set(data.items.map((item) => item.category_name)),
      );

      if (uniqueCategories.length > 0) {
        setCategories(uniqueCategories);
      }

      setAccessoryError("");
    } catch (error) {
      setAccessoryError(
        error instanceof Error
          ? error.message
          : "Failed to load accessory details",
      );
    }
  };

  const openQrModal = async (accessory: AccessoryItem) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/accessories/by-code/${encodeURIComponent(accessory.id)}`,
      );
      const data = (await response.json()) as AccessoryLookupResponse;

      if (!response.ok || !data.ok || !data.accessory) {
        throw new Error(data.message ?? "Failed to fetch QR code details");
      }

      const detail = data.accessory;

      setSelectedQrItemState({
        id: detail.id,
        itemDetailId: detail.item_detail_id,
        itemName: detail.item_name,
        subCategory: detail.category_name,
        status: detail.status as AccessoryStatus,
        department: detail.department as Department,
        room: detail.room,
        academicYear: detail.academic_year,
        registeredDate: detail.registered_date,
        createdAt: detail.created_at,
        remark: detail.remark,
        borrowerName: detail.borrower_name ?? undefined,
        borrowerId: detail.borrower_id ?? undefined,
        qrCode: detail.id,
      });
    } catch (error) {
      console.error(error);
      setSelectedQrItemState(accessory);
    }
  };

  useEffect(() => {
    void loadAccessoryDetails();
  }, []);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/departments`);
        const result = (await response.json()) as DepartmentApiResponse;

        if (!response.ok || !result.ok) {
          throw new Error(result.message ?? "Failed to load departments");
        }

        const roomsByDepartment = result.departments.reduce(
          (current, room) => {
            const departmentName = room.department as Department;

            if (!current[departmentName]) {
              current[departmentName] = new Set<string>();
            }

            if (room.classroom) {
              current[departmentName].add(room.classroom);
            }

            return current;
          },
          {} as Record<Department, Set<string>>,
        );
        const nextDepartmentIds: Record<string, number> = {};
        const nextRoomIds: Record<string, number> = {};

        for (const room of result.departments) {
          nextDepartmentIds[room.department] = room.department_id;
          if (room.classroom) {
            nextRoomIds[`${room.department}\u0000${room.classroom}`] = room.id;
          }
        }

        setServerDepartments(
          Array.from(
            new Set(result.departments.map((room) => room.department)),
          ) as Department[],
        );

        setServerDepartmentRoomMap(
          Object.fromEntries(
            Object.entries(roomsByDepartment).map(([department, rooms]) => [
              department,
              Array.from(rooms) as readonly string[],
            ]),
          ) as unknown as Record<Department, readonly string[]>,
        );
        setServerDepartmentIds(nextDepartmentIds);
        setServerRoomIds(nextRoomIds);
      } catch {
        // Preserve local department room map if API fails.
      }
    };

    void loadDepartments();
  }, []);

  const handleTransfer = async (
    payload: TransferRequestPayload,
  ): Promise<{ ok: boolean; message?: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/transfers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        return {
          ok: false,
          message: data.message ?? "Failed to complete transfer.",
        };
      }

      await loadAccessoryDetails();
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to complete transfer.",
      };
    }
  };

  const selectFilterDepartment = (department: FilterChoice) => {
    if (department && !isNoneFilter(department)) {
      selectDepartment(department as Department);
      return;
    }

    setSelectedDepartment(department);
    setSelectedRoom(null);
  };

  const openActionDialog = (type: TableAction, item: AccessoryItem) => {
    setActiveAction({ type, item });
    setOpenActionId(null);
  };

  const handleInsertFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setInsertedFileName(file.name);
    setToolbarAction("insert");
    event.target.value = "";
  };

  const exportVisibleAccessories = () => {
    const headers: (keyof AccessoryItem)[] = [
      "id",
      "itemName",
      "subCategory",
      "status",
      "department",
      "room",
      "academicYear",
      "registeredDate",
      "createdAt",
      "remark",
    ];
    const escapeCsvValue = (value: string) =>
      `"${value.replaceAll('"', '""')}"`;
    const csvRows = [
      headers.join(","),
      ...filteredAccessories.map((item) =>
        headers.map((header) => escapeCsvValue(String(item[header]))).join(","),
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "accessories-details.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setToolbarAction("export");
  };

  const addAccessoryItem = async (payload: ItemSubmitPayload) => {
    const quantity = Math.max(1, payload.quantity);
    const itemName = payload.itemName.trim();
    const categoryName = payload.category.trim();

    if (
      !itemName ||
      !categoryName ||
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
          quantity,
          department_id: payload.departmentId,
          room_id: payload.roomId,
          remark: payload.remark,
          image_data: payload.image || null,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message ?? "Failed to create accessory items");
      }

      await loadAccessoryDetails();
      setNewAccessory({
        ...emptyNewAccessoryForm,
        department: payload.department as Department,
        room: payload.room,
        registeredDate: formatDate(new Date()),
        remark: "",
      });
      setToolbarAction(null);
    } catch (error) {
      setAccessoryError(
        error instanceof Error
          ? error.message
          : "Failed to create accessory items",
      );
    }
  };

  const updateAccessoryItem = async (payload: ItemSubmitPayload) => {
    const activeItem = activeAction?.item;

    if (!activeItem) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/item-details/${encodeURIComponent(activeItem.id)}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: payload.status,
            remark: payload.remark,
          }),
        },
      );
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message ?? "Failed to update accessory details");
      }

      await loadAccessoryDetails();
      setActiveAction(null);
    } catch (error) {
      setAccessoryError(
        error instanceof Error
          ? error.message
          : "Failed to update accessory details",
      );
    }
  };

  const openAddItemModal = () => {
    const defaultDepartment = "Store" as Department;
    const defaultRoom =
      serverDepartmentRoomMap[defaultDepartment]?.[0] ??
      departmentRoomMapState[defaultDepartment]?.[0] ??
      "";

    setNewAccessory({
      ...emptyNewAccessoryForm,
      department: defaultDepartment,
      room: defaultRoom,
      registeredDate: formatDate(new Date()),
    });
    setToolbarAction("add");
  };

  return {
    headerProps: {
      insertFileInputRef,
      canExport: filteredAccessories.length > 0,
      onInsertClick: () => insertFileInputRef.current?.click(),
      onInsertFile: handleInsertFile,
      onExport: exportVisibleAccessories,
      onAddItem: openAddItemModal,
    },
    accessoryError,
    filterBarProps: {
      hasActiveFilters,
      resetFilters,
      selectedCategory,
      selectedItemName,
      selectedDepartment,
      selectedRoom,
      categories,
      itemNames,
      departmentOptions,
      rooms,
      selectCategory,
      setSelectedItemName,
      onDepartmentChange: selectFilterDepartment,
      selectRoom,
      searchType,
      searchQuery,
      selectedAcademicYear,
      selectedDate,
      dateInput,
      calendarViewDate,
      academicYears,
      monthNames,
      onSearchTypeChange: selectSearchType,
      onSearchQueryChange: setSearchQuery,
      onAcademicYearChange: setSelectedAcademicYear,
      onDateChange: setSelectedDate,
      onDateInputChange: setDateInput,
      onCalendarViewDateChange: setCalendarViewDate,
      formatDate,
      isNoneFilter,
      noneFilterValue: NONE_FILTER,
      onTransferClick: () => setToolbarAction("transfer"),
    },
    tableProps: {
      filteredAccessories,
      statusClasses,
      openActionId,
      setOpenActionId,
      setSelectedQrItem: openQrModal,
      openActionDialog,
    },
    addItemModalProps: {
      isOpen: toolbarAction === "add",
      onClose: () => setToolbarAction(null),
      newAccessory,
      categories,
      statuses: Object.keys(statusClasses) as AccessoryStatus[],
      departments: Object.keys(serverDepartmentRoomMap).filter(
        (department) => department.toLowerCase() === "store",
      ) as Department[],
      departmentRoomMap: Object.fromEntries(
        Object.entries(serverDepartmentRoomMap).filter(
          ([department]) => department.toLowerCase() === "store",
        ),
      ) as Record<Department, readonly string[]>,
      departmentIds: serverDepartmentIds,
      roomIds: serverRoomIds,
      onSubmit: addAccessoryItem,
    },
    insertModalProps: {
      isOpen: toolbarAction === "insert",
      insertedFileName,
      onClose: () => setToolbarAction(null),
    },
    exportModalProps: {
      isOpen: toolbarAction === "export",
      visibleAccessoriesCount: filteredAccessories.length,
      onClose: () => setToolbarAction(null),
    },
    actionMenuModalProps: {
      activeAction,
      categories,
      statuses: Object.keys(statusClasses) as AccessoryStatus[],
      departments: Object.keys(departmentRoomMapState) as Department[],
      departmentRoomMap: departmentRoomMapState,
      onClose: () => setActiveAction(null),
      onSubmitEdit: updateAccessoryItem,
    },
    transferModalProps: {
      isOpen: toolbarAction === "transfer",
      onClose: () => setToolbarAction(null),
      categories,
      departments: transferDepartments,
      departmentRoomMap: transferDepartmentRoomMap,
      items: accessoryItems,
      onTransfer: handleTransfer,
    },
    qrScanModalProps: {
      selectedQrItem,
      statusClasses,
      onClose: () => setSelectedQrItemState(null),
    },
  };
}
