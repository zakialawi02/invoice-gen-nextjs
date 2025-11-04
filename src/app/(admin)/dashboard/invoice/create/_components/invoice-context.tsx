"use client";

import { createContext, useContext, ReactNode, useState } from "react";

type InvoiceItem = {
  name: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
};

type InvoiceData = {
  invoiceNumber: string;
  dateIssued: Date;
  dateDue: Date | undefined;
  currency: string;
  items: InvoiceItem[];
  taxRate: number;
  discount: number;
  note: string;
  terms: string;
};

type InvoiceContextType = {
  invoiceData: InvoiceData;
  updateInvoiceData: (data: Partial<InvoiceData>) => void;
};

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

export function InvoiceProvider({ children }: { children: ReactNode }) {
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    invoiceNumber: "",
    dateIssued: new Date(),
    dateDue: undefined,
    currency: "USD",
    items: [
      { name: "Cloud Hosting Subscription", description: null, quantity: 1, unitPrice: 3500 },
      { name: "Data Analytics Report", description: null, quantity: 2, unitPrice: 750 },
      { name: "On-Site Technical Support", description: null, quantity: 1, unitPrice: 400 },
    ],
    taxRate: 10,
    discount: 0,
    note: "It was great doing business with you.",
    terms: "Please make the payment by the due date.",
  });

  const updateInvoiceData = (data: Partial<InvoiceData>) => {
    setInvoiceData((prev) => ({ ...prev, ...data }));
  };

  return (
    <InvoiceContext.Provider value={{ invoiceData, updateInvoiceData }}>
      {children}
    </InvoiceContext.Provider>
  );
}

export function useInvoice() {
  const context = useContext(InvoiceContext);
  if (!context) {
    throw new Error("useInvoice must be used within an InvoiceProvider");
  }
  return context;
}
