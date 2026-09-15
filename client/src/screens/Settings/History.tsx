import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRightLeft,
  CalendarDays,
  Download,
  Eye,
  History as HistoryIcon,
  PencilLine,
  Plus,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";

import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "@/context/LanguageContext";
import { API_BASE_URL } from "@/lib/api";

type ActivityAction = "created" | "updated" | "deleted" | "transferred";

type Activity = {
  activity_log_id: number;
  action: ActivityAction;
  module: string;
  target_type: string;
  target_id: string | null;
  target_name: string;
  actor_name: string;
  details: Record<string, unknown> | null;
  created_at: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const modules = [
  { value: "Dashboard", label: "Dashboard" },
  { value: "Inventory", label: "Inventory" },
  { value: "Accessories", label: "Accessories" },
  { value: "Laptop Rental", label: "Laptop Rental" },
  { value: "Department", label: "Departments" },
  { value: "Settings", label: "Settings" },
  { value: "Users", label: "Users" },
];

const rentalStatuses = ["approved", "pending", "returned", "rejected"] as const;

function dateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function csvCell(value: unknown) {
  const text = String(value ?? "").replace(/"/g, '""');
  return `"${text}"`;
}

function activityQrCodes(module: string, details: Record<string, unknown> | null) {
  const generatedCodes = details?.qr_codes;

  if (Array.isArray(generatedCodes)) {
    return generatedCodes.filter((code): code is string => typeof code === "string" && code.trim().length > 0);
  }

  // Transfer activities record the physical item codes as one comma-separated
  // value. They are the same values stored in each item's QR code.
  if (module === "Transfer" && typeof details?.item_detail_codes === "string") {
    return details.item_detail_codes.split(",").map((code) => code.trim()).filter(Boolean);
  }

  return [];
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]!);
}

function detailText(details: Record<string, unknown> | null) {
  if (!details || Object.keys(details).length === 0) return "";

  return Object.entries(details)
    .map(([field, value]) => {
      if (value && typeof value === "object" && "from" in value && "to" in value) {
        const change = value as { from?: unknown; to?: unknown };
        return `${field}: ${change.from ?? "—"} → ${change.to ?? "—"}`;
      }
      return `${field}: ${typeof value === "string" ? value : JSON.stringify(value)}`;
    })
    .join(" · ");
}

export default function History() {
  const { accessToken } = useAuth();
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [module, setModule] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestId = useRef(0);

  const loadActivities = useCallback(async () => {
    if (!accessToken) return;

    const currentRequest = ++requestId.current;
    setLoading(true);
    const query = new URLSearchParams();
    if (search.trim()) query.set("search", search.trim());
    if (action) query.set(module === "Laptop Rental" ? "rentalStatus" : "action", action);
    if (module) query.set("module", module);
    if (from) query.set("from", from);
    if (to) query.set("to", to);
    query.set("page", String(page));
    query.set("limit", "20");

    try {
      const response = await fetch(`${API_BASE_URL}/api/activity-log?${query}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: "include",
      });
      const payload = await response.json() as { ok?: boolean; message?: string; activities?: Activity[]; pagination?: Pagination };
      if (!response.ok || !payload.ok) throw new Error(payload.message ?? "Unable to load activity history.");
      if (currentRequest === requestId.current) {
        setActivities(payload.activities ?? []);
        setPagination(payload.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 1 });
        setError("");
      }
    } catch (requestError) {
      if (currentRequest === requestId.current) {
        setError(requestError instanceof Error ? requestError.message : "Unable to load activity history.");
        setActivities([]);
      }
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [accessToken, action, from, module, page, search, to]);

  useEffect(() => { void loadActivities(); }, [loadActivities]);
  useEffect(() => { setPage(1); }, [action, from, module, search, to]);

  const hasFilters = Boolean(search || action || module || from || to);
  const actionLabel = (value: ActivityAction) => ({
    created: t("added"),
    updated: t("edited"),
    deleted: t("deleted"),
    transferred: t("transfer"),
  })[value];
  const rentalStatusLabel = (value: typeof rentalStatuses[number]) => ({
    approved: "Approved",
    pending: "Pending",
    returned: "Returned",
    rejected: "Rejected",
  })[value];

  const exportCsv = () => {
    const rows = [
      ["Action", "Module", "Record", "Record ID", "Performed by", "Date", "Details"],
      ...activities.map((activity) => [
        actionLabel(activity.action),
        activity.module,
        activity.target_name,
        activity.target_id ?? "",
        activity.actor_name,
        dateTime(activity.created_at),
        detailText(activity.details),
      ]),
    ];
    const blob = new Blob([rows.map((row) => row.map(csvCell).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "miit-store-activity-history.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearch("");
    setAction("");
    setModule("");
    setFrom("");
    setTo("");
  };

  const resultContent = useMemo(() => {
    if (loading) return <p className="py-14 text-center text-sm text-slate-500">{t("loadingHistory")}</p>;
    if (error) return <p className="py-14 text-center text-sm text-rose-600">{error}</p>;
    if (activities.length === 0) {
      return (
        <div className="flex min-h-56 flex-col items-center justify-center px-4 text-center">
          <HistoryIcon className="h-8 w-8 text-[#91a5c4]" />
          <p className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-200">{t("noActivity")}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t("activityWillAppear")}</p>
        </div>
      );
    }
    return (
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {activities.map((activity) => <ActivityRow key={activity.activity_log_id} activity={activity} label={actionLabel(activity.action)} detail={detailText(activity.details)} onView={() => setSelectedActivity(activity)} />)}
      </div>
    );
  }, [activities, error, loading, t]);

  return (
    <section className="mx-auto w-full max-w-5xl space-y-4 pb-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">{t("history")}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t("historyDescription")}</p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={activities.length === 0} className="h-9 w-fit rounded-lg px-3.5 text-sm">
          {t("exportCsv")} <Download className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/75 p-3 dark:border-slate-700 dark:bg-slate-900/50">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(200px,1fr)_130px_140px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("searchHistory")} className="h-10 rounded-xl border-slate-200 bg-white pl-9 text-sm dark:border-slate-700 dark:bg-slate-900" />
          </div>
          <FilterSelect value={action} onChange={setAction} ariaLabel={module === "Laptop Rental" ? "Rental status" : t("allActions")}>
            {module === "Laptop Rental" ? <>
              <option value="">Status</option>
              {rentalStatuses.map((status) => <option key={status} value={status}>{rentalStatusLabel(status)}</option>)}
            </> : <>
              <option value="">{t("allActions")}</option>
              <option value="created">{t("added")}</option>
              <option value="updated">{t("edited")}</option>
              <option value="deleted">{t("deleted")}</option>
              <option value="transferred">{t("transfer")}</option>
            </>}
          </FilterSelect>
          <FilterSelect value={module} onChange={(value) => { setModule(value); setAction(""); }} ariaLabel={t("allModules")}>
            <option value="">{t("allModules")}</option>
            {modules.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </FilterSelect>
          <Button variant="ghost" onClick={clearFilters} disabled={!hasFilters} className="h-10 rounded-xl px-3 text-slate-500">
            × {t("clear")}
          </Button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <DateFilter label={t("from")} value={from} onChange={setFrom} />
          <DateFilter label={t("to")} value={to} onChange={setTo} />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)] dark:border-slate-700 dark:bg-slate-900">
        {resultContent}
        {!loading && !error && activities.length > 0 ? (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 dark:border-slate-800">
            <p className="text-xs text-slate-500">Showing {activities.length} of {pagination.total} activities</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((value) => value - 1)} disabled={pagination.page <= 1}>Previous</Button>
              <span className="text-xs text-slate-500">{pagination.page} / {pagination.totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((value) => value + 1)} disabled={pagination.page >= pagination.totalPages}>Next</Button>
            </div>
          </div>
        ) : null}
      </div>
      <ActivityDetailsDialog activity={selectedActivity} onOpenChange={(open) => { if (!open) setSelectedActivity(null); }} />
    </section>
  );
}

function FilterSelect({ children, value, onChange, ariaLabel }: { children: React.ReactNode; value: string; onChange: (value: string) => void; ariaLabel: string }) {
  return <select aria-label={ariaLabel} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">{children}</select>;
}

function DateFilter({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
    <span className="text-xs font-medium">{label}</span>
    <input type="date" value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 bg-transparent text-sm text-slate-700 outline-none dark:text-slate-200" />
    <CalendarDays className="h-4 w-4" />
  </label>;
}

function ActivityRow({ activity, label, detail, onView }: { activity: Activity; label: string; detail: string; onView: () => void }) {
  const styles = {
    created: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
    updated: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
    deleted: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
    transferred: "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
  }[activity.action];
  const Icon = activity.action === "created" ? Plus : activity.action === "updated" ? PencilLine : activity.action === "transferred" ? ArrowRightLeft : Trash2;
  const critical = activity.action === "deleted" || (activity.module === "Profile" && /role|password|permission|status/i.test(Object.keys(activity.details ?? {}).join(" ")));

  return (
    <article className="flex gap-3 px-4 py-3.5 sm:px-5">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${styles}`}><Icon className="h-4 w-4" /></div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="font-medium text-slate-900 dark:text-slate-100">{activity.target_name}</p>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${styles}`}>{label}</span>
          <span className="text-xs text-slate-500">{activity.module}</span>
          {critical ? <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">Critical</span> : null}
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400"><UserRound className="mr-1 inline h-3.5 w-3.5" />{activity.actor_name} · {dateTime(activity.created_at)}</p>
        {detail ? <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{detail}</p> : null}
      </div>
      <Button variant="ghost" size="icon-sm" onClick={onView} aria-label="View activity details" className="shrink-0 text-slate-500"><Eye className="h-4 w-4" /></Button>
    </article>
  );
}

function ActivityDetailsDialog({ activity, onOpenChange }: { activity: Activity | null; onOpenChange: (open: boolean) => void }) {
  if (!activity) return null;

  const qrCodes = activityQrCodes(activity.module, activity.details);
  const fields = Object.entries(activity.details ?? {}).filter(([field]) => field !== "qr_codes" && !(activity.module === "Transfer" && field === "item_detail_codes"));
  return (
    <Dialog open={Boolean(activity)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto rounded-2xl p-5">
        <DialogHeader>
          <DialogTitle>Activity details</DialogTitle>
          <DialogDescription>{activity.module} · {dateTime(activity.created_at)}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 text-sm">
          <Detail label="Record" value={activity.target_name} />
          <Detail label="Performed by" value={activity.actor_name} />
          <Detail label="Action" value={activity.action} />
          {fields.length ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
              {fields.map(([field, value]) => <ChangeDetail key={field} field={field} value={value} />)}
            </div>
          ) : <p className="text-sm text-slate-500">No additional details recorded.</p>}
          {qrCodes.length > 0 ? <ActivityQrCodes codes={qrCodes} activityId={activity.activity_log_id} title={activity.module === "Transfer" ? "Transferred item QR codes" : "QR codes"} /> : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ActivityQrCodes({ codes, activityId, title }: { codes: string[]; activityId: number; title: string }) {
  const qrCodeRefs = useRef(new Map<string, SVGSVGElement>());

  const downloadQrSheet = () => {
    const cards = codes.map((code) => {
      const svg = qrCodeRefs.current.get(code);
      return `<article><div class="qr">${svg?.outerHTML ?? ""}</div><p>${escapeHtml(code)}</p></article>`;
    }).join("");
    const documentHtml = `<!doctype html><html><head><meta charset="utf-8"><title>MIIT Store QR codes</title><style>body{font-family:Arial,sans-serif;color:#0f172a;margin:32px}h1{font-size:20px;margin:0 0 6px}small{color:#475569}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:24px}article{break-inside:avoid;border:1px solid #cbd5e1;border-radius:12px;padding:14px;text-align:center}.qr svg{width:150px;height:150px}p{font-family:monospace;font-weight:700;font-size:12px;word-break:break-all}@media print{body{margin:12mm}.grid{grid-template-columns:repeat(3,1fr);gap:10mm}}</style></head><body><h1>MIIT Store QR codes</h1><small>${codes.length} item code${codes.length === 1 ? "" : "s"}</small><div class="grid">${cards}</div></body></html>`;
    const url = URL.createObjectURL(new Blob([documentHtml], { type: "text/html;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `miit-store-qr-codes-${activityId}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><h3 className="font-medium text-slate-900 dark:text-slate-100">{title}</h3><p className="text-xs text-slate-500 dark:text-slate-400">{codes.length} item code{codes.length === 1 ? "" : "s"}</p></div>
        <Button size="sm" variant="outline" onClick={downloadQrSheet}><Download className="h-4 w-4" />Download QR sheet</Button>
      </div>
      <div className="grid max-h-80 grid-cols-2 gap-3 overflow-y-auto p-1 sm:grid-cols-3">
        {codes.map((code) => <div key={code} className="flex flex-col items-center rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-950"><QRCodeSVG ref={(node) => { if (node) qrCodeRefs.current.set(code, node); }} value={code} size={104} level="M" includeMargin /><span className="mt-1 break-all text-center font-mono text-[10px] font-semibold text-slate-700 dark:text-slate-200">{code}</span></div>)}
      </div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 px-3 py-2.5 text-slate-700 dark:bg-slate-800 dark:text-slate-200"><span className="text-xs text-slate-500 dark:text-slate-400">{label}</span><span className="text-right font-medium">{value}</span></div>;
}

function ChangeDetail({ field, value }: { field: string; value: unknown }) {
  const isChange = value !== null && typeof value === "object" && "from" in value && "to" in value;
  const change = isChange ? value as { from?: unknown; to?: unknown } : null;
  return <div className="border-b border-slate-100 px-3 py-2.5 last:border-0 dark:border-slate-800"><p className="text-xs font-medium capitalize text-slate-500">{field.replaceAll("_", " ")}</p>{change ? <div className="mt-1 grid grid-cols-2 gap-3 text-sm"><span className="break-words text-slate-500">{String(change.from ?? "Not set")}</span><span className="break-words font-medium text-slate-900 dark:text-slate-100">{String(change.to ?? "Not set")}</span></div> : <p className="mt-1 break-words text-sm font-medium text-slate-800 dark:text-slate-200">{typeof value === "string" ? value : JSON.stringify(value)}</p>}</div>;
}
