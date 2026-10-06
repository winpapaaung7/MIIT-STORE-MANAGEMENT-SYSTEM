import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DepartmentHistoryEvent {
  type: "Item added" | "Transfer received" | "Transfer sent";
  name: string;
  detail: string;
  quantity: number;
  date: string;
}

export default function DepartmentHistory({
  events,
}: {
  events: DepartmentHistoryEvent[];
}) {
  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Department activity</CardTitle>
        <p className="text-sm text-slate-500">
          Recently added items and transfer history for this department.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-y bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                {['Activity', 'Item / Transfer', 'Details', 'Quantity', 'Date'].map((heading) => (
                  <th key={heading} className="px-4 py-3 font-medium">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((event) => {
                const added = event.type === "Item added";
                const received = event.type === "Transfer received";

                return (
                  <tr key={`${event.type}-${event.name}-${event.date}-${event.detail}`} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${added ? "bg-blue-50 text-blue-700" : received ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        {event.type}
                      </span>
                    </td>
                    <td className="max-w-64 truncate px-4 py-3 font-medium text-slate-900" title={event.name}>{event.name}</td>
                    <td className="max-w-80 truncate px-4 py-3 text-slate-600" title={event.detail}>{event.detail}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{event.quantity}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{event.date ? new Date(event.date).toLocaleDateString() : "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!events.length && <p className="py-10 text-center text-sm text-slate-500">No item additions or transfers have been recorded for this department.</p>}
      </CardContent>
    </Card>
  );
}
