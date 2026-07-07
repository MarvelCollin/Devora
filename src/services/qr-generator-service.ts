import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import JSZip from "jszip";

export const generateQrDataUrl = async (
  text: string,
  size: number = 256
): Promise<string> => {
  return QRCode.toDataURL(text, {
    width: size,
    margin: 1,
    color: { dark: "#000000", light: "#ffffff" },
  });
};

export interface BulkQrEntry {
  value: string;
  title: string;
  count: number;
}

export const parseBulkCsv = (text: string): BulkQrEntry[] => {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const parts = line.split(",").map((p) => p.trim());
      return {
        value: parts[0] || "",
        title: parts[1] || parts[0] || "",
        count: Math.max(1, parseInt(parts[2] || "1", 10) || 1),
      };
    })
    .filter((entry) => entry.value.length > 0);
};

const A4_WIDTH = 210;
const A4_HEIGHT = 297;
const MARGIN = 10;
const PAGE_TITLE_HEIGHT = 10;
const GAP = 4;
const LABEL_HEIGHT = 5;

interface GridLayout {
  cols: number;
  qrSize: number;
  cellH: number;
  fontSize: number;
}

const calcLayout = (maxCount: number): GridLayout => {
  const usableWidth = A4_WIDTH - 2 * MARGIN;
  const usableHeight = A4_HEIGHT - 2 * MARGIN - PAGE_TITLE_HEIGHT;

  let cols = Math.ceil(Math.sqrt(maxCount * (usableWidth / usableHeight)));
  let rows = Math.ceil(maxCount / cols);
  let qrSize = Math.floor(Math.min(
    (usableWidth - (cols - 1) * GAP) / cols,
    (usableHeight - (rows - 1) * GAP - rows * LABEL_HEIGHT) / rows
  ));

  while (cols * rows < maxCount || qrSize < 8) {
    cols++;
    rows = Math.ceil(maxCount / cols);
    qrSize = Math.floor(Math.min(
      (usableWidth - (cols - 1) * GAP) / cols,
      (usableHeight - (rows - 1) * GAP - rows * LABEL_HEIGHT) / rows
    ));
  }

  return {
    cols,
    qrSize,
    cellH: qrSize + LABEL_HEIGHT,
    fontSize: Math.min(7, qrSize / 2.5),
  };
};

const buildRoomPdf = async (
  value: string,
  title: string,
  count: number,
  layout: GridLayout
): Promise<Uint8Array> => {
  const { cols, qrSize, cellH, fontSize } = layout;

  const dataUrl = await QRCode.toDataURL(value, {
    width: qrSize * 4,
    margin: 1,
  });

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.text(title, A4_WIDTH / 2, MARGIN + 6, { align: "center" });

  const startY = MARGIN + PAGE_TITLE_HEIGHT;

  pdf.setFontSize(fontSize);
  pdf.setFont("helvetica", "normal");

  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;

    const x = MARGIN + col * (qrSize + GAP);
    const y = startY + row * (cellH + GAP);

    pdf.setDrawColor(200);
    pdf.setLineWidth(0.1);
    pdf.rect(x - 1, y - 1, qrSize + 2, cellH + 2);

    pdf.addImage(dataUrl, "PNG", x, y, qrSize, qrSize);
    pdf.setTextColor(0);
    pdf.text(value, x + qrSize / 2, y + qrSize + LABEL_HEIGHT - 1, {
      align: "center",
    });
  }

  return pdf.output("arraybuffer") as unknown as Uint8Array;
};

const sanitizeFilename = (name: string): string => {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_");
};

export const generateBulkZip = async (
  entries: BulkQrEntry[]
): Promise<void> => {
  const maxCount = Math.max(...entries.map((e) => e.count));
  const layout = calcLayout(maxCount);

  if (entries.length === 1) {
    const e = entries[0];
    const pdfBytes = await buildRoomPdf(e.value, e.title, e.count, layout);
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `${sanitizeFilename(e.title)}.pdf`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    return;
  }

  const zip = new JSZip();
  for (const entry of entries) {
    const pdfBytes = await buildRoomPdf(entry.value, entry.title, entry.count, layout);
    zip.file(`${sanitizeFilename(entry.title)}.pdf`, pdfBytes);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = "qrcodes.zip";
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
};
