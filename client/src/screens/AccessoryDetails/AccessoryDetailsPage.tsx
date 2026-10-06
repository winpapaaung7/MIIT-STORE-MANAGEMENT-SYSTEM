import AccessoriesFilterBar from "@/screens/AccessoryDetails/AccessoriesFilterBar"
import AccessoriesHeader from "@/screens/AccessoryDetails/AccessoriesHeader"
import AccessoriesTable from "@/screens/AccessoryDetails/AccessoriesTable"
import { useAccessoryDetails } from "@/screens/AccessoryDetails/useAccessoryDetails"
import ActionMenuModal from "@/components/modals/ActionMenuModal"
import AddItemModal from "@/components/modals/AddItemModal"
import ExportModal from "@/components/modals/ExportModal"
import InsertModal from "@/components/modals/InsertModal"
import ScanModal from "@/components/modals/ScanModal"
import TransferModal from "@/components/modals/TransferModal"
import { useAuth } from "@/auth/AuthContext"

export default function AccessoryDetailsPage({ departmentName, embedded = false }: { departmentName?: string; embedded?: boolean }) {
  const { user } = useAuth()
  const {
    headerProps,
    filterBarProps,
    tableProps,
    addItemModalProps,
    insertModalProps,
    exportModalProps,
    transferModalProps,
    actionMenuModalProps,
    qrScanModalProps,
  } = useAccessoryDetails({ departmentName })

  return (
    <section className={embedded ? "accessories-page min-w-0 bg-transparent text-foreground" : "accessories-page flex h-full max-h-full min-h-0 flex-col overflow-hidden bg-transparent text-foreground"}>
      <div className={embedded ? "mx-auto flex min-w-0 w-full max-w-7xl flex-col gap-4" : "mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-4 overflow-hidden sm:gap-5"}>
        {embedded ? <><div><h2 className="text-xl font-semibold text-slate-950">{departmentName} accessories</h2><p className="mt-1 text-sm text-slate-500">Inventory items assigned to this department.</p></div><AccessoriesFilterBar {...filterBarProps} compact /></> : <><AccessoriesHeader {...headerProps} /><AccessoriesFilterBar {...filterBarProps} showLocationFilters={user?.role.code === "ADMIN"} /></>}
        <AccessoriesTable {...tableProps} />
      </div>

      <AddItemModal {...addItemModalProps} />
      <InsertModal {...insertModalProps} />
      <ExportModal {...exportModalProps} />
      <TransferModal {...transferModalProps} />
      <ActionMenuModal {...actionMenuModalProps} />
      <ScanModal {...qrScanModalProps} />
    </section>
  )
}
