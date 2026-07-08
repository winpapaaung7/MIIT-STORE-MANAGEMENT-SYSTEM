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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type InventoryItem } from "./data/inventoryData";

interface EditItemModalProps {
  item: InventoryItem & { category?: string }; // Extended slightly to support category if present
  onDelete: (id: string) => void;
  onEdit: (updatedItem: any) => void;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({ item, onDelete, onEdit }) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState(item.category || "Laptops & Computers");
  const [quantity] = useState(item.quantity); // Kept read-only since it's disabled

  const handleSaveChanges = () => {
    onEdit({ ...item, name, category });
    setIsEditDialogOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 rounded-full border border-slate-200 bg-white shadow-sm hover:bg-slate-50">
            <MoreHorizontal className="h-4 w-4 text-slate-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuLabel className="text-xs text-slate-400 font-normal">Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-slate-700 text-xs cursor-pointer" onClick={() => setIsEditDialogOpen(true)}>
            <Edit3 className="mr-2 h-3.5 w-3.5 text-slate-400" /> Edit Item
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 text-xs cursor-pointer" onClick={() => onDelete(item.id)}>
            <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-[24px] p-6 gap-0">
          <DialogHeader className="flex flex-row items-center justify-between border-b-0 pb-2">
            <DialogTitle className="text-lg font-bold text-slate-900">Edit Item</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 py-4">
            {/* Item ID Field (Disabled) */}
            <div className="grid gap-1.5">
              <Label htmlFor="itemId" className="text-sm font-semibold text-slate-900">Item ID</Label>
              <Input 
                id="itemId" 
                value={item.id} 
                disabled 
                className="h-10 rounded-xl bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed" 
              />
            </div>

            {/* Item Name Field */}
            <div className="grid gap-1.5">
              <Label htmlFor="name" className="text-sm font-semibold text-slate-900">Item Name</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="h-10 rounded-xl border-slate-300 focus:border-slate-400 focus-visible:ring-0" 
              />
            </div>

            {/* Category Field */}
            <div className="grid gap-1.5">
              <Label htmlFor="category" className="text-sm font-semibold text-slate-900">Category</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 6 6 6-6'/></svg>")`, backgroundPosition: 'right 12px center', backgroundRepeat: 'no-repeat' }}
              >
                <option value="Laptops & Computers">Laptops & Computers</option>
                <option value="Electronics">Electronics</option>
                <option value="Furniture">Furniture</option>
              </select>
            </div>

            {/* Quantity Field (Disabled) */}
            <div className="grid gap-1.5">
              <Label htmlFor="quantity" className="text-sm font-semibold text-slate-900">Quantity</Label>
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
              <Label htmlFor="image" className="text-sm font-semibold text-slate-900">Image</Label>
              <Input 
                id="image" 
                type="file" 
                className="h-10 rounded-xl border-slate-300 file:mr-4 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer text-slate-500 text-sm flex items-center pt-1.5" 
              />
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
    </>
  );
};