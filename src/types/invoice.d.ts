export type InvoiceParty = {
  role: "ORIGIN" | "CUSTOMER";
  name?: string | null;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  website?: string | null;
};

export type InvoiceItem = {
  id?: string;
  name: string;
  description?: string | null;
  quantity: number;
  rate: number;
  amount: number;
  notes?: string | null;
  position?: number;
};

export type InvoiceFormValues = {
  invoiceNumber: string;
  issueDate?: Date | string | null;
  dueDate?: Date | string | null;
  currencyCode: string;
  taxRate: number;
  discount: number;
  notes: string;
  terms: string;
  from: InvoiceParty;
  billTo: InvoiceParty;
  items: InvoiceItem[];
};
