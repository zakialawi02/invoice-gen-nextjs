import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { generateInvoiceNumber } from "@/lib/invoice";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const invoiceNumber = await generateInvoiceNumber();

  const invoice = await prisma.invoice.create({
    data: {
      userId: session.user.id,
      invoiceNumber,
      currency: body.currency ?? "USD",
    },
    select: { id: true, invoiceNumber: true, status: true },
  });

  return NextResponse.json(invoice, { status: 201 });
}
