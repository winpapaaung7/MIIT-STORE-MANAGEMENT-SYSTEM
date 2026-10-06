import { useEffect, useState } from "react";
import { CircleAlert, LoaderCircle } from "lucide-react";
import { useParams } from "react-router-dom";

import miitLogo from "@/assets/MIIT_LOGO.jpg";
import { API_BASE_URL } from "@/lib/api";

type Accessory = {
  id: string;
  item_name: string;
  category_name: string;
  status: string;
  department: string;
  room: string;
  academic_year: string;
  registered_date: string;
  remark: string;
};

type LookupResponse = {
  ok?: boolean;
  message?: string;
  accessory?: Accessory;
};

function statusClass(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("available")) return "bg-emerald-100 text-emerald-800";
  if (normalized.includes("repair") || normalized.includes("maintenance")) return "bg-amber-100 text-amber-800";
  if (normalized.includes("lost") || normalized.includes("damaged")) return "bg-rose-100 text-rose-800";

  return "bg-slate-100 text-slate-700";
}

export default function PublicAccessoryScanPage() {
  const { code } = useParams();
  const [accessory, setAccessory] = useState<Accessory | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) return;

    const controller = new AbortController();

    const loadAccessory = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/accessories/by-code/${encodeURIComponent(code)}`,
          { signal: controller.signal },
        );
        const data = (await response.json()) as LookupResponse;

        if (!response.ok || !data.ok || !data.accessory) {
          throw new Error(data.message ?? "This QR code does not match an accessory.");
        }

        setAccessory(data.accessory);
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setAccessory(null);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to connect to the store server.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void loadAccessory();

    return () => controller.abort();
  }, [code]);

  const content = !code ? (
    <ScanMessage
      icon={<CircleAlert className="size-9 text-rose-600" />}
      title="Invalid QR code"
      message="The scanned QR code does not contain an accessory ID."
    />
  ) : loading ? (
    <ScanMessage
      icon={<LoaderCircle className="size-9 animate-spin text-blue-600" />}
      title="Looking up accessory"
      message="Connecting to the MIIT Store server…"
    />
  ) : error ? (
    <ScanMessage
      icon={<CircleAlert className="size-9 text-rose-600" />}
      title="Accessory unavailable"
      message={error}
    />
  ) : accessory ? (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
      <header className="border-b border-slate-100 px-6 py-5">
        <p className="text-sm font-medium text-blue-700">MIIT Store</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{accessory.item_name}</h1>
        <p className="mt-2 font-mono text-sm font-semibold text-slate-500">{accessory.id}</p>
      </header>
      <dl className="divide-y divide-slate-100 px-6">
        <ScanDetail label="Category" value={accessory.category_name} />
        <ScanDetail label="Status" value={<span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(accessory.status)}`}>{accessory.status}</span>} />
        <ScanDetail label="Department" value={accessory.department} />
        <ScanDetail label="Room" value={accessory.room || "Not assigned"} />
        <ScanDetail label="Academic year" value={accessory.academic_year} />
        <ScanDetail label="Registered date" value={accessory.registered_date} />
        {accessory.remark ? <ScanDetail label="Remark" value={accessory.remark} /> : null}
      </dl>
    </article>
  ) : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8 text-slate-900">
      <div className="w-full max-w-md">
        <div className="mb-5 flex items-center justify-center gap-3">
          <img src={miitLogo} alt="MIIT" className="size-11 rounded-full object-cover shadow-sm" />
          <div><p className="text-sm font-semibold text-slate-950">MIIT Store</p><p className="text-xs text-slate-500">Accessory QR lookup</p></div>
        </div>
        {content}
      </div>
    </main>
  );
}

function ScanMessage({ icon, title, message }: { icon: React.ReactNode; title: string; message: string }) {
  return <section className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center shadow-xl shadow-slate-900/10"><div className="flex justify-center">{icon}</div><h1 className="mt-4 text-xl font-bold text-slate-950">{title}</h1><p className="mt-2 text-sm leading-6 text-slate-600">{message}</p></section>;
}

function ScanDetail({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-4 py-3.5 text-sm"><dt className="font-medium text-slate-500">{label}</dt><dd className="break-words text-right font-semibold text-slate-800">{value}</dd></div>;
}
