import { Button } from "@/components/ui/button";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Invoice",
  description: "Invoice page for your application",
};

export default function InvoicePage() {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">Invoice</h1>
      <Button asChild>
        <Link href="/dashboard/invoice/create">Create Invoice</Link>
      </Button>
    </div>
  );
}
