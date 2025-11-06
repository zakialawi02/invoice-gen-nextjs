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
  const margin = 48;

  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const textColor = rgb(0.149, 0.149, 0.149);
  const subtextColor = rgb(0.41, 0.41, 0.41);
  const accentColor = rgb(0.11, 0.36, 0.63);
  const lightLine = rgb(0.89, 0.91, 0.94);
  const tableHeaderBg = rgb(0.96, 0.97, 0.99);

  let cursorY = height - margin;

  const drawText = (
    text: string,
    x: number,
    y: number,
    options: {
      size?: number;
      font?: typeof regularFont;
      color?: ReturnType<typeof rgb>;
      align?: "left" | "right" | "center";
    } = {},
  ) => {
    const { size = 12, font = regularFont, color = textColor, align = "left" } = options;
    let drawX = x;

    if (align === "right") {
      drawX = x - font.widthOfTextAtSize(text, size);
    } else if (align === "center") {
      drawX = x - font.widthOfTextAtSize(text, size) / 2;
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

  const drawLabelValue = (
    label: string,
    value: string,
    x: number,
    y: number,
    options: { align?: "left" | "right"; labelColor?: ReturnType<typeof rgb> } = {},
  ) => {
    const { align = "left", labelColor = subtextColor } = options;
    drawText(label, x, y, { size: 10, color: labelColor, align });
    drawText(value, x, y - 14, { size: 12, align });
  };

  // Header left side
  drawText("INVOICE", margin, cursorY, { font: boldFont, size: 28 });
  cursorY -= 34;
  drawText(`#${invoice.invoiceNumber || "INV-001"}`, margin, cursorY, {
    color: subtextColor,
    size: 12,
  });

  // Header right side (company badge + info)
  const headerRightX = width - margin;
  const badgeRadius = 26;
  const badgeCenterX = headerRightX - badgeRadius;
  const badgeCenterY = height - margin + 6;
  page.drawEllipse({
    x: badgeCenterX,
    y: badgeCenterY,
    xScale: badgeRadius,
    yScale: badgeRadius,
    color: rgb(0.82, 0.85, 0.9),
  });

  const initials = previewCompany.name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2) || "CN";

  drawText(initials, badgeCenterX, badgeCenterY - 9, {
    font: boldFont,
    size: 18,
    align: "center",
    color: rgb(0.29, 0.32, 0.4),
  });

  drawText(previewCompany.name, headerRightX, height - margin - 6, {
    font: boldFont,
    size: 12,
    align: "right",
  });
  drawText(previewCompany.email, headerRightX, height - margin - 22, {
    size: 10,
    color: subtextColor,
    align: "right",
  });

  cursorY -= 60;

  // Bill to section
  drawText("Bill To:", margin, cursorY, { font: boldFont, size: 12 });
  cursorY -= 18;
  drawText(previewRecipient.name, margin, cursorY, { size: 12 });
  cursorY -= 16;
  drawText(previewRecipient.email, margin, cursorY, { size: 10, color: subtextColor });

  // Date info on right
  const dateSectionY = height - margin - 74;
  drawLabelValue("Date Issued:", invoice.formattedDates.issued, headerRightX, dateSectionY, { align: "right" });
  drawLabelValue("Due Date:", invoice.formattedDates.due, headerRightX, dateSectionY - 44, { align: "right" });

  cursorY -= 78;

  // Items table header
  const columnXs = [margin, margin + 260, margin + 350, width - margin - 10];

  page.drawRectangle({
    x: margin,
    y: cursorY - 24,
    width: width - margin * 2,
    height: 32,
    color: tableHeaderBg,
  });

  drawText("Item", columnXs[0], cursorY, { font: boldFont, size: 11 });
  drawText("Qty", columnXs[1], cursorY, { font: boldFont, size: 11, align: "right" });
  drawText("Price", columnXs[2], cursorY, { font: boldFont, size: 11, align: "right" });
  drawText("Total", width - margin, cursorY, { font: boldFont, size: 11, align: "right" });

  cursorY -= 32;
  page.drawLine({
    start: { x: margin, y: cursorY + 6 },
    end: { x: width - margin, y: cursorY + 6 },
    thickness: 1,
    color: lightLine,
  });

  invoice.items.forEach((item) => {
    const rowTop = cursorY;
    drawText(item.name, columnXs[0], rowTop - 2, { font: boldFont, size: 11 });

    let rowHeight = 20;

    if (item.description) {
      const descriptionLines = wrapText(item.description, {
        size: 10,
        maxWidth: columnXs[1] - columnXs[0] - 12,
      });
      descriptionLines.forEach((line, index) => {
        drawText(line, columnXs[0], rowTop - 16 - index * 12, { size: 10, color: subtextColor });
      });
      rowHeight = Math.max(rowHeight, 20 + descriptionLines.length * 12);
    }

    drawText(String(item.quantity), columnXs[1], rowTop - 2, { size: 11, align: "right", color: subtextColor });
    drawText(formatCurrency(item.unitPrice, invoice.currency), columnXs[2], rowTop - 2, {
      size: 11,
      align: "right",
      color: subtextColor,
    });
    drawText(formatCurrency(item.quantity * item.unitPrice, invoice.currency), width - margin, rowTop - 2, {
      size: 11,
      align: "right",
    });

    cursorY -= rowHeight + 12;
    page.drawLine({
      start: { x: margin, y: cursorY + 6 },
      end: { x: width - margin, y: cursorY + 6 },
      thickness: 1,
      color: lightLine,
    });
  });

  cursorY -= 14;

  // Totals section
  const totalsLabelX = width - margin - 140;
  const totalsValueX = width - margin;
  const totals = [
    { label: "Subtotal:", value: formatCurrency(invoice.totals.subtotal, invoice.currency) },
    { label: `Tax (${invoice.taxRate}%):`, value: formatCurrency(invoice.totals.taxAmount, invoice.currency) },
  ];

  if (invoice.discount > 0) {
    totals.push({ label: "Discount:", value: `- ${formatCurrency(invoice.discount, invoice.currency)}` });
  }

  totals.forEach((line) => {
    drawText(line.label, totalsLabelX, cursorY, { size: 11, align: "right", color: subtextColor });
    drawText(line.value, totalsValueX, cursorY, { size: 11, align: "right" });
    cursorY -= 20;
  });

  page.drawLine({
    start: { x: totalsLabelX, y: cursorY + 12 },
    end: { x: totalsValueX, y: cursorY + 12 },
    thickness: 1.2,
    color: lightLine,
  });
  cursorY -= 20;

  drawText("Total:", totalsLabelX, cursorY, {
    size: 16,
    font: boldFont,
    align: "right",
  });
  drawText(formatCurrency(invoice.totals.total, invoice.currency), totalsValueX, cursorY, {
    size: 16,
    font: boldFont,
    align: "right",
    color: accentColor,
  });

  cursorY -= 36;

  // Notes and terms
  const sectionWidth = width - margin * 2;

  if (invoice.note) {
    drawText("Note:", margin, cursorY, { font: boldFont, size: 12 });
    cursorY -= 18;
    const noteLines = wrapText(invoice.note, {
      size: 11,
      maxWidth: sectionWidth,
    });
    noteLines.forEach((line, index) => {
      drawText(line, margin, cursorY - index * 14, { size: 11, color: subtextColor });
    });
    cursorY -= noteLines.length * 14 + 18;
  }

  if (invoice.terms) {
    drawText("Terms & Conditions:", margin, cursorY, { font: boldFont, size: 12 });
    cursorY -= 18;
    const termsLines = wrapText(invoice.terms, {
      size: 11,
      maxWidth: sectionWidth,
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
