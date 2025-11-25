import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

function generateInvoiceNumber() {
  const now = new Date();
  const randomSuffix = Math.floor(Math.random() * 9000 + 1000);
  return `INV-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}${now
    .getDate()
    .toString()
    .padStart(2, "0")}-${randomSuffix}`;
}

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const invoice = await prisma.invoice.create({
    data: {
      userId: session.user.id,
      invoiceNumber: generateInvoiceNumber(),
      date: now,
      dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      subtotal: 0,
      tax: 0,
      total: 0,
      balanceDue: 0,
    },
  });

  return NextResponse.json({ id: invoice.id, invoiceNumber: invoice.invoiceNumber });
}
