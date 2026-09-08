import TransferButton from "@/components/buttons/TransferButton"

export interface ActionButtonsProps {
  onTransferClick: () => void
  label?: string
}

export default function ActionButtons({ onTransferClick, label }: ActionButtonsProps) {
  return <TransferButton onClick={onTransferClick} label={label} />
}
