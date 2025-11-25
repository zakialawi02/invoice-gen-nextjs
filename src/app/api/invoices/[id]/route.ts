import { InvoiceStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { serializeInvoice } from "@/lib/invoice";
import { prisma } from "@/lib/prisma";

interface InvoiceItemPayload {
  id?: string;
  name: string;
  description?: string;
  quantity?: number;
  rate?: number;
  notes?: string;
}

interface InvoicePayload {
  fromName?: string;
  fromAddress?: string;
  fromPhone?: string;
  fromEmail?: string;
  fromWebsite?: string;
  billToName?: string;
  billToCompany?: string;
  billToPhone?: string;
  billToEmail?: string;
  date?: string | null;
  dueDate?: string | null;
  notes?: string;
  currency?: string;
  taxRate?: number;
  amountPaid?: number;
  status?: string;
  items?: InvoiceItemPayload[];
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: { items: true },
  });

  if (!invoice) {
    return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
  }

  return NextResponse.json(serializeInvoice(invoice));
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: { items: true },
  });

  if (!invoice) {
    return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as InvoicePayload;
  const items = Array.isArray(body.items) ? body.items : [];
  const normalizedItems = items.map((item) => {
    const quantity = Number(item.quantity ?? 0);
    const rate = Number(item.rate ?? 0);
    return {
      id: item.id,
      name: item.name || "Untitled item",
      description: item.description,
      quantity,
      rate,
      amount: quantity * rate,
      notes: item.notes,
    };
  });

  const subtotal = normalizedItems.reduce((sum, item) => sum + item.amount, 0);
  const taxRate = Number(body.taxRate ?? 0);
  const taxAmount = Number(((subtotal * taxRate) / 100).toFixed(2));
  const total = Number((subtotal + taxAmount).toFixed(2));
  const amountPaid = Number(body.amountPaid ?? invoice.amountPaid ?? 0);
  const balanceDue = Number((total - amountPaid).toFixed(2));

  const requestedStatus = (body.status as InvoiceStatus | undefined)?.toUpperCase?.();
  const status = requestedStatus && Object.values(InvoiceStatus).includes(requestedStatus as InvoiceStatus)
    ? (requestedStatus as InvoiceStatus)
    : invoice.status;

  const parsedDate = body.date ? new Date(body.date) : null;
  const parsedDueDate = body.dueDate ? new Date(body.dueDate) : null;

  await prisma.$transaction(async (tx) => {
    await tx.invoiceItem.deleteMany({ where: { invoiceId: invoice.id } });

    if (normalizedItems.length > 0) {
      await tx.invoiceItem.createMany({
        data: normalizedItems.map((item) => ({
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
          notes: item.notes,
          invoiceId: invoice.id,
        })),
      });
    }

    await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        fromName: body.fromName,
        fromAddress: body.fromAddress,
        fromPhone: body.fromPhone,
        fromEmail: body.fromEmail,
        fromWebsite: body.fromWebsite,
        billToName: body.billToName,
        billToCompany: body.billToCompany,
        billToPhone: body.billToPhone,
        billToEmail: body.billToEmail,
        date: parsedDate,
        dueDate: parsedDueDate,
        notes: body.notes,
        currency: body.currency ?? invoice.currency,
        taxRate,
        subtotal,
        tax: taxAmount,
        total,
        amountPaid,
        balanceDue,
        status,
      },
    });
  });

  return NextResponse.json({ message: "Invoice updated" });
}
