import { type ReactNode } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export interface ModalLayoutProps {
  isOpen: boolean
  title: string
  description: ReactNode
  onClose: () => void
  children: ReactNode
  footer: ReactNode
  footerClassName?: string
}

export default function ModalLayout({
  isOpen,
  title,
  description,
  onClose,
  children,
  footer,
  footerClassName = "border-t-0 bg-transparent p-0",
}: ModalLayoutProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
    >
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md p-4 sm:p-6">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-xl font-bold text-slate-950">
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {children}

        <DialogFooter className={footerClassName}>{footer}</DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
