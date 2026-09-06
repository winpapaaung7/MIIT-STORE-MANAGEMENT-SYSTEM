import { useEffect, useState } from "react";
import {
  CalendarDays,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import AddAcademicYearDialog from "./AddAcademicYearDialog";
import EditAcademicYearDialog from "./EditAcademicYearDialog";
import DeleteAcademicYearDialog from "./DeleteAcademicYearDialog";

import { type AcademicYear } from "./data/academicYearData";

type LiveAcademicYear = AcademicYear & {
  semesters?: { semester_name: string; start_date: string; end_date: string }[];
};

export default function AcedemicYear() {
  const { t } = useLanguage();
  // Academic Year List
  const [academicYears, setAcademicYears] =
    useState<LiveAcademicYear[]>([]);

  // Search
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000"}/api/academic-years`)
      .then((response) => response.json())
      .then((payload) => {
        if (!payload.ok) return;
        setAcademicYears((payload.years ?? []).map((year: any) => ({
          id: year.budget_year_id,
          startDate: new Date(year.start_date),
          endDate: new Date(year.end_date),
          status: year.status === "Active" ? "Active" : "Inactive",
          current: year.status === "Active",
          semesters: year.semester ?? [],
        })));
      });
  }, []);

  // ----------------------------
  // Add Academic Year
  // ----------------------------
  const handleAdd = async (newYear: AcademicYear) => { const response = await fetch((import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000") + "/api/academic-years", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ year_name: newYear.startDate.getFullYear() + "-" + newYear.endDate.getFullYear(), start_date: newYear.startDate.toISOString(), end_date: newYear.endDate.toISOString(), status: newYear.status }) }); const payload = await response.json(); if (!response.ok || !payload.ok) throw new Error(payload.message ?? "Unable to save academic year"); setAcademicYears((previous) => [{ id: payload.year.budget_year_id, startDate: new Date(payload.year.start_date), endDate: new Date(payload.year.end_date), status: payload.year.status, current: payload.year.status === "Active" }, ...previous]); };

  // ----------------------------
  // Update Academic Year
  // ----------------------------
  const handleUpdate = async (updatedYear: AcademicYear) => { const response = await fetch((import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000") + "/api/academic-years/" + updatedYear.id, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ year_name: updatedYear.startDate.getFullYear() + "-" + updatedYear.endDate.getFullYear(), start_date: updatedYear.startDate.toISOString(), end_date: updatedYear.endDate.toISOString(), status: updatedYear.status }) }); const payload = await response.json(); if (!response.ok || !payload.ok) throw new Error(payload.message ?? "Unable to update academic year"); setAcademicYears((previous) => previous.map((year) => year.id === updatedYear.id ? { ...updatedYear, current: updatedYear.status === "Active" } : updatedYear.status === "Active" ? { ...year, status: "Inactive", current: false } : year)); };

  // ----------------------------
  // Delete Academic Year
  // ----------------------------
  const handleDelete = async (id: number) => { const response = await fetch((import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000") + "/api/academic-years/" + id, { method: "DELETE" }); const payload = await response.json(); if (!response.ok || !payload.ok) throw new Error(payload.message ?? "Unable to delete academic year"); setAcademicYears((previous) => previous.filter((year) => year.id !== id)); };

  // ----------------------------
  // Search Filter
  // ----------------------------
  const filteredYears = academicYears.filter((item) =>
    `${item.startDate.getFullYear()} ${item.endDate.getFullYear()}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <section className="space-y-6">
      {/* Header */}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">
            {t("academicYear")}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {t("manageAcademicYears")}
          </p>
        </div>

        <AddAcademicYearDialog onAdd={handleAdd} />
      </div>

      {/* Search */}

      <div className="relative max-w-md">
        <Search
          className="
            absolute
            left-3
            top-1/2
            h-4
            w-4
            -translate-y-1/2
            text-slate-400
          "
        />

        <Input
          placeholder={t("searchAcademicYears")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rounded-xl"
        />
      </div>

      {/* Academic Year Cards */}

      <div className="space-y-4">
        {filteredYears.map((item) => (
          <Card
            key={item.id}
            className="
              rounded-2xl
              p-5
              shadow-sm
            "
          >
            {/* Current Academic Year */}

            {item.current && (
              <Badge
                className="
                  mb-3
                  bg-blue-100
                  text-blue-700
                "
              >
                {t("currentAcademicYear")}
              </Badge>
            )}

            <div
              className="
                flex
                items-center
                justify-between
                gap-4
              "
            >
              {/* Left */}

              <div
                className="
                  flex
                  items-center
                  gap-4
                  min-w-0
                "
              >
                <div
                  className="
                    flex
                    h-12
                    w-12
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-slate-100
                  "
                >
                  <CalendarDays
                    className="
                      h-6
                      w-6
                      text-slate-700
                    "
                  />
                </div>

                <div className="min-w-0">
                  <h3
                    className="
                      font-semibold
                      text-slate-950
                    "
                  >
                    {item.startDate.getFullYear()} -{" "}
                    {item.endDate.getFullYear()}
                  </h3>

                  <p
                    className="
                      mt-1
                      text-sm
                      text-slate-500
                    "
                  >
                    {item.startDate.toLocaleDateString()} {" - "}
                    {item.endDate.toLocaleDateString()}
                  </p>
                  {item.semesters?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.semesters.map((semester, index) => (
                        <span
                          key={`${semester.semester_name}-${index}`}
                          className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                        >
                          {semester.semester_name}: {new Date(semester.start_date).toLocaleDateString()} – {new Date(semester.end_date).toLocaleDateString()}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-amber-600">{t("noSemesters")}</p>
                  )}
                </div>
              </div>

              {/* Right */}

              <div className="flex shrink-0 items-center gap-3">
                <Badge
                  className={
                    item.status === "Active"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }
                >
                  {item.status === "Active" ? t("active") : t("inactive")}
                </Badge>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label={t("actions")}
                      className="h-11 w-11 rounded-xl border-slate-200 bg-white shadow-sm hover:bg-slate-50"
                    >
                      <MoreHorizontal className="h-5 w-5 text-slate-700" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-36 rounded-xl">
                    <EditAcademicYearDialog
                      academicYear={item}
                      onUpdate={handleUpdate}
                      trigger={
                        <DropdownMenuItem
                          onSelect={(event) => event.preventDefault()}
                        >
                          <Pencil className="h-4 w-4 text-slate-600" />
                          {t("edit")}
                        </DropdownMenuItem>
                      }
                    />

                    <DeleteAcademicYearDialog
                      academicYear={item}
                      onDelete={handleDelete}
                      trigger={
                        <DropdownMenuItem
                          onSelect={(event) => event.preventDefault()}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                          {t("delete")}
                        </DropdownMenuItem>
                      }
                    />
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </Card>
        ))}

        {filteredYears.length === 0 && (
          <Card className="rounded-2xl p-8 text-center text-sm text-slate-500 shadow-sm">
            {t("noAcademicYears")}
          </Card>
        )}
      </div>
    </section>
  );
}
