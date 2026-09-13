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
import { Card } from "@/components/ui/card";
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
    <Card className="workspace-table-card mt-6 overflow-hidden border-slate-200 shadow-sm">
      <div className="max-h-[420px] overflow-auto">
        <Table className="workspace-table w-full min-w-[760px] text-sm">
          <colgroup>
            <col className="w-[70px]" />
            <col className="w-[220px]" />
            <col className="w-[140px]" />
            <col className="w-[140px]" />
            <col className="w-[120px]" />
          </colgroup>

          <TableHeader className="workspace-table-head border-b bg-slate-50 text-left text-xs text-slate-500">
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4 py-3 text-left text-xs font-medium text-slate-500">ID</TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-medium text-slate-500">{t("departmentClassroom")}</TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-medium text-slate-500">{t("room")}</TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-medium text-slate-500">{t("status")}</TableHead>
              <TableHead className="px-4 py-3 text-center text-xs font-medium text-slate-500">{t("actions")}</TableHead>
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
                  className="workspace-table-row cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                >
                  <TableCell className="px-4 py-4 text-left font-mono text-xs text-slate-600">
                    {department.id}
                  </TableCell>

              <TableCell className="max-w-0 overflow-hidden px-4 py-4 text-left font-medium text-slate-950">
                <span className="block truncate" title={department.department}>
                  {department.department}
                </span>
              </TableCell>

                  <TableCell className="px-4 py-4 text-left text-sm text-slate-500">
                    {department.classroom}
                  </TableCell>

                  <TableCell className="px-4 py-4 text-left">
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
                    className="px-4 py-4 text-center"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="flex justify-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="size-9 rounded-lg border-slate-200 bg-white shadow-sm hover:bg-slate-50"
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
                        className="size-9 rounded-lg"
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
    </Card>
  );
}
