"use client";

import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SerializableInvoice } from "@/lib/invoice";
import {
  ArrowLeft,
  Download,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type InvoiceItemForm = {
  id?: string;
  name: string;
  description?: string;
  quantity: number;
  rate: number;
  notes?: string;
};

type InvoiceFormState = Omit<SerializableInvoice, "items"> & {
  items: InvoiceItemForm[];
};

type Totals = {
  subtotal: number;
  tax: number;
  total: number;
  balanceDue: number;
};

const statusOptions = ["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"] as const;
const currencyOptions = ["USD", "IDR", "EUR", "GBP", "AUD"];

export default function InvoiceBuilder({ invoice }: { invoice: SerializableInvoice }) {
  const router = useRouter();
  const previewRef = useRef<HTMLDivElement>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [form, setForm] = useState<InvoiceFormState>({
    ...invoice,
    date: invoice.date ? invoice.date.slice(0, 10) : "",
    dueDate: invoice.dueDate ? invoice.dueDate.slice(0, 10) : "",
    items: invoice.items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description ?? "",
      quantity: Number(item.quantity ?? 1),
      rate: Number(item.rate ?? 0),
      notes: item.notes ?? "",
    })),
  });

  const totals = useMemo<Totals>(() => {
    const subtotal = form.items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
    const tax = Number(((subtotal * Number(form.taxRate ?? 0)) / 100).toFixed(2));
    const total = Number((subtotal + tax).toFixed(2));
    const balanceDue = Number((total - Number(form.amountPaid ?? 0)).toFixed(2));

    return { subtotal, tax, total, balanceDue };
  }, [form.items, form.taxRate, form.amountPaid]);

  const updateField = <K extends keyof InvoiceFormState>(key: K, value: InvoiceFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateItem = (index: number, field: keyof InvoiceItemForm, value: string | number) => {
    setForm((prev) => {
      const nextItems = [...prev.items];
      const nextItem = { ...nextItems[index], [field]: field === "quantity" || field === "rate" ? Number(value) : value };
      nextItems[index] = nextItem;
      return { ...prev, items: nextItems };
    });
  };

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { id: crypto.randomUUID(), name: "New Item", description: "", quantity: 1, rate: 0, notes: "" },
      ],
    }));
  };

  const removeItem = (index: number) => {
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, idx) => idx !== index) }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        ...form,
        ...totals,
        items: form.items.map((item) => ({ ...item, amount: item.quantity * item.rate })),
        taxRate: Number(form.taxRate ?? 0),
        amountPaid: Number(form.amountPaid ?? 0),
        date: form.date ? new Date(form.date).toISOString() : null,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      };

      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save invoice");
      }

      toast.success("Invoice saved");
    } catch (error) {
      console.error(error);
      toast.error("Could not save invoice");
    } finally {
      setIsSaving(false);
    }
  };

  const downloadPreview = async () => {
    if (!previewRef.current) return;
    setIsDownloading(true);
    try {
      const html2pdf = (await import("html2pdf.js")) as unknown as typeof import("html2pdf.js");
      const fileName = `invoice-${invoice.invoiceNumber}.pdf`;

      await html2pdf.default()
        .from(previewRef.current)
        .set({
          margin: 8,
          filename: fileName,
          html2canvas: { scale: 2 },
        })
        .save();

      toast.success("Preview downloaded");
    } catch (error) {
      console.error(error);
      toast.error("Unable to download preview");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/invoice")}>
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to invoices</span>
            </Button>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Invoice Number</p>
              <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Edit, preview, and download your invoice.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="show-preview">Show Preview</Label>
            <Switch id="show-preview" checked={showPreview} onCheckedChange={setShowPreview} />
          </div>
          <ButtonGroup>
            <Button variant="outline" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save Draft
            </Button>
            <ButtonGroupSeparator />
            <Button onClick={downloadPreview} disabled={isDownloading}>
              {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}Download Preview
            </Button>
          </ButtonGroup>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={form.status} onValueChange={(value) => updateField("status", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={form.currency} onValueChange={(value) => updateField("currency", value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencyOptions.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Invoice Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date ?? ""}
                  onChange={(event) => updateField("date", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={form.dueDate ?? ""}
                  onChange={(event) => updateField("dueDate", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  min={0}
                  step="0.01"
                  value={Number(form.taxRate ?? 0)}
                  onChange={(event) => updateField("taxRate", Number(event.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amountPaid">Amount Paid</Label>
                <Input
                  id="amountPaid"
                  type="number"
                  min={0}
                  step="0.01"
                  value={Number(form.amountPaid ?? 0)}
                  onChange={(event) => updateField("amountPaid", Number(event.target.value))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fromName">From (name)</Label>
                <Input
                  id="fromName"
                  value={form.fromName ?? ""}
                  onChange={(event) => updateField("fromName", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromEmail">From Email</Label>
                <Input
                  id="fromEmail"
                  type="email"
                  value={form.fromEmail ?? ""}
                  onChange={(event) => updateField("fromEmail", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromPhone">From Phone</Label>
                <Input
                  id="fromPhone"
                  value={form.fromPhone ?? ""}
                  onChange={(event) => updateField("fromPhone", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromWebsite">From Website</Label>
                <Input
                  id="fromWebsite"
                  value={form.fromWebsite ?? ""}
                  onChange={(event) => updateField("fromWebsite", event.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="fromAddress">From Address</Label>
                <Textarea
                  id="fromAddress"
                  value={form.fromAddress ?? ""}
                  onChange={(event) => updateField("fromAddress", event.target.value)}
                  rows={3}
                />
              </div>
              <Separator className="md:col-span-2" />
              <div className="space-y-2">
                <Label htmlFor="billToName">Bill To (name)</Label>
                <Input
                  id="billToName"
                  value={form.billToName ?? ""}
                  onChange={(event) => updateField("billToName", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billToCompany">Company</Label>
                <Input
                  id="billToCompany"
                  value={form.billToCompany ?? ""}
                  onChange={(event) => updateField("billToCompany", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billToPhone">Client Phone</Label>
                <Input
                  id="billToPhone"
                  value={form.billToPhone ?? ""}
                  onChange={(event) => updateField("billToPhone", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billToEmail">Client Email</Label>
                <Input
                  id="billToEmail"
                  type="email"
                  value={form.billToEmail ?? ""}
                  onChange={(event) => updateField("billToEmail", event.target.value)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={form.notes ?? ""}
                  onChange={(event) => updateField("notes", event.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Line Items</CardTitle>
              <Button variant="outline" size="sm" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" /> Add Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.items.length === 0 && (
                <p className="text-sm text-muted-foreground">No items yet. Add your first service or product.</p>
              )}
              <div className="space-y-4">
                {form.items.map((item, index) => (
                  <div key={item.id ?? index} className="grid gap-3 rounded-md border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <Label className="text-xs text-muted-foreground">Item name</Label>
                        <Input
                          value={item.name}
                          onChange={(event) => updateItem(index, "name", event.target.value)}
                        />
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeItem(index)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove item</span>
                      </Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Description</Label>
                        <Textarea
                          value={item.description ?? ""}
                          onChange={(event) => updateItem(index, "description", event.target.value)}
                          rows={2}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Quantity</Label>
                        <Input
                          type="number"
                          min={0}
                          step="1"
                          value={item.quantity}
                          onChange={(event) => updateItem(index, "quantity", Number(event.target.value))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Rate</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.rate}
                          onChange={(event) => updateItem(index, "rate", Number(event.target.value))}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span>Amount</span>
                      <span>
                        {form.currency} {(item.quantity * item.rate).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Preview</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowPreview((prev) => !prev)}>
                {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="sr-only">Toggle preview</span>
              </Button>
            </CardHeader>
            {showPreview && (
              <CardContent className="space-y-4">
                <div ref={previewRef} className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">From</p>
                      <p className="font-semibold">{form.fromName || "Your Company"}</p>
                      <p className="text-sm">{form.fromEmail}</p>
                      <p className="text-sm">{form.fromPhone}</p>
                      <p className="text-sm">{form.fromWebsite}</p>
                      <p className="text-sm whitespace-pre-line">{form.fromAddress}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-xs uppercase text-muted-foreground">Invoice</p>
                      <p className="text-lg font-semibold">#{invoice.invoiceNumber}</p>
                      <p className="text-sm text-muted-foreground">Status: {form.status}</p>
                      <p className="text-sm text-muted-foreground">Date: {form.date || "N/A"}</p>
                      <p className="text-sm text-muted-foreground">Due: {form.dueDate || "N/A"}</p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Bill To</p>
                    <p className="font-semibold">{form.billToName || "Client Name"}</p>
                    <p className="text-sm">{form.billToCompany}</p>
                    <p className="text-sm">{form.billToEmail}</p>
                    <p className="text-sm">{form.billToPhone}</p>
                  </div>

                  <div className="rounded-md border">
                    <div className="grid grid-cols-4 gap-2 border-b bg-muted px-3 py-2 text-xs font-medium uppercase text-muted-foreground">
                      <div className="col-span-2">Item</div>
                      <div>Qty</div>
                      <div className="text-right">Amount</div>
                    </div>
                    {form.items.length === 0 && (
                      <div className="px-3 py-4 text-sm text-muted-foreground">No items added yet.</div>
                    )}
                    {form.items.map((item) => (
                      <div key={item.id} className="grid grid-cols-4 gap-2 px-3 py-2 text-sm">
                        <div className="col-span-2">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-muted-foreground text-xs">{item.description}</p>
                        </div>
                        <div>{item.quantity}</div>
                        <div className="text-right">
                          {form.currency} {(item.quantity * item.rate).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>
                        {form.currency} {totals.subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax ({Number(form.taxRate ?? 0)}%)</span>
                      <span>
                        {form.currency} {totals.tax.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>
                        {form.currency} {totals.total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Amount Paid</span>
                      <span>
                        {form.currency} {Number(form.amountPaid ?? 0).toFixed(2)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Balance Due</span>
                      <span>
                        {form.currency} {totals.balanceDue.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {form.notes && (
                    <div className="rounded-md bg-muted/40 px-3 py-2 text-sm">
                      <p className="text-xs uppercase text-muted-foreground">Notes</p>
                      <p>{form.notes}</p>
                    </div>
                  )}
                </div>

                <Button className="w-full" onClick={downloadPreview} disabled={isDownloading}>
                  {isDownloading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Download PDF
                </Button>
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save Invoice
              </Button>
              <Button className="w-full" variant="secondary" disabled={isSaving} onClick={handleSave}>
                <Send className="mr-2 h-4 w-4" />Save & Send
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
