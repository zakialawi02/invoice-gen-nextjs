import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create New Invoice",
  description: "Create a new invoice for your business",
};

export default function CreateInvoiceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
