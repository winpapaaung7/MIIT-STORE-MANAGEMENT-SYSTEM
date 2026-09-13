import { useEffect, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/context/LanguageContext";

const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";
type Department = { id: number; name: string };
type Teacher = { id: number; name: string; email: string; phone: string; departmentId: number; department: string; laptopStatus?: string };
const blank = { name: "", email: "", phone: "", departmentId: "" };

export default function TeacherListModal({ open, onOpenChange }: { open: boolean; onOpenChange: (value: boolean) => void }) {
  const { t } = useLanguage();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [draft, setDraft] = useState(blank);
  const [editing, setEditing] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    const [teacherResponse, departmentResponse] = await Promise.all([fetch(`${API}/api/teachers`).then((response) => response.json()), fetch(`${API}/api/departments`).then((response) => response.json())]);
    setTeachers(teacherResponse.teachers ?? []);
    setDepartments((departmentResponse.departments ?? []).map((department: { id?: number; department_id?: number; department: string }) => ({ id: department.id ?? department.department_id!, name: department.department })));
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
  const shown = teachers.filter((teacher) => `${teacher.name} ${teacher.email} ${teacher.phone} ${teacher.department}`.toLowerCase().includes(query.toLowerCase()));
  const fields = [["name", t("teacherName")], ["phone", t("phoneNumber")], ["email", t("email")]] as const;

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[92vh] w-[96vw] max-w-[96vw] overflow-y-auto sm:max-w-[min(96vw,1100px)]"><DialogHeader><DialogTitle>{t("teacherList")}</DialogTitle><p className="text-sm text-slate-500">{t("manageTeachers")}</p></DialogHeader><div className="grid gap-4 lg:grid-cols-[310px_1fr]"><div className="space-y-3 rounded-lg border p-4"><h3 className="font-semibold">{editing ? t("editTeacher") : t("addTeacher")}</h3>{fields.map(([key, label]) => <label key={key} className="block text-xs font-medium">{label}<input className="mt-1 h-9 w-full rounded border px-2 text-sm" value={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}/></label>)}<label className="block text-xs font-medium">{t("department")}<select className="mt-1 h-9 w-full rounded border px-2 text-sm" value={draft.departmentId} onChange={(event) => setDraft({ ...draft, departmentId: event.target.value })}><option value="">{t("selectDepartment")}</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label><div className="flex gap-2"><Button size="sm" onClick={save}><Plus className="mr-1 h-4 w-4"/>{editing ? t("updateTeacher") : t("addTeacher")}</Button>{editing && <Button size="sm" variant="outline" onClick={() => { setEditing(null); setDraft(blank); }}>{t("cancel")}</Button>}</div>{message && <p className="text-xs text-red-600">{message}</p>}</div><div><label className="relative block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input className="h-10 w-full rounded border pl-10 text-sm" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("searchTeachers")}/></label><div className="mt-3 overflow-auto rounded-lg border"><table className="w-full min-w-[700px] text-sm"><thead className="bg-slate-50 text-left text-xs text-slate-500"><tr>{[t("teacher"), t("phone"), t("email"), t("department"), t("laptopStatus"), t("actions")].map((heading) => <th key={heading} className="p-3">{heading}</th>)}</tr></thead><tbody>{shown.map((teacher) => <tr key={teacher.id} className="border-t"><td className="p-3 font-medium">{teacher.name}</td><td className="p-3">{teacher.phone}</td><td className="p-3">{teacher.email}</td><td className="p-3">{teacher.department}</td><td className="p-3"><RentalStatus status={teacher.laptopStatus ?? "No Rental"}/></td><td className="p-3"><Button size="icon" variant="ghost" onClick={() => { setEditing(teacher.id); setDraft({ name: teacher.name, email: teacher.email, phone: teacher.phone, departmentId: String(teacher.departmentId) }); }}><Pencil className="h-4 w-4"/></Button><Button size="icon" variant="ghost" className="text-red-600" onClick={() => void remove(teacher.id)}><Trash2 className="h-4 w-4"/></Button></td></tr>)}{!shown.length && <tr><td colSpan={6} className="p-10 text-center text-slate-500">{t("noTeachers")}</td></tr>}</tbody></table></div></div></div></DialogContent></Dialog>;
}

function RentalStatus({ status }: { status: string }) {
  const { t } = useLanguage();
  const key = status.toLowerCase();
  const style = key === "approved" || key === "issued" || key === "active" ? "bg-green-50 text-green-700" : key === "pending" ? "bg-amber-50 text-amber-700" : key === "returned" ? "bg-slate-100 text-slate-700" : key === "no rental" ? "bg-slate-100 text-slate-600" : "bg-red-50 text-red-700";
  const label = key === "no rental" ? t("noRental") : key === "approved" || key === "issued" || key === "active" ? t("approved") : key === "pending" ? t("pending") : key === "returned" ? t("returned") : key === "rejected" ? t("rejected") : status;
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${style}`}>{label}</span>;
}
