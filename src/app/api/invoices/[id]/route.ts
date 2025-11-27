import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";

// GET single invoice
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await params;

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        userId: user.id,
      },
      include: {
        items: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 });
  }
}

// Define types for request body to avoid 'any'
interface InvoiceItemInput {
  name: string;
  description?: string | null;
  quantity: number | string;
  rate: number | string;
  amount: number | string;
  notes?: string | null;
}

interface InvoiceUpdateBody {
  items?: InvoiceItemInput[];
  date?: string | Date;
  dueDate?: string | Date;
  discount?: number | string;
  taxRate?: number | string;
  shipping?: number | string;
  subtotal?: number | string;
  tax?: number | string;
  total?: number | string;
  balanceDue?: number | string;
  [key: string]: unknown;
}

interface PrismaError extends Error {
  code?: string;
  meta?: {
    cause?: string;
  };
}

// PUT - Update invoice
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = (await req.json()) as InvoiceUpdateBody;
    const { items, ...invoiceData } = body;

    const { id } = await params;

    // Verify ownership
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Prepare data for update - convert dates and handle optional fields
    const updateData: InvoiceUpdateBody = {
      ...invoiceData,
    };

    // Convert date strings to Date objects if they exist
    if (typeof updateData.date === "string") {
      updateData.date = new Date(updateData.date);
    }
    if (typeof updateData.dueDate === "string") {
      updateData.dueDate = new Date(updateData.dueDate);
    }

    // Ensure numeric fields are numbers
    if (updateData.discount !== undefined) {
      updateData.discount = Number(updateData.discount);
    }
    if (updateData.taxRate !== undefined) {
      updateData.taxRate = Number(updateData.taxRate);
    }
    if (updateData.shipping !== undefined) {
      updateData.shipping = Number(updateData.shipping);
    }
    if (updateData.subtotal !== undefined) {
      updateData.subtotal = Number(updateData.subtotal);
    }
    if (updateData.tax !== undefined) {
      updateData.tax = Number(updateData.tax);
    }
    if (updateData.total !== undefined) {
      updateData.total = Number(updateData.total);
    }
    if (updateData.balanceDue !== undefined) {
      updateData.balanceDue = Number(updateData.balanceDue);
    }

    // Prepare items data - ensure numeric fields are numbers
    const preparedItems =
      items?.map((item) => ({
        name: item.name,
        description: item.description || null,
        quantity: Number(item.quantity),
        rate: Number(item.rate),
        amount: Number(item.amount),
        notes: item.notes || null,
      })) || [];

    // Update invoice with items
    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        ...(updateData as Prisma.InvoiceUpdateInput),
        items: {
          deleteMany: {}, // Delete existing items
          create: preparedItems, // Create new items
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(invoice);
  } catch (error: unknown) {
    console.error("Error updating invoice:", error);

    // Provide more detailed error message
    const err = error as PrismaError;
    const errorMessage = err?.message || "Failed to update invoice";
    const errorDetails = err?.meta?.cause || err?.code || "";

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
        message: "Please check your input data and try again",
      },
      { status: 500 },
    );
  }
}

// DELETE invoice
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id } = await params;

    // Verify ownership
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    await prisma.invoice.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
}
