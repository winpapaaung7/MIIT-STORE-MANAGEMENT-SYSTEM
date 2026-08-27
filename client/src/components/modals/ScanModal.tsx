import { type ReactNode, type RefObject, useRef } from "react";
import { Download, Printer } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import miitLogo from "@/assets/MIIT_LOGO.jpg";

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
}

export type QrScanModalProps = Omit<ScanModalProps, "onOpenChange">;

function LargeQrCode({
  value,
  qrCodeRef,
}: {
  value: string;
  qrCodeRef: RefObject<SVGSVGElement | null>;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-inner sm:p-4">
      <QRCodeSVG
        ref={qrCodeRef}
        value={value}
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

function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (character) => {
    const entities: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      '"': "&quot;",
      "'": "&apos;",
    };

    return entities[character];
  });
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

export default function ScanModal({
  selectedQrItem,
  onOpenChange,
  onClose,
  statusClasses,
}: ScanModalProps) {
  const qrCodeRef = useRef<SVGSVGElement | null>(null);

  const handleOpenChange = (open: boolean) => {
    onOpenChange?.(open);

    if (!open) {
      onClose();
    }
  };

  const buildPrintableQrSvg = () => {
    const accessoryId = selectedQrItem?.id;
    const qrCodeSvg = qrCodeRef.current;

    if (!accessoryId || !qrCodeSvg) {
      return null;
    }

    const safeAccessoryId = escapeXml(accessoryId);

    return `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="250" viewBox="0 0 240 250">
  <rect width="240" height="250" fill="#ffffff"/>
  <svg x="24" y="16" width="192" height="192" viewBox="0 0 192 192">${qrCodeSvg.innerHTML}</svg>
  <text x="120" y="232" text-anchor="middle" font-family="monospace" font-size="14" font-weight="600" fill="#334155">${safeAccessoryId}</text>
</svg>`;
  };

  const handleDownload = () => {
    const accessoryId = selectedQrItem?.id;
    const qrSvg = buildPrintableQrSvg();

    if (!accessoryId || !qrSvg) {
      return;
    }

    const downloadUrl = URL.createObjectURL(
      new Blob([qrSvg], { type: "image/svg+xml;charset=utf-8" }),
    );
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = `${accessoryId}.svg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(downloadUrl);
  };

  const handlePrint = () => {
    const accessoryId = selectedQrItem?.id;
    const qrSvg = buildPrintableQrSvg();

    if (!accessoryId || !qrSvg) {
      return;
    }

    const printWindow = window.open("", "_blank", "width=420,height=520");

    if (!printWindow) {
      return;
    }

    printWindow.document.write(`<!doctype html><html><head><title>${escapeXml(accessoryId)}</title><style>body{margin:0;display:grid;min-height:100vh;place-items:center;background:#fff}</style></head><body>${qrSvg}<script>window.onload=function(){window.focus();window.print();}</script></body></html>`);
    printWindow.document.close();
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
            <LargeQrCode
              value={selectedQrItem?.id ?? ""}
              qrCodeRef={qrCodeRef}
            />

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
            onClick={handleDownload}
            className="w-full sm:w-auto"
          >
            <Download className="size-4" />
            Download QR
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handlePrint}
            className="w-full sm:w-auto"
          >
            <Printer className="size-4" />
            Print QR
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
