import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const invoiceItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  rate: z.number().min(0, "Rate must be 0 or higher"),
});

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  fromName: z.string().min(1, "Sender name is required"),
  fromAddress: z.string().optional(),
  fromPhone: z.string().optional(),
  fromEmail: z.string().optional(),
  fromWebsite: z.string().optional(),
  billToName: z.string().min(1, "Recipient name is required"),
  billToCompany: z.string().optional(),
  billToPhone: z.string().optional(),
  date: z.string().optional(),
  dueDate: z.string().optional(),
  taxRate: z.number().min(0).default(0),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = invoiceSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.format() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const subtotal = data.items.reduce(
    (sum, item) => sum + item.quantity * item.rate,
    0,
  );
  const taxAmount = subtotal * ((data.taxRate ?? 0) / 100);
  const total = subtotal + taxAmount;

  try {
    const created = await prisma.invoice.create({
      data: {
        invoiceNumber: data.invoiceNumber,
        fromName: data.fromName,
        fromAddress: data.fromAddress,
        fromPhone: data.fromPhone,
        fromEmail: data.fromEmail,
        fromWebsite: data.fromWebsite,
        billToName: data.billToName,
        billToCompany: data.billToCompany,
        billToPhone: data.billToPhone,
        date: data.date ? new Date(data.date) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        notes: data.notes,
        subtotal,
        tax: taxAmount,
        total,
        balanceDue: total,
        user: {
          connect: {
            id: session.user.id,
          },
        },
        items: {
          create: data.items.map((item) => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.quantity * item.rate,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 },
    );
  }
}
