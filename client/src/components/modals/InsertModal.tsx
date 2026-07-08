import AccessoryDetailTile from "@/components/modals/AccessoryDetailTile"
import ModalLayout from "@/components/modals/ModalLayout"
import { Button } from "@/components/ui/button"

export interface InsertModalProps {
  isOpen: boolean
  insertedFileName: string
  onClose: () => void
}

export default function InsertModal({
  isOpen,
  insertedFileName,
  onClose,
}: InsertModalProps) {
  return (
    <ModalLayout
      isOpen={isOpen}
      title="Insert Accessories"
      description="File selected and ready for your import parser."
      onClose={onClose}
      footer={
        <Button type="button" onClick={onClose} className="w-full sm:w-auto">
          Done
        </Button>
      }
    >
      <div className="grid gap-3 py-2">
        <AccessoryDetailTile
          label="Selected File"
          value={insertedFileName || "No file selected"}
        />
        <AccessoryDetailTile
          label="Accepted Types"
          value="CSV, Excel, or JSON accessory files"
        />
      </div>
    </ModalLayout>
  )
}
