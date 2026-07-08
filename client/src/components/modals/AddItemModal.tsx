import {
  type AccessoryStatus,
  type Department,
  type NewAccessoryForm,
} from "@/screens/AccessoryDetails/types"
import ItemModal, {
  type ItemFormValues,
  type ItemModalProps,
  type ItemSubmitPayload,
} from "@/components/modals/ItemModal"

export interface AddItemModalProps {
  isOpen: boolean
  onClose: () => void
  newAccessory: NewAccessoryForm
  categories: readonly string[]
  statuses: readonly AccessoryStatus[]
  departments: readonly Department[]
  departmentRoomMap: Record<Department, readonly string[]>
  onSubmit: (payload: ItemSubmitPayload) => void
}

export default function AddItemModal({
  isOpen,
  onClose,
  newAccessory,
  categories,
  statuses,
  departments,
  departmentRoomMap,
  onSubmit,
}: AddItemModalProps) {
  return (
    <ItemModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
      defaultValues={{
        id: newAccessory.id,
        itemName: newAccessory.itemName,
        category: newAccessory.subCategory,
        status: newAccessory.status,
        department: newAccessory.department,
        room: newAccessory.room,
        createdDate: newAccessory.registeredDate,
        remark: newAccessory.remark,
      }}
      categories={categories}
      statuses={statuses}
      departments={departments}
      departmentRoomMap={departmentRoomMap}
      onConfirm={onSubmit}
    />
  )
}

export { ItemModal as AddAccessoryModal }
export type {
  ItemFormValues as AddAccessoryFormValues,
  ItemModalProps as AddAccessoryModalProps,
  ItemSubmitPayload as AddAccessorySubmitPayload,
}
