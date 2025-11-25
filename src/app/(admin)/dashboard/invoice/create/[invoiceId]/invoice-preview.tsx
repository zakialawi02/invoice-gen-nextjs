import React, { forwardRef } from "react";

import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { InvoiceFormValues } from "@/types/invoice";

type PreviewProps = {
  data: InvoiceFormValues & {
    totals: { subtotal: number; tax: number; total: number };
    currency: string;
  };
};

const formatCurrency = (value: number, currency: string) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(value || 0);
};

const formatDate = (value?: string | Date | null) => {
  if (!value) return "-";

  const parsed = typeof value === "string" ? new Date(value) : value;
  return parsed.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const InvoicePreview = forwardRef<HTMLDivElement, PreviewProps>(({ data }, ref) => {
  return (
    <Card ref={ref} className="h-full space-y-6 p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Invoice</p>
          <h2 className="text-2xl font-bold">{data.invoiceNumber || "Draft"}</h2>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <p>Issue Date: {formatDate(data.issueDate)}</p>
          <p>Due Date: {formatDate(data.dueDate)}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-md border p-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground">From</p>
          <p className="text-lg font-semibold">{data.from?.company || data.from?.name || "Your Business"}</p>
          <p className="text-sm text-muted-foreground">{data.from?.name}</p>
          <p className="text-sm text-muted-foreground">{data.from?.address}</p>
          <p className="text-sm text-muted-foreground">{data.from?.phone}</p>
          <p className="text-sm text-muted-foreground">{data.from?.email}</p>
        </div>

        <div className="rounded-md border p-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Bill To</p>
          <p className="text-lg font-semibold">{data.billTo?.company || data.billTo?.name || "Customer"}</p>
          <p className="text-sm text-muted-foreground">{data.billTo?.name}</p>
          <p className="text-sm text-muted-foreground">{data.billTo?.address}</p>
          <p className="text-sm text-muted-foreground">{data.billTo?.phone}</p>
          <p className="text-sm text-muted-foreground">{data.billTo?.email}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/60">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">Item</th>
              <th className="px-4 py-3 font-medium">Quantity</th>
              <th className="px-4 py-3 font-medium">Rate</th>
              <th className="px-4 py-3 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => (
              <tr key={item.id ?? index} className="border-t">
                <td className="px-4 py-3">
                  <div className="font-medium">{item.name}</div>
                  {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                </td>
                <td className="px-4 py-3">{item.quantity}</td>
                <td className="px-4 py-3">{formatCurrency(item.rate, data.currency)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency((item.quantity || 0) * (item.rate || 0), data.currency)}</td>
              </tr>
            ))}
            {!data.items.length && (
              <tr>
                <td className="px-4 py-3 text-center text-muted-foreground" colSpan={4}>
                  No line items yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">Notes:</span> {data.notes || "-"}
          </p>
          <p>
            <span className="font-semibold text-foreground">Terms:</span> {data.terms || "-"}
          </p>
        </div>
        <div className="space-y-2 rounded-md border p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold">{formatCurrency(data.totals.subtotal, data.currency)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tax</span>
            <span className="font-semibold">{formatCurrency(data.totals.tax, data.currency)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Discount</span>
            <span className="font-semibold">- {formatCurrency(data.discount || 0, data.currency)}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-base font-semibold">
            <span>Total Due</span>
            <span>{formatCurrency(data.totals.total, data.currency)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
});

InvoicePreview.displayName = "InvoicePreview";

export default InvoicePreview;
