import { Download, History as HistoryIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function History() {
  const activities = [
    "Inventory data exported",
    "Academic year reviewed",
    "Settings page opened",
  ];

  return (
    <section>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">
            History
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Recent setting and account activity.
          </p>
        </div>

        <Button variant="outline" className="h-9 rounded-xl px-4">
          Export
          <Download className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-5 divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-slate-50/70">
        {activities.map((activity) => (
          <div
            key={activity}
            className="flex items-center gap-3 px-4 py-3"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm">
              <HistoryIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-950">
                {activity}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Today
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
