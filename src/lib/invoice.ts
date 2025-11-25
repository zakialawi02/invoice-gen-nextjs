import { InvoiceStatus, PartyRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type NumericLike = number | string | null | undefined;

export type InvoicePartyPayload = {
  name?: string | null;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  website?: string | null;
};

export type InvoiceItemPayload = {
  name: string;
  description?: string | null;
  quantity: NumericLike;
  rate: NumericLike;
  notes?: string | null;
};

export const generateInvoiceNumber = () => {
  const now = new Date();
  const randomSuffix = crypto.randomUUID().slice(0, 6).toUpperCase();
  return `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${randomSuffix}`;
};

export const calculateTotals = (items: InvoiceItemPayload[], taxRate: number, discount: number) => {
  const subtotal = items.reduce((acc, item) => {
    const quantity = Number(item.quantity ?? 0) || 0;
    const rate = Number(item.rate ?? 0) || 0;
    return acc + quantity * rate;
  }, 0);

  const normalizedTaxRate = Math.max(0, Number.isFinite(taxRate) ? taxRate : 0);
  const normalizedDiscount = Math.max(0, Number.isFinite(discount) ? discount : 0);

  const tax = subtotal * (normalizedTaxRate / 100);
  const total = Math.max(0, subtotal + tax - normalizedDiscount);

  return { subtotal, tax, total };
};

export const createDraftInvoice = async (userId: string) => {
  return prisma.invoice.create({
    data: {
      invoiceNumber: generateInvoiceNumber(),
      userId,
      status: InvoiceStatus.DRAFT,
      currencyCode: "USD",
      parties: {
        create: [
          {
            role: PartyRole.ORIGIN,
            name: "Your Business",
            company: "",
            address: "",
            phone: "",
            email: "",
            website: "",
          },
          {
            role: PartyRole.CUSTOMER,
            name: "Customer",
            company: "",
            address: "",
            phone: "",
            email: "",
            website: "",
          },
        ],
      },
    },
    include: {
      parties: true,
      items: true,
    },
  });
};
