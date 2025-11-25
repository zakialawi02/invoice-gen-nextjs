import { Metadata } from "next";
import { CreateInvoiceButton } from "./create-invoice-button";

export const metadata: Metadata = {
  title: "Invoice",
  description: "Invoice page for your application",
};

export default function InvoicePage() {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">Invoice</h1>
      <CreateInvoiceButton />
    </div>
  );
}
