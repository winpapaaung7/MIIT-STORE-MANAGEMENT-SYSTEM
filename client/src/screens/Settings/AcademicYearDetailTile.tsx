import { type ReactNode } from "react";

export interface AcademicYearDetailTileProps {
  label: string;
  children: ReactNode;
}

export default function AcademicYearDetailTile({
  label,
  children,
}: AcademicYearDetailTileProps) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-2 min-w-0 text-sm font-semibold text-slate-950">
        {children}
      </div>
    </div>
  );
}
