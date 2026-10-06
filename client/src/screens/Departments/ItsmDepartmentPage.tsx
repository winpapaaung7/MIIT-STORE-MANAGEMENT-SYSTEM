import { useEffect, useState } from "react";

import DepartmentRoomsPage from "./DepartmentRoomsPage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

type DepartmentRecord = { department_id: number };

/** The Laptop Rental workspace always opens its ITSM department locations. */
export default function ItsmDepartmentPage() {
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetch(`${API_BASE_URL}/api/departments`)
      .then(async (response) => {
        const payload = await response.json() as { ok?: boolean; departments?: DepartmentRecord[]; message?: string };
        if (!response.ok || !payload.ok || !payload.departments?.[0]) throw new Error(payload.message ?? "ITSM department is not available.");
        setDepartmentId(payload.departments[0].department_id);
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "ITSM department is not available."));
  }, []);

  if (error) return <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>;
  if (!departmentId) return <p className="text-sm text-slate-500">Loading ITSM department...</p>;

  return <DepartmentRoomsPage departmentId={departmentId} viewOnly dashboardPath="/rental-dashboard/room" locationLabel="ITSM / Locations" />;
}
