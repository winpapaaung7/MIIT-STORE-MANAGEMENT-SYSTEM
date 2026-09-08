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

export default function AccessoryDetailsPage() {
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
  } = useAccessoryDetails()

  return (
    <section className="accessories-page flex h-full max-h-full min-h-0 flex-col overflow-hidden bg-background text-foreground">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-4 overflow-hidden sm:gap-5">
        <AccessoriesHeader {...headerProps} />
        <AccessoriesFilterBar {...filterBarProps} />
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
