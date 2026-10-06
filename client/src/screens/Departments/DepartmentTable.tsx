import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ChevronRight, DoorOpen } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export interface DepartmentSummary {
  departmentId: number;
  name: string;
  roomCount: number;
  availableRooms: number;
}

export default function DepartmentTable({
  data,
  onOpen,
}: {
  data: DepartmentSummary[];
  onOpen: (department: DepartmentSummary) => void;
}) {
  const { t } = useLanguage();

  return (
    <Card className="workspace-table-card overflow-hidden border-slate-200 shadow-sm">
      <div className="max-h-[420px] overflow-auto">
        <Table className="workspace-table w-full min-w-[620px] text-sm">
          <TableHeader className="workspace-table-head border-b bg-slate-50 text-left text-xs text-slate-500">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-20 px-4 py-3">No.</TableHead>
              <TableHead className="px-4 py-3">{t("department")}</TableHead>
              <TableHead className="w-40 px-4 py-3">{t("room")}</TableHead>
              <TableHead className="w-40 px-4 py-3">{t("status")}</TableHead>
              <TableHead className="w-12 px-4 py-3" aria-label="Open" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {!data.length ? (
              <TableRow><TableCell colSpan={5} className="h-80 text-center text-muted-foreground">{t("noDepartments")}</TableCell></TableRow>
            ) : data.map((department, index) => (
              <TableRow
                key={department.departmentId}
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
                <TableCell className="px-4 py-4 font-mono text-xs text-slate-600">{index + 1}</TableCell>
                <TableCell className="px-4 py-4 font-medium text-slate-950">{department.name}</TableCell>
                <TableCell className="px-4 py-4 text-slate-600"><span className="inline-flex items-center gap-2"><DoorOpen className="size-4" />{department.roomCount} {department.roomCount === 1 ? "room" : "rooms"}</span></TableCell>
                <TableCell className="px-4 py-4"><Badge variant={department.availableRooms ? "default" : "secondary"} className="h-7 rounded-full px-3 text-sm font-semibold">{department.availableRooms ? t("available") : t("closed")}</Badge></TableCell>
                <TableCell className="px-4 py-4 text-right text-slate-500"><ChevronRight className="ml-auto size-5" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
