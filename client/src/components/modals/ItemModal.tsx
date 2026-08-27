import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import type { InventoryItem } from "@/screens/Inventory/data/inventoryData";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export interface ItemFormValues {
  id: string;
  itemName: string;
  category: string;
  status: string;
  department: string;
  room: string;
  createdDate: string;
  remark: string;
  image?: string;
}

export interface ItemSubmitPayload extends ItemFormValues {
  quantity: number;
  idRange: string;
  image?: string;
  departmentId?: number;
  roomId?: number;
  categoryId?: number;
}

export interface ItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues: ItemFormValues;
  mode?: "add" | "edit";
  categories: readonly string[];
  categoryIds?: Record<string, number>;
  statuses: readonly string[];
  departments: readonly string[];
  departmentRoomMap: Record<string, string | readonly string[]>;
  departmentIds?: Record<string, number>;
  roomIds?: Record<string, number>;
  existingInventory?: readonly InventoryItem[];
  onConfirm: (payload: ItemSubmitPayload) => void;
}

interface ItemModalState {
  values: Omit<ItemFormValues, "id">;
  quantity: number;
}

const idPattern = /^\d{4}-\d{6}$/;

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function incrementAccessoryId(id: string, offset: number) {
  if (!idPattern.test(id)) {
    return id;
  }

  const [prefix, serial] = id.split("-");
  const numericValue = Number(prefix) * 1_000_000 + Number(serial) + offset;
  const nextPrefix = Math.floor(numericValue / 1_000_000);
  const nextSerial = numericValue % 1_000_000;

  return `${String(nextPrefix).padStart(4, "0")}-${String(nextSerial).padStart(
    6,
    "0",
  )}`;
}

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

interface GeneratedIdResponse {
  ok: boolean;
  item_id: string;
  next_serial: number;
}

function toRoomList(rooms: string | readonly string[] | undefined) {
  if (!rooms) {
    return [];
  }

  return Array.isArray(rooms) ? [...rooms] : [rooms];
}

function buildInitialState(
  defaultValues: ItemFormValues,
  mode: ItemModalProps["mode"],
) {
  return {
    values: {
      ...defaultValues,
      createdDate:
        mode === "edit" ? defaultValues.createdDate : formatDate(new Date()),
    },
    quantity: 1,
  };
}

function getInitialStateKey(
  defaultValues: ItemFormValues,
  mode: ItemModalProps["mode"],
  open: boolean,
) {
  if (!open) {
    return "closed";
  }

  return [
    mode ?? "add",
    defaultValues.id,
    defaultValues.itemName,
    defaultValues.category,
    defaultValues.status,
    defaultValues.department,
    defaultValues.room,
    defaultValues.createdDate,
    defaultValues.remark,
  ].join("|");
}

export default function ItemModal(props: ItemModalProps) {
  return (
    <ItemModalContent
      key={getInitialStateKey(props.defaultValues, props.mode, props.open)}
      {...props}
    />
  );
}

function ItemModalContent({
  open,
  onOpenChange,
  defaultValues,
  mode = "add",
  categories,
  categoryIds,
  statuses,
  departments,
  departmentRoomMap,
  departmentIds,
  roomIds,
  existingInventory,
  onConfirm,
}: ItemModalProps) {
  const [formState, setFormState] = useState<ItemModalState>(() =>
    buildInitialState(defaultValues, mode),
  );
  const [image, setImage] = useState(defaultValues.image ?? "");
  const [generatedItemId, setGeneratedItemId] = useState("");
  const [nextSerial, setNextSerial] = useState(1);

  useEffect(() => {
    if (mode !== "add" || !open) {
      return;
    }

    const itemName = formState.values.itemName.trim();
    const categoryName = formState.values.category.trim();

    if (!itemName || !categoryName) {
      setGeneratedItemId("");
      setNextSerial(1);
      return;
    }

    setGeneratedItemId("");
    setNextSerial(1);
    let cancelled = false;

    const loadGeneratedId = async () => {
      try {
        const params = new URLSearchParams({
          item_name: itemName,
          category_name: categoryName,
        });
        const response = await fetch(
          `${API_BASE_URL}/api/items/next-generated-id?${params.toString()}`,
        );
        const data = (await response.json()) as GeneratedIdResponse;

        if (!response.ok || !data.ok || cancelled) {
          return;
        }

        setGeneratedItemId(data.item_id);
        setNextSerial(data.next_serial);
      } catch {
        if (!cancelled) {
          setGeneratedItemId("");
        }
      }
    };

    void loadGeneratedId();

    return () => {
      cancelled = true;
    };
  }, [formState.values.category, formState.values.itemName, mode, open]);

  const departmentRooms = useMemo<Record<string, string[]>>(() => {
    const entries = Object.entries(departmentRoomMap).map(
      ([department, rooms]) => [department, toRoomList(rooms)] as const,
    );
    return entries.reduce<Record<string, string[]>>(
      (result, [department, rooms]) => ({
        ...result,
        [department]: Array.from(
          new Set([...(result[department] ?? []), ...rooms]),
        ),
      }),
      {},
    );
  }, [departmentRoomMap]);

  const departmentOptions = useMemo(
    () =>
      Array.from(new Set(departments)),
    [departments],
  );

  const roomOptions = useMemo<string[]>(() => {
    const selectedDepartmentRooms =
      departmentRooms[formState.values.department];

    if (selectedDepartmentRooms?.length) {
      return selectedDepartmentRooms;
    }

    return Array.from(new Set(Object.values(departmentRooms).flat()));
  }, [departmentRooms, formState.values.department]);

  const generatedId = useMemo(
    () =>
      mode === "edit"
        ? defaultValues.id
        : generatedItemId
          ? `${generatedItemId}-${String(nextSerial).padStart(6, "0")}`
          : "",
    [defaultValues.id, generatedItemId, mode, nextSerial],
  );
  const idRange = useMemo(() => {
    const startId = generatedId;
    const endId = incrementAccessoryId(startId, formState.quantity - 1);

    if (formState.quantity <= 1 || startId === endId) {
      return startId;
    }

    return `${startId} to ${endId}`;
  }, [formState.quantity, generatedId]);

  const updateValue = <Key extends keyof ItemModalState["values"]>(
    key: Key,
    value: ItemModalState["values"][Key],
  ) => {
    setFormState((current) => ({
      ...current,
      values: {
        ...current.values,
        [key]: value,
      },
    }));
  };

  const existingMatch = useMemo(() => {
    if (!existingInventory) return undefined;
    const name = formState.values.itemName.trim().toLowerCase();
    return existingInventory.find(
      (it) =>
        it.name.trim().toLowerCase() === name &&
        it.category === formState.values.category,
    );
  }, [existingInventory, formState.values.itemName, formState.values.category]);

  const previewImage = image || existingMatch?.image || "";

  const selectDepartment = (department: string) => {
    const rooms = departmentRooms[department] ?? [];

    setFormState((current) => ({
      ...current,
      values: {
        ...current.values,
        department,
        room: rooms.includes(current.values.room)
          ? current.values.room
          : (rooms[0] ?? current.values.room),
      },
    }));
  };

  const selectRoom = (room: string) => {
    const matchingDepartment = Object.entries(departmentRooms).find(
      ([, rooms]) => rooms.includes(room),
    )?.[0];

    setFormState((current) => ({
      ...current,
      values: {
        ...current.values,
        room,
        department: matchingDepartment ?? current.values.department,
      },
    }));
  };

  const updateQuantity = (value: string) => {
    const quantity = Math.max(1, Number(value) || 1);

    setFormState((current) => ({
      ...current,
      quantity,
    }));
  };

  const updateImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setImage("");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setImage(typeof reader.result === "string" ? reader.result : "");
    };

    reader.readAsDataURL(file);
  };

  const submitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      (mode === "add" &&
        (!idPattern.test(generatedId) ||
          !formState.values.itemName.trim() ||
          !formState.values.room.trim())) ||
      !formState.values.status
    ) {
      return;
    }

    onConfirm({
      ...formState.values,
      id: generatedId,
      idRange,
      itemName: formState.values.itemName.trim(),
      room: formState.values.room.trim(),
      remark: formState.values.remark.trim(),
      quantity: formState.quantity,
      image,
      categoryId: categoryIds?.[formState.values.category],
      departmentId: departmentIds?.[formState.values.department],
      roomId: roomIds?.[`${formState.values.department}\u0000${formState.values.room}`],
    });
  };

  const canSubmit =
    mode === "edit"
      ? formState.values.status.length > 0
      : idPattern.test(generatedId) &&
        formState.values.itemName.trim().length > 0 &&
        formState.values.room.trim().length > 0;
  const formId = mode === "edit" ? "edit-accessory-form" : "add-accessory-form";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="grid max-h-[90vh] w-[calc(100vw-2rem)] max-w-2xl grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0"
      >
        <DialogHeader className="border-b border-slate-100 px-4 py-4 pr-10 sm:px-6 sm:py-5 sm:pr-12">
          <DialogTitle className="text-lg font-bold text-slate-950 sm:text-xl">
            {mode === "edit" ? "Edit Item" : "Add Item"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Update the selected accessory record."
              : "Create one or more accessory records with generated IDs."}
          </DialogDescription>
        </DialogHeader>

        <form
          id={formId}
          onSubmit={submitForm}
          className="min-h-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5"
        >
          <div className="grid gap-4 sm:gap-5">
            {mode === "add" ? (
              <>
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select
                value={formState.values.category}
                onValueChange={(value) => updateValue("category", value)}
              >
                <SelectTrigger className="h-10 w-full border-slate-300">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="accessory-item-name">Item Name</Label>
              <Input
                id="accessory-item-name"
                value={formState.values.itemName}
                onChange={(event) =>
                  updateValue("itemName", event.target.value)
                }
                placeholder="Accessory name"
                className="h-10 border-slate-300"
              />
              {existingMatch ? (
                <div className="mt-2 rounded-md border border-amber-100 bg-amber-50 p-2 text-sm text-amber-700">
                  Existing item detected: <strong>{existingMatch.name}</strong>{" "}
                  — {existingMatch.quantity} in stock. Submitting will increase
                  quantity of the existing item.
                </div>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="accessory-id">Generated ID</Label>
              <Input
                id="accessory-id"
                value={idRange}
                disabled
                readOnly
                tabIndex={-1}
                className="h-10 border-slate-200 bg-slate-100 font-mono text-slate-600"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Department</Label>
                <Select
                  value={formState.values.department}
                  onValueChange={selectDepartment}
                >
                  <SelectTrigger className="h-10 w-full border-slate-300">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departmentOptions.map((department) => (
                      <SelectItem key={department} value={department}>
                        {department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Room</Label>
                <Select
                  value={formState.values.room}
                  onValueChange={selectRoom}
                >
                  <SelectTrigger className="h-10 w-full border-slate-300">
                    <SelectValue placeholder="Select room" />
                  </SelectTrigger>
                  <SelectContent>
                    {roomOptions.map((room) => (
                      <SelectItem key={room} value={room}>
                        {room}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              </div>

            <div className="grid gap-2">
              <Label htmlFor="accessory-quantity">Quantity</Label>
              <Input
                id="accessory-quantity"
                type="number"
                min={1}
                value={formState.quantity}
                onChange={(event) => updateQuantity(event.target.value)}
                className="h-10 border-slate-300 bg-white"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="accessory-image">Image</Label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                  id="accessory-image"
                  type="file"
                  accept="image/*"
                  onChange={updateImage}
                  className="h-10 rounded-xl border border-slate-300 bg-white file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200 cursor-pointer text-slate-500 text-sm flex items-center pt-1.5"
                />

                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-slate-100 bg-slate-50 shadow-sm">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt="Selected item"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-slate-500">No image</span>
                  )}
                </div>
              </div>
            </div>
              </>
            ) : null}

            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={formState.values.status}
                onValueChange={(value) => updateValue("status", value)}
              >
                <SelectTrigger className="h-10 w-full border-slate-300">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {mode === "add" ? (
              <div className="grid gap-2">
                <Label htmlFor="accessory-created-date">Created Date</Label>
                <Input
                  id="accessory-created-date"
                  value={formState.values.createdDate}
                  disabled
                  readOnly
                  className="h-10 border-slate-200 bg-slate-100 text-slate-500"
                />
              </div>
            ) : null}

            <div className="grid gap-2">
              <Label htmlFor="accessory-remark">Remark</Label>
              <Textarea
                id="accessory-remark"
                value={formState.values.remark}
                onChange={(event) => updateValue("remark", event.target.value)}
                placeholder="Add a note for this item"
                className="min-h-24 resize-none border-slate-300"
              />
            </div>
          </div>
        </form>

        <DialogFooter className="m-0 flex-col gap-2 rounded-none border-t border-slate-100 bg-white px-4 py-3 sm:flex-row sm:justify-center sm:gap-3 sm:px-6 sm:py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={!canSubmit}
            className="w-full bg-slate-950 text-white hover:bg-slate-800 sm:w-auto"
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

