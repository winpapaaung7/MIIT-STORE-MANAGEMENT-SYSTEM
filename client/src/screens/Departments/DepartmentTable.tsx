import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface Department {
  id: number;
  department: string;
  classroom: string;
  status: "Available" | "Closed";
}

interface DepartmentTableProps {
  data: Department[];
  onOpen: (department: Department) => void;
  onEdit: (department: Department) => void;
  onDelete: (department: Department) => void;
}

export default function DepartmentTable({
  data,
  onOpen,
  onEdit,
  onDelete,
}: DepartmentTableProps) {
  const { t } = useLanguage();
  return (
    <div className="mt-6 overflow-hidden rounded-3xl border bg-white shadow-sm">
      <div className="max-h-[420px] overflow-auto">
        <Table className="w-full table-fixed">
          <colgroup>
            <col className="w-[70px]" />
            <col className="w-[220px]" />
            <col className="w-[140px]" />
            <col className="w-[140px]" />
            <col className="w-[120px]" />
          </colgroup>

          <TableHeader className="sticky top-0 z-10 bg-white">
            <TableRow>
              <TableHead className="px-4 py-3 text-left">ID</TableHead>
              <TableHead className="px-4 py-3 text-left">{t("departmentClassroom")}</TableHead>
              <TableHead className="px-4 py-3 text-left">{t("room")}</TableHead>
              <TableHead className="px-4 py-3 text-left">{t("status")}</TableHead>
              <TableHead className="px-4 py-3 text-center">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-80 px-4 py-6 text-center text-muted-foreground"
                >
                  {t("noDepartments")}
                </TableCell>
              </TableRow>
            ) : (
              data.map((department) => (
                <TableRow
                  key={department.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpen(department)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onOpen(department);
                    }
                  }}
                  className="cursor-pointer hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                >
                  <TableCell className="px-4 py-4 text-left font-mono text-sm font-medium text-slate-950 sm:py-5 sm:text-base">
                    {department.id}
                  </TableCell>

              <TableCell className="max-w-0 overflow-hidden px-4 py-4 text-left font-semibold text-slate-950 sm:py-5">
                <span className="block truncate" title={department.department}>
                  {department.department}
                </span>
              </TableCell>

                  <TableCell className="px-4 py-4 text-left text-sm text-slate-500 sm:py-5">
                    {department.classroom}
                  </TableCell>

                  <TableCell className="px-4 py-4 text-left sm:py-5">
                    <Badge
                      variant={
                        department.status === "Available"
                          ? "default"
                          : "secondary"
                      }
                      className="h-7 rounded-full px-3 text-sm font-semibold"
                    >
                      {department.status === "Available" ? t("available") : department.status === "Closed" ? t("closed") : department.status}
                    </Badge>
                  </TableCell>

                  <TableCell
                    className="px-4 py-4 text-center sm:py-5"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="flex justify-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={(event) => {
                          event.stopPropagation();
                          onEdit(department);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDelete(department);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
