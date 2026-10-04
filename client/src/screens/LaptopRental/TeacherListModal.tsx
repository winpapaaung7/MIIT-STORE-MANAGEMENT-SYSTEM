import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { FileDown, MoreHorizontal, Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/context/LanguageContext";

const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";
type Department = { id: number; name: string };
type Teacher = { id: number; name: string; email: string; phone: string; departmentId: number; department: string; laptopStatus?: string; personalLaptopStatus?: string };
const blank = { name: "", email: "", phone: "", departmentId: "", personalLaptopStatus: "None" };

export default function TeacherListModal({ open, onOpenChange }: { open: boolean; onOpenChange: (value: boolean) => void }) {
  const { t } = useLanguage();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [draft, setDraft] = useState(blank);
  const [editing, setEditing] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [openActionId, setOpenActionId] = useState<number | null>(null);

  const load = async () => {
    const [teacherResponse, departmentResponse] = await Promise.all([fetch(`${API}/api/teachers`).then((response) => response.json()), fetch(`${API}/api/departments`).then((response) => response.json())]);
    setTeachers(teacherResponse.teachers ?? []);
    setDepartments((departmentResponse.departments ?? []).map((department: { id?: number; department_id?: number; department: string }) => ({ id: department.department_id ?? department.id!, name: department.department })));
  };
  useEffect(() => { if (open) { void load(); setMessage(""); } }, [open]);

  const save = async () => {
    const response = await fetch(editing ? `${API}/api/teachers/${editing}` : `${API}/api/teachers`, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...draft, departmentId: Number(draft.departmentId) }) });
    const payload = await response.json();
    if (!response.ok) return setMessage(payload.message ?? "Unable to save teacher.");
    setDraft(blank); setEditing(null); setMessage(""); void load();
  };
  const remove = async (id: number) => {
    if (!window.confirm("Delete this teacher?")) return;
    const response = await fetch(`${API}/api/teachers/${id}`, { method: "DELETE" });
    const payload = await response.json();
    if (!response.ok) return setMessage(payload.message ?? "Unable to delete teacher.");
    void load();
  };
  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    const lines = (await file.text()).trim().split(/\r?\n/); const headers = lines.shift()?.split(",").map((header) => header.trim()) ?? [];
    const teachers = lines.filter(Boolean).map((line) => Object.fromEntries(headers.map((header, index) => [header, line.split(",")[index]?.trim() ?? ""])));
    const response = await fetch(`${API}/api/teachers/import`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ teachers }) });
    const payload = await response.json(); setMessage(response.ok ? `Imported ${payload.imported ?? teachers.length} teacher(s).` : (payload.message ?? "Import failed.")); if (response.ok) void load(); event.target.value = "";
  };
  const downloadSample = () => { const csv = "name,email,phone,department,personal_laptop_status\nExample Teacher (No Laptop),teacher1@miit.edu.mm,09123456789,Faculty of Computing,None\nExample Teacher (Working Laptop),teacher2@miit.edu.mm,09123456780,Faculty of Computing,Working\nExample Teacher (Damaged Laptop),teacher3@miit.edu.mm,09123456781,Faculty of Computing,Damaged\n"; const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = "Teacher-Import-Sample.csv"; link.click(); URL.revokeObjectURL(url); };
  const shown = teachers.filter((teacher) => `${teacher.name} ${teacher.email} ${teacher.phone} ${teacher.department}`.toLowerCase().includes(query.toLowerCase()));
  const fields = [["name", t("teacherName")], ["phone", t("phoneNumber")], ["email", t("email")]] as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[96vw] max-w-[96vw] overflow-y-auto sm:max-w-[min(96vw,1100px)]">
        <DialogHeader><DialogTitle>{t("teacherList")}</DialogTitle><p className="text-sm text-slate-500">{t("manageTeachers")}</p></DialogHeader>
        <div className="grid gap-4 lg:grid-cols-[310px_1fr]">
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between gap-2"><h3 className="font-semibold">{editing ? t("editTeacher") : t("addTeacher")}</h3><div className="flex items-center gap-2"><Button type="button" variant="outline" size="sm" onClick={downloadSample} className="h-8 border-slate-200 px-2 text-xs"><FileDown className="mr-1.5 h-4 w-4"/>Sample File</Button><label className="inline-flex h-8 cursor-pointer items-center rounded-md border border-blue-200 bg-blue-50 px-2.5 text-xs font-medium text-blue-700 shadow-sm transition-colors hover:bg-blue-100"><Upload className="mr-1.5 h-4 w-4"/>Import<input type="file" accept=".csv" className="hidden" onChange={importFile}/></label></div></div>
            {fields.map(([key, label]) => <label key={key} className="block text-xs font-medium">{label}<input className="mt-1 h-9 w-full rounded border px-2 text-sm" value={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}/></label>)}
            <label className="block text-xs font-medium">{t("department")}<select className="mt-1 h-9 w-full rounded border px-2 text-sm" value={draft.departmentId} onChange={(event) => setDraft({ ...draft, departmentId: event.target.value })}><option value="">{t("selectDepartment")}</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>
            <label className="block text-xs font-medium">Personal laptop<select className="mt-1 h-9 w-full rounded border px-2 text-sm" value={draft.personalLaptopStatus} onChange={(event) => setDraft({ ...draft, personalLaptopStatus: event.target.value })}><option value="None">No personal laptop</option><option value="Working">Working</option><option value="Damaged">Damaged</option></select><span className="mt-1 block font-normal text-slate-500">A working personal laptop prevents an MIIT rental.</span></label>
            <div className="flex gap-2"><Button size="sm" onClick={save}><Plus className="mr-1 h-4 w-4"/>{editing ? t("updateTeacher") : t("addTeacher")}</Button>{editing && <Button size="sm" variant="outline" onClick={() => { setEditing(null); setDraft(blank); }}>{t("cancel")}</Button>}</div>{message && <p className="text-xs text-red-600">{message}</p>}
          </div>
          <div><label className="relative block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input className="h-10 w-full rounded border pl-10 text-sm" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("searchTeachers")}/></label><div className="mt-3 overflow-auto rounded-lg border"><table className="w-full min-w-[820px] text-sm"><thead className="bg-slate-50 text-left text-xs text-slate-500"><tr>{[t("teacher"), t("phone"), t("email"), t("department"), "Personal laptop", t("laptopStatus"), t("actions")].map((heading) => <th key={heading} className="p-3">{heading}</th>)}</tr></thead><tbody>{shown.map((teacher) => <tr key={teacher.id} className="border-t"><td className="p-3 font-medium">{teacher.name}</td><td className="p-3">{teacher.phone}</td><td className="p-3">{teacher.email}</td><td className="p-3">{teacher.department}</td><td className="p-3"><PersonalLaptopStatus status={teacher.personalLaptopStatus ?? "None"}/></td><td className="p-3"><RentalStatus status={teacher.laptopStatus ?? "No Rental"}/></td><td className="p-3"><div className="flex justify-center"><DropdownMenu open={openActionId === teacher.id} onOpenChange={(isOpen) => setOpenActionId(isOpen ? teacher.id : null)}><DropdownMenuTrigger asChild><Button type="button" variant="outline" size="icon" aria-label={`Actions for ${teacher.name}`} className="size-9 rounded-lg border-slate-200 bg-white shadow-sm hover:bg-slate-50"><MoreHorizontal className="size-4"/></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-32"><DropdownMenuItem onClick={() => { setEditing(teacher.id); setDraft({ name: teacher.name, email: teacher.email, phone: teacher.phone, departmentId: String(teacher.departmentId), personalLaptopStatus: teacher.personalLaptopStatus ?? "None" }); }}><Pencil className="size-4 text-sky-600"/>{t("edit")}</DropdownMenuItem><DropdownMenuItem onClick={() => void remove(teacher.id)} className="text-rose-700 focus:text-rose-700"><Trash2 className="size-4"/>{t("delete")}</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></td></tr>)}{!shown.length && <tr><td colSpan={7} className="p-10 text-center text-slate-500">{t("noTeachers")}</td></tr>}</tbody></table></div></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PersonalLaptopStatus({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const style = normalized === "working" ? "bg-amber-50 text-amber-700" : normalized === "damaged" ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600";
  const label = normalized === "working" ? "Working" : normalized === "damaged" ? "Damaged" : "No personal laptop";
  return <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${style}`}>{label}</span>;
}

function RentalStatus({ status }: { status: string }) {
  const { t } = useLanguage();
  const key = status.toLowerCase();
  const style = key === "approved" || key === "issued" || key === "active" ? "bg-green-50 text-green-700" : key === "pending" ? "bg-amber-50 text-amber-700" : key === "returned" ? "bg-slate-100 text-slate-700" : key === "no rental" ? "bg-slate-100 text-slate-600" : "bg-red-50 text-red-700";
  const label = key === "no rental" ? t("noRental") : key === "approved" || key === "issued" || key === "active" ? t("approved") : key === "pending" ? t("pending") : key === "returned" ? t("returned") : key === "rejected" ? t("rejected") : status;
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${style}`}>{label}</span>;
}
