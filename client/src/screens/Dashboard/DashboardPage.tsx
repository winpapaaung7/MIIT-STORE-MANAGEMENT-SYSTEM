/* eslint-disable @typescript-eslint/no-explicit-any */
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, ArrowRight, Boxes, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ClipboardCheck, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { type TranslationKey, useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
const InventoryPage = lazy(() => import("@/screens/Inventory/InventoryPage"));
import DepartmentHistory from "@/screens/Dashboard/DepartmentHistory";

const API = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";
const CURRENT_ACADEMIC_YEAR = "2026-2027";
const academicYearKey = (name: string) => name.replaceAll("–", "-");
const colors = { available: "#16a34a", inUse: "#f97316", damaged: "#dc2626" };
const number = (value: any) => typeof value === "number" && Number.isFinite(value) ? value : 0;
type T = (key: TranslationKey) => string;

export default function DashboardPage({ scope }: { scope?: "mine" }) {
  const { t } = useLanguage();
  const { accessToken, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isDepartmentDashboard = location.pathname.startsWith("/departments/");
  const urlDepartmentId = scope === "mine" ? "" : searchParams.get("departmentId") ?? "";
  const urlRoomId = scope === "mine" ? "" : searchParams.get("roomId") ?? "";
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const [filters, setFilters] = useState(() => ({ academicYearId: "", departmentId: urlDepartmentId, categoryId: "", roomId: urlRoomId, status: "", departmentItemsPage: 1 }));
  const [hover, setHover] = useState<string | null>(null);
  const request = useRef(0);

  const load = useCallback(async () => {
    if (!accessToken) return;
    controller.current?.abort();
    const currentController = new AbortController();
    controller.current = currentController;
    const timeout = window.setTimeout(() => currentController.abort("timeout"), 30_000);
    const query = new URLSearchParams({ departmentItemsPage: String(filters.departmentItemsPage), departmentItemsLimit: "8", recentItemsLimit: "5" });
    if (scope === "mine") query.set("scope", "mine");
    Object.entries(filters).forEach(([key, value]) => { if (value && key !== "departmentItemsPage" && !(key === "roomId" && value === "storage")) query.set(key, String(value)); });
    if (hover) query.set("activeDepartmentId", hover);
    const id = ++request.current;
    setLoading(true);
    try {
      const response = await fetch(`${API}/api/dashboard/overview?${query}`, { signal: currentController.signal, headers: { Authorization: `Bearer ${accessToken}` } });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.message ?? "Unable to load dashboard");
      if (id === request.current) { setData(payload); setLoadError(""); }
    } catch (error) {
      if (id === request.current && currentController.signal.reason === "timeout") setLoadError("The server took too long to respond. Please retry.");
      else if (!currentController.signal.aborted && id === request.current) setLoadError(error instanceof Error ? error.message : "Unable to load dashboard");
    } finally { window.clearTimeout(timeout); if (id === request.current) setLoading(false); }
  }, [accessToken, filters, hover, scope]);

  useEffect(() => { void load(); return () => controller.current?.abort(); }, [load]);
  useEffect(() => {
    const refreshAfterTransfer = () => void load();
    window.addEventListener("inventory-transfer-complete", refreshAfterTransfer);
    return () => window.removeEventListener("inventory-transfer-complete", refreshAfterTransfer);
  }, [load]);
  useEffect(() => {
    if (scope !== "mine") {
      setFilters((current) => current.departmentId === urlDepartmentId && current.roomId === urlRoomId
        ? current
        : { ...current, departmentId: urlDepartmentId, roomId: urlRoomId, departmentItemsPage: 1 });
    }
  }, [scope, urlDepartmentId, urlRoomId]);
  const change = (key: string, value: string) => setFilters((current) => ({ ...current, [key]: value, departmentItemsPage: 1 }));
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
  const filterOptions = (source: string) => {
    const options = data?.filterOptions?.[source] ?? [];
    return source === "academicYears"
      ? [...options].sort((a: any, b: any) => Number(academicYearKey(String(b.name)) === CURRENT_ACADEMIC_YEAR) - Number(academicYearKey(String(a.name)) === CURRENT_ACADEMIC_YEAR))
      : options;
  };
  const selectedDepartment = scope === "mine" ? null : filterOptions("departments").find((department: any) => String(department.id) === filters.departmentId);
  const allRooms = data?.filterOptions?.rooms ?? [];
  const selectedDashboardRoom = allRooms.find((room: any) => String(room.id) === filters.roomId);
  const storageDepartment = (data?.filterOptions?.departments ?? []).find((department: any) => String(department.name).trim().toLowerCase() === "storage");
  const isStorageSelected = Boolean(storageDepartment && String(storageDepartment.id) === filters.departmentId);
  // Storage is one logical inventory location. Its historical room numbers
  // stay in the database, but the dashboard exposes a single Storage option.
  const rooms = isStorageSelected
    ? [{ id: "storage", departmentId: storageDepartment.id, name: "Storage" }]
    : allRooms.filter((room: any) => !filters.departmentId || String(room.departmentId) === filters.departmentId);
  const selectDepartment = (value: string) => {
    const departmentRooms = allRooms.filter((room: any) => String(room.departmentId) === value);
    const isStorage = Boolean(storageDepartment && String(storageDepartment.id) === value);
    setHover(value || null);
    setFilters((current) => ({
      ...current,
      departmentId: value,
      // Keep the location in sync with the Accessories Details filter. A
      // department with one room (such as Faculty of Computing -> 101) has
      // an unambiguous location, so select it automatically.
      roomId: isStorage ? "storage" : departmentRooms.length === 1 ? String(departmentRooms[0].id) : "",
      departmentItemsPage: 1,
    }));
  };
  const selectRoom = (value: string) => {
    const room = rooms.find((candidate: any) => String(candidate.id) === value);
    setHover(room ? String(room.departmentId) : null);
    setFilters((current) => ({
      ...current,
      roomId: value,
      // A named room has one owning department, just as on Accessory Details.
      departmentId: room ? String(room.departmentId) : "",
      departmentItemsPage: 1,
    }));
  };
  const resetFilters = () => {
    setFilters({ academicYearId: "", departmentId: "", categoryId: "", roomId: "", status: "", departmentItemsPage: 1 });
    setHover(null);
  };
  const hasActiveFilters = Boolean(filters.academicYearId || filters.departmentId || filters.categoryId || filters.roomId || filters.status);
  const openSelectedDepartmentAccessories = () => {
    if (!selectedDepartment) return;
    const params = new URLSearchParams({ department: selectedDepartment.name });
    const selectedRoom = rooms.find((room: any) => String(room.id) === filters.roomId);
    if (selectedRoom?.name) params.set("room", selectedRoom.name);
    navigate(`/accessories?${params.toString()}`);
  };

  return <div className="dashboard-page space-y-6 pb-4">
    {loadError && <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><span>{loadError}</span><Button variant="outline" onClick={() => void load()}>Retry</Button></div>}
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2">
      {isDepartmentDashboard && <Button type="button" variant="ghost" size="icon" aria-label="Back to Departments" title="Back to Departments" onClick={() => navigate("/departments")}><ChevronLeft className="size-5" /></Button>}
      <h1 className="text-3xl font-bold text-slate-950">{scope === "mine" ? `My Department${user?.department ? ` — ${user.department.name}` : ""}` : isDepartmentDashboard ? `${selectedDepartment?.name ?? "Department"}${selectedDashboardRoom?.name ? selectedDashboardRoom.name === "Room number not assigned" ? " · Room number not assigned" : ` · Room ${selectedDashboardRoom.name}` : ""} Dashboard` : t("dashboard")}</h1>
    </div>{!isDepartmentDashboard && selectedDepartment && <Button type="button" variant="outline" onClick={openSelectedDepartmentAccessories}>View accessories <ArrowRight className="size-4" /></Button>}</header>
    {!isDepartmentDashboard && <section className="shrink-0 rounded-lg border border-border bg-card p-3 shadow-sm dark:shadow-none sm:p-4">
      <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-center">
        <Button type="button" variant={!hasActiveFilters ? "default" : "outline"} onClick={resetFilters} className={`h-10 w-full rounded-lg px-5 shadow-sm sm:w-auto sm:min-w-24 ${!hasActiveFilters ? "bg-slate-950 text-white hover:bg-slate-800" : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"}`}>{t("all")}</Button>
        <DashboardFilterDropdown value={filters.academicYearId} options={filterOptions("academicYears")} label={t("academicYear")} allLabel={t("all")} onChange={(value) => change("academicYearId", value)} />
        {scope !== "mine" && <DashboardFilterDropdown value={filters.departmentId} options={filterOptions("departments")} label={t("department")} allLabel={t("all")} onChange={selectDepartment} />}
        <RoomFilter value={filters.roomId} rooms={rooms} label={t("roomNumber")} allLabel={t("all")} noneLabel={t("none")} onChange={selectRoom} />
        <DashboardFilterDropdown value={filters.categoryId} options={filterOptions("categories")} label={t("category")} allLabel={t("all")} onChange={(value) => change("categoryId", value)} />
        <DashboardFilterDropdown value={filters.status} options={filterOptions("statuses")} label={t("status")} allLabel={t("all")} onChange={(value) => change("status", value)} />
      </div>
    </section>}

    <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
      {loading && !data ? Array.from({ length: 5 }, (_, index) => <Card key={index} className="h-44 animate-pulse" />) : <>
        {cards.map(([title, value, description, Icon, tone, surface, percent]) => <Card key={title} className="h-44 overflow-hidden border-slate-200/90 bg-white shadow-sm"><CardContent className="flex h-full flex-col px-5 pb-4 pt-3.5"><div className="flex items-start justify-between gap-3"><p className="-mt-0.5 truncate text-sm font-semibold tracking-tight text-slate-600">{title}</p><div className={`-mt-0.5 rounded-xl p-2.5 ${surface} ${tone}`}><Icon className="h-5 w-5" /></div></div><p className="mt-3 text-3xl font-bold leading-none">{value}</p><div className="mt-auto flex gap-2"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${surface} ${tone}`}>{percent}%</span><span className="truncate text-xs text-slate-500">{description}</span></div></CardContent></Card>)}
        <Health t={t} total={number(summary?.totalItems)} data={[{ name: t("available"), value: number(summary?.available), color: colors.available }, { name: t("inUse"), value: number(summary?.inUse), color: colors.inUse }, { name: t("damagedMaintenance"), value: number(summary?.damagedMaintenance), color: colors.damaged }]} />
      </>}
    </section>

    {!isDepartmentDashboard && <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,.95fr)]">
      <Card className="min-w-0 overflow-hidden border-slate-200 shadow-sm"><CardHeader><CardTitle className="text-base">{t("departmentOverview")}</CardTitle></CardHeader><CardContent className="p-0"><div className="h-64 overflow-x-auto"><div className="h-full min-w-[760px]" style={{ width: Math.max(620, departments.length * 82) }}><ResponsiveContainer width="100%" height="100%"><BarChart data={departments} margin={{ left: 8, right: 12, bottom: 24 }} onClick={(state: any) => chooseDepartment(state?.activePayload?.[0]?.payload?.departmentId)}><XAxis dataKey="departmentName" interval={0} height={54} tick={<DepartmentAxisTick departments={departments} onSelect={chooseDepartment} />} /><YAxis allowDecimals={false} /><Tooltip content={<DepartmentTooltip />} /><Bar dataKey="available" name={t("available")} stackId="units" barSize={14}>{departments.map((row: any) => <Cell key={row.departmentId} onClick={() => chooseDepartment(row.departmentId)} fill={colors.available} fillOpacity={!hover || String(row.departmentId) === hover ? 1 : 0.3} />)}</Bar><Bar dataKey="inUse" name={t("inUse")} stackId="units" barSize={14}>{departments.map((row: any) => <Cell key={row.departmentId} onClick={() => chooseDepartment(row.departmentId)} fill={colors.inUse} fillOpacity={!hover || String(row.departmentId) === hover ? 1 : 0.3} />)}</Bar><Bar dataKey="damagedMaintenance" name={t("damagedMaintenance")} stackId="units" barSize={14}>{departments.map((row: any) => <Cell key={row.departmentId} onClick={() => chooseDepartment(row.departmentId)} fill={colors.damaged} fillOpacity={!hover || String(row.departmentId) === hover ? 1 : 0.3} />)}</Bar></BarChart></ResponsiveContainer></div></div></CardContent></Card>
      <Items t={t} data={data?.departmentItems} page={filters.departmentItemsPage} setPage={(page: number) => setFilters((current) => ({ ...current, departmentItemsPage: page }))} />
    </section>}
    {isDepartmentDashboard && selectedDepartment && <Suspense fallback={<div role="status">Loading inventory...</div>}><InventoryPage embedded departmentName={selectedDepartment.name} roomName={selectedDashboardRoom?.name} /></Suspense>}
    {isDepartmentDashboard ? <DepartmentHistory events={data?.departmentHistory ?? []} /> : <RecentItems t={t} items={data?.recentItems ?? []} />}
  </div>;
}

function DashboardFilterDropdown({ value, options, label, allLabel, onChange }: { value: string; options: any[]; label: string; allLabel: string; onChange: (value: string) => void }) {
  const selectedOption = options.find((option) => String(option.id ?? option.name ?? option) === value);
  const selected = Boolean(value);
  return <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button type="button" variant="outline" aria-label={label} className={`h-10 w-full justify-between gap-3 rounded-lg border-slate-200 bg-white px-4 text-slate-900 shadow-sm hover:bg-slate-50 sm:w-auto sm:min-w-36 ${selected ? "border-slate-950 bg-slate-950 text-white hover:bg-slate-800 hover:text-white" : ""}`}>
        <span className="truncate text-left">{selectedOption?.name ?? selectedOption ?? label}</span>
        <ChevronDown className="ml-auto size-4 shrink-0 opacity-70" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="w-56">
      <DropdownMenuItem onClick={() => onChange("")}>{!value && <Check className="size-4" />}{allLabel}</DropdownMenuItem>
      {options.map((option) => {
        const optionValue = String(option.id ?? option.name ?? option);
        return <DropdownMenuItem key={optionValue} onClick={() => onChange(optionValue)}>{value === optionValue && <Check className="size-4" />}{option.name ?? option}</DropdownMenuItem>;
      })}
    </DropdownMenuContent>
  </DropdownMenu>;
}

function RoomFilter({ value, rooms, label, allLabel, noneLabel, onChange }: { value: string; rooms: any[]; label: string; allLabel: string; noneLabel: string; onChange: (value: string) => void }) {
  const selectedRoom = rooms.find((room) => String(room.id) === value);
  const selected = Boolean(value);
  return <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button type="button" variant="outline" aria-label={label} className={`h-10 w-full justify-between gap-3 rounded-lg border-slate-200 bg-white px-4 text-slate-900 shadow-sm hover:bg-slate-50 sm:w-auto sm:min-w-36 ${selected ? "border-slate-950 bg-slate-950 text-white hover:bg-slate-800 hover:text-white" : ""}`}>
        <span className="truncate text-left">{value === "none" ? noneLabel : selectedRoom?.name ?? label}</span>
        <ChevronDown className="ml-auto size-4 shrink-0 opacity-70" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="w-56">
      <DropdownMenuItem onClick={() => onChange("")}>{!value && <Check className="size-4" />}{allLabel}</DropdownMenuItem>
      <DropdownMenuItem onClick={() => onChange("none")}>{value === "none" && <Check className="size-4" />}{noneLabel}</DropdownMenuItem>
      {rooms.map((room) => <DropdownMenuItem key={room.id} onClick={() => onChange(String(room.id))}>{value === String(room.id) && <Check className="size-4" />}{room.name}</DropdownMenuItem>)}
    </DropdownMenuContent>
  </DropdownMenu>;
}

function Health({ data, total, t }: { data: any[]; total: number; t: T }) { return <Card className="flex h-44 min-w-0 flex-col overflow-hidden border-slate-200/90 bg-white shadow-sm"><CardHeader className="px-5 pb-0 pt-3.5"><CardTitle className="text-sm font-semibold tracking-tight text-slate-600">{t("inventoryHealth")}</CardTitle></CardHeader><CardContent className="flex h-[132px] items-center justify-center px-4 pb-3 pt-0">{total ? <div className="flex h-28 w-28 items-center justify-center rounded-full bg-slate-50 p-1.5 shadow-inner"><div className="h-[104px] w-[104px]"><ResponsiveContainer><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="90%" paddingAngle={2} stroke="none">{data.map((row) => <Cell key={row.name} fill={row.color} />)}</Pie><Tooltip formatter={(value: any, name: any) => [`${value} ${t("items")}`, name]} /></PieChart></ResponsiveContainer></div></div> : <div className="h-24 w-24 rounded-full border-[10px] border-slate-100" />}</CardContent></Card>; }
function Items({ data, page, setPage, t }: any) { const name = data?.selectedDepartment?.name; return <Card className={`min-w-0 overflow-hidden border-2 shadow-sm ${name ? "border-blue-400 ring-2 ring-blue-100" : "border-slate-200"}`}><CardHeader className="pb-3"><CardTitle className="text-base">{name ? `Department items - ${name}` : "Department items"}</CardTitle><p className={`text-xs font-medium ${name ? "text-blue-700" : "text-slate-500"}`}>{name ? t("selectedDepartment") : "Choose a department from the chart or filter to view its items."}</p></CardHeader><CardContent className="px-4 pb-4 pt-0"><div className="max-h-[240px] overflow-auto"><table className="w-full min-w-[520px] table-fixed text-xs"><thead className="sticky top-0 bg-white text-left text-slate-500"><tr>{["ID", t("item"), t("available"), t("inUse"), t("damaged"), t("total")].map((heading) => <th key={heading} className="border-b px-2 py-2">{heading}</th>)}</tr></thead><tbody>{(data?.items ?? []).map((item: any) => <tr key={item.itemId} className="border-b"><td className="px-2 py-2.5 font-mono text-slate-500">{item.itemCode}</td><td className="max-w-32 truncate px-2 py-2.5 font-medium">{item.itemName}</td><td className="px-2 text-green-700">{number(item.available)}</td><td className="px-2 text-amber-700">{number(item.inUse)}</td><td className="px-2 text-red-700">{number(item.damagedMaintenance)}</td><td className="px-2 font-semibold text-slate-700">{number(item.total)}</td></tr>)}</tbody></table></div>{!(data?.items?.length) && <p className="py-8 text-center text-sm text-slate-500">{name ? t("noItemRecords") : "No department selected."}</p>}{number(data?.pagination?.totalPages) > 1 && <div className="mt-3 flex items-center justify-end gap-2"><Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button><span className="text-xs text-slate-500">{t("page")} {data?.pagination?.page ?? 1} {t("of")} {data?.pagination?.totalPages ?? 0}</span><Button variant="outline" size="icon" disabled={page >= number(data?.pagination?.totalPages)} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button></div>}</CardContent></Card>; }
function DepartmentAxisTick({ x, y, payload, index, departments, onSelect }: any) { const full = String(payload?.value ?? ""); const label = full.length > 10 ? `${full.slice(0, 10)}...` : full; const departmentId = departments?.find((department: any) => department.departmentName === full)?.departmentId ?? departments?.[index]?.departmentId; return <text x={x} y={y} dy={16} textAnchor="middle" fill="#64748b" fontSize={11} className="cursor-pointer" onClick={() => onSelect(departmentId)}><title>{full}</title>{label}</text>; }
function DepartmentTooltip({ active, payload, label }: any) { if (!active || !payload?.length) return null; return <div className="max-w-48 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs shadow-md"><p className="mb-1 truncate font-semibold text-slate-800" title={String(label)}>{label}</p>{payload.filter((entry: any) => entry.value !== undefined).map((entry: any) => <p key={entry.name} className="flex justify-between gap-4 py-0.5 text-slate-600"><span>{entry.name}</span><strong className="text-slate-900">{number(entry.value)}</strong></p>)}</div>; }
function RecentItems({ items, t }: { items: any[]; t: T }) { return <Card className="overflow-hidden border-slate-200 shadow-sm"><CardHeader className="flex-row items-center justify-between"><CardTitle className="text-base">{t("recentlyAddedItems")}</CardTitle><a href="/inventory" className="text-sm font-semibold text-blue-700 hover:underline">{t("viewAll")}</a></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm"><thead className="border-y bg-slate-50 text-left text-xs text-slate-500"><tr>{[t("itemId"), t("itemName"), t("image"), t("quantity"), t("dateAdded")].map((heading) => <th key={heading} className="px-4 py-3 font-medium">{heading}</th>)}</tr></thead><tbody>{items.map((item) => <tr key={item.itemId} className="border-b last:border-0"><td className="px-4 py-3 font-mono text-xs text-slate-600">{item.itemCode}</td><td className="px-4 py-3 font-medium">{item.itemName}</td><td className="px-4 py-2"><img className="h-10 w-12 rounded-md border border-slate-100 object-cover" src={item.imageUrl ? API + item.imageUrl : "/favicon.svg"} alt="" loading="lazy" decoding="async" onError={(event) => { event.currentTarget.src = "/favicon.svg"; }} /></td><td className="px-4 py-3 font-medium">{number(item.quantity)}</td><td className="px-4 py-3 text-slate-600">{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}</td></tr>)}</tbody></table></div>{!items.length && <p className="py-8 text-center text-sm text-slate-500">{t("noRecentItems")}</p>}</CardContent></Card>; }
