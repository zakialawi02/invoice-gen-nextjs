export type InvoiceItem = {
  id: string;
  itemName: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
};

export type InvoiceData = {
  companyName: string;
  companyAddress: string;
  clientName: string;
  clientAddress: string;
  invoiceNumber: string;
  invoiceDate: Date | undefined;
  dueDate: Date | undefined;
  items: InvoiceItem[];
  taxRate: number;
  discount: number;
  notes: string;
  additionalInfo: string;
  currency: string;
};
