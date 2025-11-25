import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InvoiceItem } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

type RouteContext = {
  params: { invoiceId: string };
};

function parseDate(value: unknown) {
  if (!value) return null;
  const parsed = new Date(value as string);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeItems(rawItems: InvoiceItem[]) {
  return rawItems.map((item) => ({
    ...item,
    quantity: Number(item.quantity) || 0,
    rate: Number(item.rate) || 0,
    amount: Number(item.amount) || 0,
  }));
}

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: params.invoiceId, userId: session.user.id },
    include: { items: true },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  return NextResponse.json(invoice);
}

export async function PUT(request: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: params.invoiceId, userId: session.user.id },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const body = await request.json();
  const items = Array.isArray(body.items) ? body.items : [];

  const cleanedItems = items
    .map((item) => {
      const quantity = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;

      return {
        name: String(item.name ?? ""),
        description: item.description ? String(item.description) : undefined,
        quantity,
        rate,
        amount: quantity * rate,
        notes: item.notes ? String(item.notes) : undefined,
      };
    })
    .filter((item) => item.name.trim().length > 0);

  const subtotal = cleanedItems.reduce((acc, item) => acc + item.amount, 0);
  const tax = Number(body.tax) || 0;
  const total = subtotal + tax;
  const balanceDue = total;

  const [updatedInvoice] = await prisma.$transaction([
    prisma.invoice.update({
      where: { id: params.invoiceId },
      data: {
        fromName: body.fromName ?? null,
        fromAddress: body.fromAddress ?? null,
        fromPhone: body.fromPhone ?? null,
        fromEmail: body.fromEmail ?? null,
        fromWebsite: body.fromWebsite ?? null,
        billToName: body.billToName ?? null,
        billToCompany: body.billToCompany ?? null,
        billToPhone: body.billToPhone ?? null,
        date: parseDate(body.date),
        dueDate: parseDate(body.dueDate),
        balanceDue,
        notes: body.notes ?? null,
        subtotal,
        tax,
        total,
      },
    }),
    prisma.invoiceItem.deleteMany({ where: { invoiceId: params.invoiceId } }),
    ...(cleanedItems.length
      ? [
          prisma.invoiceItem.createMany({
            data: cleanedItems.map((item) => ({ ...item, invoiceId: params.invoiceId })),
          }),
        ]
      : []),
  ]);

  const withItems = await prisma.invoice.findUnique({
    where: { id: updatedInvoice.id },
    include: { items: true },
  });

  if (!withItems) {
    return NextResponse.json(updatedInvoice);
  }

  return NextResponse.json({ ...withItems, items: normalizeItems(withItems.items) });
}
