import { useMemo, useState, type FormEvent } from "react"
import { ChevronDown, X } from "lucide-react"

import {
  type TransferCategory,
  type TransferDepartmentId,
  transferCategories,
  transferDepartments,
  transferItemNamesByCategory,
  transferRooms,
  transferSerialItems,
} from "@/constants/transferData"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface TransferModalProps {
  isOpen: boolean
  onClose: () => void
}

interface TransferFormState {
  fromDepartment: TransferLocationDepartmentId
  fromRoom: string
  toDepartment: TransferLocationDepartmentId
  toRoom: string
  category: TransferCategory
  itemName: string
  selectedItems: string[]
  transferDate: string
}

type TransferLocationDepartmentId = Exclude<
  TransferDepartmentId,
  "all" | "none"
>

const locationDepartments: readonly {
  id: TransferLocationDepartmentId
  label: string
}[] = transferDepartments
  .filter((department) => department.id !== "all" && department.id !== "none")
  .map((department) => ({
    id: department.id as TransferLocationDepartmentId,
    label: department.label,
  }))

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function buildInitialFormState(): TransferFormState {
  const firstCategory = transferCategories[0]

  return {
    fromDepartment: "ict",
    fromRoom: getDefaultRoomForDepartment("ict"),
    toDepartment: "store",
    toRoom: getDefaultRoomForDepartment("store"),
    category: firstCategory,
    itemName: transferItemNamesByCategory[firstCategory][0],
    selectedItems: [],
    transferDate: formatDate(new Date()),
  }
}

export default function TransferModal({ isOpen, onClose }: TransferModalProps) {
  const [formState, setFormState] =
    useState<TransferFormState>(buildInitialFormState)
  const [itemsOpen, setItemsOpen] = useState(false)

  const fromRoomOptions = useMemo(
    () => getRoomsForDepartment(formState.fromDepartment),
    [formState.fromDepartment]
  )
  const toRoomOptions = useMemo(
    () => getRoomsForDepartment(formState.toDepartment),
    [formState.toDepartment]
  )
  const itemNameOptions = useMemo(
    () => transferItemNamesByCategory[formState.category] ?? [],
    [formState.category]
  )
  const itemPieceOptions = useMemo(
    () =>
      transferSerialItems.filter((item) => item.itemName === formState.itemName),
    [formState.itemName]
  )
  const selectedSerialItems = useMemo(
    () =>
      transferSerialItems.filter((item) =>
        formState.selectedItems.includes(item.serial)
      ),
    [formState.selectedItems]
  )

  const updateValue = <Key extends keyof TransferFormState>(
    key: Key,
    value: TransferFormState[Key]
  ) => {
    setFormState((current) => ({ ...current, [key]: value }))
  }

  const selectDepartment = (
    departmentKey: "fromDepartment" | "toDepartment",
    roomKey: "fromRoom" | "toRoom",
    department: TransferLocationDepartmentId
  ) => {
    const departmentRooms = getRoomsForDepartment(department)

    setFormState((current) => ({
      ...current,
      [departmentKey]: department,
      [roomKey]: departmentRooms.some((room) => room.id === current[roomKey])
        ? current[roomKey]
        : departmentRooms[0]?.id ?? "",
    }))
  }

  const selectRoom = (
    departmentKey: "fromDepartment" | "toDepartment",
    roomKey: "fromRoom" | "toRoom",
    roomId: string
  ) => {
    const selectedRoom = transferRooms.find((room) => room.id === roomId)

    if (!selectedRoom) {
      return
    }

    setFormState((current) => ({
      ...current,
      [departmentKey]: selectedRoom.deptId,
      [roomKey]: roomId,
    }))
  }

  const selectCategory = (category: TransferCategory) => {
    const nextItemName = transferItemNamesByCategory[category]?.[0] ?? ""

    setFormState((current) => ({
      ...current,
      category,
      itemName: nextItemName,
      selectedItems: [],
    }))
    setItemsOpen(false)
  }

  const selectItemName = (itemName: string) => {
    setFormState((current) => ({
      ...current,
      itemName,
      selectedItems: [],
    }))
    setItemsOpen(false)
  }

  const toggleSelectedItem = (serial: string) => {
    setFormState((current) => {
      const selectedItems = current.selectedItems.includes(serial)
        ? current.selectedItems.filter((selectedItem) => selectedItem !== serial)
        : [...current.selectedItems, serial]

      return {
        ...current,
        selectedItems,
      }
    })
  }

  const removeSelectedItem = (serial: string) => {
    setFormState((current) => ({
      ...current,
      selectedItems: current.selectedItems.filter(
        (selectedItem) => selectedItem !== serial
      ),
    }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    console.log("Transfer form data:", {
      ...formState,
      quantity: formState.selectedItems.length,
    })
    onClose()
  }

  const canSubmit =
    formState.fromDepartment.length > 0 &&
    formState.fromRoom.length > 0 &&
    formState.toDepartment.length > 0 &&
    formState.toRoom.length > 0 &&
    formState.category.length > 0 &&
    formState.itemName.length > 0 &&
    formState.selectedItems.length > 0 &&
    formState.transferDate.length > 0

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="grid max-h-[90vh] w-[calc(100vw-2rem)] max-w-2xl grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0"
      >
        <DialogHeader className="border-b border-slate-100 px-4 py-4 pr-10 sm:px-6 sm:py-5 sm:pr-12">
          <DialogTitle className="text-lg font-bold text-slate-950 sm:text-xl">
            Transfer item
          </DialogTitle>
          <DialogDescription>
            Move selected accessory pieces between departments and rooms.
          </DialogDescription>
        </DialogHeader>

        <form
          id="transfer-item-form"
          onSubmit={handleSubmit}
          className="min-h-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5"
        >
          <div className="grid gap-4 sm:gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="From Department"
                value={formState.fromDepartment}
                options={locationDepartments}
                placeholder="Select department"
                onValueChange={(department) =>
                  selectDepartment(
                    "fromDepartment",
                    "fromRoom",
                    department as TransferLocationDepartmentId
                  )
                }
              />
              <SelectField
                label="From Room"
                value={formState.fromRoom}
                options={toSelectOptions(fromRoomOptions)}
                placeholder="Select room"
                onValueChange={(room) =>
                  selectRoom("fromDepartment", "fromRoom", room)
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="To Department"
                value={formState.toDepartment}
                options={locationDepartments}
                placeholder="Select department"
                onValueChange={(department) =>
                  selectDepartment(
                    "toDepartment",
                    "toRoom",
                    department as TransferLocationDepartmentId
                  )
                }
              />
              <SelectField
                label="To Room"
                value={formState.toRoom}
                options={toSelectOptions(toRoomOptions)}
                placeholder="Select room"
                onValueChange={(room) => selectRoom("toDepartment", "toRoom", room)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Category"
                value={formState.category}
                options={transferCategories.map((category) => ({
                  id: category,
                  label: category,
                }))}
                placeholder="Select category"
                onValueChange={(category) =>
                  selectCategory(category as TransferCategory)
                }
              />
              <SelectField
                label="Item Name"
                value={formState.itemName}
                options={itemNameOptions.map((itemName) => ({
                  id: itemName,
                  label: itemName,
                }))}
                placeholder="Select item"
                onValueChange={selectItemName}
              />
            </div>

            <div className="grid gap-2">
              <div className="grid items-start gap-4 sm:grid-cols-[minmax(0,1fr)_9rem]">
                <div className="grid gap-2">
                  <Label>Items</Label>
                  <DropdownMenu open={itemsOpen} onOpenChange={setItemsOpen}>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex h-10 w-full cursor-pointer items-center justify-between gap-3 rounded-md border border-slate-300 bg-white px-3 text-left text-sm font-normal text-slate-950 shadow-xs transition hover:bg-slate-50 focus-visible:border-slate-900 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-slate-200"
                      >
                        <span className="pointer-events-none truncate text-slate-700">
                          {selectedSerialItems.length > 0
                            ? `${selectedSerialItems.length} item${
                                selectedSerialItems.length === 1 ? "" : "s"
                              } selected`
                            : "Select item pieces"}
                        </span>
                        <ChevronDown className="pointer-events-none size-4 shrink-0 opacity-70" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-72">
                      <DropdownMenuLabel>Available IDs</DropdownMenuLabel>
                      <div className="max-h-48 overflow-y-auto">
                        {itemPieceOptions.map((item) => (
                          <DropdownMenuCheckboxItem
                            key={item.id}
                            checked={formState.selectedItems.includes(item.serial)}
                            onSelect={(event) => event.preventDefault()}
                            onCheckedChange={() => toggleSelectedItem(item.serial)}
                            className="font-mono"
                          >
                            {item.serial}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="transfer-quantity">Quantity</Label>
                  <Input
                    id="transfer-quantity"
                    type="text"
                    value={formState.selectedItems.length}
                    readOnly
                    disabled
                    className="h-10 border-slate-200 bg-slate-100 text-center text-slate-600 disabled:cursor-default disabled:opacity-100"
                  />
                </div>
              </div>

              {selectedSerialItems.length > 0 && (
                <div className="max-h-32 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2 sm:mr-[calc(9rem+1rem)]">
                  <div className="space-y-1">
                    {selectedSerialItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 text-sm text-slate-700 shadow-xs"
                      >
                        <span className="font-mono">{item.serial}</span>
                        <button
                          type="button"
                          onClick={() => removeSelectedItem(item.serial)}
                          className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-950"
                          aria-label={`Remove ${item.serial}`}
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="transfer-date">Transfer Date</Label>
              <Input
                id="transfer-date"
                type="date"
                value={formState.transferDate}
                onChange={(event) =>
                  updateValue("transferDate", event.target.value)
                }
                className="h-10 border-slate-300 bg-white"
              />
            </div>
          </div>
        </form>

        <DialogFooter className="m-0 flex-col gap-2 rounded-none border-t border-slate-100 bg-white px-4 py-3 sm:flex-row sm:justify-center sm:gap-3 sm:px-6 sm:py-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="transfer-item-form"
            disabled={!canSubmit}
            className="w-full bg-slate-950 text-white hover:bg-slate-800 sm:w-auto"
          >
            Transfer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface SelectFieldProps {
  label: string
  value: string
  options: readonly { id: string; label: string }[]
  placeholder: string
  onValueChange: (value: string) => void
}

function SelectField({
  label,
  value,
  options,
  placeholder,
  onValueChange,
}: SelectFieldProps) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          className={cn(
            "h-10 w-full border-slate-300 bg-white",
            options.length === 1 && "border-slate-200 bg-slate-50"
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function getRoomsForDepartment(departmentId: TransferLocationDepartmentId) {
  return transferRooms.filter((room) => room.deptId === departmentId)
}

function getDefaultRoomForDepartment(departmentId: TransferLocationDepartmentId) {
  return getRoomsForDepartment(departmentId)[0]?.id ?? ""
}

function toSelectOptions(rooms: readonly { id: string; name: string }[]) {
  return rooms.map((room) => ({ id: room.id, label: room.name }))
}
