import { useState } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import AddAcademicYearDialog from "./AddAcademicYearDialog";
import EditAcademicYearDialog from "./EditAcademicYearDialog";
import DeleteAcademicYearDialog from "./DeleteAcademicYearDialog";

import { academicYearData, type AcademicYear } from "./data/academicYearData";

export default function AcedemicYear() {
  // Academic Year List
  const [academicYears, setAcademicYears] =
    useState<AcademicYear[]>(academicYearData);

  // Search
  const [search, setSearch] = useState("");

  // ----------------------------
  // Add Academic Year
  // ----------------------------
  const handleAdd = (newYear: AcademicYear) => {
    const updated = academicYears.map((item) => ({
      ...item,
      status: newYear.status === "Active" ? "Inactive" : item.status,
      current: false,
    }));

    setAcademicYears([
      {
        ...newYear,
        current: newYear.status === "Active",
      },
      ...updated,
    ]);
  };

  // ----------------------------
  // Update Academic Year
  // ----------------------------
  const handleUpdate = (updatedYear: AcademicYear) => {
    setAcademicYears((prev) =>
      prev.map((item) => {
        if (item.id === updatedYear.id) {
          return updatedYear;
        }

        if (updatedYear.status === "Active") {
          return {
            ...item,
            status: "Inactive",
            current: false,
          };
        }

        return item;
      }),
    );
  };

  // ----------------------------
  // Delete Academic Year
  // ----------------------------
  const handleDelete = (id: number) => {
    setAcademicYears((prev) => prev.filter((item) => item.id !== id));
  };

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
            Academic Year
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage academic years and current sessions.
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
          placeholder="Search academic year..."
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
                Current Academic Year
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
                  {item.status}
                </Badge>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Academic year actions"
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
                          Edit
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
                          Delete
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
            No academic years found.
          </Card>
        )}
      </div>
    </section>
  );
}
