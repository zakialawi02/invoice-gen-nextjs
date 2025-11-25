import { Invoice, InvoiceItem, InvoiceStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type InvoiceWithItems = Invoice & { items: InvoiceItem[] };

type SerializableInvoiceItem = {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  rate: number;
  amount: number;
  notes: string | null;
  invoiceId: string;
};

type SerializableInvoice = {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  currency: string;
  fromName: string | null;
  fromAddress: string | null;
  fromPhone: string | null;
  fromEmail: string | null;
  fromWebsite: string | null;
  billToName: string | null;
  billToCompany: string | null;
  billToPhone: string | null;
  billToEmail: string | null;
  date: string | null;
  dueDate: string | null;
  balanceDue: number;
  amountPaid: number;
  taxRate: number;
  notes: string | null;
  subtotal: number;
  tax: number;
  total: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  items: SerializableInvoiceItem[];
};

const randomSuffix = () => Math.floor(Math.random() * 10_000)
  .toString()
  .padStart(4, "0");

export async function generateInvoiceNumber() {
  const year = new Date().getFullYear();

  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `INV-${year}-${Date.now().toString().slice(-6)}-${randomSuffix()}`;
    const existing = await prisma.invoice.findUnique({ where: { invoiceNumber: candidate } });

    if (!existing) {
      return candidate;
    }
  }

  return `INV-${year}-${crypto.randomUUID()}`;
}

export function serializeInvoice(invoice: InvoiceWithItems): SerializableInvoice {
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    currency: invoice.currency,
    fromName: invoice.fromName,
    fromAddress: invoice.fromAddress,
    fromPhone: invoice.fromPhone,
    fromEmail: invoice.fromEmail,
    fromWebsite: invoice.fromWebsite,
    billToName: invoice.billToName,
    billToCompany: invoice.billToCompany,
    billToPhone: invoice.billToPhone,
    billToEmail: invoice.billToEmail,
    date: invoice.date ? invoice.date.toISOString() : null,
    dueDate: invoice.dueDate ? invoice.dueDate.toISOString() : null,
    subtotal: Number(invoice.subtotal ?? 0),
    tax: Number(invoice.tax ?? 0),
    total: Number(invoice.total ?? 0),
    balanceDue: Number(invoice.balanceDue ?? 0),
    amountPaid: Number(invoice.amountPaid ?? 0),
    taxRate: Number(invoice.taxRate ?? 0),
    notes: invoice.notes,
    userId: invoice.userId,
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString(),
    items: invoice.items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      quantity: Number(item.quantity ?? 0),
      rate: Number(item.rate ?? 0),
      amount: Number(item.amount ?? 0),
      notes: item.notes,
      invoiceId: item.invoiceId,
    })),
  };
}

export { type SerializableInvoice, type SerializableInvoiceItem, type InvoiceWithItems, InvoiceStatus };
