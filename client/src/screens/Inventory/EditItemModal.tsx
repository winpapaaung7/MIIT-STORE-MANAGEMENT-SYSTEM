// Inventory/EditItemModal.tsx
import React, { useState } from "react";
import { MoreHorizontal, Edit3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type InventoryItem } from "./data/inventoryData";

interface EditItemModalProps {
  item: InventoryItem & { category?: string }; // Extended slightly to support category if present
  onDelete: (id: string) => void;
  onEdit: (updatedItem: any) => void;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({
  item,
  onDelete,
  onEdit,
}) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState(
    item.category || "Laptops & Computers",
  );
  const [quantity] = useState(item.quantity); // Kept read-only since it's disabled
  const [image, setImage] = useState(item.image);

  const shortItemId = item.id.includes("-") ? item.id.split("-")[0] : item.id;

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setImage(item.image);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setImage(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveChanges = () => {
    onEdit({ ...item, name, category, image });
    setIsEditDialogOpen(false);
  };

  const canDelete = item.quantity === 0;

  const handleConfirmDelete = () => {
    if (!canDelete) return;

    onDelete(item.id);
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="size-9 rounded-lg border-slate-200 bg-white shadow-sm hover:bg-slate-50"
          >
            <MoreHorizontal className="size-4 text-slate-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36 rounded-xl">
          <DropdownMenuItem
            className="cursor-pointer text-slate-950 focus:text-slate-950"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Edit3 className="h-4 w-4 text-slate-600" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer text-red-600 focus:text-red-600"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-110 rounded-[24px] p-6 gap-0">
          <DialogHeader className="flex flex-row items-center justify-between border-b-0 pb-2">
            <DialogTitle className="text-lg font-bold text-slate-900">
              Edit Item
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            {/* Item ID Field (Disabled) */}
            <div className="grid gap-1.5">
              <Label
                htmlFor="itemId"
                className="text-sm font-semibold text-slate-900"
              >
                Item ID
              </Label>
              <Input
                id="itemId"
                value={shortItemId}
                disabled
                className="h-10 rounded-xl bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
              />
            </div>

            {/* Item Name Field */}
            <div className="grid gap-1.5">
              <Label
                htmlFor="name"
                className="text-sm font-semibold text-slate-900"
              >
                Item Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 rounded-xl border-slate-300 focus:border-slate-400 focus-visible:ring-0"
              />
            </div>

            {/* Category Field */}
            <div className="grid gap-1.5">
              <Label
                htmlFor="category"
                className="text-sm font-semibold text-slate-900"
              >
                Category
              </Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 6 6 6-6'/></svg>")`,
                  backgroundPosition: "right 12px center",
                  backgroundRepeat: "no-repeat",
                }}
              >
                <option value="Laptops & Computers">Laptops & Computers</option>
                <option value="Electronics">Electronics</option>
                <option value="Furniture">Furniture</option>
              </select>
            </div>

            {/* Quantity Field (Disabled) */}
            <div className="grid gap-1.5">
              <Label
                htmlFor="quantity"
                className="text-sm font-semibold text-slate-900"
              >
                Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                disabled
                className="h-10 rounded-xl bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
              />
            </div>

            {/* Image Upload Field */}
            <div className="grid gap-1.5">
              <Label
                htmlFor="image"
                className="text-sm font-semibold text-slate-900"
              >
                Image
              </Label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="h-10 border-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-2 file:py-1 file:text-xs file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                />

                {image ? (
                  <img
                    src={image}
                    alt="Item preview"
                    className="h-14 w-14 rounded-xl border border-slate-100 object-cover shadow-sm"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-400">
                    No image
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Left Aligned Footer Button */}
          <div className="flex justify-start pt-2">
            <Button
              className="bg-slate-950 hover:bg-slate-800 text-white font-medium rounded-xl h-10 px-6 text-sm"
              onClick={handleSaveChanges}
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md p-4 sm:p-6">
          <DialogHeader className="pr-8">
            <DialogTitle className="text-xl font-bold text-slate-950">
              {canDelete ? "Delete Inventory Item" : "Cannot Delete Item"}
            </DialogTitle>

            <DialogDescription>
              {canDelete
                ? `Are you sure you want to delete "${item.name}" from the inventory?`
                : `This item still has ${item.quantity} units in inventory.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div
              className={
                canDelete
                  ? "rounded-lg border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700"
                  : "rounded-lg border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700"
              }
            >
              {canDelete ? (
                <>
                  This item has no remaining stock. This action cannot be
                  undone.
                </>
              ) : (
                <>
                  Only items with 0 quantity can be deleted. Please reduce the
                  quantity to 0 before deleting this inventory item.
                </>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 border-t-0 bg-transparent p-0 sm:flex-row">
            {canDelete ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="w-full bg-rose-700 text-white hover:bg-rose-800 sm:w-auto"
                >
                  Delete
                </Button>
              </>
            ) : (
              <Button
                type="button"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="w-full bg-slate-950 text-white hover:bg-slate-800 sm:w-auto"
              >
                OK
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
