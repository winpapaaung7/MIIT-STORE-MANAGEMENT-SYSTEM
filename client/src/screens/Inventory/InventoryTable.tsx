import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Dialog, DialogContent } from "@/components/ui/dialog";

import { useState } from "react";

import { type InventoryItem } from "./data/inventoryData";
import { EditItemModal } from "./EditItemModal";

interface InventoryTableProps {
  items: InventoryItem[];
  onOpenItem: (item: InventoryItem) => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
}

export default function InventoryTable({
  items,
  onOpenItem,
  onEditItem,
  onDeleteItem,
}: InventoryTableProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  return (
    <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <div className="h-full overflow-y-auto overflow-x-hidden [scrollbar-color:#cbd5e1_transparent] [scrollbar-thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-white [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb:hover]:bg-slate-400 [&::-webkit-scrollbar-track]:bg-transparent">
        <Table className="w-full table-fixed">
          <colgroup>
            <col className="w-27.5" />
            <col className="w-65" />
            <col className="w-35" />
            <col className="w-35" />
            <col className="w-30" />
          </colgroup>

          <TableHeader className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/90 backdrop-blur">
            <TableRow className="h-14 hover:bg-transparent">
              <TableHead className="px-4 py-4 text-left text-sm font-semibold text-slate-500 shadow-[inset_0_-1px_0_#f1f5f9] sm:px-8">
                ID
              </TableHead>
              <TableHead className="px-4 py-4 text-left text-sm font-semibold text-slate-500 shadow-[inset_0_-1px_0_#f1f5f9] sm:px-8">
                Item
              </TableHead>
              <TableHead className="px-4 py-4 text-left text-sm font-semibold text-slate-500 shadow-[inset_0_-1px_0_#f1f5f9] sm:px-8">
                Image
              </TableHead>
              <TableHead className="px-4 py-4 text-left text-sm font-semibold text-slate-500 shadow-[inset_0_-1px_0_#f1f5f9] sm:px-8">
                Quantity
              </TableHead>
              <TableHead className="px-4 py-4 text-center text-sm font-semibold text-slate-500 shadow-[inset_0_-1px_0_#f1f5f9] sm:px-8">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-80 px-8 py-6 text-center text-muted-foreground"
                >
                  No inventory items found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpenItem(item)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onOpenItem(item);
                    }
                  }}
                  className="h-24 cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                >
                  <TableCell className="px-4 py-5 text-left font-mono text-sm font-medium text-slate-950 sm:px-8 sm:text-base">
                    {item.id.slice(0, 3)}
                  </TableCell>

                  <TableCell className="px-4 py-5 text-left sm:px-8">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-slate-950">
                        {item.name}
                      </span>
                      <span className="mt-1 text-sm text-slate-500">
                        {item.category}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="px-4 py-5 text-left sm:px-8">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        onClick={(event) => {
                          event.stopPropagation();
                          setPreviewImage(item.image);
                        }}
                        className="h-12 w-12 rounded-xl border border-slate-100 object-cover shadow-sm transition duration-200 hover:scale-105 cursor-pointer"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-[10px] font-medium text-slate-400">
                        No Image
                      </div>
                    )}
                  </TableCell>

                  <TableCell className="px-4 py-5 text-left sm:px-8">
                    <span
                      className={`inline-flex items-center justify-center rounded-full px-4 py-1.5 text-sm font-semibold ${
                        item.quantity > 0
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-rose-50 text-rose-600"
                      }`}
                    >
                      {item.quantity > 0
                        ? `${item.quantity} Units`
                        : "Out of Stock"}
                    </span>
                  </TableCell>

                  <TableCell
                    className="px-4 py-5 text-center sm:px-8"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="flex items-center justify-center">
                      <EditItemModal
                        item={item}
                        onDelete={onDeleteItem}
                        onEdit={onEditItem}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Image Preview Lightbox */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-md p-2 overflow-hidden rounded-2xl border-0 bg-transparent shadow-none">
          {previewImage && (
            <img
              src={previewImage}
              alt="Preview"
              className="w-full h-auto rounded-2xl object-contain bg-white shadow-xl"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
