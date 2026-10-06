import AccessoryDetailTile from "@/components/modals/AccessoryDetailTile"
import ModalLayout from "@/components/modals/ModalLayout"
import {
  type AccessoryStatus,
  type ActiveAccessoryAction,
  type Department,
} from "@/screens/AccessoryDetails/types"
import ItemModal, {
  type ItemSubmitPayload,
} from "@/components/modals/ItemModal"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState } from "react"

export interface ActionMenuModalProps {
  activeAction: ActiveAccessoryAction | null
  categories: readonly string[]
  statuses: readonly AccessoryStatus[]
  departments: readonly Department[]
  departmentRoomMap: Record<Department, readonly string[]>
  onClose: () => void
  onSubmitEdit: (payload: ItemSubmitPayload) => void
  onConfirmDelete: () => Promise<{ ok: boolean; message?: string }>
}

export default function ActionMenuModal({
  activeAction,
  categories,
  statuses,
  departments,
  departmentRoomMap,
  onClose,
  onSubmitEdit,
  onConfirmDelete,
}: ActionMenuModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")
  const actionTitle = activeAction
    ? `${activeAction.type[0].toUpperCase()}${activeAction.type.slice(1)} Accessory`
    : "Accessory Action"
  const isEditOpen = activeAction?.type === "edit"
  const isDetailOpen = activeAction !== null && activeAction.type !== "edit"
  const confirmDelete = async () => {
    setDeleteError("")
    setIsDeleting(true)
    try {
      const result = await onConfirmDelete()
      if (!result.ok) setDeleteError(result.message ?? "Failed to delete item.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      {activeAction && (
        <ItemModal
          open={isEditOpen}
          mode="edit"
          onOpenChange={(open) => {
            if (!open) {
              onClose()
            }
          }}
          defaultValues={{
            id: activeAction.item.id,
            itemName: activeAction.item.itemName,
            category: activeAction.item.subCategory,
            status: activeAction.item.status,
            department: activeAction.item.department,
            room: activeAction.item.room,
            createdDate: activeAction.item.registeredDate,
            remark: activeAction.item.remark,
          }}
          categories={categories}
          statuses={statuses}
          departments={departments}
          departmentRoomMap={departmentRoomMap}
          onConfirm={onSubmitEdit}
        />
      )}

      <ModalLayout
        isOpen={isDetailOpen}
        title={actionTitle}
        description={
          activeAction
            ? `${activeAction.item.id} - ${activeAction.item.itemName}`
            : "Accessory action"
        }
        onClose={onClose}
        footerClassName="flex-col gap-2 border-t-0 bg-transparent p-0 sm:flex-row"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isDeleting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={activeAction?.type === "delete" ? () => void confirmDelete() : onClose}
              disabled={isDeleting}
              className={cn(
                "w-full bg-slate-950 text-white hover:bg-slate-800 sm:w-auto",
                activeAction?.type === "delete" &&
                  "bg-rose-700 hover:bg-rose-800"
              )}
            >
              {activeAction?.type === "delete" ? (isDeleting ? "Deleting..." : "Confirm Delete") : "Done"}
            </Button>
          </>
        }
      >
        {activeAction && (
          <div className="space-y-4 py-2">
            {activeAction.type === "remark" && (
              <div className="grid gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <AccessoryDetailTile
                    label="Current Department"
                    value={activeAction.item.department}
                  />
                  <AccessoryDetailTile
                    label="Current Room"
                    value={activeAction.item.room || "No room assigned."}
                  />
                </div>
                <AccessoryDetailTile
                  label="Status"
                  value={activeAction.item.status}
                />
                <AccessoryDetailTile
                  label="Remark"
                  value={activeAction.item.remark || "No remark added."}
                />
              </div>
            )}

            {activeAction.type === "delete" && (
              <div className="space-y-3">
                <div className="rounded-lg border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
                  Delete this item unit permanently? Units with rental or transfer history cannot be deleted.
                </div>
                {deleteError ? <p className="text-sm font-medium text-rose-700">{deleteError}</p> : null}
              </div>
            )}
          </div>
        )}
      </ModalLayout>
    </>
  )
}
