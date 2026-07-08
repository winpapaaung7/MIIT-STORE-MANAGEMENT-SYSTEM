import { type ReactNode } from "react"

import {
  type AccessoryItem,
  type AccessoryStatus,
} from "@/screens/AccessoryDetails/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export interface ScanModalProps {
  selectedQrItem: AccessoryItem | null
  onClose: () => void
  statusClasses: Record<AccessoryStatus, string>
  onOpenChange?: (open: boolean) => void
}

export type QrScanModalProps = Omit<ScanModalProps, "onOpenChange">

const qrCells = [
  1, 1, 1, 0, 1, 0, 1, 1,
  1, 0, 0, 1, 0, 1, 0, 1,
  1, 0, 1, 1, 1, 0, 0, 1,
  0, 1, 1, 0, 1, 1, 0, 0,
  1, 0, 1, 0, 0, 1, 1, 1,
  0, 1, 0, 1, 1, 0, 1, 0,
  1, 1, 0, 0, 1, 0, 1, 1,
  1, 0, 1, 1, 0, 1, 0, 1,
]

function LargeQrCode() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-inner sm:p-4">
      <div className="grid size-36 grid-cols-8 gap-0.5 rounded-lg bg-slate-50 p-2 sm:size-48 sm:gap-1 sm:p-3">
        {qrCells.map((active, index) => (
          <span
            key={index}
            className={cn("rounded-[2px]", active ? "bg-slate-950" : "bg-white")}
          />
        ))}
      </div>
    </div>
  )
}

function DetailTile({
  label,
  value,
  children,
}: {
  label: string
  value?: string
  children?: ReactNode
}) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 min-w-0 break-words text-sm font-semibold text-slate-950">
        {children ?? value}
      </div>
    </div>
  )
}

export default function ScanModal({
  selectedQrItem,
  onOpenChange,
  onClose,
  statusClasses,
}: ScanModalProps) {
  const handleOpenChange = (open: boolean) => {
    onOpenChange?.(open)

    if (!open) {
      onClose()
    }
  }

  return (
    <Dialog open={selectedQrItem !== null} onOpenChange={handleOpenChange}>
      <DialogContent className="grid max-h-[90vh] w-[calc(100vw-2rem)] max-w-md grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-slate-100 px-4 py-4 pr-10 sm:px-6 sm:py-5 sm:pr-12">
          <DialogTitle className="text-lg font-bold text-slate-950 sm:text-xl">
            Accessory QR Code Scan
          </DialogTitle>
          <DialogDescription className="break-words">
            {selectedQrItem
              ? `${selectedQrItem.id} - ${selectedQrItem.itemName}`
              : "Scan accessory record"}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto px-4 py-4 sm:px-6">
          <div className="flex flex-col items-center gap-4 sm:gap-5">
            <LargeQrCode />

            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
              <DetailTile label="ID" value={selectedQrItem?.id} />
              <DetailTile
                label="Created Date"
                value={selectedQrItem?.createdAt ?? selectedQrItem?.registeredDate}
              />
              <DetailTile label="Status">
                {selectedQrItem && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "h-6 rounded-full px-2.5 font-semibold",
                      statusClasses[selectedQrItem.status]
                    )}
                  >
                    {selectedQrItem.status}
                  </Badge>
                )}
              </DetailTile>
              <DetailTile label="Department" value={selectedQrItem?.department} />
              <DetailTile label="Room" value={selectedQrItem?.room} />
              <div className="sm:col-span-2">
                <DetailTile
                  label="Remark"
                  value={selectedQrItem?.remark || "No remark added."}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="m-0 border-t border-slate-100 bg-white px-4 py-3 sm:justify-center sm:px-6 sm:py-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto sm:min-w-28"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { ScanModal as QrScanModal }
