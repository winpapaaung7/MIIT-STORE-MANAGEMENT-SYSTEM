import { useState } from "react";
import {
  Folder,
  ChevronDown,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import { type InventoryItem } from "./data/inventoryData";

interface Props {
  categories: string[];
  inventory: InventoryItem[];
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  onAddCategory: (name: string) => void | Promise<void>;
}

export default function FilterCategories({
  categories,
  inventory,
  selectedCategory,
  setSelectedCategory,
  onAddCategory,
}: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const getCount = (category: string) => {
    if (category === "All") return inventory.length;

    return inventory.filter((item) => item.category === category).length;
  };

  const handleAdd = () => {
    if (!name.trim()) return;

    onAddCategory(name.trim());

    setName("");
    setOpen(false);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-11 min-w-52 justify-between rounded-xl border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Folder className="h-4 w-4 shrink-0 text-slate-600" />
                <span className="truncate">
                  {selectedCategory === "All" ? "All Category" : selectedCategory}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {getCount(selectedCategory)}
                </span>
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="max-h-72 w-[var(--radix-dropdown-menu-trigger-width)] rounded-xl p-1.5" align="start">
            <DropdownMenuRadioGroup
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              {categories.map((category) => (
                <DropdownMenuRadioItem
                  key={category}
                  value={category}
                  className="cursor-pointer rounded-lg px-3 py-2.5 text-sm font-medium"
                >
                  <Folder className="h-4 w-4 text-slate-500" />
                  <span className="truncate">
                    {category === "All" ? "All Category" : category}
                  </span>
                  <span className="ml-auto mr-3 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {getCount(category)}
                  </span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          className="h-11 rounded-xl border-dashed border-slate-300 bg-white px-5 text-slate-700 shadow-sm hover:bg-slate-50"
          onClick={() => setOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
          </DialogHeader>

          <Input
            placeholder="Category name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>

            <Button onClick={handleAdd}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
