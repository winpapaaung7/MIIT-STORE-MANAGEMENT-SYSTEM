import { ArrowRightLeft } from "lucide-react"

import { Button } from "@/components/ui/button"

interface TransferButtonProps {
  onClick: () => void
}

const TransferButton = ({ onClick }: TransferButtonProps) => {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className="h-10 w-full gap-2 rounded-xl border-slate-200 bg-white px-4 font-medium text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 hover:shadow-md sm:w-auto sm:px-5"
    >
      <ArrowRightLeft className="size-4" />
      Transfer
    </Button>
  )
}

export default TransferButton
