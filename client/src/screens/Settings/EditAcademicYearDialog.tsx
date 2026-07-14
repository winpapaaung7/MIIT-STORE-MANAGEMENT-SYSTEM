import { type ReactNode, useEffect, useState } from "react";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import AcademicYearDetailTile from "./AcademicYearDetailTile";
import { days, months, years } from "./data/academicYearOptions";
import type { AcademicYear } from "./data/academicYearData";

interface EditAcademicYearDialogProps {
  academicYear: AcademicYear;
  onUpdate: (academicYear: AcademicYear) => void;
  trigger?: ReactNode;
}

export default function EditAcademicYearDialog({
  academicYear,
  onUpdate,
  trigger,
}: EditAcademicYearDialogProps) {
  const [open, setOpen] = useState(false);

  // Start Date
  const [startDay, setStartDay] = useState("");
  const [startMonth, setStartMonth] = useState("");
  const [startYear, setStartYear] = useState("");

  // End Date
  const [endDay, setEndDay] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [endYear, setEndYear] = useState("");

  const [status, setStatus] = useState<"Active" | "Inactive">(
    academicYear.status
  );

  useEffect(() => {
    const start = academicYear.startDate;
    const end = academicYear.endDate;

    setStartDay(String(start.getDate()));
    setStartMonth(months[start.getMonth()]);
    setStartYear(String(start.getFullYear()));

    setEndDay(String(end.getDate()));
    setEndMonth(months[end.getMonth()]);
    setEndYear(String(end.getFullYear()));

    setStatus(academicYear.status);
  }, [academicYear]);

  const handleSave = () => {
    const updatedAcademicYear: AcademicYear = {
      ...academicYear,

      startDate: new Date(
        Number(startYear),
        months.indexOf(startMonth),
        Number(startDay)
      ),

      endDate: new Date(
        Number(endYear),
        months.indexOf(endMonth),
        Number(endDay)
      ),

      status,

      current: status === "Active",
    };

    onUpdate(updatedAcademicYear);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Edit academic year"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl rounded-lg">
        <DialogHeader>
          <DialogTitle>Edit Academic Year</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">

          {/* Start Date */}
          <AcademicYearDetailTile label="Start Date">

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

              <Select value={startDay} onValueChange={setStartDay}>
                <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-white">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {days.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={startMonth}
                onValueChange={setStartMonth}
              >
                <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-white">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {months.map((month) => (
                    <SelectItem
                      key={month}
                      value={month}
                    >
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={startYear}
                onValueChange={setStartYear}
              >
                <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-white">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {years.map((year) => (
                    <SelectItem
                      key={year}
                      value={year}
                    >
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

            </div>
          </AcademicYearDetailTile>

          {/* End Date */}
          <AcademicYearDetailTile label="End Date">

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

              <Select value={endDay} onValueChange={setEndDay}>
                <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-white">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {days.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={endMonth}
                onValueChange={setEndMonth}
              >
                <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-white">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {months.map((month) => (
                    <SelectItem
                      key={month}
                      value={month}
                    >
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={endYear}
                onValueChange={setEndYear}
              >
                <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-white">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {years.map((year) => (
                    <SelectItem
                      key={year}
                      value={year}
                    >
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

            </div>
          </AcademicYearDetailTile>

          {/* Status */}
          <AcademicYearDetailTile label="Status">

            <Select
              value={status}
              onValueChange={(value) =>
                setStatus(value as "Active" | "Inactive")
              }
            >
              <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-white">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="Active">
                  Active
                </SelectItem>

                <SelectItem value="Inactive">
                Inactive
              </SelectItem>
            </SelectContent>
          </Select>
          </AcademicYearDetailTile>

        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="rounded-lg border-slate-200 bg-white hover:bg-slate-50"
          >
            Cancel
          </Button>

          <Button
            onClick={handleSave}
            className="rounded-lg bg-slate-950 hover:bg-slate-800"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
