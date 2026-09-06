import { useEffect, useState } from "react";
import { Download, History as HistoryIcon, PencilLine, Plus, Search, Trash2, UserRound, X } from "lucide-react";

import { Button } from "@/components/ui/button";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

type AuditAction = "created" | "updated" | "deleted";
type Activity = {
  activity_log_id: number;
  action: AuditAction;
  module: string;
  target_type: string;
  target_id: string | null;
  target_name: string;
  actor_name: string;
  details: Record<string, unknown> | null;
  created_at: string;
};
type Filters = { search: string; action: string; module: string; from: string; to: string };
const emptyFilters: Filters = { search: "", action: "", module: "", from: "", to: "" };
const auditModules = ["Inventory", "Department", "Academic year", "Profile"];

function actionLabel(action: AuditAction) { return action === "created" ? "Added" : action === "updated" ? "Edited" : "Deleted"; }
function actionIcon(action: AuditAction) { const props = { className: "h-4 w-4" }; return action === "created" ? <Plus {...props} /> : action === "updated" ? <PencilLine {...props} /> : <Trash2 {...props} />; }
function actionStyles(action: AuditAction) { return action === "created" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : action === "updated" ? "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300" : "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"; }
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date); }
function displayValue(value: unknown) { return value === null || value === undefined || value === "" ? "Not set" : String(value); }
function detailSummary(details: Activity["details"]) {
  if (!details) return "No additional details recorded.";
  return Object.entries(details).map(([field, value]) => {
    const label = field.replaceAll("_", " ");
    if (value && typeof value === "object" && "from" in value && "to" in value) {
      const change = value as { from: unknown; to: unknown };
      return `${label}: ${displayValue(change.from)} → ${displayValue(change.to)}`;
    }
    return `${label}: ${displayValue(value)}`;
  }).join(" · ");
}
function csvCell(value: unknown) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }

export default function History() {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true); setError("");
      try {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
        const response = await fetch(`${API_BASE_URL}/api/activity-log?${params}`, { signal: controller.signal });
        const payload = await response.json();
        if (!response.ok || !payload.ok) throw new Error(payload.message ?? "Unable to load history.");
        setActivities(payload.activities ?? []);
      } catch (requestError) {
        if ((requestError as Error).name !== "AbortError") setError(requestError instanceof Error ? requestError.message : "Unable to load history.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }, 250);
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [filters]);

  const setFilter = (name: keyof Filters, value: string) => setFilters((current) => ({ ...current, [name]: value }));
  const exportHistory = () => {
    const header = ["Date", "Action", "Module", "Record", "Record ID", "Performed by", "Details"];
    const rows = activities.map((activity) => [formatDate(activity.created_at), actionLabel(activity.action), activity.module, activity.target_name, activity.target_id ?? "", activity.actor_name, detailSummary(activity.details)]);
    const content = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `activity-history-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url);
  };

  return <section>
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><h2 className="text-xl font-semibold text-slate-950 dark:text-slate-50">History</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Track who added, edited, or deleted each system record.</p></div>
      <Button variant="outline" className="h-9 rounded-xl px-4" onClick={exportHistory} disabled={!activities.length}>Export CSV <Download className="h-4 w-4" /></Button>
    </div>

    <div className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60 sm:grid-cols-2 lg:grid-cols-5">
      <label className="relative lg:col-span-2"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input aria-label="Search history" value={filters.search} onChange={(event) => setFilter("search", event.target.value)} placeholder="Search record or user" className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none focus:border-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" /></label>
      <select aria-label="Filter by action" value={filters.action} onChange={(event) => setFilter("action", event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"><option value="">All actions</option><option value="created">Added</option><option value="updated">Edited</option><option value="deleted">Deleted</option></select>
      <select aria-label="Filter by module" value={filters.module} onChange={(event) => setFilter("module", event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"><option value="">All modules</option>{auditModules.map((module) => <option key={module} value={module}>{module}</option>)}</select>
      <Button variant="ghost" className="h-10 justify-center" onClick={() => setFilters(emptyFilters)} disabled={!Object.values(filters).some(Boolean)}><X className="h-4 w-4" /> Clear</Button>
      <label className="text-xs font-medium text-slate-500 dark:text-slate-300">From<input aria-label="From date" type="date" value={filters.from} onChange={(event) => setFilter("from", event.target.value)} className="mt-1 block h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" /></label>
      <label className="text-xs font-medium text-slate-500 dark:text-slate-300">To<input aria-label="To date" type="date" value={filters.to} onChange={(event) => setFilter("to", event.target.value)} className="mt-1 block h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-sky-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100" /></label>
    </div>

    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      {loading ? <p className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-300">Loading activity history…</p> : error ? <p className="px-5 py-10 text-center text-sm text-rose-600 dark:text-rose-300">{error}</p> : !activities.length ? <div className="px-5 py-12 text-center"><HistoryIcon className="mx-auto h-8 w-8 text-slate-400" /><p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">No matching activity yet.</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">New additions, edits, and deletions will appear here.</p></div> : activities.map((activity) => <article key={activity.activity_log_id} className="flex gap-3 border-b border-slate-100 px-4 py-4 last:border-0 dark:border-slate-800"><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${actionStyles(activity.action)}`}>{actionIcon(activity.action)}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-slate-950 dark:text-slate-50">{actionLabel(activity.action)} {activity.target_type.toLowerCase()}: {activity.target_name}</p><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${actionStyles(activity.action)}`}>{actionLabel(activity.action)}</span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{activity.module}</span></div><p className="mt-1 text-xs text-slate-500 dark:text-slate-300">{detailSummary(activity.details)}</p><p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"><UserRound className="h-3.5 w-3.5" /> {activity.actor_name} <span aria-hidden="true">•</span> {formatDate(activity.created_at)}</p></div></article>)}
    </div>
  </section>;
}
