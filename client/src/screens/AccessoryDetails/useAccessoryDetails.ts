import { useMemo, useRef, useState, type ChangeEvent } from "react"
import { useSearchParams } from "react-router-dom"

import {
  academicYears,
  categories,
  departmentRoomMap,
  emptyNewAccessoryForm,
  initialAccessories,
  monthNames,
  NONE_FILTER,
  statusClasses,
} from "@/screens/AccessoryDetails/accessoryData"
import {
  formatDate,
  formatDateTime,
  incrementAccessoryId,
  isNoneFilter,
} from "@/screens/AccessoryDetails/accessoryUtils"
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
} from "@/screens/AccessoryDetails/types"
import { type ItemSubmitPayload } from "@/components/modals/ItemModal"

function findDepartmentForRoom(room: string) {
  return Object.entries(departmentRoomMap).find(([, rooms]) =>
    rooms.includes(room)
  )?.[0] as Department | undefined
}

export function useAccessoryDetails() {
  const [searchParams] = useSearchParams()
  const initialCategory = searchParams.get("category")
  const initialItemName = searchParams.get("item")
  const initialDepartment = searchParams.get("department")
  const initialRoom = searchParams.get("room")
  const insertFileInputRef = useRef<HTMLInputElement | null>(null)
  const [accessoryItems, setAccessoryItems] = useState<AccessoryItem[]>(
    initialAccessories
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [searchType, setSearchType] = useState<SearchType>("general")
  const [selectedCategory, setSelectedCategory] =
    useState<FilterChoice>(initialCategory)
  const [selectedItemName, setSelectedItemName] =
    useState<FilterChoice>(initialItemName)
  const [selectedDepartment, setSelectedDepartment] =
    useState<FilterChoice>(initialDepartment)
  const [selectedRoom, setSelectedRoom] = useState<FilterChoice>(initialRoom)
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string | null>(
    null
  )
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [dateInput, setDateInput] = useState("")
  const [calendarViewDate, setCalendarViewDate] = useState(new Date())
  const [openActionId, setOpenActionId] = useState<string | null>(null)
  const [selectedQrItem, setSelectedQrItem] = useState<AccessoryItem | null>(null)
  const [activeAction, setActiveAction] =
    useState<ActiveAccessoryAction | null>(null)
  const [toolbarAction, setToolbarAction] = useState<ToolbarAction | null>(null)
  const [insertedFileName, setInsertedFileName] = useState("")
  const [newAccessory, setNewAccessory] =
    useState<NewAccessoryForm>(emptyNewAccessoryForm)

  const rooms = useMemo(
    () =>
      selectedDepartment && !isNoneFilter(selectedDepartment)
        ? [...departmentRoomMap[selectedDepartment as Department]]
        : Array.from(new Set(accessoryItems.map((item) => item.room))),
    [accessoryItems, selectedDepartment]
  )

  const departmentOptions = useMemo(
    () =>
      selectedRoom && !isNoneFilter(selectedRoom)
        ? Array.from(
            new Set([
              findDepartmentForRoom(selectedRoom),
              ...accessoryItems
                .filter((item) => item.room === selectedRoom)
                .map((item) => item.department),
            ].filter(Boolean) as Department[])
          )
        : Object.keys(departmentRoomMap),
    [accessoryItems, selectedRoom]
  )

  const itemNames = useMemo(() => {
    const categoryAccessories =
      selectedCategory && !isNoneFilter(selectedCategory)
        ? accessoryItems.filter((item) => item.subCategory === selectedCategory)
        : accessoryItems

    return Array.from(new Set(categoryAccessories.map((item) => item.itemName)))
  }, [accessoryItems, selectedCategory])

  const filteredAccessories = useMemo(() => {
    return accessoryItems.filter((item) => {
      const normalizedSearchQuery = searchQuery.trim().toLowerCase()
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
                value.toLowerCase().includes(normalizedSearchQuery)
              )
            : true)
      const matchesAcademicYear =
        !selectedAcademicYear || item.academicYear === selectedAcademicYear
      const matchesDate =
        !selectedDate || item.registeredDate === formatDate(selectedDate)
      const matchesCategory =
        !selectedCategory ||
        (!isNoneFilter(selectedCategory) && item.subCategory === selectedCategory)
      const matchesItemName =
        !selectedItemName ||
        (!isNoneFilter(selectedItemName) && item.itemName === selectedItemName)
      const matchesDepartment =
        !selectedDepartment ||
        (!isNoneFilter(selectedDepartment) &&
          item.department === selectedDepartment)
      const matchesRoom =
        !selectedRoom || (!isNoneFilter(selectedRoom) && item.room === selectedRoom)

      return (
        matchesSearch &&
        matchesAcademicYear &&
        matchesDate &&
        matchesCategory &&
        matchesItemName &&
        matchesDepartment &&
        matchesRoom
      )
    })
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
  ])

  const hasActiveFilters =
    selectedCategory ||
    selectedItemName ||
    selectedDepartment ||
    selectedRoom ||
    selectedAcademicYear ||
    selectedDate

  const resetFilters = () => {
    setSearchQuery("")
    setSearchType("general")
    setSelectedAcademicYear(null)
    setSelectedDate(undefined)
    setDateInput("")
    setSelectedCategory(null)
    setSelectedItemName(null)
    setSelectedDepartment(null)
    setSelectedRoom(null)
  }

  const selectDepartment = (department: Department) => {
    setSelectedDepartment(department)
    setSelectedRoom(departmentRoomMap[department][0] ?? null)
  }

  const selectRoom = (room: FilterChoice) => {
    setSelectedRoom(room)

    if (room && !isNoneFilter(room)) {
      setSelectedDepartment(findDepartmentForRoom(room) ?? null)
      return
    }

    setSelectedDepartment(null)
  }

  const selectCategory = (category: FilterChoice) => {
    setSelectedCategory(category)
    setSelectedItemName(null)
  }

  const selectSearchType = (type: SearchType) => {
    setSearchType(type)
    setSearchQuery("")
    setSelectedAcademicYear(null)
    setSelectedDate(undefined)
    setDateInput("")
  }

  const selectFilterDepartment = (department: FilterChoice) => {
    if (department && !isNoneFilter(department)) {
      selectDepartment(department as Department)
      return
    }

    setSelectedDepartment(department)
    setSelectedRoom(null)
  }

  const openActionDialog = (type: TableAction, item: AccessoryItem) => {
    setActiveAction({ type, item })
    setOpenActionId(null)
  }

  const handleInsertFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setInsertedFileName(file.name)
    setToolbarAction("insert")
    event.target.value = ""
  }

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
    ]
    const escapeCsvValue = (value: string) => `"${value.replaceAll('"', '""')}"`
    const csvRows = [
      headers.join(","),
      ...filteredAccessories.map((item) =>
        headers.map((header) => escapeCsvValue(String(item[header]))).join(",")
      ),
    ]
    const blob = new Blob([csvRows.join("\n")], {
      type: "text/csv;charset=utf-8",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = "accessories-details.csv"
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    setToolbarAction("export")
  }

  const addAccessoryItem = (payload: ItemSubmitPayload) => {
    const quantity = Math.max(1, payload.quantity)
    const firstItem: AccessoryItem = {
      id: payload.id.trim(),
      itemName: payload.itemName.trim(),
      subCategory: payload.category,
      status: payload.status as AccessoryStatus,
      department: payload.department as Department,
      room: payload.room.trim(),
      academicYear: newAccessory.academicYear,
      registeredDate: payload.createdDate,
      createdAt: formatDateTime(new Date()),
      remark: payload.remark,
    }

    if (!firstItem.id || !firstItem.itemName || !firstItem.room) {
      return
    }

    const nextItems = Array.from({ length: quantity }, (_, index) => ({
      ...firstItem,
      id: incrementAccessoryId(firstItem.id, index),
      createdAt: index === 0 ? firstItem.createdAt : formatDateTime(new Date()),
    }))

    setAccessoryItems((current) => [...nextItems, ...current])
    setNewAccessory({
      ...emptyNewAccessoryForm,
      id: incrementAccessoryId(firstItem.id, quantity),
      registeredDate: formatDate(new Date()),
      remark: "",
    })
    setToolbarAction(null)
  }

  const updateAccessoryItem = (payload: ItemSubmitPayload) => {
    const activeItem = activeAction?.item

    if (!activeItem) {
      return
    }

    setAccessoryItems((current) =>
      current.map((item) =>
        item.id === activeItem.id
          ? {
              ...item,
              id: payload.id.trim(),
              itemName: payload.itemName.trim(),
              subCategory: payload.category,
              status: payload.status as AccessoryStatus,
              department: payload.department as Department,
              room: payload.room.trim(),
              registeredDate: payload.createdDate,
              remark: payload.remark,
            }
          : item
      )
    )
    setActiveAction(null)
  }

  return {
    headerProps: {
      insertFileInputRef,
      canExport: filteredAccessories.length > 0,
      onInsertClick: () => insertFileInputRef.current?.click(),
      onInsertFile: handleInsertFile,
      onExport: exportVisibleAccessories,
      onAddItem: () => setToolbarAction("add"),
    },
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
      setSelectedQrItem,
      openActionDialog,
    },
    addItemModalProps: {
      isOpen: toolbarAction === "add",
      onClose: () => setToolbarAction(null),
      newAccessory,
      categories,
      statuses: Object.keys(statusClasses) as AccessoryStatus[],
      departments: Object.keys(departmentRoomMap) as Department[],
      departmentRoomMap,
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
    transferModalProps: {
      isOpen: toolbarAction === "transfer",
      onClose: () => setToolbarAction(null),
    },
    actionMenuModalProps: {
      activeAction,
      categories,
      statuses: Object.keys(statusClasses) as AccessoryStatus[],
      departments: Object.keys(departmentRoomMap) as Department[],
      departmentRoomMap,
      onClose: () => setActiveAction(null),
      onSubmitEdit: updateAccessoryItem,
    },
    qrScanModalProps: {
      selectedQrItem,
      statusClasses,
      onClose: () => setSelectedQrItem(null),
    },
  }
}
