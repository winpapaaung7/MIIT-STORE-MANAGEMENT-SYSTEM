import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ChevronDown, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  type AccessoryItem,
  type Department,
} from "@/screens/AccessoryDetails/types";

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

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: readonly string[];
  departments: Department[];
  departmentRoomMap: Record<Department, readonly string[]>;
  items: AccessoryItem[];
  onTransfer: (payload: TransferRequestPayload) => Promise<{
    ok: boolean;
    message?: string;
  }>;
}

interface TransferFormState {
  fromDepartment: Department;
  fromRoom: string;
  toDepartment: Department;
  toRoom: string;
  category: string;
  itemName: string;
  selectedItems: string[];
  transferDate: string;
  remarks: string;
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toSelectOptions(rooms: readonly string[]) {
  return rooms.map((room) => ({ id: room, label: room }));
}

export default function TransferModal({
  isOpen,
  onClose,
  categories,
  departments,
  departmentRoomMap,
  items,
  onTransfer,
}: TransferModalProps) {
  const roomsForDepartment = (department: Department) =>
    Array.from(
      new Set([
        ...(departmentRoomMap[department] ?? []),
        ...items
          .filter((item) => item.department === department && item.room)
          .map((item) => item.room),
      ]),
    );

  const defaultFromDepartment = departments[0] ?? "Store";
  const defaultToDepartment =
    departments.find((department) => department !== defaultFromDepartment) ??
    defaultFromDepartment;
  const defaultFromRoom = roomsForDepartment(defaultFromDepartment)[0] ?? "";
  const defaultToRoom = roomsForDepartment(defaultToDepartment)[0] ?? "";
  const defaultCategory =
    categories.find((category) =>
      items.some(
        (item) =>
          item.subCategory === category &&
          item.department === defaultFromDepartment &&
          item.room === defaultFromRoom &&
          (item.status === "Available" || item.status === "Damaged"),
      ),
    ) ?? categories[0] ?? "";

  const filteredItemsForInitialCategory = items.filter(
    (item) =>
      item.subCategory === defaultCategory &&
      item.department === defaultFromDepartment &&
      item.room === defaultFromRoom &&
      (item.status === "Available" || item.status === "Damaged"),
  );
  const defaultItemName =
    filteredItemsForInitialCategory[0]?.itemName ?? "";

  const [formState, setFormState] = useState<TransferFormState>(() => ({
    fromDepartment: defaultFromDepartment,
    fromRoom: defaultFromRoom,
    toDepartment: defaultToDepartment,
    toRoom: defaultToRoom,
    category: defaultCategory,
    itemName: defaultItemName,
    selectedItems: [],
    transferDate: formatDate(new Date()),
    remarks: "",
  }));
  const [itemsOpen, setItemsOpen] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    // API data can arrive after the dialog opens. Fill a missing room, but
    // never overwrite a room the user has deliberately selected.
    setFormState((current) => {
      const fromRooms = roomsForDepartment(current.fromDepartment);
      const toRooms = roomsForDepartment(current.toDepartment);
      const fromRoom = fromRooms.includes(current.fromRoom)
        ? current.fromRoom
        : (fromRooms[0] ?? "");
      const toRoom = toRooms.includes(current.toRoom)
        ? current.toRoom
        : (toRooms[0] ?? "");

      if (fromRoom === current.fromRoom && toRoom === current.toRoom) {
        return current;
      }

      return {
        ...current,
        fromRoom,
        toRoom,
        itemName: "",
        selectedItems: [],
      };
    });
  }, [isOpen, departmentRoomMap, items]);

  const departmentOptions = useMemo(
    () =>
      departments.map((department) => ({ id: department, label: department })),
    [departments],
  );

  const fromRoomOptions = useMemo(
    () => roomsForDepartment(formState.fromDepartment),
    [departmentRoomMap, formState.fromDepartment, items],
  );

  const toRoomOptions = useMemo(
    () => roomsForDepartment(formState.toDepartment),
    [departmentRoomMap, formState.toDepartment, items],
  );
  // Keep controls usable even while React is synchronising an initially empty
  // room value from asynchronous department data.
  const effectiveFromRoom = formState.fromRoom || fromRoomOptions[0] || "";
  const effectiveToRoom = formState.toRoom || toRoomOptions[0] || "";

  const availableItems = useMemo(
    () =>
      items.filter(
        (item) => item.status === "Available" || item.status === "Damaged",
      ),
    [items],
  );

  const itemNameOptions = useMemo(() => {
    // Show every item name at the selected location. Individual IDs remain
    // limited to transferable (Available/Damaged) pieces below.
    const itemsByRoom = items.filter(
      (item) =>
        item.subCategory === formState.category &&
        item.department === formState.fromDepartment &&
        item.room === effectiveFromRoom,
    );

    return Array.from(new Set(itemsByRoom.map((item) => item.itemName)));
  }, [
    items,
    formState.category,
    formState.fromDepartment,
    effectiveFromRoom,
  ]);

  useEffect(() => {
    if (itemNameOptions.length === 0) {
      setFormState((current) => ({
        ...current,
        itemName: "",
        selectedItems: [],
      }));
      return;
    }

    if (!itemNameOptions.includes(formState.itemName)) {
      setFormState((current) => ({
        ...current,
        itemName: itemNameOptions[0],
        selectedItems: [],
      }));
    }
  }, [itemNameOptions, formState.itemName]);

  const itemPieceOptions = useMemo(
    () =>
      availableItems.filter(
        (item) =>
          item.itemName === formState.itemName &&
          item.department === formState.fromDepartment &&
          item.room === effectiveFromRoom,
      ),
    [
      availableItems,
      formState.itemName,
      formState.fromDepartment,
      effectiveFromRoom,
    ],
  );

  const selectedItems = useMemo(
    () => items.filter((item) => formState.selectedItems.includes(item.id)),
    [items, formState.selectedItems],
  );

  const updateValue = <Key extends keyof TransferFormState>(
    key: Key,
    value: TransferFormState[Key],
  ) => {
    setFormState((current) => ({ ...current, [key]: value }));
  };

  const selectDepartment = (
    key: "fromDepartment" | "toDepartment",
    roomKey: "fromRoom" | "toRoom",
    department: Department,
  ) => {
    const departmentRooms = roomsForDepartment(department);

    setFormState((current) => ({
      ...current,
      [key]: department,
      [roomKey]: departmentRooms.some((room) => room === current[roomKey])
        ? current[roomKey]
        : (departmentRooms[0] ?? ""),
      selectedItems: key === "fromDepartment" ? [] : current.selectedItems,
    }));
  };

  const selectRoom = (
    departmentKey: "fromDepartment" | "toDepartment",
    roomKey: "fromRoom" | "toRoom",
    room: string,
  ) => {
    setFormState((current) => ({
      ...current,
      [roomKey]: room,
      selectedItems:
        departmentKey === "fromDepartment" ? [] : current.selectedItems,
    }));
  };

  const selectCategory = (category: string) => {
    setFormState((current) => ({
      ...current,
      category,
      itemName: "",
      selectedItems: [],
    }));
    setItemsOpen(false);
  };

  const selectItemName = (itemName: string) => {
    setFormState((current) => ({
      ...current,
      itemName,
      selectedItems: [],
    }));
    setItemsOpen(false);
  };

  const toggleSelectedItem = (itemId: string) => {
    setFormState((current) => {
      const selectedItems = current.selectedItems.includes(itemId)
        ? current.selectedItems.filter((selected) => selected !== itemId)
        : [...current.selectedItems, itemId];

      return {
        ...current,
        selectedItems,
      };
    });
  };

  const removeSelectedItem = (itemId: string) => {
    setFormState((current) => ({
      ...current,
      selectedItems: current.selectedItems.filter(
        (selected) => selected !== itemId,
      ),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    const { ok, message } = await onTransfer({
      fromDepartment: formState.fromDepartment,
      fromRoom: effectiveFromRoom,
      toDepartment: formState.toDepartment,
      toRoom: effectiveToRoom,
      itemName: formState.itemName,
      itemDetailIds: formState.selectedItems,
      transferDate: formState.transferDate,
      remarks: formState.remarks || null,
    });

    if (!ok) {
      setSubmitError(message ?? "Unable to complete transfer.");
      return;
    }

    onClose();
  };

  const canSubmit =
    formState.fromDepartment.length > 0 &&
    effectiveFromRoom.length > 0 &&
    formState.toDepartment.length > 0 &&
    effectiveToRoom.length > 0 &&
    formState.selectedItems.length > 0 &&
    formState.transferDate.length > 0;

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
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <SelectField
                label="From Department"
                value={formState.fromDepartment}
                options={departmentOptions}
                placeholder="Select department"
                onValueChange={(department) =>
                  selectDepartment(
                    "fromDepartment",
                    "fromRoom",
                    department as Department,
                  )
                }
              />
              <SelectField
                label="From Room"
                value={effectiveFromRoom}
                options={toSelectOptions(fromRoomOptions)}
                placeholder="Select room"
                onValueChange={(room) =>
                  selectRoom("fromDepartment", "fromRoom", room)
                }
              />
            </div>

            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <SelectField
                label="To Department"
                value={formState.toDepartment}
                options={departmentOptions}
                placeholder="Select department"
                onValueChange={(department) =>
                  selectDepartment(
                    "toDepartment",
                    "toRoom",
                    department as Department,
                  )
                }
              />
              <SelectField
                label="To Room"
                value={effectiveToRoom}
                options={toSelectOptions(toRoomOptions)}
                placeholder="Select room"
                onValueChange={(room) =>
                  selectRoom("toDepartment", "toRoom", room)
                }
              />
            </div>

            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <SelectField
                label="Category"
                value={formState.category}
                options={categories.map((category) => ({
                  id: category,
                  label: category,
                }))}
                placeholder="Select category"
                onValueChange={selectCategory}
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
              <div className="grid min-w-0 items-start gap-4 sm:grid-cols-[minmax(0,1fr)_9rem]">
                <div className="grid gap-2">
                  <Label>Items</Label>
                  <DropdownMenu open={itemsOpen} onOpenChange={setItemsOpen}>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        title={
                          selectedItems.length > 0
                            ? `${selectedItems.length} item${
                                selectedItems.length === 1 ? "" : "s"
                              } selected`
                            : "Select item pieces"
                        }
                        className="flex h-10 min-w-0 w-full max-w-full cursor-pointer items-center justify-between gap-3 overflow-hidden rounded-md border border-slate-300 bg-white px-3 text-left text-sm font-normal text-slate-950 shadow-xs transition hover:bg-slate-50 focus-visible:border-slate-900 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-slate-200"
                      >
                        <span className="pointer-events-none truncate text-slate-700">
                          {selectedItems.length > 0
                            ? `${selectedItems.length} item${
                                selectedItems.length === 1 ? "" : "s"
                              } selected`
                            : "Select item pieces"}
                        </span>
                        <ChevronDown className="pointer-events-none size-4 shrink-0 opacity-70" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-72">
                      <DropdownMenuLabel>Available IDs</DropdownMenuLabel>
                      <div className="max-h-48 overflow-y-auto">
                        {itemPieceOptions.length > 0 ? (
                          itemPieceOptions.map((item) => (
                            <DropdownMenuCheckboxItem
                              key={item.id}
                              checked={formState.selectedItems.includes(
                                item.id,
                              )}
                              onSelect={(event) => event.preventDefault()}
                              onCheckedChange={() =>
                                toggleSelectedItem(item.id)
                              }
                              className="min-w-0 font-mono"
                            >
                              <span title={item.id} className="block truncate">
                                {item.id}
                              </span>
                            </DropdownMenuCheckboxItem>
                          ))
                        ) : (
                          <div className="p-3 text-sm text-slate-500">
                            No transferable items for this selection. Only
                            Available or Damaged pieces can be transferred.
                          </div>
                        )}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="transfer-quantity">Quantity</Label>
                  <Input
                    id="transfer-quantity"
                    type="text"
                    value={selectedItems.length}
                    readOnly
                    disabled
                    className="h-10 border-slate-200 bg-slate-100 text-center text-slate-600 disabled:cursor-default disabled:opacity-100"
                  />
                </div>
              </div>

              {selectedItems.length > 0 && (
                <div className="max-h-32 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2 sm:mr-40">
                  <div className="space-y-1">
                    {selectedItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 rounded-md bg-white px-3 py-2 text-sm text-slate-700 shadow-xs"
                      >
                        <span title={item.id} className="min-w-0 truncate font-mono">
                          {item.id}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeSelectedItem(item.id)}
                          className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-950"
                          aria-label={`Remove ${item.id}`}
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

            <div className="grid gap-2">
              <Label htmlFor="transfer-remarks">Remarks</Label>
              <textarea
                id="transfer-remarks"
                value={formState.remarks}
                onChange={(event) => updateValue("remarks", event.target.value)}
                className="min-h-[5rem] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-100"
              />
            </div>

            {submitError ? (
              <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                {submitError}
              </div>
            ) : null}
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
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: readonly { id: string; label: string }[];
  placeholder: string;
  onValueChange: (value: string) => void;
}

function SelectField({
  label,
  value,
  options,
  placeholder,
  onValueChange,
}: SelectFieldProps) {
  const selectedLabel = options.find((option) => option.id === value)?.label ?? value;

  return (
    <div className="grid min-w-0 gap-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          title={selectedLabel || placeholder}
          className={cn(
            "h-10 min-w-0 w-full max-w-full overflow-hidden border-slate-300 bg-white [&>span]:min-w-0 [&>span]:truncate",
            options.length === 1 && "border-slate-200 bg-slate-50",
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-w-[var(--radix-select-trigger-width)]">
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id} className="min-w-0">
              <span title={option.label} className="block truncate">
                {option.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
