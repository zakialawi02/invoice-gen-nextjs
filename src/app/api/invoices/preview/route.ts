import { NextResponse } from "next/server";
import { getCurrencySymbol } from "@/lib/currency";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type InvoiceItem = {
  name: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
};

type InvoicePayload = {
  invoiceNumber?: string;
  dateIssued?: string | null;
  dateDue?: string | null;
  currency?: string;
  items?: InvoiceItem[];
  taxRate?: number;
  discount?: number;
  note?: string;
  terms?: string;
};

type PreparedInvoice = Required<InvoicePayload> & {
  totals: {
    subtotal: number;
    taxAmount: number;
    total: number;
  };
  formattedDates: {
    issued: string;
    due: string;
  };
};

const previewCompany = {
  name: "Your Company Name",
  email: "yourcompany@email.com",
};

const previewRecipient = {
  name: "Brightstone Industries",
  email: "jacobpau@brightstone.industries",
};

function formatCurrency(value: number, currency: string): string {
  return `${getCurrencySymbol(currency)} ${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function withDefaults(payload: InvoicePayload): PreparedInvoice {
  const invoiceNumber = payload.invoiceNumber ?? "INV-001";
  const dateIssued = payload.dateIssued ?? null;
  const dateDue = payload.dateDue ?? null;
  const currency = payload.currency ?? "USD";
  const items = payload.items ?? [];
  const taxRate = payload.taxRate ?? 0;
  const discount = payload.discount ?? 0;
  const note = payload.note ?? "";
  const terms = payload.terms ?? "";

  const subtotal = items.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount - discount;

  return {
    invoiceNumber,
    dateIssued,
    dateDue,
    currency,
    items,
    taxRate,
    discount,
    note,
    terms,
    totals: { subtotal, taxAmount, total },
    formattedDates: {
      issued: formatDate(dateIssued),
      due: formatDate(dateDue),
    },
  };
}

async function createPdf(invoice: PreparedInvoice): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const margin = 40;

  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const textColor = rgb(0.18, 0.18, 0.18);
  const subtextColor = rgb(0.4, 0.4, 0.4);

  let cursorY = height - margin;

  const drawText = (
    text: string,
    x: number,
    y: number,
    options: { size?: number; font?: typeof regularFont; color?: ReturnType<typeof rgb>; align?: "left" | "right" } = {},
  ) => {
    const { size = 12, font = regularFont, color = textColor, align = "left" } = options;
    let drawX = x;
    if (align === "right") {
      drawX = x - font.widthOfTextAtSize(text, size);
    }

    page.drawText(text, {
      x: drawX,
      y,
      size,
      font,
      color,
    });
  };

  const wrapText = (
    text: string,
    options: { font?: typeof regularFont; size?: number; maxWidth: number },
  ): string[] => {
    const { font = regularFont, size = 12, maxWidth } = options;
    const trimmed = text.trim();
    if (!trimmed) {
      return [];
    }

    const words = trimmed.split(/\s+/);
    const lines: string[] = [];
    let currentLine = "";

    words.forEach((word) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, size);
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  };

  // Header left side
  drawText("INVOICE", margin, cursorY, { font: boldFont, size: 24 });
  cursorY -= 28;
  drawText(`#${invoice.invoiceNumber || "INV-001"}`, margin, cursorY, { color: subtextColor, size: 12 });

  // Header right side (company info)
  const headerRightX = width - margin;
  drawText(previewCompany.name, headerRightX, height - margin - 4, {
    font: boldFont,
    size: 12,
    color: textColor,
    align: "right",
  });
  drawText(previewCompany.email, headerRightX, height - margin - 20, {
    size: 10,
    color: subtextColor,
    align: "right",
  });

  cursorY -= 52;

  // Bill to section
  drawText("Bill To:", margin, cursorY, { font: boldFont, size: 12 });
  cursorY -= 16;
  drawText(previewRecipient.name, margin, cursorY, { size: 12 });
  cursorY -= 16;
  drawText(previewRecipient.email, margin, cursorY, { size: 10, color: subtextColor });

  // Date info on right
  const dateYStart = height - margin - 64;
  drawText("Date Issued:", headerRightX, dateYStart, { size: 10, color: subtextColor, align: "right" });
  drawText(invoice.formattedDates.issued, headerRightX, dateYStart - 14, {
    size: 12,
    align: "right",
  });
  drawText("Due Date:", headerRightX, dateYStart - 32, { size: 10, color: subtextColor, align: "right" });
  drawText(invoice.formattedDates.due, headerRightX, dateYStart - 46, {
    size: 12,
    align: "right",
  });

  cursorY -= 64;

  // Items table header
  const tableStartY = cursorY;
  const columnXs = [margin, margin + 250, margin + 320, margin + 420];

  page.drawLine({
    start: { x: margin, y: tableStartY },
    end: { x: width - margin, y: tableStartY },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  });

  cursorY -= 18;
  drawText("Item", columnXs[0], cursorY, { font: boldFont, size: 12 });
  drawText("Qty", columnXs[1], cursorY, { font: boldFont, size: 12, align: "right" });
  drawText("Price", columnXs[2], cursorY, { font: boldFont, size: 12, align: "right" });
  drawText("Total", columnXs[3], cursorY, { font: boldFont, size: 12, align: "right" });

  cursorY -= 8;
  page.drawLine({
    start: { x: margin, y: cursorY },
    end: { x: width - margin, y: cursorY },
    thickness: 1,
    color: rgb(0.9, 0.9, 0.9),
  });

  cursorY -= 10;

  invoice.items.forEach((item) => {
    const rowTopY = cursorY;
    drawText(item.name, columnXs[0], rowTopY, { size: 12, font: boldFont });

    let rowHeight = 24;

    if (item.description) {
      const descriptionLines = wrapText(item.description, {
        font: regularFont,
        size: 10,
        maxWidth: columnXs[1] - columnXs[0] - 16,
      });
      descriptionLines.forEach((line, index) => {
        drawText(line, columnXs[0], rowTopY - 14 - index * 12, { size: 10, color: subtextColor });
      });
      rowHeight = Math.max(rowHeight, 24 + descriptionLines.length * 12);
    }

    drawText(String(item.quantity), columnXs[1], rowTopY, { size: 12, align: "right" });
    drawText(formatCurrency(item.unitPrice, invoice.currency), columnXs[2], rowTopY, {
      size: 12,
      align: "right",
    });
    drawText(formatCurrency(item.quantity * item.unitPrice, invoice.currency), columnXs[3], rowTopY, {
      size: 12,
      align: "right",
    });

    cursorY -= rowHeight;

    page.drawLine({
      start: { x: margin, y: cursorY + 8 },
      end: { x: width - margin, y: cursorY + 8 },
      thickness: 1,
      color: rgb(0.95, 0.95, 0.95),
    });
  });

  // Totals section
  const totalsX = width - margin;
  cursorY -= 10;

  const totals = [
    { label: "Subtotal:", value: formatCurrency(invoice.totals.subtotal, invoice.currency), emphasize: false },
    {
      label: `Tax (${invoice.taxRate}%):`,
      value: formatCurrency(invoice.totals.taxAmount, invoice.currency),
      emphasize: false,
    },
  ];

  if (invoice.discount > 0) {
    totals.push({
      label: "Discount:",
      value: `- ${formatCurrency(invoice.discount, invoice.currency)}`,
      emphasize: false,
    });
  }

  totals.push({
    label: "Total:",
    value: formatCurrency(invoice.totals.total, invoice.currency),
    emphasize: true,
  });

  totals.forEach((line) => {
    if (line.emphasize) {
      page.drawLine({
        start: { x: totalsX - 180, y: cursorY + 14 },
        end: { x: totalsX, y: cursorY + 14 },
        thickness: 1,
        color: rgb(0.85, 0.85, 0.85),
      });
    }

    drawText(line.label, totalsX - 100, cursorY, {
      size: line.emphasize ? 14 : 12,
      font: line.emphasize ? boldFont : regularFont,
      color: line.emphasize ? textColor : subtextColor,
      align: "right",
    });
    drawText(line.value, totalsX, cursorY, {
      size: line.emphasize ? 14 : 12,
      font: boldFont,
      align: "right",
      color: textColor,
    });

    cursorY -= line.emphasize ? 28 : 20;
  });

  // Notes and terms
  cursorY -= 10;

  if (invoice.note) {
    drawText("Note:", margin, cursorY, { font: boldFont, size: 12 });
    cursorY -= 16;
    const noteLines = wrapText(invoice.note, {
      font: regularFont,
      size: 11,
      maxWidth: width - margin * 2,
    });
    noteLines.forEach((line, index) => {
      drawText(line, margin, cursorY - index * 14, { size: 11, color: subtextColor });
    });
    cursorY -= noteLines.length * 14 + 10;
  }

  if (invoice.terms) {
    drawText("Terms & Conditions:", margin, cursorY, { font: boldFont, size: 12 });
    cursorY -= 16;
    const termsLines = wrapText(invoice.terms, {
      font: regularFont,
      size: 11,
      maxWidth: width - margin * 2,
    });
    termsLines.forEach((line, index) => {
      drawText(line, margin, cursorY - index * 14, { size: 11, color: subtextColor });
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

export async function POST(request: Request) {
  try {
    const { invoiceData } = (await request.json()) as { invoiceData?: InvoicePayload };

    if (!invoiceData) {
      return NextResponse.json({ error: "Missing invoice data" }, { status: 400 });
    }

    const preparedInvoice = withDefaults(invoiceData);

    if (preparedInvoice.items.length === 0) {
      return NextResponse.json({ error: "Invoice requires at least one item" }, { status: 400 });
    }

    const pdfBuffer = await createPdf(preparedInvoice);

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${preparedInvoice.invoiceNumber || "preview"}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error("Failed to generate invoice PDF", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
