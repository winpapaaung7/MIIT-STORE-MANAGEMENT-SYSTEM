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

interface Department {
  id: number;
  department: string;
  classroom: string;
  status: "Available" | "Closed";
}

interface DepartmentTableProps {
  data: Department[];
  onEdit: (department: Department) => void;
  onDelete: (department: Department) => void;
}

export default function DepartmentTable({
  data,
  onEdit,
  onDelete,
}: DepartmentTableProps) {
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
              <TableHead className="px-4 py-3 text-left">Department</TableHead>
              <TableHead className="px-4 py-3 text-left">Classroom</TableHead>
              <TableHead className="px-4 py-3 text-left">Status</TableHead>
              <TableHead className="px-4 py-3 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-80 px-4 py-6 text-center text-muted-foreground"
                >
                  No department records found.
                </TableCell>
              </TableRow>
            ) : (
              data.map((department) => (
                <TableRow key={department.id}>
                  <TableCell className="px-4 py-3">{department.id}</TableCell>

                  <TableCell className="px-4 py-3 font-medium">
                    {department.department}
                  </TableCell>

                  <TableCell className="px-4 py-3">
                    {department.classroom}
                  </TableCell>

                  <TableCell className="px-4 py-3">
                    <Badge
                      variant={
                        department.status === "Available"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {department.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => onEdit(department)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => onDelete(department)}
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
