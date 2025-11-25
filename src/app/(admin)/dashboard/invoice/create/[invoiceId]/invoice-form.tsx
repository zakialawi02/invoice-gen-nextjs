"use client";

import { useMemo, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { calculateTotals } from "@/lib/invoice";
import { InvoiceFormValues, InvoiceItem, InvoiceParty } from "@/types/invoice";

import InvoicePreview from "./invoice-preview";

type InvoiceEditorProps = {
  invoice: {
    id: string;
    invoiceNumber: string;
    issueDate?: string;
    dueDate?: string;
    notes?: string;
    terms?: string;
    currencyCode: string;
    taxRate: number;
    discount: number;
    subtotal: number;
    tax: number;
    total: number;
    items: InvoiceItem[];
    from?: InvoiceParty | null;
    billTo?: InvoiceParty | null;
  };
};

const blankParty: InvoiceParty = {
  role: "ORIGIN",
  name: "",
  company: "",
  email: "",
  phone: "",
  address: "",
  website: "",
};

const createDefaultItem = (): InvoiceItem => ({
  id: crypto.randomUUID(),
  name: "New line item",
  description: "",
  quantity: 1,
  rate: 0,
  amount: 0,
});

export default function InvoiceEditor({ invoice }: InvoiceEditorProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const form = useForm<InvoiceFormValues>({
    defaultValues: {
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate ? invoice.issueDate.slice(0, 10) : "",
      dueDate: invoice.dueDate ? invoice.dueDate.slice(0, 10) : "",
      currencyCode: invoice.currencyCode || "USD",
      taxRate: invoice.taxRate || 0,
      discount: invoice.discount || 0,
      notes: invoice.notes || "",
      terms: invoice.terms || "",
      from: invoice.from ?? { ...blankParty, role: "ORIGIN" },
      billTo: invoice.billTo ?? { ...blankParty, role: "CUSTOMER" },
      items: invoice.items.length
        ? invoice.items.map((item) => ({
            ...item,
            amount: item.amount ?? item.quantity * item.rate,
          }))
        : [createDefaultItem()],
    },
  });

  const { control, register, handleSubmit, watch } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const watchedItems = watch("items");
  const taxRate = watch("taxRate");
  const discount = watch("discount");

  const totals = useMemo(
    () => calculateTotals(watchedItems, Number(taxRate) || 0, Number(discount) || 0),
    [watchedItems, taxRate, discount],
  );

  const handleDownload = async () => {
    if (!previewRef.current) return;

    try {
      setIsDownloading(true);
      const html2pdf = (await import("html2pdf.js")).default;
      await html2pdf()
        .from(previewRef.current)
        .set({
          margin: 0.5,
          filename: `${form.getValues("invoiceNumber") || "invoice"}.pdf`,
          html2canvas: { scale: 2 },
          jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
        })
        .save();
      toast.success("Invoice preview downloaded");
    } catch (error) {
      console.error(error);
      toast.error("Unable to download invoice");
    } finally {
      setIsDownloading(false);
    }
  };

  const onSubmit = async (values: InvoiceFormValues) => {
    setIsSaving(true);

    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          items: values.items.map((item, index) => ({
            ...item,
            position: index,
            quantity: Number(item.quantity) || 0,
            rate: Number(item.rate) || 0,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to save invoice");
      }

      toast.success("Invoice saved");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save invoice");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b pb-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Create Invoice</h1>
          <p className="text-sm text-muted-foreground">
            Fill out your invoice details, preview the layout, and download a PDF instantly.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-2 rounded-md border px-3 py-2">
            <Label htmlFor="preview-toggle" className="text-sm font-medium">
              Preview
            </Label>
            <Switch id="preview-toggle" checked={showPreview} onCheckedChange={setShowPreview} />
          </div>
          <Button variant="outline" onClick={handleDownload} disabled={isDownloading} aria-busy={isDownloading}>
            {isDownloading ? "Preparing..." : "Download Preview"}
          </Button>
          <ButtonGroup>
            <Button variant="outline" onClick={handleSubmit(onSubmit)} disabled={isSaving} aria-busy={isSaving}>
              Save Draft
            </Button>
            <ButtonGroupSeparator />
            <Button onClick={handleSubmit(onSubmit)} disabled={isSaving} aria-busy={isSaving}>
              {isSaving ? "Saving..." : "Save & Continue"}
            </Button>
          </ButtonGroup>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card className="p-6 space-y-6">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">From</h2>
                <div className="space-y-1">
                  <Label htmlFor="from-name">Name</Label>
                  <Input id="from-name" {...register("from.name")} placeholder="Your name" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="from-company">Company</Label>
                  <Input id="from-company" {...register("from.company")} placeholder="Business name" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="from-email">Email</Label>
                  <Input id="from-email" type="email" {...register("from.email")} placeholder="you@example.com" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="from-phone">Phone</Label>
                  <Input id="from-phone" {...register("from.phone")} placeholder="(+62) 812-3456-7890" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="from-address">Address</Label>
                  <Textarea id="from-address" rows={3} {...register("from.address")} placeholder="Street, City" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="from-website">Website</Label>
                  <Input id="from-website" {...register("from.website")} placeholder="https://yourcompany.com" />
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-lg font-semibold">Bill To</h2>
                <div className="space-y-1">
                  <Label htmlFor="bill-name">Name</Label>
                  <Input id="bill-name" {...register("billTo.name")} placeholder="Client name" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="bill-company">Company</Label>
                  <Input id="bill-company" {...register("billTo.company")} placeholder="Client company" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="bill-email">Email</Label>
                  <Input id="bill-email" type="email" {...register("billTo.email")} placeholder="client@example.com" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="bill-phone">Phone</Label>
                  <Input id="bill-phone" {...register("billTo.phone")} placeholder="(+62) 811-0000-0000" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="bill-address">Address</Label>
                  <Textarea id="bill-address" rows={3} {...register("billTo.address")} placeholder="Street, City" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="bill-website">Website</Label>
                  <Input id="bill-website" {...register("billTo.website")} placeholder="https://client.com" />
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="invoice-number">Invoice Number</Label>
                <Input id="invoice-number" {...register("invoiceNumber")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" maxLength={3} {...register("currencyCode")} className="uppercase" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="issue-date">Issue Date</Label>
                <Input id="issue-date" type="date" {...register("issueDate")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="due-date">Due Date</Label>
                <Input id="due-date" type="date" {...register("dueDate")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                <Input id="tax-rate" type="number" step="0.01" {...register("taxRate", { valueAsNumber: true })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="discount">Discount (Amount)</Label>
                <Input id="discount" type="number" step="0.01" {...register("discount", { valueAsNumber: true })} />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Line Items</h2>
                <Button type="button" variant="outline" onClick={() => append(createDefaultItem())}>
                  Add Item
                </Button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <Card key={field.id} className="p-4 space-y-3 border-dashed">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-2">
                        <div className="space-y-1">
                          <Label htmlFor={`item-name-${field.id}`}>Item Name</Label>
                          <Input id={`item-name-${field.id}`} {...register(`items.${index}.name` as const)} />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`item-description-${field.id}`}>Description</Label>
                          <Textarea
                            id={`item-description-${field.id}`}
                            rows={2}
                            {...register(`items.${index}.description` as const)}
                            placeholder="Describe the service or product"
                          />
                        </div>
                        <div className="grid gap-3 md:grid-cols-3">
                          <div className="space-y-1">
                            <Label htmlFor={`item-qty-${field.id}`}>Quantity</Label>
                            <Input
                              id={`item-qty-${field.id}`}
                              type="number"
                              step="1"
                              min="0"
                              {...register(`items.${index}.quantity` as const, { valueAsNumber: true })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`item-rate-${field.id}`}>Rate</Label>
                            <Input
                              id={`item-rate-${field.id}`}
                              type="number"
                              step="0.01"
                              min="0"
                              {...register(`items.${index}.rate` as const, { valueAsNumber: true })}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Total</Label>
                            <div className="rounded-md border px-3 py-2 text-sm font-medium">
                              {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: (watch("currencyCode") || "USD").toUpperCase(),
                              }).format((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.rate || 0))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button type="button" variant="ghost" onClick={() => remove(index)} className="text-red-500 hover:text-red-600">
                        Remove
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" rows={4} {...register("notes")} placeholder="Optional notes for the customer" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="terms">Terms</Label>
                <Textarea id="terms" rows={4} {...register("terms")} placeholder="Payment terms or conditions" />
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-md border bg-muted/40 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-semibold">{totals.tax.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-base font-semibold">
                <span>Total</span>
                <span>{totals.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving} aria-busy={isSaving}>
                {isSaving ? "Saving..." : "Save Invoice"}
              </Button>
            </div>
          </form>
        </Card>

        {showPreview && (
          <InvoicePreview
            ref={previewRef}
            data={{
              ...watch(),
              totals,
              currency: (watch("currencyCode") || "USD").toUpperCase(),
            }}
          />
        )}
      </div>
    </div>
  );
}
