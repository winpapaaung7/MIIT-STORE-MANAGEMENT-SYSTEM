import AccessoryDetailTile from "@/components/modals/AccessoryDetailTile"
import ModalLayout from "@/components/modals/ModalLayout"
import { Button } from "@/components/ui/button"

export interface ExportModalProps {
  isOpen: boolean
  visibleAccessoriesCount: number
  onClose: () => void
}

export default function ExportModal({
  isOpen,
  visibleAccessoriesCount,
  onClose,
}: ExportModalProps) {
  return (
    <ModalLayout
      isOpen={isOpen}
      title="Export Accessories"
      description="Visible accessory rows were exported as a CSV file."
      onClose={onClose}
      footer={
        <Button type="button" onClick={onClose} className="w-full sm:w-auto">
          Done
        </Button>
      }
    >
      <div className="grid gap-3 py-2">
        <AccessoryDetailTile
          label="Exported Records"
          value={`${visibleAccessoriesCount} visible accessories`}
        />
        <AccessoryDetailTile label="File Name" value="accessories-details.csv" />
      </div>
    </ModalLayout>
  )
}
