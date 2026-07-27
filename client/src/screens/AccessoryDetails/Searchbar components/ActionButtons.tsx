import TransferButton from "@/components/buttons/TransferButton"

export interface ActionButtonsProps {
  onTransferClick: () => void
}

export default function ActionButtons({ onTransferClick }: ActionButtonsProps) {
  return <TransferButton onClick={onTransferClick} />
}
