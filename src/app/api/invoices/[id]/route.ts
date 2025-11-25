import { InvoiceStatus, PartyRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { InvoiceItemPayload, calculateTotals } from "@/lib/invoice";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: params.id, userId: session.user.id },
      include: { parties: true, items: { orderBy: { position: "asc" } } },
    });

    if (!invoice) {
      return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Failed to fetch invoice" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  try {
    const existing = await prisma.invoice.findFirst({
      where: { id: params.id, userId: session.user.id },
      include: { parties: true, items: true },
    });

    if (!existing) {
      return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
    }

    const rawItems: InvoiceItemPayload[] = Array.isArray(body.items) ? body.items : [];
    const items = rawItems.map((item, index) => {
      const quantity = Number(item.quantity ?? 0) || 0;
      const rate = Number(item.rate ?? 0) || 0;

      return {
        name: item.name?.toString() || "Item",
        description: item.description ?? "",
        quantity,
        rate,
        amount: quantity * rate,
        notes: item.notes ?? "",
        position: index,
      };
    });

    const { subtotal, tax, total } = calculateTotals(items, Number(body.taxRate) || 0, Number(body.discount) || 0);

    await prisma.$transaction([
      prisma.invoice.update({
        where: { id: params.id },
        data: {
          invoiceNumber: body.invoiceNumber || existing.invoiceNumber,
          currencyCode: body.currencyCode || existing.currencyCode,
          issueDate: body.issueDate ? new Date(body.issueDate) : null,
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
          notes: body.notes ?? existing.notes,
          terms: body.terms ?? existing.terms,
          taxRate: Number(body.taxRate) || 0,
          discount: Number(body.discount) || 0,
          subtotal,
          tax,
          total,
          status: existing.status ?? InvoiceStatus.DRAFT,
        },
      }),
      prisma.invoiceParty.upsert({
        where: { invoiceId_role: { invoiceId: params.id, role: PartyRole.ORIGIN } },
        create: {
          invoiceId: params.id,
          role: PartyRole.ORIGIN,
          name: body.from?.name ?? "",
          company: body.from?.company ?? "",
          email: body.from?.email ?? "",
          phone: body.from?.phone ?? "",
          address: body.from?.address ?? "",
          website: body.from?.website ?? "",
        },
        update: {
          name: body.from?.name ?? "",
          company: body.from?.company ?? "",
          email: body.from?.email ?? "",
          phone: body.from?.phone ?? "",
          address: body.from?.address ?? "",
          website: body.from?.website ?? "",
        },
      }),
      prisma.invoiceParty.upsert({
        where: { invoiceId_role: { invoiceId: params.id, role: PartyRole.CUSTOMER } },
        create: {
          invoiceId: params.id,
          role: PartyRole.CUSTOMER,
          name: body.billTo?.name ?? "",
          company: body.billTo?.company ?? "",
          email: body.billTo?.email ?? "",
          phone: body.billTo?.phone ?? "",
          address: body.billTo?.address ?? "",
          website: body.billTo?.website ?? "",
        },
        update: {
          name: body.billTo?.name ?? "",
          company: body.billTo?.company ?? "",
          email: body.billTo?.email ?? "",
          phone: body.billTo?.phone ?? "",
          address: body.billTo?.address ?? "",
          website: body.billTo?.website ?? "",
        },
      }),
      prisma.invoiceItem.deleteMany({ where: { invoiceId: params.id } }),
      ...(items.length
        ? [
            prisma.invoiceItem.createMany({
              data: items.map((item) => ({ ...item, invoiceId: params.id })),
            }),
          ]
        : []),
    ]);

    const updatedInvoice = await prisma.invoice.findFirst({
      where: { id: params.id, userId: session.user.id },
      include: { parties: true, items: { orderBy: { position: "asc" } } },
    });

    return NextResponse.json(updatedInvoice);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Failed to update invoice" }, { status: 500 });
  }
}
