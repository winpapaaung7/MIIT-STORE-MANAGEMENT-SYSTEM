import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";

type Option = { id: number; name: string };
type SelectOption = { value: string; label: string };
export type RentalFiltersValue = { status: string; role: string; department: string; academicYear: string; query: string };

export default function RentalFilters({ value, departments, academicYears, loading, onChange, onReset }: { value: RentalFiltersValue; departments: Option[]; academicYears: Option[]; loading: boolean; onChange: (next: Partial<RentalFiltersValue>) => void; onReset: () => void }) {
  const { t } = useLanguage();
  const departmentOptions = value.role === "Student" ? [{ id: 1, name: "CSE" }, { id: 2, name: "ECE" }] : value.role === "Teacher" ? departments : [];
  const statusOptions = ["Approved", "Pending", "Returned", "Rejected"].map((value) => ({ value, label: value === "Approved" ? t("approved") : value === "Pending" ? t("pending") : value === "Returned" ? t("returned") : t("rejected") }));
  return <Card className="border-slate-200 shadow-sm"><CardContent className="space-y-3 p-4"><div className="flex flex-wrap gap-2"><Button size="sm" variant={!value.status && !value.role && !value.department && !value.academicYear ? "default" : "outline"} onClick={onReset}>{t("all")}</Button><Select label={t("status")} value={value.status} disabled={loading} options={statusOptions} onChange={(status) => onChange({ status })} /><Select label={t("role")} value={value.role} disabled={loading} options={[{ value: "Student", label: t("studentList") }, { value: "Teacher", label: t("teacherList") }]} onChange={(role) => onChange({ role, department: "", academicYear: "" })} /><Select label={t("department")} value={value.department} disabled={!value.role || loading} options={departmentOptions.map((option) => ({ value: option.name, label: option.name }))} onChange={(department) => onChange({ department })} /><Select label={t("academicYear")} value={value.academicYear} disabled={!value.role || loading} options={academicYears.map((option) => ({ value: option.name, label: option.name }))} onChange={(academicYear) => onChange({ academicYear })} /></div><label className="relative block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={value.query} onChange={(event) => onChange({ query: event.target.value })} placeholder={t("searchRentals")} className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-slate-300" /></label></CardContent></Card>;
}

function Select({ label, value, options, disabled, onChange }: { label: string; value: string; options: SelectOption[]; disabled: boolean; onChange: (value: string) => void }) { return <label className="relative"><span className="sr-only">{label}</span><select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="h-9 min-w-32 rounded-md border border-slate-200 bg-white px-3 text-sm disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"><option value="">{label}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>; }
