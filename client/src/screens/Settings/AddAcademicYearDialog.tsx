import { useState } from "react";
import { Plus } from "lucide-react";

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

interface AddAcademicYearDialogProps {
  onAdd: (academicYear: AcademicYear) => void;
}

export default function AddAcademicYearDialog({
  onAdd,
}: AddAcademicYearDialogProps) {
  const [open, setOpen] = useState(false);

  // Start Date
  const [startDay, setStartDay] = useState("1");
  const [startMonth, setStartMonth] = useState("June");
  const [startYear, setStartYear] = useState("2025");

  // End Date
  const [endDay, setEndDay] = useState("31");
  const [endMonth, setEndMonth] = useState("March");
  const [endYear, setEndYear] = useState("2026");

  // Status
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");

  const resetForm = () => {
    setStartDay("1");
    setStartMonth("June");
    setStartYear("2025");

    setEndDay("31");
    setEndMonth("March");
    setEndYear("2026");

    setStatus("Active");
  };

  const handleSave = () => {
    const newAcademicYear: AcademicYear = {
      id: Date.now(),

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

    onAdd(newAcademicYear);

    resetForm();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-10 rounded-lg bg-slate-950 px-5 shadow-sm hover:bg-slate-800">
          <Plus className="mr-2 h-4 w-4" />
          Add Academic Year
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl rounded-lg">
        <DialogHeader>
          <DialogTitle>Add Academic Year</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">

          {/* Start Date */}
          <AcademicYearDetailTile label="Start Date">

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

              <Select value={startDay} onValueChange={setStartDay}>
                <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-white">
                  <SelectValue placeholder="Day" />
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
                  <SelectValue placeholder="Month" />
                </SelectTrigger>

                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>
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
                  <SelectValue placeholder="Year" />
                </SelectTrigger>

                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
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
                  <SelectValue placeholder="Day" />
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
                  <SelectValue placeholder="Month" />
                </SelectTrigger>

                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>
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
                  <SelectValue placeholder="Year" />
                </SelectTrigger>

                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
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
            onClick={() => {
              resetForm();
              setOpen(false);
            }}
            className="rounded-lg border-slate-200 bg-white hover:bg-slate-50"
          >
            Cancel
          </Button>

          <Button
            onClick={handleSave}
            className="rounded-lg bg-slate-950 hover:bg-slate-800"
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
