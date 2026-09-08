import { type ReactNode, useState } from "react";
import { Trash2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

import type { AcademicYear } from "./data/academicYearData";

interface DeleteAcademicYearDialogProps {
  academicYear: AcademicYear;
  onDelete: (id: number) => void;
  trigger?: ReactNode;
}

export default function DeleteAcademicYearDialog({
  academicYear,
  onDelete,
  trigger,
}: DeleteAcademicYearDialogProps) {
  const [open, setOpen] = useState(false);

  const handleDelete = () => {
    onDelete(academicYear.id);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete academic year"
            className="text-red-500 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="w-[calc(100vw-2rem)] max-w-md p-4 sm:p-6">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-xl font-bold text-slate-950">
            Delete Academic Year
          </DialogTitle>

          <DialogDescription>
            {academicYear.startDate.getFullYear()} -{" "}
            {academicYear.endDate.getFullYear()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
            Are you sure you want to delete
            <span className="mx-1 font-semibold text-rose-900">
              {academicYear.startDate.getFullYear()} -{" "}
              {academicYear.endDate.getFullYear()}
            </span>
            academic year?
            This action cannot be undone.
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 border-t-0 bg-transparent p-0 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleDelete}
            className="w-full bg-rose-700 text-white hover:bg-rose-800 sm:w-auto"
          >
            Confirm Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
