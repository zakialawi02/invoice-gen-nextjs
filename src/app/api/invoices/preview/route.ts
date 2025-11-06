import { NextResponse } from "next/server";
import { getCurrencySymbol } from "@/lib/currency";

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

function escapePdfText(input: string): string {
  return input.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function formatCurrency(value: number, currency: string): string {
  return `${getCurrencySymbol(currency)} ${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

function buildInvoiceContent(invoice: Required<InvoicePayload>): string {
  const subtotal = invoice.items.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
  const taxAmount = (subtotal * invoice.taxRate) / 100;
  const total = subtotal + taxAmount - invoice.discount;

  const issuedDate = invoice.dateIssued
    ? new Date(invoice.dateIssued).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "N/A";

  const dueDate = invoice.dateDue
    ? new Date(invoice.dateDue).toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "N/A";

  const lines: string[] = [
    "BT",
    "/F1 20 Tf",
    "72 800 Td",
    `(${escapePdfText("INVOICE")}) Tj`,
    "/F1 12 Tf",
    "0 -28 Td",
    `(${escapePdfText(`Invoice Number: ${invoice.invoiceNumber || "INV-001"}`)}) Tj`,
    "0 -16 Td",
    `(${escapePdfText(`Date Issued: ${issuedDate}`)}) Tj`,
    "0 -16 Td",
    `(${escapePdfText(`Due Date: ${dueDate}`)}) Tj`,
    "0 -24 Td",
    "/F1 14 Tf",
    `(${escapePdfText("Bill To")}) Tj`,
    "/F1 12 Tf",
    "0 -18 Td",
    `(${escapePdfText("Brightstone Industries")}) Tj`,
    "0 -16 Td",
    `(${escapePdfText("jacobpau@brightstone.industries")}) Tj`,
    "0 -24 Td",
    "/F1 14 Tf",
    `(${escapePdfText("Items")}) Tj`,
    "/F1 12 Tf",
  ];

  invoice.items.forEach((item) => {
    lines.push("0 -18 Td");
    lines.push(
      `(${escapePdfText(`${item.quantity} x ${item.name} @ ${formatCurrency(item.unitPrice, invoice.currency)}`)}) Tj`,
    );
    lines.push(
      `(${escapePdfText(`Total: ${formatCurrency(item.quantity * item.unitPrice, invoice.currency)}`)}) Tj`,
    );
    if (item.description) {
      lines.push("0 -16 Td");
      lines.push(`(${escapePdfText(item.description)}) Tj`);
    }
  });

  lines.push("0 -24 Td");
  lines.push("/F1 14 Tf");
  lines.push(`(${escapePdfText("Summary")}) Tj`);
  lines.push("/F1 12 Tf");
  lines.push("0 -18 Td");
  lines.push(`(${escapePdfText(`Subtotal: ${formatCurrency(subtotal, invoice.currency)}`)}) Tj`);
  lines.push("0 -16 Td");
  lines.push(`(${escapePdfText(`Tax (${invoice.taxRate}%): ${formatCurrency(taxAmount, invoice.currency)}`)}) Tj`);
  if (invoice.discount > 0) {
    lines.push("0 -16 Td");
    lines.push(`(${escapePdfText(`Discount: ${formatCurrency(invoice.discount, invoice.currency)}`)}) Tj`);
  }
  lines.push("0 -16 Td");
  lines.push(`(${escapePdfText(`Total: ${formatCurrency(total, invoice.currency)}`)}) Tj`);

  if (invoice.note) {
    lines.push("0 -24 Td");
    lines.push("/F1 14 Tf");
    lines.push(`(${escapePdfText("Note")}) Tj`);
    lines.push("/F1 12 Tf");
    lines.push("0 -18 Td");
    lines.push(`(${escapePdfText(invoice.note)}) Tj`);
  }

  if (invoice.terms) {
    lines.push("0 -24 Td");
    lines.push("/F1 14 Tf");
    lines.push(`(${escapePdfText("Terms & Conditions")}) Tj`);
    lines.push("/F1 12 Tf");
    lines.push("0 -18 Td");
    lines.push(`(${escapePdfText(invoice.terms)}) Tj`);
  }

  lines.push("ET");
  return lines.join("\n");
}

function createPdf(invoice: Required<InvoicePayload>): Buffer {
  const content = buildInvoiceContent(invoice);
  const contentLength = Buffer.byteLength(content, "utf8");

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];

  const addObject = (objectContent: string) => {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    const objectIndex = offsets.length;
    pdf += `${objectIndex} 0 obj\n${objectContent}\nendobj\n`;
  };

  addObject("<< /Type /Catalog /Pages 2 0 R >>");
  addObject("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  addObject(
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
  );
  addObject(`<< /Length ${contentLength} >>\nstream\n${content}\nendstream`);
  addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  let xref = `xref\n0 ${offsets.length + 1}\n`;
  xref += "0000000000 65535 f \n";
  offsets.forEach((offset) => {
    xref += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  });

  const trailer = `trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  const pdfContent = pdf + xref + trailer;
  return Buffer.from(pdfContent, "utf8");
}

function withDefaults(payload: InvoicePayload): Required<InvoicePayload> {
  return {
    invoiceNumber: payload.invoiceNumber ?? "INV-001",
    dateIssued: payload.dateIssued ?? null,
    dateDue: payload.dateDue ?? null,
    currency: payload.currency ?? "USD",
    items: payload.items ?? [],
    taxRate: payload.taxRate ?? 0,
    discount: payload.discount ?? 0,
    note: payload.note ?? "",
    terms: payload.terms ?? "",
  };
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

    const pdfBuffer = createPdf(preparedInvoice);

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
