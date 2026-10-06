import { type ChangeEvent, type RefObject } from "react"


export interface AccessoriesHeaderProps {
  insertFileInputRef: RefObject<HTMLInputElement | null>
  canExport: boolean
  onInsertClick: () => void
  onInsertFile: (event: ChangeEvent<HTMLInputElement>) => void
  onExport: () => void
  onAddItem: () => void
}

export default function AccessoriesHeader(_props: AccessoriesHeaderProps) {
  return (
    <header className="shrink-0">
      <div>
        <h1 className="text-2xl font-bold tracking-normal text-slate-950 sm:text-3xl">
          Item details
        </h1>
      </div>
    </header>
  )
}
