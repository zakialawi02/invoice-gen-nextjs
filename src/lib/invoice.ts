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

const formatInvoiceNumber = (prefix: string, padLength: number, sequenceValue: number) => {
  return `${prefix}-${String(sequenceValue).padStart(Math.max(3, padLength || 5), "0")}`;
};

const roundCurrency = (value: number, precision = 2) => {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};

export const calculateTotals = (items: InvoiceItemPayload[], taxRate: number, discount: number) => {
  const subtotal = items.reduce((acc, item) => {
    const quantity = Number(item.quantity ?? 0) || 0;
    const rate = Number(item.rate ?? 0) || 0;
    return acc + quantity * rate;
  }, 0);

  const normalizedTaxRate = Math.max(0, Number.isFinite(taxRate) ? taxRate : 0);
  const normalizedDiscount = Math.max(0, Number.isFinite(discount) ? discount : 0);

  const tax = roundCurrency(subtotal * (normalizedTaxRate / 100));
  const total = Math.max(0, roundCurrency(subtotal + tax - normalizedDiscount));

  return { subtotal: roundCurrency(subtotal), tax, total };
};

export const allocateInvoiceNumber = async (userId: string) => {
  const sequence = await prisma.invoiceSequence.upsert({
    where: { userId_prefix: { userId, prefix: "INV" } },
    update: { lastNumber: { increment: 1 } },
    create: { userId, prefix: "INV", padLength: 5, lastNumber: 1 },
  });

  const invoiceNumber = formatInvoiceNumber(sequence.prefix, sequence.padLength, sequence.lastNumber);

  return {
    invoiceNumber,
    sequenceId: sequence.id,
    sequenceValue: sequence.lastNumber,
  };
};

export const createDraftInvoice = async (userId: string) => {
  const numbering = await allocateInvoiceNumber(userId);

  return prisma.invoice.create({
    data: {
      invoiceNumber: numbering.invoiceNumber,
      sequenceId: numbering.sequenceId,
      sequenceValue: numbering.sequenceValue,
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
