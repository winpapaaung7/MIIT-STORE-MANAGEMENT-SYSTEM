import { type ReactNode } from "react"

export interface AccessoryDetailTileProps {
  label: string
  value?: string
  children?: ReactNode
}

export default function AccessoryDetailTile({
  label,
  value,
  children,
}: AccessoryDetailTileProps) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 break-words text-sm font-semibold text-slate-950">
        {children ?? value}
      </div>
    </div>
  )
}
