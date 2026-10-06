import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import miitLogo from "@/assets/MIIT_LOGO.jpg";

function removeTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

/**
 * The URL encoded into physical QR labels. Configure VITE_PUBLIC_APP_URL with
 * a LAN address or deployed domain so phones can open the scan result page.
 */
export const PUBLIC_APP_URL = removeTrailingSlash(
  import.meta.env.VITE_PUBLIC_APP_URL?.trim() || window.location.origin,
);

export function accessoryScanUrl(code: string) {
  return `${PUBLIC_APP_URL}/scan/${encodeURIComponent(code)}`;
}

async function imageUrlToDataUrl(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Unable to load the MIIT logo.");
  const blob = await response.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Unable to read the MIIT logo."));
    reader.onerror = () => reject(new Error("Unable to read the MIIT logo."));
    reader.readAsDataURL(blob);
  });
}

export async function downloadQrCodePdf(codes: readonly string[]) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const logoDataUrl = await imageUrlToDataUrl(miitLogo);
  const columns = 3;
  const rowsPerPage = 3;
  const pageCapacity = columns * rowsPerPage;
  const marginX = 12;
  const startY = 20;
  const cardWidth = 62;
  const cardHeight = 61;

  for (const [index, code] of codes.entries()) {
    if (index > 0 && index % pageCapacity === 0) {
      pdf.addPage();
    }

    const position = index % pageCapacity;
    const column = position % columns;
    const row = Math.floor(position / columns);
    const x = marginX + column * cardWidth;
    const y = startY + row * cardHeight;
    const png = await QRCode.toDataURL(accessoryScanUrl(code), {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 360,
      color: { dark: "#020617", light: "#f8fafc" },
    });

    pdf.setDrawColor("#cbd5e1");
    pdf.roundedRect(x, y, 56, 56, 2, 2, "S");
    pdf.addImage(png, "PNG", x + 5, y + 4, 46, 46);
    pdf.setFillColor("#f8fafc");
    pdf.roundedRect(x + 22, y + 21, 12, 12, 2, 2, "F");
    pdf.addImage(logoDataUrl, "JPEG", x + 23, y + 22, 10, 10);
    pdf.setFont("courier", "bold");
    pdf.setFontSize(7);
    pdf.text(code, x + 28, y + 53, { align: "center" });
  }

  pdf.save("MIIT-Store-QR-Codes.pdf");
}
