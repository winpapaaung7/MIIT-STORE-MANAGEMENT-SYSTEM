import { useState } from "react";
import { Download, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import miitLogo from "@/assets/MIIT_LOGO.jpg";
import { type AccessoryItem } from "@/screens/AccessoryDetails/types";
import { accessoryScanUrl, downloadQrCodePdf, printQrCodePdf } from "@/lib/qr";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface QrSheetModalProps {
  items: readonly AccessoryItem[];
  open: boolean;
  onClose: () => void;
}

export default function QrSheetModal({ items, open, onClose }: QrSheetModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadQrCodePdf(items.map((item) => item.id));
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      await printQrCodePdf(items.map((item) => item.id));
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="grid max-h-[90vh] w-[calc(100vw-2rem)] max-w-3xl grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-slate-100 px-4 py-4 pr-10 sm:px-6 sm:py-5 sm:pr-12">
          <DialogTitle className="text-lg font-bold text-slate-950 sm:text-xl">
            Generated QR Codes
          </DialogTitle>
          <DialogDescription>
            {items.length} item code{items.length === 1 ? "" : "s"} generated successfully.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 overflow-x-hidden overflow-y-auto px-4 py-4 sm:px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {items.map((item) => (
              <div key={item.id} className="flex min-w-0 flex-col items-center rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <QRCodeSVG
                  value={accessoryScanUrl(item.id)}
                  size={144}
                  level="H"
                  includeMargin={false}
                  bgColor="#f8fafc"
                  fgColor="#020617"
                  imageSettings={{ src: miitLogo, height: 32, width: 32, excavate: true }}
                />
                <p className="mt-3 break-all text-center font-mono text-xs font-semibold text-slate-700">
                  {item.id}
                </p>
                <p className="mt-0.5 text-center text-xs text-slate-500">{item.itemName}</p>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="m-0 flex-col gap-2 border-t border-slate-100 bg-white px-4 py-3 sm:flex-row sm:justify-center sm:px-6 sm:py-4">
          <Button type="button" variant="outline" onClick={handleDownload} disabled={isDownloading} className="w-full sm:w-auto">
            <Download className="size-4" />
            {isDownloading ? "Preparing PDF..." : "Download QR Sheet"}
          </Button>
          <Button type="button" variant="outline" onClick={() => void handlePrint()} disabled={isPrinting} className="w-full sm:w-auto">
            <Printer className="size-4" />
            {isPrinting ? "Preparing PDF..." : "Print QR Sheet"}
          </Button>
          <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto sm:min-w-28">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
