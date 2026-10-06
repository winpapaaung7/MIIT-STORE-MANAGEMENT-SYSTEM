import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import type { ChangeEvent } from "react";
import { AlertTriangle, BookOpen, Download, FileDown, Gauge, Laptop, MoreHorizontal, Pencil, Plus, QrCode, Search, ShieldCheck, Trash2, Upload, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ScanModal from "@/components/modals/ScanModal";
import type { AccessoryItem, AccessoryStatus } from "@/screens/AccessoryDetails/types";
import BulkIssueRentalModal from "./BulkIssueRentalModal";
import RentalFilters, { type RentalFiltersValue } from "./RentalFilters";
import TeacherListModal from "./TeacherListModal";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/auth/AuthContext";

const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";
type Rental = { id: number; rentalCode: string; studentName: string; rollNumber: string; role: string; department: string; academicYear: string; year: string; laptopName: string; laptopId: string; qrCode: string; issuedAt: string; dueDate: string; returnedAt: string | null; issuedBy: string; status: string; inventoryStatus: AccessoryStatus; inventoryDepartment: string; inventoryRoom: string; inventoryRegisteredDate: string; inventoryRemark: string };
type RentalData = { summary: { all: number; pending: number; active: number; returned: number; available: number; damaged: number }; rentals: Rental[]; pagination?: { page: number; totalPages: number; total: number } };
type FilterOptions = { departments: { id: number; name: string }[]; academicYears: { id: number; name: string }[] };
type Student = { student_id: number; student_name: string; roll_number: string; email?: string; phone?: string; major?: string; batch?: string; status?: string; laptop_status?: string; personal_laptop_status?: string };
type Draft = Omit<Student, "student_id">;
const zero = { all: 0, pending: 0, active: 0, returned: 0, available: 0, damaged: 0 };
const emptyStudent: Draft = { student_name: "", roll_number: "", email: "", phone: "", major: "CSE", batch: "", status: "Active", personal_laptop_status: "None" };
const qrStatusClasses: Record<AccessoryStatus, string> = { Available: "bg-green-50 text-green-700", "In Use": "bg-blue-50 text-blue-700", Damaged: "bg-red-50 text-red-700" };
const formatDateTime = (value: string) => new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });

export default function LaptopRentalPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<RentalData>({ summary: zero, rentals: [] });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<RentalFiltersValue>({ status: "", role: "", department: "", academicYear: "", query: "" });
  const [page, setPage] = useState(1);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ departments: [], academicYears: [] });
  const [filterError, setFilterError] = useState("");
  const [studentsOpen, setStudentsOpen] = useState(false);
  const [teachersOpen, setTeachersOpen] = useState(false);
  const [policiesOpen, setPoliciesOpen] = useState(false);
  const [selectedQrItem, setSelectedQrItemState] = useState<AccessoryItem | null>(null);
  const rentalImportRef = useRef<HTMLInputElement>(null);
  const [bulkIssueOpen, setBulkIssueOpen] = useState(false);
  const loadRentals = () => { const params = new URLSearchParams({ page: String(page), limit: "50" }); if (filters.status) params.set("status", filters.status); if (filters.role) params.set("role", filters.role); if (filters.department) params.set("department", filters.department); if (filters.academicYear) params.set("academicYear", filters.academicYear); if (filters.query.trim()) params.set("query", filters.query.trim()); return fetch(API + "/api/laptop-rentals?" + params).then((r) => r.json()).then((p) => { if (!p.ok) throw new Error(p.message ?? "Unable to load rentals."); setData({ summary: p.summary, rentals: p.rentals, pagination: p.pagination }); setFilterError(""); }).catch((e) => setFilterError(e instanceof Error ? e.message : "Unable to load rentals.")).finally(() => setLoading(false)); };
  useEffect(() => { setLoading(true); void loadRentals(); }, [filters.status, filters.role, filters.department, filters.academicYear, filters.query, page]);
  useEffect(() => { fetch(API + "/api/laptop-rentals/filter-options").then((r) => r.json()).then((p) => { if (!p.ok) throw new Error(p.message); setFilterOptions({ departments: p.departments ?? [], academicYears: p.academicYears ?? [] }); }).catch((e) => setFilterError(e instanceof Error ? e.message : "Unable to load filter options.")); }, []);
  const updateRentalStatus = async (id: number, status: string) => {
    if (!window.confirm("Change this rental status to " + status + "?")) return;
    setLoading(true);
    const response = await fetch(API + "/api/laptop-rentals/" + id + "/status", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    const payload = await response.json();
    if (!response.ok) window.alert(payload.message ?? "Unable to update rental status.");
    void loadRentals();
  };
  const exportRentals = () => { const rows = rentals.map((r) => ({ rental_id: r.rentalCode, role: r.role, borrower: r.studentName, borrower_id: r.rollNumber, issued_by: r.issuedBy, issued_at: r.issuedAt, returned_at: r.returnedAt ?? "", department: r.department, academic_year: r.academicYear, laptop: r.laptopName, inventory_qr: r.qrCode, expected_return_date: r.dueDate ? new Date(r.dueDate).toISOString().slice(0, 10) : "", status: r.status })); const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(rows), "Laptop Rentals"); XLSX.writeFile(book, "Laptop-Rentals.xlsx"); };
  const downloadRentalSample = () => { const book = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet([{ role: "Student", borrower_id: "2026-MIIT-CSE-001", inventory_qr: "0009-000001", expected_return_date: "2027-01-04", status: "pending" }, { role: "Teacher", borrower_id: "teacher@miit.edu.mm", inventory_qr: "0009-000002", expected_return_date: "2027-01-04", status: "approved" }]), "Rental Import"); XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([["How to use this file"], ["Student rows use the student's roll number in borrower_id."], ["Teacher rows use the teacher's email in borrower_id."], ["inventory_qr must be an active laptop QR code."], ["status must be pending, approved, returned, or rejected."]]), "Instructions"); XLSX.writeFile(book, "Laptop-Rental-Import-Sample.xlsx"); };
  const importRentals = async (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; try { const book = XLSX.read(await file.arrayBuffer(), { type: "array" }); const sheet = book.Sheets[book.SheetNames[0]]; const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet).map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key.toLowerCase().replaceAll(" ", "_"), String(value ?? "")]))); const response = await fetch(API + "/api/laptop-rentals/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rentals: rows }) }); const payload = await response.json(); if (!response.ok) throw new Error(payload.message ?? "Import failed."); window.alert("Imported " + payload.imported + " rental records."); setLoading(true); void loadRentals(); } catch (error) { window.alert(error instanceof Error ? error.message : "Import failed."); } finally { event.target.value = ""; } };
  const rentals = data.rentals;
  const setSelectedQrItem = (item: AccessoryItem | null) => {
    if (!item || item.subCategory !== "Laptop Rental") return setSelectedQrItemState(item);
    const rental = data.rentals.find((record) => record.qrCode === item.id);
    if (!rental) return setSelectedQrItemState(item);
    setSelectedQrItemState({ ...item, status: rental.inventoryStatus, department: rental.inventoryDepartment as AccessoryItem["department"], room: rental.inventoryRoom, registeredDate: rental.inventoryRegisteredDate, createdAt: rental.inventoryRegisteredDate, remark: rental.inventoryRemark, borrowerName: rental.studentName, borrowerId: rental.rollNumber });
  };
  return <div className="laptop-rental-page space-y-5 pb-4">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><h1 className="text-3xl font-bold text-slate-950">{t("laptopRental")}</h1></div><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={downloadRentalSample} className="h-10 gap-2 rounded-xl border-slate-200 bg-white px-4 font-medium text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 hover:shadow-md sm:px-5"><FileDown className="h-4 w-4"/>Sample File</Button><Button variant="outline" onClick={() => rentalImportRef.current?.click()}><Upload className="mr-2 h-4 w-4"/>{t("import")}</Button><Button variant="outline" onClick={exportRentals}><Download className="mr-2 h-4 w-4"/>{t("export")}</Button><Button onClick={() => setBulkIssueOpen(true)}><Plus className="mr-2 h-4 w-4"/>{t("issueRental")}</Button></div></header>
    <input ref={rentalImportRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={importRentals}/>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><RentalStat label={t("allQuantity")} value={data.summary.all} Icon={Users} tone="text-blue-600" surface="bg-blue-50"/><RentalStat label={t("inUseQuantity")} value={data.summary.active} Icon={Laptop} tone="text-blue-600" surface="bg-blue-50"/><RentalAvailability available={data.summary.available} pending={data.summary.pending}/><RentalStat label={t("damagedMaintenance")} value={data.summary.damaged} Icon={AlertTriangle} tone="text-red-600" surface="bg-red-50"/></section>
    <RentalFilters value={filters} departments={filterOptions.departments} academicYears={filterOptions.academicYears} loading={loading} onChange={(next) => { setPage(1); setFilters((current) => ({ ...current, ...next })); }} onReset={() => { setPage(1); setFilters({ status: "", role: "", department: "", academicYear: "", query: "" }); }} onOpenStudents={() => setStudentsOpen(true)} onOpenTeachers={() => setTeachersOpen(true)} onOpenPolicies={() => setPoliciesOpen(true)} />
    {filterError && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{filterError}</p>}
    <Card className="overflow-hidden border-slate-200 shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[1180px] text-sm"><thead className="border-b bg-slate-50 text-left text-xs text-slate-500"><tr>{["ID", t("borrower"), `${t("role")} / ${t("department")} / ${t("academicYear")}`, t("laptop"), t("inventoryQr"), "Issued", "Returned", t("status"), t("actions")].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead><tbody>{rentals.map((r) => <tr key={r.id} className="border-b last:border-0"><td className="px-4 py-4 font-mono text-xs text-slate-600">{r.rentalCode}</td><td className="px-4 py-4"><p className="font-medium">{r.studentName}</p><p className="text-xs text-slate-500">{r.rollNumber}</p></td><td className="px-4 py-4"><p>{r.role}</p><p className="text-xs text-slate-500">{r.department}</p><p className="text-xs text-slate-500">{r.academicYear}</p></td><td className="px-4 py-4"><p className="font-medium">{r.laptopName}</p><p className="font-mono text-xs text-slate-500">{r.laptopId}</p></td><td className="px-4 py-4"><div className="flex justify-center">{r.qrCode === "-" ? <span className="font-mono text-xs text-slate-500">-</span> : <button type="button" aria-label={`${t("qrCode")}: ${r.laptopName}`} onClick={() => setSelectedQrItem({ id: r.qrCode, itemName: r.laptopName, subCategory: "Laptop Rental", status: "In Use", department: "Store", room: "", academicYear: r.academicYear, registeredDate: r.issuedAt, createdAt: r.issuedAt, remark: `${r.studentName} · ${r.rentalCode}` })} className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-slate-200"><QrCode className="size-5 text-slate-800"/></button>}</div></td><td className="px-4 py-4 text-slate-600"><p>{formatDateTime(r.issuedAt)}</p><p className="text-xs text-slate-500">By {r.issuedBy}</p><p className="text-xs text-slate-500">Due {new Date(r.dueDate).toLocaleDateString()}</p></td><td className="px-4 py-4 text-slate-600">{r.returnedAt ? formatDateTime(r.returnedAt) : "-"}</td><td className="px-4 py-4"><Status status={r.status}/></td><td className="px-4 py-4"><select aria-label={t("status")} value={["issued", "active"].includes(r.status.toLowerCase()) ? "approved" : r.status.toLowerCase()} onChange={(e) => { if (e.target.value !== r.status.toLowerCase()) void updateRentalStatus(r.id, e.target.value); }} className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm font-medium text-slate-700 shadow-sm"><option value="pending">{t("pending")}</option><option value="approved">{t("approved")}</option><option value="returned">{t("returned")}</option><option value="rejected">{t("rejected")}</option></select></td></tr>)}</tbody></table></div>{loading && <div className="py-16 text-center text-sm text-slate-500">{t("loadingRentalRecords")}</div>}{!loading && !rentals.length && <div className="py-16 text-center text-sm text-slate-500">{t("noRentalRecords")}</div>}</Card>
    {data.pagination && data.pagination.totalPages > 1 && <div className="flex items-center justify-between text-sm text-slate-600"><span>Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} records)</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</Button><Button variant="outline" size="sm" disabled={page >= data.pagination.totalPages} onClick={() => setPage((current) => current + 1)}>Next</Button></div></div>}
    <StudentModal open={studentsOpen} onOpenChange={setStudentsOpen}/>
    <TeacherListModal open={teachersOpen} onOpenChange={setTeachersOpen}/>
    <RentalPoliciesModal open={policiesOpen} onOpenChange={setPoliciesOpen}/>
    <BulkIssueRentalModal open={bulkIssueOpen} onOpenChange={setBulkIssueOpen} onIssued={() => { setLoading(true); void loadRentals(); }}/>
    <ScanModal selectedQrItem={selectedQrItem} onClose={() => setSelectedQrItem(null)} statusClasses={qrStatusClasses}/>
  </div>;
}

function RentalPoliciesModal({ open, onOpenChange }: { open: boolean; onOpenChange: (value: boolean) => void }) {
  const { user } = useAuth();
  const canEdit = user?.role.code === "ADMIN" || user?.role.code === "LAPTOP_RENTAL";
  const isAdmin = user?.role.code === "ADMIN";
  const [policies, setPolicies] = useState<{ title: string; text: string }[]>([]);
  const [savedPolicies, setSavedPolicies] = useState<{ title: string; text: string }[]>([]);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => { if (open) { fetch(`${API}/api/laptop-rentals/policies`).then((response) => response.json()).then((payload) => { const loaded = payload.policies ?? []; setPolicies(loaded); setSavedPolicies(loaded); setMessage(""); }).catch(() => setMessage("Unable to load rental policies.")); } }, [open]);
  const save = async () => { const response = await fetch(`${API}/api/laptop-rentals/policies`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ policies }) }); const payload = await response.json(); if (!response.ok) return setMessage(payload.message ?? "Unable to save rental policies."); const saved = payload.policies ?? policies; setPolicies(saved); setSavedPolicies(saved); setEditing(false); setMessage("Rental policies saved."); };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[92vw] max-w-3xl gap-0 overflow-y-auto p-0">
        <DialogHeader className="border-b border-slate-100 px-6 py-5 pr-12">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700"><BookOpen className="size-5" /></div>
            <div>
              <DialogTitle>Laptop Rental Policies</DialogTitle>
              <p className="mt-1 text-sm leading-6 text-slate-500">Rules applied when issuing and managing laptop rentals.</p>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-3 p-6 text-sm text-slate-700">
          {policies.map((policy, index) => (
            <div key={`${policy.title}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              {editing ? <>
                <div className="flex gap-2">
                  <input value={policy.title} onChange={(event) => setPolicies((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item))} className="h-9 flex-1 rounded-md border border-slate-200 bg-white px-2 text-sm font-medium text-slate-900" />
                  {isAdmin && <Button type="button" size="icon" variant="outline" aria-label={`Delete ${policy.title || "policy"}`} title="Delete policy" disabled={policies.length === 1} onClick={() => setPolicies((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="size-9 border-rose-200 text-rose-700 hover:bg-rose-50"><Trash2 className="size-4" /></Button>}
                </div>
                <textarea value={policy.text} onChange={(event) => setPolicies((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, text: event.target.value } : item))} className="mt-2 min-h-20 w-full rounded-md border border-slate-200 bg-white p-2 text-sm text-slate-700" />
              </> : <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-white p-2 text-blue-700 shadow-sm ring-1 ring-slate-200"><ShieldCheck className="size-4" /></div>
                <div className="min-w-0"><p className="font-semibold text-slate-900">{policy.title}</p><p className="mt-1 leading-6 text-slate-600">{policy.text}</p></div>
              </div>}
            </div>
          ))}
          {!policies.length && !message && <p className="py-6 text-center text-slate-500">Loading policies...</p>}
          {message && <p className="text-sm text-slate-600">{message}</p>}
          {editing ? <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
            {isAdmin && <Button type="button" size="sm" variant="outline" onClick={() => setPolicies((current) => [...current, { title: "New policy", text: "Describe this rental policy." }])}><Plus className="mr-1.5 size-4" />Add Policy</Button>}
            <Button type="button" size="sm" variant="outline" onClick={() => { setPolicies(savedPolicies); setEditing(false); }}>Cancel</Button>
            <Button type="button" size="sm" onClick={() => void save()}>Save Policies</Button>
          </div> : canEdit && <div className="flex justify-end border-t border-slate-100 pt-4">
            <Button type="button" size="sm" onClick={() => setEditing(true)}><Pencil className="mr-1.5 size-4" />Edit policies</Button>
          </div>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StudentModal({ open, onOpenChange }: { open: boolean; onOpenChange: (value: boolean) => void }) {
  const { t } = useLanguage();
  const [students, setStudents] = useState<Student[]>([]); const [search, setSearch] = useState(""); const [draft, setDraft] = useState<Draft>(emptyStudent); const [editingId, setEditingId] = useState<number | null>(null); const [message, setMessage] = useState(""); const [openActionId, setOpenActionId] = useState<number | null>(null);
  const load = () => fetch(API + "/api/students").then((r) => r.json()).then((p) => setStudents(p.students ?? []));
  useEffect(() => { if (open) { load(); setMessage(""); } }, [open]);
  const shown = students.filter((s) => (s.student_name + " " + s.roll_number + " " + (s.major ?? "")).toLowerCase().includes(search.toLowerCase()));
  const save = async () => { if (!draft.student_name.trim() || !draft.roll_number.trim()) return setMessage("Student name and roll number are required."); const url = editingId ? API + "/api/students/" + editingId : API + "/api/students"; const response = await fetch(url, { method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) }); const payload = await response.json(); if (!response.ok) return setMessage(payload.message ?? "Unable to save student."); setDraft(emptyStudent); setEditingId(null); setMessage("Student saved successfully."); load(); };
  const importFile = async (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; const lines = (await file.text()).trim().split(/\r?\n/); const headers = lines.shift()?.split(",").map((h) => h.trim()) ?? []; const rows = lines.filter(Boolean).map((line) => { const values = line.split(","); return Object.fromEntries(headers.map((h, i) => [h, values[i]?.trim() ?? ""])); }); const response = await fetch(API + "/api/students/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ students: rows }) }); const payload = await response.json(); setMessage(response.ok ? "Imported " + (payload.count ?? rows.length) + " students." : (payload.message ?? "Import failed.")); if (response.ok) load(); event.target.value = ""; };
  const downloadSample = () => { const csv = "student_name,roll_number,email,phone,major,batch,status,personal_laptop_status\nExample Student (No Laptop),2026-MIIT-CSE-001,student1@miit.edu.mm,09123456789,CSE,2026 Batch,Active,None\nExample Student (Working Laptop),2026-MIIT-CSE-002,student2@miit.edu.mm,09123456780,CSE,2026 Batch,Active,Working\nExample Student (Damaged Laptop),2026-MIIT-CSE-003,student3@miit.edu.mm,09123456781,CSE,2026 Batch,Active,Damaged\n"; const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = "Student-Import-Sample.csv"; link.click(); URL.revokeObjectURL(url); };
  const remove = async (id: number) => { if (!window.confirm("Delete this student?")) return; const response = await fetch(API + "/api/students/" + id, { method: "DELETE" }); if (response.ok) { setMessage("Student deleted."); load(); } else setMessage("Unable to delete student."); };
  const edit = (s: Student) => { setDraft({ student_name: s.student_name, roll_number: s.roll_number, email: s.email ?? "", phone: s.phone ?? "", major: s.major ?? "", batch: s.batch ?? "", status: s.status ?? "Active", personal_laptop_status: s.personal_laptop_status ?? "None" }); setEditingId(s.student_id); setMessage("Editing " + s.roll_number); };
  const field = (name: keyof Draft, value: string) => setDraft({ ...draft, [name]: value });
  const studentFields: [keyof Draft, string][] = [["student_name", t("studentName")], ["roll_number", t("rollNumber")], ["email", t("email")], ["phone", t("phone")], ["major", `${t("major")} (CSE / ECE)`], ["batch", t("batch")], ["status", t("status")]];
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[92vh] w-[96vw] max-w-[96vw] overflow-y-auto sm:max-w-[min(96vw,1200px)]"><DialogHeader><DialogTitle>{t("studentList")}</DialogTitle><p className="text-sm text-slate-500">{t("manageStudents")}</p></DialogHeader><div className="grid gap-4 lg:grid-cols-[330px_1fr]"><Card className="border-slate-200"><CardContent className="space-y-3 p-4"><div className="flex items-center justify-between gap-2"><h3 className="font-semibold">{editingId ? t("editStudent") : t("addStudent")}</h3><div className="flex items-center gap-2"><Button type="button" variant="outline" size="sm" onClick={downloadSample} className="h-8 border-slate-200 px-2 text-xs"><FileDown className="mr-1.5 h-4 w-4"/>Sample File</Button><label className="inline-flex h-8 cursor-pointer items-center rounded-md border border-blue-200 bg-blue-50 px-2.5 text-xs font-medium text-blue-700 shadow-sm transition-colors hover:bg-blue-100"><Upload className="mr-1.5 h-4 w-4"/>{t("importCsv")}<input type="file" accept=".csv" className="hidden" onChange={importFile}/></label></div></div>{studentFields.map(([name, label]) => <label key={name} className="block text-xs font-medium text-slate-600">{label}<input value={draft[name] ?? ""} onChange={(e) => field(name, e.target.value)} className="mt-1 h-9 w-full rounded-md border border-slate-200 px-2 text-sm"/></label>)}<label className="block text-xs font-medium text-slate-600">Personal laptop<select value={draft.personal_laptop_status ?? "None"} onChange={(event) => field("personal_laptop_status", event.target.value)} className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm"><option value="None">No personal laptop</option><option value="Working">Working</option><option value="Damaged">Damaged</option></select></label><div className="flex gap-2"><Button size="sm" onClick={save}>{editingId ? t("updateStudent") : t("addStudent")}</Button>{editingId && <Button size="sm" variant="outline" onClick={() => { setEditingId(null); setDraft(emptyStudent); }}>{t("cancel")}</Button>}</div>{message && <p className="text-xs text-slate-600">{message}</p>}</CardContent></Card><div className="min-w-0"><label className="relative block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("searchStudents")} className="h-10 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm"/></label><div className="mt-3 max-h-[520px] overflow-auto rounded-lg border border-slate-200"><table className="w-full min-w-[760px] text-sm"><thead className="sticky top-0 bg-slate-50 text-left text-xs text-slate-500"><tr>{[t("rollNumber"), t("student"), t("major"), t("batch"), "Personal laptop", t("laptopStatus"), t("actions")].map((h) => <th key={h} className="px-3 py-3">{h}</th>)}</tr></thead><tbody>{shown.map((s) => <tr key={s.student_id} className="border-t"><td className="px-3 py-3 font-mono text-xs">{s.roll_number}</td><td className="px-3 py-3"><p className="font-medium">{s.student_name}</p><p className="text-xs text-slate-500">{s.email || s.phone || "-"}</p></td><td className="px-3 py-3">{s.major || "-"}</td><td className="px-3 py-3">{s.batch || "-"}</td><td className="px-3 py-3"><PersonalLaptopStatus status={s.personal_laptop_status}/></td><td className="px-3 py-3"><Status status={s.laptop_status ?? "No Rental"}/></td><td className="px-3 py-3"><div className="flex justify-center"><DropdownMenu open={openActionId === s.student_id} onOpenChange={(isOpen) => setOpenActionId(isOpen ? s.student_id : null)}><DropdownMenuTrigger asChild><Button type="button" variant="outline" size="icon" aria-label={`Actions for ${s.student_name}`} className="size-9 rounded-lg border-slate-200 bg-white shadow-sm hover:bg-slate-50"><MoreHorizontal className="size-4"/></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-32"><DropdownMenuItem onClick={() => edit(s)}><Pencil className="size-4 text-sky-600"/>{t("edit")}</DropdownMenuItem><DropdownMenuItem onClick={() => remove(s.student_id)} className="text-rose-700 focus:text-rose-700"><Trash2 className="size-4"/>{t("delete")}</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></td></tr>)}{!shown.length && <tr><td colSpan={7} className="px-3 py-12 text-center text-slate-500">{t("noStudents")}</td></tr>}</tbody></table></div></div></div></DialogContent></Dialog>;
}

function PersonalLaptopStatus({ status }: { status?: string }) {
  const normalized = status === "Working" || status === "Damaged" ? status : "None";
  const style = normalized === "Working" ? "bg-amber-50 text-amber-700" : normalized === "Damaged" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600";
  const label = normalized === "None" ? "No personal laptop" : normalized;
  return <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${style}`}>{label}</span>;
}

function RentalStat({ label, value, Icon, tone, surface }: { label: string; value: number; Icon: typeof Laptop; tone: string; surface: string }) { return <Card className="h-32 overflow-hidden border-slate-200/90 bg-white shadow-sm"><CardContent className="flex h-full flex-col px-4 pb-3 pt-3"><div className="flex items-start justify-between gap-3"><p className="truncate text-sm font-semibold tracking-tight text-slate-600">{label}</p><div className={`rounded-xl p-2 ${surface} ${tone}`}><Icon className="h-5 w-5"/></div></div><p className="mt-2 text-3xl font-bold leading-none text-slate-950">{value}</p></CardContent></Card>; }
function RentalAvailability({ available, pending }: { available: number; pending: number }) {
  return <Card className="flex h-32 min-w-0 flex-col overflow-hidden border-slate-200/90 bg-white shadow-sm">
    <CardContent className="relative flex h-full flex-col px-4 pb-3 pt-3">
      <div className="min-w-[140px] flex-1">
        <p className="whitespace-nowrap text-[13px] font-semibold tracking-tight text-slate-600">Rental availability</p>
        <div className="mt-2 flex items-baseline gap-2"><strong className="text-3xl font-bold leading-none text-green-600">{available}</strong><span className="text-sm font-medium text-slate-600">Available</span></div>
        <p className="mt-3 flex items-center gap-2 text-sm font-medium text-slate-600"><span className="size-2.5 rounded-full bg-amber-500"/><strong className="text-slate-950">{pending}</strong> Pending</p>
      </div>
      <div className="absolute right-4 top-3 rounded-xl bg-green-50 p-2 text-green-600"><Gauge className="size-5"/></div>
    </CardContent>
  </Card>;
}
function Status({ status }: { status: string }) { const { t } = useLanguage(); const key = status.toLowerCase(); const style = key === "returned" || key === "completed" ? "bg-slate-100 text-slate-700" : key === "pending" ? "bg-amber-50 text-amber-700" : key === "approved" || key === "active" || key === "issued" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"; const label = key === "returned" || key === "completed" ? t("returned") : key === "pending" ? t("pending") : key === "approved" || key === "active" || key === "issued" ? t("approved") : key === "rejected" ? t("rejected") : status; return <span className={"rounded-full px-2.5 py-1 text-xs font-medium " + style}>{label}</span>; }


