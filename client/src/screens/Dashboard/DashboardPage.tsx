/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, Boxes, CheckCircle2, ChevronLeft, ChevronRight, ClipboardCheck, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type TranslationKey, useLanguage } from "@/context/LanguageContext";

const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";
const colors = { available: "#16a34a", inUse: "#f97316", damaged: "#dc2626" };
const number = (value: any) => typeof value === "number" && Number.isFinite(value) ? value : 0;
type T = (key: TranslationKey) => string;

export default function DashboardPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ academicYearId: "", departmentId: "", categoryId: "", status: "", departmentItemsPage: 1 });
  const [hover, setHover] = useState<string | null>(null);
  const request = useRef(0);

  const load = useCallback(async () => {
    const query = new URLSearchParams({ departmentItemsPage: String(filters.departmentItemsPage), departmentItemsLimit: "8", recentItemsLimit: "5" });
    Object.entries(filters).forEach(([key, value]) => { if (value && key !== "departmentItemsPage") query.set(key, String(value)); });
    if (hover) query.set("activeDepartmentId", hover);
    const id = ++request.current;
    setLoading(true);
    try {
      const response = await fetch(`${API}/api/dashboard/overview?${query}`);
      const payload = await response.json();
      if (id === request.current) setData(payload);
    } finally { if (id === request.current) setLoading(false); }
  }, [filters, hover]);

  useEffect(() => { void load(); }, [load]);
  const change = (key: string, value: string) => setFilters((current) => ({ ...current, [key]: value }));
  const chooseDepartment = (id: any) => {
    const value = String(id ?? "");
    if (value && value !== hover) { setHover(value); setFilters((current) => ({ ...current, departmentItemsPage: 1 })); }
  };

  const summary = data?.summary;
  const departments = (data?.departmentOverview ?? []).map((row: any) => ({ ...row, available: number(row.available), inUse: number(row.inUse), damagedMaintenance: number(row.damagedMaintenance) })).sort((a: any, b: any) => a.departmentName === "Store" ? -1 : b.departmentName === "Store" ? 1 : String(a.departmentName).localeCompare(String(b.departmentName)));
  const cards = [
    [t("totalItems"), number(summary?.totalItems), t("allTrackedUnits"), Boxes, "text-blue-600", "bg-blue-50", 100],
    [t("available"), number(summary?.available), t("readyForUse"), CheckCircle2, "text-green-600", "bg-green-50", number(summary?.availablePercentage)],
    [t("inUse"), number(summary?.inUse), t("issuedUnits"), ClipboardCheck, "text-orange-600", "bg-orange-50", number(summary?.inUsePercentage)],
    [t("damagedMaintenance"), number(summary?.damagedMaintenance), t("needsAttention"), AlertTriangle, "text-red-600", "bg-red-50", number(summary?.damagedMaintenancePercentage)],
  ] as [string, number, string, LucideIcon, string, string, number][];
  const filterLabels: [TranslationKey, string, string][] = [["academicYear", "academicYearId", "academicYears"], ["department", "departmentId", "departments"], ["category", "categoryId", "categories"], ["status", "status", "statuses"]];

  return <div className="dashboard-page space-y-6 pb-4">
    <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <h1 className="text-3xl font-bold text-slate-950">{t("dashboard")}</h1>
      <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 xl:w-auto xl:grid-cols-4">
        {filterLabels.map(([labelKey, key, source]) => <select key={key} aria-label={t(labelKey)} value={(filters as any)[key]} onChange={(event) => change(key, event.target.value)} className="h-10 min-w-[160px] rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="">{t("all")} {t(labelKey)}</option>{(data?.filterOptions?.[source] ?? []).map((option: any) => <option key={option.id ?? option.name ?? option} value={String(option.id ?? option.name ?? option)}>{option.name ?? option}</option>)}</select>)}
      </div>
    </header>

    <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
      {loading && !data ? Array.from({ length: 5 }, (_, index) => <Card key={index} className="h-44 animate-pulse" />) : <>
        {cards.map(([title, value, description, Icon, tone, surface, percent]) => <Card key={title} className="h-44 overflow-hidden border-slate-200/90 bg-white shadow-sm"><CardContent className="flex h-full flex-col px-5 pb-4 pt-3.5"><div className="flex items-start justify-between gap-3"><p className="-mt-0.5 truncate text-sm font-semibold tracking-tight text-slate-600">{title}</p><div className={`-mt-0.5 rounded-xl p-2.5 ${surface} ${tone}`}><Icon className="h-5 w-5" /></div></div><p className="mt-3 text-3xl font-bold leading-none">{value}</p><div className="mt-auto flex gap-2"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${surface} ${tone}`}>{percent}%</span><span className="truncate text-xs text-slate-500">{description}</span></div></CardContent></Card>)}
        <Health t={t} total={number(summary?.totalItems)} data={[{ name: t("available"), value: number(summary?.available), color: colors.available }, { name: t("inUse"), value: number(summary?.inUse), color: colors.inUse }, { name: t("damagedMaintenance"), value: number(summary?.damagedMaintenance), color: colors.damaged }]} />
      </>}
    </section>

    <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,.95fr)]">
      <Card className="min-w-0 overflow-hidden border-slate-200 shadow-sm"><CardHeader><CardTitle className="text-base">{t("departmentOverview")}</CardTitle></CardHeader><CardContent className="p-0"><div className="h-64 overflow-x-auto"><div className="h-full min-w-[760px]" style={{ width: Math.max(620, departments.length * 82) }}><ResponsiveContainer width="100%" height="100%"><BarChart data={departments} margin={{ left: 8, right: 12, bottom: 24 }} onClick={(state: any) => chooseDepartment(state?.activePayload?.[0]?.payload?.departmentId)}><XAxis dataKey="departmentName" interval={0} height={54} tick={<DepartmentAxisTick departments={departments} onSelect={chooseDepartment} />} /><YAxis allowDecimals={false} /><Tooltip content={<DepartmentTooltip />} /><Bar dataKey="available" name={t("available")} stackId="units" barSize={14}>{departments.map((row: any) => <Cell key={row.departmentId} onClick={() => chooseDepartment(row.departmentId)} fill={colors.available} fillOpacity={!hover || String(row.departmentId) === hover ? 1 : 0.3} />)}</Bar><Bar dataKey="inUse" name={t("inUse")} stackId="units" barSize={14}>{departments.map((row: any) => <Cell key={row.departmentId} onClick={() => chooseDepartment(row.departmentId)} fill={colors.inUse} fillOpacity={!hover || String(row.departmentId) === hover ? 1 : 0.3} />)}</Bar><Bar dataKey="damagedMaintenance" name={t("damagedMaintenance")} stackId="units" barSize={14}>{departments.map((row: any) => <Cell key={row.departmentId} onClick={() => chooseDepartment(row.departmentId)} fill={colors.damaged} fillOpacity={!hover || String(row.departmentId) === hover ? 1 : 0.3} />)}</Bar></BarChart></ResponsiveContainer></div></div></CardContent></Card>
      <Items t={t} data={data?.departmentItems} page={filters.departmentItemsPage} setPage={(page: number) => setFilters((current) => ({ ...current, departmentItemsPage: page }))} />
    </section>
    <RecentItems t={t} items={data?.recentItems ?? []} />
  </div>;
}

function Health({ data, total, t }: { data: any[]; total: number; t: T }) { return <Card className="flex h-44 min-w-0 flex-col overflow-hidden border-slate-200/90 bg-white shadow-sm"><CardHeader className="px-5 pb-0 pt-3.5"><CardTitle className="text-sm font-semibold tracking-tight text-slate-600">{t("inventoryHealth")}</CardTitle></CardHeader><CardContent className="flex h-[132px] items-center justify-center px-4 pb-3 pt-0">{total ? <div className="flex h-28 w-28 items-center justify-center rounded-full bg-slate-50 p-1.5 shadow-inner"><div className="h-[104px] w-[104px]"><ResponsiveContainer><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="90%" paddingAngle={2} stroke="none">{data.map((row) => <Cell key={row.name} fill={row.color} />)}</Pie><Tooltip formatter={(value: any, name: any) => [`${value} ${t("items")}`, name]} /></PieChart></ResponsiveContainer></div></div> : <div className="h-24 w-24 rounded-full border-[10px] border-slate-100" />}</CardContent></Card>; }
function Items({ data, page, setPage, t }: any) { const name = data?.selectedDepartment?.name; return <Card className={`min-w-0 overflow-hidden border-2 shadow-sm ${name ? "border-blue-400 ring-2 ring-blue-100" : "border-slate-200"}`}><CardHeader className="pb-3"><CardTitle className="text-base">{name ? `${t("storeItems")} - ${name}` : t("storeItems")}</CardTitle><p className={`text-xs font-medium ${name ? "text-blue-700" : "text-slate-500"}`}>{name ? t("selectedDepartment") : t("clickDepartment")}</p></CardHeader><CardContent className="px-4 pb-4 pt-0"><div className="max-h-[240px] overflow-auto"><table className="w-full min-w-[520px] table-fixed text-xs"><thead className="sticky top-0 bg-white text-left text-slate-500"><tr>{["ID", t("item"), t("available"), t("inUse"), t("damaged"), t("total")].map((heading) => <th key={heading} className="border-b px-2 py-2">{heading}</th>)}</tr></thead><tbody>{(data?.items ?? []).map((item: any) => <tr key={item.itemId} className="border-b"><td className="px-2 py-2.5 font-mono text-slate-500">{item.itemCode}</td><td className="max-w-32 truncate px-2 py-2.5 font-medium">{item.itemName}</td><td className="px-2 text-green-700">{number(item.available)}</td><td className="px-2 text-amber-700">{number(item.inUse)}</td><td className="px-2 text-red-700">{number(item.damagedMaintenance)}</td><td className="px-2 font-semibold text-slate-700">{number(item.total)}</td></tr>)}</tbody></table></div>{!(data?.items?.length) && <p className="py-8 text-center text-sm text-slate-500">{t("noItemRecords")}</p>}{number(data?.pagination?.totalPages) > 1 && <div className="mt-3 flex items-center justify-end gap-2"><Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button><span className="text-xs text-slate-500">{t("page")} {data?.pagination?.page ?? 1} {t("of")} {data?.pagination?.totalPages ?? 0}</span><Button variant="outline" size="icon" disabled={page >= number(data?.pagination?.totalPages)} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button></div>}</CardContent></Card>; }
function DepartmentAxisTick({ x, y, payload, index, departments, onSelect }: any) { const full = String(payload?.value ?? ""); const label = full.length > 10 ? `${full.slice(0, 10)}...` : full; const departmentId = departments?.find((department: any) => department.departmentName === full)?.departmentId ?? departments?.[index]?.departmentId; return <text x={x} y={y} dy={16} textAnchor="middle" fill="#64748b" fontSize={11} className="cursor-pointer" onClick={() => onSelect(departmentId)}><title>{full}</title>{label}</text>; }
function DepartmentTooltip({ active, payload, label }: any) { if (!active || !payload?.length) return null; return <div className="max-w-48 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-md"><p className="mb-1 truncate font-semibold text-slate-800" title={String(label)}>{label}</p>{payload.filter((entry: any) => entry.value !== undefined).map((entry: any) => <p key={entry.name} className="flex justify-between gap-4 py-0.5 text-slate-600"><span>{entry.name}</span><strong className="text-slate-900">{number(entry.value)}</strong></p>)}</div>; }
function RecentItems({ items, t }: { items: any[]; t: T }) { return <Card className="overflow-hidden border-slate-200 shadow-sm"><CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base">{t("recentlyAddedItems")}</CardTitle><a href="/inventory" className="text-sm font-semibold text-blue-700 hover:underline">{t("viewAll")}</a></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm"><thead className="border-y bg-slate-50 text-left text-xs text-slate-500"><tr>{[t("itemId"), t("itemName"), t("image"), t("quantity"), t("dateAdded")].map((heading) => <th key={heading} className="px-4 py-3 font-medium">{heading}</th>)}</tr></thead><tbody>{items.map((item) => <tr key={item.itemId} className="border-b last:border-0"><td className="px-4 py-3 font-mono text-xs text-slate-600">{item.itemCode}</td><td className="px-4 py-3 font-medium">{item.itemName}</td><td className="px-4 py-2"><img className="h-10 w-12 rounded-md border border-slate-100 object-cover" src={item.imageUrl ? API + item.imageUrl : "/favicon.svg"} alt="" onError={(event) => { event.currentTarget.src = "/favicon.svg"; }} /></td><td className="px-4 py-3 font-medium">{number(item.quantity)}</td><td className="px-4 py-3 text-slate-600">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}</td></tr>)}</tbody></table></div>{!items.length && <p className="py-8 text-center text-sm text-slate-500">{t("noRecentItems")}</p>}</CardContent></Card>; }
