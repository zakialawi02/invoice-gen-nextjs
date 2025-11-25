import { PartyRole } from "@prisma/client";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import InvoiceEditor from "./invoice-form";

type PageProps = {
  params: { invoiceId: string };
};

export const metadata: Metadata = {
  title: "Edit Invoice",
  description: "Update invoice details and preview before sending",
};

export default async function InvoiceEditorPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth?callbackUrl=/dashboard/invoice");
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: params.invoiceId, userId: session.user.id },
    include: { parties: true, items: { orderBy: { position: "asc" } } },
  });

  if (!invoice) {
    redirect("/dashboard/invoice");
  }

  const from = invoice.parties.find((party) => party.role === PartyRole.ORIGIN);
  const billTo = invoice.parties.find((party) => party.role === PartyRole.CUSTOMER);

  return (
    <InvoiceEditor
      invoice={{
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        issueDate: invoice.issueDate?.toISOString() ?? "",
        dueDate: invoice.dueDate?.toISOString() ?? "",
        notes: invoice.notes ?? "",
        terms: invoice.terms ?? "",
        currencyCode: invoice.currencyCode,
        taxRate: invoice.taxRate,
        discount: invoice.discount,
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        total: invoice.total,
        items: invoice.items,
        from,
        billTo,
      }}
    />
  );
}
