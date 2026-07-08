import {
  Edit3,
  MessageSquare,
  MoreHorizontal,
  Trash2,
} from "lucide-react"

import {
  type AccessoryItem,
  type AccessoryStatus,
  type TableAction,
} from "@/screens/AccessoryDetails/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TableCell, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

export interface AccessoryRowItemProps {
  accessory: AccessoryItem
  statusClasses: Record<AccessoryStatus, string>
  openActionId: string | null
  setOpenActionId: (id: string | null) => void
  setSelectedQrItem: (item: AccessoryItem) => void
  openActionDialog: (type: TableAction, item: AccessoryItem) => void
}

function QrCodeMark({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open QR code scan"
      className="grid size-9 shrink-0 grid-cols-4 gap-0.5 rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-slate-200"
    >
      {Array.from({ length: 16 }).map((_, index) => (
        <span
          key={index}
          className={cn(
            "rounded-[1px] bg-slate-800",
            [1, 6, 9, 14].includes(index) && "bg-slate-300",
            [4, 11].includes(index) && "bg-slate-500"
          )}
        />
      ))}
    </button>
  )
}

export default function AccessoryRowItem({
  accessory,
  statusClasses,
  openActionId,
  setOpenActionId,
  setSelectedQrItem,
  openActionDialog,
}: AccessoryRowItemProps) {
  return (
    <TableRow className="border-slate-100">
      <TableCell className="px-4 py-4 text-left font-mono text-sm font-medium text-slate-950 sm:px-8 sm:py-5 sm:text-base">
        {accessory.id}
      </TableCell>
      <TableCell className="px-4 py-4 text-left sm:px-8 sm:py-5">
        <div className="font-semibold text-slate-950">
          {accessory.itemName}
        </div>
        <div className="mt-1 text-sm text-slate-500">
          {accessory.subCategory}
        </div>
      </TableCell>
      <TableCell className="px-4 py-4 text-center sm:px-6 sm:py-5">
        <Badge
          variant="secondary"
          className={cn(
            "h-7 rounded-full px-3 text-sm font-semibold",
            statusClasses[accessory.status]
          )}
        >
          {accessory.status}
        </Badge>
      </TableCell>
      <TableCell className="px-4 py-4 text-center sm:px-6 sm:py-5">
        <div className="flex justify-center">
          <QrCodeMark onClick={() => setSelectedQrItem(accessory)} />
        </div>
      </TableCell>
      <TableCell className="px-4 py-4 text-center sm:px-6 sm:py-5">
        <DropdownMenu
          open={openActionId === accessory.id}
          onOpenChange={(open) =>
            setOpenActionId(open ? accessory.id : null)
          }
        >
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={`Actions for ${accessory.itemName}`}
              className="size-9 rounded-lg border-slate-200 bg-white shadow-sm hover:bg-slate-50"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem
              onClick={() => openActionDialog("edit", accessory)}
            >
              <Edit3 className="size-4 text-sky-600" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => openActionDialog("remark", accessory)}
            >
              <MessageSquare className="size-4 text-slate-500" />
              Remark
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => openActionDialog("delete", accessory)}
              className="text-rose-700 focus:text-rose-700"
            >
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}
