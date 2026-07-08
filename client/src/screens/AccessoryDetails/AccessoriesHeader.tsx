import { type ChangeEvent, type RefObject } from "react"

import AddItemButton from "@/components/buttons/AddItemButton"
import ExportButton from "@/components/buttons/ExportButton"
import ImportButton from "@/components/buttons/ImportButton"

export interface AccessoriesHeaderProps {
  insertFileInputRef: RefObject<HTMLInputElement | null>
  canExport: boolean
  onInsertClick: () => void
  onInsertFile: (event: ChangeEvent<HTMLInputElement>) => void
  onExport: () => void
  onAddItem: () => void
}

export default function AccessoriesHeader({
  insertFileInputRef,
  canExport,
  onInsertClick,
  onInsertFile,
  onExport,
  onAddItem,
}: AccessoriesHeaderProps) {
  return (
    <header className="shrink-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-normal text-slate-950 sm:text-3xl">
            Accessories Details
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage accessory details and records
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={insertFileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls,.json"
            className="hidden"
            onChange={onInsertFile}
          />
          <ImportButton label="Import" onClick={onInsertClick} />
          <ExportButton onClick={onExport} disabled={!canExport} />
          <AddItemButton onClick={onAddItem} />
        </div>
      </div>
    </header>
  )
}
