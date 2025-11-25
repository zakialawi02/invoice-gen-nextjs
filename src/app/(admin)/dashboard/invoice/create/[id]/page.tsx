import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { serializeInvoice } from "@/lib/invoice";
import { prisma } from "@/lib/prisma";

import InvoiceBuilder from "./invoice-builder";

interface InvoicePageProps {
  params: { id: string };
}

export default async function InvoiceBuilderPage({ params }: InvoicePageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return redirect("/auth");
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: { items: true },
  });

  if (!invoice) {
    return notFound();
  }

  const serializedInvoice = serializeInvoice(invoice);

  return <InvoiceBuilder invoice={serializedInvoice} />;
}
