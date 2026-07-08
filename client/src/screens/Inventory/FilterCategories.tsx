import { useState } from "react";
import {
  Folder,
  Laptop,
  Zap,
  Armchair,
  BrushCleaning,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  onAddCategory: (name: string) => void;
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

  const getIcon = (category: string) => {
    switch (category) {
      case "All":
        return <Folder size={15} />;

      case "Laptop & Computer":
        return <Laptop size={15} />;

      case "Electronic":
        return <Zap size={15} />;

      case "Furniture":
        return <Armchair size={15} />;

      case "Cleaning Tools":
        return <BrushCleaning size={15} />;

      default:
        return <Folder size={15} />;
    }
  };

  const handleAdd = () => {
    if (!name.trim()) return;

    onAddCategory(name.trim());

    setName("");
    setOpen(false);
  };

  return (
    <>
      <div className="w-full min-w-0 max-w-full space-y-3 overflow-hidden">
        <div className="flex w-full min-w-0 max-w-full gap-3 overflow-x-auto pb-2 [scrollbar-color:#cbd5e1_transparent] [scrollbar-width:thin]">
          {categories.map((category) => {
            const active = selectedCategory === category;

            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 border transition-all
                ${
                  active
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white hover:bg-slate-50 border-slate-200"
                }`}
              >
                {getIcon(category)}

                <span className="text-sm font-medium">
                  {category}
                </span>

                <span
                  className={`text-xs rounded-full px-2 py-0.5
                  ${
                    active
                      ? "bg-white/20"
                      : "bg-slate-100"
                  }`}
                >
                  {getCount(category)}
                </span>
              </button>
            );
          })}
        </div>

        <Button
          variant="outline"
          className="h-11 px-6 rounded-xl border-dashed"
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
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>

            <Button onClick={handleAdd}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
