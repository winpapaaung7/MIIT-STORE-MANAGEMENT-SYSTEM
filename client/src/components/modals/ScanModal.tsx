import { type ReactNode, useState } from "react";
import { Archive, Download, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import QRCode from "qrcode";
import miitLogo from "@/assets/MIIT_LOGO.jpg";
import { accessoryScanUrl, downloadQrCodePdf } from "@/lib/qr";

import {
  type AccessoryItem,
  type AccessoryStatus,
} from "@/screens/AccessoryDetails/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface ScanModalProps {
  selectedQrItem: AccessoryItem | null;
  onClose: () => void;
  statusClasses: Record<AccessoryStatus, string>;
  onOpenChange?: (open: boolean) => void;
  onDownloadAll?: () => Promise<void> | void;
  downloadAllCount?: number;
}

export type QrScanModalProps = Omit<ScanModalProps, "onOpenChange">;

function LargeQrCode({ value }: { value: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-inner sm:p-4">
      <QRCodeSVG
        value={accessoryScanUrl(value)}
        size={192}
        level="H"
        includeMargin={false}
        bgColor="#f8fafc"
        fgColor="#020617"
        imageSettings={{
          src: miitLogo,
          height: 40,
          width: 40,
          excavate: true,
        }}
        className="size-36 rounded-lg sm:size-48"
      />
      <p className="font-mono text-sm font-semibold text-slate-700">{value}</p>
    </div>
  );
}

function DetailTile({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 min-w-0 break-words text-sm font-semibold text-slate-950">
        {children ?? value}
      </div>
    </div>
  );
}

function escapeHtml(value: string) {
  return value.replace(/[<>&"']/g, (character) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

export default function ScanModal({
  selectedQrItem,
  onOpenChange,
  onClose,
  statusClasses,
  onDownloadAll,
  downloadAllCount = 0,
}: ScanModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const handleOpenChange = (open: boolean) => {
    onOpenChange?.(open);

    if (!open) {
      onClose();
    }
  };

  const handleDownload = async () => {
    const accessoryId = selectedQrItem?.id;

    if (!accessoryId) {
      return;
    }

    setIsDownloading(true);
    try {
      await downloadQrCodePdf([accessoryId]);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = async () => {
    const accessoryId = selectedQrItem?.id;
    if (!accessoryId) return;

    // Open the print document immediately from the button click so popup
    // blockers do not prevent printing after the QR image is generated.
    const printWindow = window.open("", "_blank", "width=850,height=900");
    if (!printWindow) return;

    setIsPrinting(true);
    try {
      const qrImage = await QRCode.toDataURL(accessoryScanUrl(accessoryId), {
        errorCorrectionLevel: "H",
        margin: 1,
        width: 600,
        color: { dark: "#020617", light: "#f8fafc" },
      });
      const fileName = `MIIT-Store-QR-${accessoryId}`;
      const safeFileName = escapeHtml(fileName);
      const safeCode = escapeHtml(accessoryId);

      printWindow.document.write(`<!doctype html>
<html><head><title>${safeFileName}</title>
<style>
  @page { size: A4 portrait; margin: 12mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; }
  .qr-label { width: 56mm; height: 56mm; border: .3mm solid #cbd5e1; border-radius: 2mm; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3mm 2mm 1.5mm; }
  .qr-image { position: relative; width: 46mm; height: 46mm; }
  .qr-image > .code { display: block; width: 46mm; height: 46mm; }
  .qr-image > .logo { position: absolute; left: 18mm; top: 18mm; width: 10mm; height: 10mm; border-radius: 1.5mm; background: #f8fafc; padding: .7mm; object-fit: contain; }
  .code-label { margin: .5mm 0 0; color: #334155; font: 700 7pt monospace; }
</style></head>
<body><section class="qr-label"><div class="qr-image"><img class="code" src="${qrImage}" alt="QR code" /><img class="logo" src="${miitLogo}" alt="MIIT" /></div><p class="code-label">${safeCode}</p></section>
<script>window.onload = function () { window.focus(); window.print(); };</script>
</body></html>`);
      printWindow.document.close();
    } catch {
      printWindow.close();
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownloadAll = async () => {
    if (!onDownloadAll) return;
    setIsDownloadingAll(true);
    try {
      await onDownloadAll();
    } finally {
      setIsDownloadingAll(false);
    }
  };

  return (
    <Dialog open={selectedQrItem !== null} onOpenChange={handleOpenChange}>
      <DialogContent className="grid max-h-[90vh] w-[calc(100vw-2rem)] max-w-md grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-slate-100 px-4 py-4 pr-10 sm:px-6 sm:py-5 sm:pr-12">
          <DialogTitle className="text-lg font-bold text-slate-950 sm:text-xl">
            Accessory QR Code Scan
          </DialogTitle>
          <DialogDescription className="break-words">
            {selectedQrItem
              ? `${selectedQrItem.id} - ${selectedQrItem.itemName}`
              : "Scan accessory record"}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto px-4 py-4 sm:px-6">
          <div className="flex flex-col items-center gap-4 sm:gap-5">
            <LargeQrCode value={selectedQrItem?.id ?? ""} />

            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
              <DetailTile label="ID" value={selectedQrItem?.id} />
              <DetailTile
                label="QR Code"
                value={selectedQrItem?.id ?? "Not available"}
              />
              <DetailTile
                label="Created Date"
                value={
                  selectedQrItem?.createdAt ?? selectedQrItem?.registeredDate
                }
              />
              <DetailTile label="Status">
                {selectedQrItem && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "h-6 rounded-full px-2.5 font-semibold",
                      statusClasses[selectedQrItem.status],
                    )}
                  >
                    {selectedQrItem.status}
                  </Badge>
                )}
              </DetailTile>
              <DetailTile
                label="Department"
                value={selectedQrItem?.department}
              />
              <DetailTile label="Room" value={selectedQrItem?.room} />
              {selectedQrItem?.borrowerName && <DetailTile label="Borrower" value={selectedQrItem.borrowerName} />}
              {selectedQrItem?.borrowerId && <DetailTile label="Roll No. / Email" value={selectedQrItem.borrowerId} />}
              <div className="sm:col-span-2">
                <DetailTile
                  label="Remark"
                  value={selectedQrItem?.remark || "No remark added."}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="m-0 flex-col gap-2 border-t border-slate-100 bg-white px-4 py-3 sm:flex-row sm:justify-center sm:px-6 sm:py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleDownload()}
            disabled={isDownloading}
            className="w-full sm:w-auto"
          >
            <Download className="size-4" />
            {isDownloading ? "Preparing PDF..." : "Download PDF"}
          </Button>
          {onDownloadAll && downloadAllCount > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadAll}
              disabled={isDownloadingAll}
              className="w-full sm:w-auto"
            >
              <Archive className="size-4" />
              {isDownloadingAll ? "Preparing PDF..." : `Download All PDF (${downloadAllCount})`}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={() => void handlePrint()}
            disabled={isPrinting}
            className="w-full sm:w-auto"
          >
            <Printer className="size-4" />
            {isPrinting ? "Preparing PDF..." : "Print QR"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto sm:min-w-28"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { ScanModal as QrScanModal };
