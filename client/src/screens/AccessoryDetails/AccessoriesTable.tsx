import AccessoryRowItem from "@/screens/AccessoryDetails/AccessoryRowItem"
import {
  type AccessoryItem,
  type AccessoryStatus,
  type TableAction,
} from "@/screens/AccessoryDetails/types"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface AccessoriesTableProps {
  filteredAccessories: AccessoryItem[]
  statusClasses: Record<AccessoryStatus, string>
  openActionId: string | null
  setOpenActionId: (id: string | null) => void
  setSelectedQrItem: (item: AccessoryItem) => void
  openActionDialog: (type: TableAction, item: AccessoryItem) => void
}

export default function AccessoriesTable({
  filteredAccessories,
  statusClasses,
  openActionId,
  setOpenActionId,
  setSelectedQrItem,
  openActionDialog,
}: AccessoriesTableProps) {
  return (
    <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm shadow-slate-200/80">
      <div className="max-h-[min(550px,calc(100vh-20rem))] min-h-[260px] overflow-auto overscroll-contain scroll-smooth [scrollbar-color:#cbd5e1_transparent] [scrollbar-width:thin]">
        <Table className="min-w-[760px]">
          <TableHeader className="sticky top-0 z-10 bg-slate-50">
            <TableRow className="border-slate-100 bg-slate-50 hover:bg-slate-50">
              <TableHead className="sticky top-0 z-10 w-36 bg-slate-50 px-4 text-left text-slate-500 shadow-[inset_0_-1px_0_#f1f5f9] sm:px-8">
                ID
              </TableHead>
              <TableHead className="sticky top-0 z-10 min-w-56 bg-slate-50 px-4 text-left text-slate-500 shadow-[inset_0_-1px_0_#f1f5f9] sm:min-w-64 sm:px-8">
                Item Name
              </TableHead>
              <TableHead className="sticky top-0 z-10 w-36 bg-slate-50 px-4 text-center text-slate-500 shadow-[inset_0_-1px_0_#f1f5f9] sm:px-6">
                Status
              </TableHead>
              <TableHead className="sticky top-0 z-10 w-28 bg-slate-50 px-4 text-center text-slate-500 shadow-[inset_0_-1px_0_#f1f5f9] sm:w-36 sm:px-6">
                QR Code
              </TableHead>
              <TableHead className="sticky top-0 z-10 w-24 bg-slate-50 px-4 text-center text-slate-500 shadow-[inset_0_-1px_0_#f1f5f9] sm:w-32 sm:px-6">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAccessories.map((accessory) => (
              <AccessoryRowItem
                key={accessory.id}
                accessory={accessory}
                statusClasses={statusClasses}
                openActionId={openActionId}
                setOpenActionId={setOpenActionId}
                setSelectedQrItem={setSelectedQrItem}
                openActionDialog={openActionDialog}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
