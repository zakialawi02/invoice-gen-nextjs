"use server";

import PDFDocument from "pdfkit";
import type PDFKit from "pdfkit";
import { format } from "date-fns";

import type { InvoiceData, InvoiceItem } from "@/types/invoice";
import { formatCurrency } from "@/lib/currency";

type InvoicePreviewPayload = Omit<InvoiceData, "invoiceDate" | "dueDate"> & {
  invoiceDate?: string | Date | null;
  dueDate?: string | Date | null;
};

type DownloadPreviewResponse = {
  base64: string;
  filename: string;
  mimeType: string;
};

export async function downloadInvoicePreview(
  payload: InvoicePreviewPayload,
): Promise<DownloadPreviewResponse> {
  const normalizedInvoice: InvoiceData = {
    ...payload,
    invoiceDate: payload.invoiceDate ? new Date(payload.invoiceDate) : undefined,
    dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
  };

  const pdfBuffer = await renderInvoicePdf(normalizedInvoice);

  return {
    base64: pdfBuffer.toString("base64"),
    filename: `invoice-${normalizedInvoice.invoiceNumber || "preview"}.pdf`,
    mimeType: "application/pdf",
  };
}

async function renderInvoicePdf(invoice: InvoiceData): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 48 });
  const chunks: Buffer[] = [];

  doc.on("data", (chunk) => chunks.push(chunk));

  const pdfCompleted = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  buildInvoiceContents(doc, invoice);
  doc.end();

  return pdfCompleted;
}

function buildInvoiceContents(doc: PDFKit.PDFDocument, invoice: InvoiceData) {
  const subtotal = invoice.items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const taxAmount = (subtotal * invoice.taxRate) / 100;
  const total = subtotal + taxAmount - invoice.discount;

  drawHeaderSection(doc, invoice);
  drawBillToSection(doc, invoice);
  drawItemsTable(doc, invoice);
  drawSummarySection(doc, invoice, subtotal, taxAmount, total);
  drawNotesSection(doc, invoice);
}

function drawHeaderSection(doc: PDFKit.PDFDocument, invoice: InvoiceData) {
  const drawWidth = getContentWidth(doc);
  const startY = doc.y;
  const leftX = doc.page.margins.left;

  doc.save();
  doc.roundedRect(leftX, startY, drawWidth, 90, 8).fill("#F8FAFC");
  doc.restore();

  doc.font("Helvetica-Bold").fontSize(26).fillColor("#0F172A");
  doc.text("INVOICE", leftX + 16, startY + 16, { width: drawWidth / 2 - 32 });
  doc.font("Helvetica").fontSize(12).fillColor("#475569");
  doc.text(`#${invoice.invoiceNumber || "ZKDEV001"}`, leftX + 16, doc.y + 6, {
    width: drawWidth / 2 - 32,
  });

  const rightColumnX = leftX + drawWidth / 2;
  doc.font("Helvetica-Bold").fontSize(12).fillColor("#0F172A");
  doc.text(invoice.companyName || "Your Company Name", rightColumnX, startY + 16, {
    width: drawWidth / 2 - 32,
    align: "right",
  });
  doc.font("Helvetica").fontSize(10).fillColor("#475569");
  doc.text(invoice.companyAddress || "yourcompany@email.com", rightColumnX, doc.y + 4, {
    width: drawWidth / 2 - 32,
    align: "right",
  });

  doc.y = startY + 90 + 16;
}

function drawBillToSection(doc: PDFKit.PDFDocument, invoice: InvoiceData) {
  const width = getContentWidth(doc);
  const leftX = doc.page.margins.left;
  const rightX = leftX + width / 2;
  const startY = doc.y;

  doc.font("Helvetica-Bold").fontSize(12).fillColor("#0F172A");
  doc.text("Bill To:", leftX, startY);
  doc.font("Helvetica").fontSize(11).fillColor("#0F172A");
  doc.text(invoice.clientName || "-", leftX, doc.y + 4);
  doc.font("Helvetica").fontSize(10).fillColor("#475569");
  doc.text(invoice.clientAddress || "-", leftX, doc.y + 2);
  const leftBottom = doc.y;

  doc.y = startY;
  doc.font("Helvetica").fontSize(10).fillColor("#475569");
  doc.text("Date Issued:", rightX, startY, { width: width / 2, align: "right" });
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#0F172A");
  doc.text(formatDate(invoice.invoiceDate), rightX, doc.y + 2, { width: width / 2, align: "right" });
  doc.font("Helvetica").fontSize(10).fillColor("#475569");
  doc.text("Due Date:", rightX, doc.y + 8, { width: width / 2, align: "right" });
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#0F172A");
  doc.text(formatDate(invoice.dueDate), rightX, doc.y + 2, { width: width / 2, align: "right" });
  const rightBottom = doc.y;

  doc.y = Math.max(leftBottom, rightBottom) + 16;

  doc.moveTo(leftX, doc.y).lineTo(leftX + width, doc.y).strokeColor("#E2E8F0").lineWidth(1).stroke();
  doc.y += 12;
}

function drawItemsTable(doc: PDFKit.PDFDocument, invoice: InvoiceData) {
  const width = getContentWidth(doc);
  const leftX = doc.page.margins.left;
  const tableTop = doc.y;
  const columns = [
    { label: "Item", width: width * 0.45, align: "left" as const },
    { label: "Qty", width: width * 0.15, align: "right" as const },
    { label: "Price", width: width * 0.2, align: "right" as const },
    { label: "Total", width: width * 0.2, align: "right" as const },
  ];
  const columnPositions = columns.reduce<number[]>((acc, column, index) => {
    const previous = index === 0 ? leftX : acc[index - 1] + columns[index - 1].width;
    return [...acc, previous];
  }, []);

  doc.save();
  doc.rect(leftX, tableTop, width, 28).fill("#F1F5F9");
  doc.restore();

  doc.font("Helvetica-Bold").fontSize(10).fillColor("#0F172A");
  columns.forEach((column, idx) => {
    doc.text(column.label, columnPositions[idx] + 8, tableTop + 9, {
      width: column.width - 16,
      align: column.align,
    });
  });

  let currentY = tableTop + 28;
  doc.moveTo(leftX, currentY).lineTo(leftX + width, currentY).strokeColor("#E2E8F0").lineWidth(1).stroke();

  if (!invoice.items.length) {
    doc.font("Helvetica").fontSize(10).fillColor("#64748B");
    doc.text("No items added yet.", leftX + 8, currentY + 12);
    doc.y = currentY + 36;
    return;
  }

  const padding = 10;

  invoice.items.forEach((item) => {
    const rowHeight = getRowHeight(doc, item, columns, padding, invoice.currency);
    const rowTop = currentY + 4;

    const originalY = doc.y;
    doc.y = rowTop;
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#0F172A");
    doc.text(item.itemName || "Untitled Item", columnPositions[0] + padding, doc.y, {
      width: columns[0].width - padding * 2,
    });
    if (item.description) {
      doc.font("Helvetica").fontSize(9).fillColor("#475569");
      doc.text(item.description, columnPositions[0] + padding, doc.y + 2, {
        width: columns[0].width - padding * 2,
      });
    }
    doc.y = originalY;

    doc.font("Helvetica").fontSize(10).fillColor("#0F172A");

    doc.y = rowTop;
    doc.text(String(item.quantity), columnPositions[1], rowTop, {
      width: columns[1].width - padding * 2,
      align: "right",
    });
    doc.y = originalY;

    doc.y = rowTop;
    doc.text(formatCurrency(item.unitPrice, invoice.currency), columnPositions[2], rowTop, {
      width: columns[2].width - padding * 2,
      align: "right",
    });
    doc.y = originalY;

    doc.y = rowTop;
    doc.text(formatCurrency(item.quantity * item.unitPrice, invoice.currency), columnPositions[3], rowTop, {
      width: columns[3].width - padding * 2,
      align: "right",
    });
    doc.y = originalY;

    currentY += rowHeight;

    doc
      .moveTo(leftX, currentY + 4)
      .lineTo(leftX + width, currentY + 4)
      .strokeColor("#E2E8F0")
      .lineWidth(1)
      .stroke();
  });

  doc.y = currentY + 16;
}

function drawSummarySection(
  doc: PDFKit.PDFDocument,
  invoice: InvoiceData,
  subtotal: number,
  taxAmount: number,
  total: number,
) {
  const width = getContentWidth(doc);
  const summaryWidth = Math.min(240, width * 0.4);
  const summaryX = doc.page.margins.left + width - summaryWidth;
  const startY = doc.y;

  const rows: Array<{ label: string; value: string; bold?: boolean }> = [
    { label: "Subtotal", value: formatCurrency(subtotal, invoice.currency) },
    { label: `Tax (${invoice.taxRate}%)`, value: formatCurrency(taxAmount, invoice.currency) },
  ];

  if (invoice.discount > 0) {
    rows.push({
      label: "Discount",
      value: `- ${formatCurrency(invoice.discount, invoice.currency)}`,
    });
  }

  rows.push({ label: "Total", value: formatCurrency(total, invoice.currency), bold: true });

  doc
    .moveTo(summaryX, startY)
    .lineTo(summaryX + summaryWidth, startY)
    .strokeColor("#E2E8F0")
    .lineWidth(1)
    .stroke();

  let cursor = startY + 12;
  rows.forEach((row) => {
    doc.font(row.bold ? "Helvetica-Bold" : "Helvetica").fontSize(row.bold ? 12 : 10).fillColor("#0F172A");
    doc.text(row.label, summaryX, cursor, { width: summaryWidth / 2 });
    doc.text(row.value, summaryX + summaryWidth / 2, cursor, {
      width: summaryWidth / 2,
      align: "right",
    });
    cursor += row.bold ? 20 : 16;
  });

  doc.y = Math.max(cursor, doc.y + 12);
}

function drawNotesSection(doc: PDFKit.PDFDocument, invoice: InvoiceData) {
  if (!invoice.notes && !invoice.additionalInfo) {
    return;
  }

  doc.moveDown();

  if (invoice.notes) {
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#0F172A").text("Note:");
    doc.font("Helvetica").fontSize(10).fillColor("#475569").text(invoice.notes);
    doc.moveDown(0.5);
  }

  if (invoice.additionalInfo) {
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#0F172A").text("Terms & Conditions:");
    doc.font("Helvetica").fontSize(10).fillColor("#475569").text(invoice.additionalInfo);
  }
}

function getRowHeight(
  doc: PDFKit.PDFDocument,
  item: InvoiceItem,
  columns: Array<{ width: number }>,
  padding: number,
  currency: string,
) {
  doc.font("Helvetica-Bold").fontSize(10);
  const nameHeight = doc.heightOfString(item.itemName || "Untitled Item", {
    width: columns[0].width - padding * 2,
  });
  doc.font("Helvetica").fontSize(9);
  const descriptionHeight = item.description
    ? doc.heightOfString(item.description, { width: columns[0].width - padding * 2 })
    : 0;

  doc.font("Helvetica").fontSize(10);
  const quantityHeight = doc.heightOfString(String(item.quantity), {
    width: columns[1].width - padding * 2,
  });
  const priceHeight = doc.heightOfString(formatCurrency(item.unitPrice, currency), {
    width: columns[2].width - padding * 2,
  });
  const totalHeight = doc.heightOfString(formatCurrency(item.quantity * item.unitPrice, currency), {
    width: columns[3].width - padding * 2,
  });

  const leftColumnHeight = nameHeight + (descriptionHeight ? descriptionHeight + 4 : 0);
  const otherHeight = Math.max(quantityHeight, priceHeight, totalHeight);

  return Math.max(Math.max(leftColumnHeight, otherHeight) + padding * 2, 32);
}

function getContentWidth(doc: PDFKit.PDFDocument) {
  return doc.page.width - doc.page.margins.left - doc.page.margins.right;
}

function formatDate(value?: Date) {
  if (!value) {
    return "-";
  }

  return format(value, "d MMM yyyy");
}
