"use server";

import { format } from "date-fns";
import { formatCurrency } from "@/lib/currency";
import { InvoiceData, InvoiceItem } from "@/types/invoice";

const PAGE_WIDTH = 595.28; // A4 width in points (8.27in * 72)
const PAGE_HEIGHT = 841.89; // A4 height in points (11.69in * 72)
const MARGIN = 40;

const DEFAULT_INVOICE_NUMBER = "ZKDEV001";

export type InvoicePreviewPayload = Omit<
  InvoiceData,
  "invoiceDate" | "dueDate" | "items"
> & {
  invoiceDate?: string | null;
  dueDate?: string | null;
  items: InvoiceItem[];
};

type NormalizedInvoiceData = Omit<InvoiceData, "invoiceDate" | "dueDate"> & {
  invoiceDate?: Date;
  dueDate?: Date;
};

type PdfColor = [number, number, number];

const COLORS = {
  primaryText: normalizeColor(17, 24, 39),
  mutedText: normalizeColor(75, 85, 99),
  border: normalizeColor(229, 231, 235),
  tableHeaderBackground: normalizeColor(249, 250, 251),
  discount: normalizeColor(239, 68, 68),
};

const DEFAULT_TEXT_COLOR: PdfColor = COLORS.primaryText;

type PdfGenerationResult = {
  base64: string;
  fileName: string;
};

export async function downloadInvoicePreview(payload: InvoicePreviewPayload): Promise<PdfGenerationResult> {
  const normalized = normalizeInvoiceData(payload);
  const pdfBuffer = createInvoicePdf(normalized);
  const fileName = `invoice-${normalized.invoiceNumber || DEFAULT_INVOICE_NUMBER}.pdf`;

  return {
    base64: pdfBuffer.toString("base64"),
    fileName,
  };
}

function normalizeInvoiceData(payload: InvoicePreviewPayload): NormalizedInvoiceData {
  return {
    ...payload,
    invoiceDate: payload.invoiceDate ? new Date(payload.invoiceDate) : undefined,
    dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
    items: payload.items ?? [],
  };
}

function createInvoicePdf(invoice: NormalizedInvoiceData): Buffer {
  const contentParts: string[] = [];

  const colWidths = [0.52, 0.12, 0.16, 0.2].map((fraction) => fraction * (PAGE_WIDTH - MARGIN * 2));
  const columnPositions = colWidths.reduce<number[]>((acc, width, index) => {
    if (index === 0) {
      acc.push(MARGIN);
    } else {
      const previous = acc[index - 1] + colWidths[index - 1];
      acc.push(previous);
    }
    return acc;
  }, []);
  const tableRight = MARGIN + colWidths.reduce((acc, width) => acc + width, 0);

  let cursorY = PAGE_HEIGHT - MARGIN;

  // Header
  contentParts.push(textBlock("INVOICE", MARGIN, cursorY, 24, "F2"));
  cursorY -= 18;
  const invoiceNumber = invoice.invoiceNumber || DEFAULT_INVOICE_NUMBER;
  contentParts.push(textBlock(`#${invoiceNumber}`, MARGIN, cursorY, 12, "F1", COLORS.mutedText));

  const rightColumnX = PAGE_WIDTH - MARGIN - 200;
  contentParts.push(
    textBlock(
      invoice.companyName || "Your Company Name",
      rightColumnX,
      PAGE_HEIGHT - MARGIN,
      12,
      "F2",
    ),
  );
  cursorY -= 36;
  contentParts.push(
    textBlock(
      invoice.companyAddress || "",
      rightColumnX,
      PAGE_HEIGHT - MARGIN - 18,
      10,
      "F1",
      COLORS.mutedText,
    ),
  );

  // Bill To and Dates
  const billToYStart = cursorY;
  contentParts.push(textBlock("Bill To:", MARGIN, billToYStart, 11, "F2"));
  contentParts.push(textBlock(invoice.clientName || "-", MARGIN, billToYStart - 14, 10));
  contentParts.push(
    textBlock(
      invoice.clientAddress || "-",
      MARGIN,
      billToYStart - 28,
      10,
      "F1",
      COLORS.mutedText,
    ),
  );

  const dateColumnX = PAGE_WIDTH - MARGIN - 200;
  const issuedDate = invoice.invoiceDate ? format(invoice.invoiceDate, "d MMM yyyy") : "-";
  const dueDate = invoice.dueDate ? format(invoice.dueDate, "d MMM yyyy") : "-";
  contentParts.push(textBlock("Date Issued:", dateColumnX, billToYStart, 10, "F2", COLORS.mutedText));
  contentParts.push(textBlock(issuedDate, dateColumnX, billToYStart - 14, 10));
  contentParts.push(textBlock("Due Date:", dateColumnX, billToYStart - 32, 10, "F2", COLORS.mutedText));
  contentParts.push(textBlock(dueDate, dateColumnX, billToYStart - 46, 10));

  cursorY = billToYStart - 70;

  // Items Table Header
  const tableTop = cursorY;
  const tableHeaderHeight = 24;
  contentParts.push(
    fillRect(
      MARGIN,
      tableTop,
      tableRight - MARGIN,
      tableHeaderHeight,
      COLORS.tableHeaderBackground,
    ),
  );
  contentParts.push(drawRow(tableTop, tableHeaderHeight, columnPositions, tableRight));
  const headerTextY = tableTop - 16;
  contentParts.push(textBlock("Item", columnPositions[0] + 6, headerTextY, 11, "F2"));
  contentParts.push(textBlock("Qty", columnPositions[1] + colWidths[1] - 32, headerTextY, 11, "F2"));
  contentParts.push(textBlock("Price", columnPositions[2] + colWidths[2] - 40, headerTextY, 11, "F2"));
  contentParts.push(textBlock("Total", columnPositions[3] + colWidths[3] - 40, headerTextY, 11, "F2"));

  let rowTop = tableTop - tableHeaderHeight;

  const subtotal = invoice.items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const taxAmount = (subtotal * invoice.taxRate) / 100;
  const total = subtotal + taxAmount - invoice.discount;

  if (invoice.items.length === 0) {
    const emptyHeight = 32;
    contentParts.push(drawRow(rowTop, emptyHeight, columnPositions, tableRight));
    const emptyText = "No items added yet.";
    const textWidth = estimateTextWidth(emptyText, 11);
    const emptyTextX = MARGIN + (tableRight - MARGIN) / 2 - textWidth / 2;
    contentParts.push(textBlock(emptyText, emptyTextX, rowTop - 18, 11, "F1", COLORS.mutedText));
    rowTop -= emptyHeight;
  } else {
    for (const item of invoice.items) {
      const descriptionLines = item.description ? wrapText(item.description, 58) : [];
      const rowHeight = 24 + (descriptionLines.length > 0 ? descriptionLines.length * 12 : 0);
      contentParts.push(drawRow(rowTop, rowHeight, columnPositions, tableRight));
      let textY = rowTop - 16;
      contentParts.push(textBlock(item.itemName || "-", columnPositions[0] + 6, textY, 11, "F2"));
      if (descriptionLines.length > 0) {
        textY -= 12;
        for (const line of descriptionLines) {
          contentParts.push(textBlock(line, columnPositions[0] + 6, textY, 9, "F1", COLORS.mutedText));
          textY -= 12;
        }
      }

      const quantityText = `${item.quantity}`;
      const unitPriceText = formatCurrency(item.unitPrice, invoice.currency);
      const itemTotalText = formatCurrency(item.quantity * item.unitPrice, invoice.currency);

      contentParts.push(
        textBlock(
          quantityText,
          columnPositions[1] + colWidths[1] - 6 - estimateTextWidth(quantityText, 11),
          rowTop - 16,
          11,
        ),
      );
      contentParts.push(
        textBlock(
          unitPriceText,
          columnPositions[2] + colWidths[2] - 6 - estimateTextWidth(unitPriceText, 11),
          rowTop - 16,
          11,
        ),
      );
      contentParts.push(
        textBlock(
          itemTotalText,
          columnPositions[3] + colWidths[3] - 6 - estimateTextWidth(itemTotalText, 11),
          rowTop - 16,
          11,
          "F2",
        ),
      );

      rowTop -= rowHeight;
    }
  }

  cursorY = rowTop - 30;

  // Totals section
  const totalsLeft = tableRight - 180;
  let totalsY = cursorY;
  const totalsSpacing = 16;

  const subtotalText = formatCurrency(subtotal, invoice.currency);
  const taxText = `${formatCurrency(taxAmount, invoice.currency)}`;
  const discountText = invoice.discount > 0 ? formatCurrency(invoice.discount, invoice.currency) : "";
  const totalText = formatCurrency(total, invoice.currency);

  contentParts.push(textBlock("Subtotal:", totalsLeft, totalsY, 11, "F1", COLORS.mutedText));
  contentParts.push(
    textBlock(
      subtotalText,
      tableRight - 6 - estimateTextWidth(subtotalText, 11),
      totalsY,
      11,
      "F2",
    ),
  );
  totalsY -= totalsSpacing;

  contentParts.push(textBlock(`Tax (${invoice.taxRate}%):`, totalsLeft, totalsY, 11, "F1", COLORS.mutedText));
  contentParts.push(
    textBlock(
      taxText,
      tableRight - 6 - estimateTextWidth(taxText, 11),
      totalsY,
      11,
      "F2",
    ),
  );
  totalsY -= totalsSpacing;

  if (invoice.discount > 0) {
    contentParts.push(textBlock("Discount:", totalsLeft, totalsY, 11, "F1", COLORS.mutedText));
    contentParts.push(
      textBlock(
        `- ${discountText}`,
        tableRight - 6 - estimateTextWidth(`- ${discountText}`, 11),
        totalsY,
        11,
        "F2",
        COLORS.discount,
      ),
    );
    totalsY -= totalsSpacing;
  }

  const totalDividerY = totalsY + totalsSpacing - 6;
  contentParts.push(drawHorizontalLine(totalsLeft, tableRight, totalDividerY, COLORS.border));
  contentParts.push(textBlock("Total:", totalsLeft, totalsY, 13, "F2"));
  contentParts.push(
    textBlock(
      totalText,
      tableRight - 6 - estimateTextWidth(totalText, 13),
      totalsY,
      13,
      "F2",
    ),
  );

  cursorY = totalsY - 36;

  // Notes & Terms
  if (invoice.notes) {
    const noteLines = wrapText(invoice.notes, 90);
    contentParts.push(textBlock("Note:", MARGIN, cursorY, 11, "F2"));
    cursorY -= 14;
    for (const line of noteLines) {
      contentParts.push(textBlock(line, MARGIN, cursorY, 10, "F1", COLORS.mutedText));
      cursorY -= 12;
    }
    cursorY -= 12;
  }

  if (invoice.additionalInfo) {
    const additionalLines = wrapText(invoice.additionalInfo, 90);
    contentParts.push(textBlock("Terms & Conditions:", MARGIN, cursorY, 11, "F2"));
    cursorY -= 14;
    for (const line of additionalLines) {
      contentParts.push(textBlock(line, MARGIN, cursorY, 10, "F1", COLORS.mutedText));
      cursorY -= 12;
    }
  }

  const contentStream = contentParts.join("\n");
  const contentLength = Buffer.byteLength(contentStream, "utf8");

  const objects = [
    {
      id: 1,
      content: "<< /Type /Catalog /Pages 2 0 R >>",
    },
    {
      id: 2,
      content: "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    },
    {
      id: 3,
      content: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH.toFixed(2)} ${PAGE_HEIGHT.toFixed(2)}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>`,
    },
    {
      id: 4,
      content: `<< /Length ${contentLength} >>\nstream\n${contentStream}\nendstream`,
    },
    {
      id: 5,
      content: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    },
    {
      id: 6,
      content: "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    },
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  let currentOffset = Buffer.byteLength(pdf, "utf8");

  for (const obj of objects) {
    const objString = `${obj.id} 0 obj\n${obj.content}\nendobj\n`;
    offsets.push(currentOffset);
    pdf += objString;
    currentOffset += Buffer.byteLength(objString, "utf8");
  }

  const xrefOffset = currentOffset;
  let xref = `xref\n0 ${objects.length + 1}\n`;
  xref += "0000000000 65535 f \n";
  for (let i = 1; i <= objects.length; i++) {
    xref += `${offsets[i].toString().padStart(10, "0")} 00000 n \n`;
  }

  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  pdf += xref + trailer;

  return Buffer.from(pdf, "utf8");
}

function textBlock(
  text: string,
  x: number,
  y: number,
  fontSize = 12,
  fontRef: "F1" | "F2" = "F1",
  color: PdfColor = DEFAULT_TEXT_COLOR,
): string {
  const escaped = escapePdfText(text ?? "");
  const colorOps = formatColor(color, "rg");
  return `${colorOps}\nBT /${fontRef} ${fontSize} Tf 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${escaped}) Tj ET`;
}

function drawRow(
  top: number,
  height: number,
  columnPositions: number[],
  tableRight: number,
  strokeColor: PdfColor = COLORS.border,
): string {
  const bottom = top - height;
  const left = columnPositions[0];
  const segments: string[] = [];
  segments.push(formatColor(strokeColor, "RG"));
  segments.push("0.75 w");
  // Horizontal borders
  segments.push(`${left.toFixed(2)} ${top.toFixed(2)} m ${tableRight.toFixed(2)} ${top.toFixed(2)} l S`);
  segments.push(`${left.toFixed(2)} ${bottom.toFixed(2)} m ${tableRight.toFixed(2)} ${bottom.toFixed(2)} l S`);
  // Vertical borders
  segments.push(`${left.toFixed(2)} ${top.toFixed(2)} m ${left.toFixed(2)} ${bottom.toFixed(2)} l S`);
  segments.push(`${tableRight.toFixed(2)} ${top.toFixed(2)} m ${tableRight.toFixed(2)} ${bottom.toFixed(2)} l S`);
  for (let i = 1; i < columnPositions.length; i++) {
    const x = columnPositions[i];
    segments.push(`${x.toFixed(2)} ${top.toFixed(2)} m ${x.toFixed(2)} ${bottom.toFixed(2)} l S`);
  }
  return segments.join("\n");
}

function drawHorizontalLine(
  left: number,
  right: number,
  y: number,
  color: PdfColor,
  lineWidth = 0.75,
): string {
  return `${formatColor(color, "RG")}\n${lineWidth.toFixed(2)} w\n${left.toFixed(2)} ${y.toFixed(2)} m ${right.toFixed(2)} ${y.toFixed(2)} l S`;
}

function fillRect(left: number, top: number, width: number, height: number, color: PdfColor): string {
  const bottom = top - height;
  return `${formatColor(color, "rg")}\n${left.toFixed(2)} ${bottom.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f`;
}

function formatColor(color: PdfColor, operator: "rg" | "RG"): string {
  const [r, g, b] = color;
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} ${operator}`;
}

function normalizeColor(r: number, g: number, b: number): PdfColor {
  return [r / 255, g / 255, b / 255];
}

function escapePdfText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\r/g, " ")
    .replace(/\n/g, " ");
}

function wrapText(text: string, maxChars: number): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return [];
  }
  const words = normalized.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length > maxChars) {
      if (currentLine) {
        lines.push(currentLine);
      }
      if (word.length > maxChars) {
        const chunks = chunkWord(word, maxChars);
        lines.push(...chunks.slice(0, -1));
        currentLine = chunks[chunks.length - 1] ?? "";
      } else {
        currentLine = word;
      }
    } else {
      currentLine = candidate;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines;
}

function chunkWord(word: string, maxChars: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < word.length; i += maxChars) {
    chunks.push(word.slice(i, i + maxChars));
  }
  return chunks;
}

function estimateTextWidth(text: string, fontSize: number): number {
  const averageWidthFactor = 0.5; // Approximate width factor for Helvetica
  return text.length * fontSize * averageWidthFactor;
}
