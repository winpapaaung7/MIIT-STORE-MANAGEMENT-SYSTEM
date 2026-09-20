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
import { Card } from "@/components/ui/card"
import { useLanguage } from "@/context/LanguageContext"

export interface AccessoriesTableProps {
  filteredAccessories: AccessoryItem[]
  pagination: { page: number; totalPages: number; total: number }
  onPreviousPage: () => void
  onNextPage: () => void
  statusClasses: Record<AccessoryStatus, string>
  openActionId: string | null
  setOpenActionId: (id: string | null) => void
  setSelectedQrItem: (item: AccessoryItem) => void
  openActionDialog: (type: TableAction, item: AccessoryItem) => void
}

export default function AccessoriesTable({
  filteredAccessories,
  pagination,
  onPreviousPage,
  onNextPage,
  statusClasses,
  openActionId,
  setOpenActionId,
  setSelectedQrItem,
  openActionDialog,
}: AccessoriesTableProps) {
  const { t } = useLanguage()
  return (
    <Card className="workspace-table-card min-h-0 flex-1 overflow-hidden border-slate-200 shadow-sm">
      <div className="max-h-[min(550px,calc(100vh-20rem))] min-h-[260px] overflow-auto overscroll-contain scroll-smooth [scrollbar-color:#cbd5e1_transparent] [scrollbar-width:thin]">
        <Table className="workspace-table w-full min-w-[760px] text-sm">
          <TableHeader className="workspace-table-head border-b bg-slate-50 text-left text-xs text-slate-500">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-36 px-4 py-3 text-left text-xs font-medium text-slate-500">
                ID
              </TableHead>
              <TableHead className="min-w-56 px-4 py-3 text-left text-xs font-medium text-slate-500 sm:min-w-64">
                {t("itemName")}
              </TableHead>
              <TableHead className="w-36 px-4 py-3 text-center text-xs font-medium text-slate-500">
                {t("status")}
              </TableHead>
              <TableHead className="w-28 px-4 py-3 text-center text-xs font-medium text-slate-500 sm:w-36">
                {t("qrCode")}
              </TableHead>
              <TableHead className="w-24 px-4 py-3 text-center text-xs font-medium text-slate-500 sm:w-32">
                {t("action")}
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
      {pagination.totalPages > 1 && <div className="flex items-center justify-between border-t p-3 text-sm text-slate-600"><span>Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)</span><div className="flex gap-2"><button type="button" className="rounded border px-3 py-1 disabled:opacity-50" disabled={pagination.page <= 1} onClick={onPreviousPage}>Previous</button><button type="button" className="rounded border px-3 py-1 disabled:opacity-50" disabled={pagination.page >= pagination.totalPages} onClick={onNextPage}>Next</button></div></div>}
    </Card>
  )
}
