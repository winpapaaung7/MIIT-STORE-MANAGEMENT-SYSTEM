import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/LanguageContext";

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
  const { t } = useLanguage();
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
  const monthLabels: Record<string, string> = { January: t("january"), February: t("february"), March: t("march"), April: t("april"), May: t("may"), June: t("june"), July: t("july"), August: t("august"), September: t("september"), October: t("october"), November: t("november"), December: t("december") };

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
          {t("addAcademicYear")}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl rounded-lg">
        <DialogHeader>
          <DialogTitle>{t("addAcademicYear")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">

          {/* Start Date */}
          <AcademicYearDetailTile label={t("startDate")}>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

              <Select value={startDay} onValueChange={setStartDay}>
                <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-white">
                  <SelectValue placeholder={t("day")} />
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
                  <SelectValue placeholder={t("month")} />
                </SelectTrigger>

                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>
                      {monthLabels[month] ?? month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={startYear}
                onValueChange={setStartYear}
              >
                <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-white">
                  <SelectValue placeholder={t("year")} />
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
          <AcademicYearDetailTile label={t("endDate")}>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

              <Select value={endDay} onValueChange={setEndDay}>
                <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-white">
                  <SelectValue placeholder={t("day")} />
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
                  <SelectValue placeholder={t("month")} />
                </SelectTrigger>

                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month} value={month}>
                      {monthLabels[month] ?? month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={endYear}
                onValueChange={setEndYear}
              >
                <SelectTrigger className="h-10 rounded-lg border-slate-200 bg-white">
                  <SelectValue placeholder={t("year")} />
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
          <AcademicYearDetailTile label={t("status")}>

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
                  {t("active")}
                </SelectItem>

                <SelectItem value="Inactive">
                {t("inactive")}
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
            {t("cancel")}
          </Button>

          <Button
            onClick={handleSave}
            className="rounded-lg bg-slate-950 hover:bg-slate-800"
          >
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
