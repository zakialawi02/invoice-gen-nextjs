"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { useMemo, useRef, useState } from "react";
import { ChevronDown, Download, Plus, Save, Trash2 } from "lucide-react";
import html2pdf from "html2pdf.js";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InputNumber } from "@/components/input-number";
import InputCurrency from "@/components/input-currency";
import { formatCurrency } from "@/lib/currency";

type InvoiceItemForm = {
  name: string;
  description?: string;
  quantity: number;
  rate: number;
};

type InvoiceFormValues = {
  invoiceNumber: string;
  fromName: string;
  fromAddress: string;
  fromPhone: string;
  fromEmail: string;
  fromWebsite: string;
  billToName: string;
  billToCompany: string;
  billToPhone: string;
  date: string;
  dueDate: string;
  taxRate: number;
  notes: string;
  items: InvoiceItemForm[];
};

const defaultValues: InvoiceFormValues = {
  invoiceNumber: "INV-001",
  fromName: "",
  fromAddress: "",
  fromPhone: "",
  fromEmail: "",
  fromWebsite: "",
  billToName: "",
  billToCompany: "",
  billToPhone: "",
  date: "",
  dueDate: "",
  taxRate: 0,
  notes: "",
  items: [
    {
      name: "",
      description: "",
      quantity: 1,
      rate: 0,
    },
  ],
};

export default function CreateNewInvoicePage() {
  const [showPreview, setShowPreview] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const currencyCode = "IDR";

  const form = useForm<InvoiceFormValues>({
    defaultValues,
    mode: "onBlur",
  });

  const {
    control,
    handleSubmit,
    register,
    reset,
    watch,
    setError,
    formState: { errors },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const items = watch("items");
  const taxRate = watch("taxRate") || 0;

  const subtotal = useMemo(
    () =>
      items?.reduce(
        (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.rate) || 0),
        0,
      ) ?? 0,
    [items],
  );

  const taxAmount = useMemo(() => subtotal * ((taxRate ?? 0) / 100), [subtotal, taxRate]);
  const total = useMemo(() => subtotal + taxAmount, [subtotal, taxAmount]);

  const formatDate = (value?: string) =>
    value ? new Date(value).toLocaleDateString("id-ID", { dateStyle: "medium" }) : "-";

  const validateItems = (invoiceItems: InvoiceItemForm[]) => {
    if (!invoiceItems.length) {
      toast.error("Tambahkan minimal satu item.");
      return false;
    }

    for (const [index, item] of invoiceItems.entries()) {
      if (!item.name.trim()) {
        setError(`items.${index}.name` as const, { message: "Nama item wajib diisi" });
        toast.error("Nama item tidak boleh kosong.");
        return false;
      }
      if ((item.quantity ?? 0) <= 0 || Number.isNaN(item.quantity)) {
        setError(`items.${index}.quantity` as const, { message: "Kuantitas harus lebih dari 0" });
        toast.error("Kuantitas harus lebih dari 0.");
        return false;
      }
      if ((item.rate ?? 0) < 0 || Number.isNaN(item.rate)) {
        setError(`items.${index}.rate` as const, { message: "Tarif tidak valid" });
        toast.error("Tarif tidak valid.");
        return false;
      }
    }

    return true;
  };

  const submitInvoice = async (values: InvoiceFormValues) => {
    const trimmedValues: InvoiceFormValues = {
      ...values,
      fromName: values.fromName.trim(),
      billToName: values.billToName.trim(),
      invoiceNumber: values.invoiceNumber.trim(),
      items: values.items.map((item) => ({
        ...item,
        name: item.name.trim(),
        description: item.description?.trim() ?? "",
        quantity: Number(item.quantity) || 0,
        rate: Number(item.rate) || 0,
      })),
    };

    if (!trimmedValues.invoiceNumber) {
      setError("invoiceNumber", { message: "Nomor invoice wajib diisi" });
      toast.error("Nomor invoice wajib diisi.");
      return false;
    }

    if (!trimmedValues.fromName) {
      setError("fromName", { message: "Nama pengirim wajib diisi" });
      toast.error("Nama pengirim wajib diisi.");
      return false;
    }

    if (!trimmedValues.billToName) {
      setError("billToName", { message: "Nama penerima wajib diisi" });
      toast.error("Nama penerima wajib diisi.");
      return false;
    }

    if (!validateItems(trimmedValues.items)) {
      return false;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...trimmedValues, taxRate: Number(trimmedValues.taxRate) || 0 }),
      });

      if (!response.ok) {
        const body = await response.json();
        const errorMessage = body?.error ? "Gagal menyimpan invoice." : "Terjadi kesalahan.";
        toast.error(errorMessage);
        return false;
      }

      toast.success("Invoice berhasil disimpan.");
      setShowPreview(true);
      reset(defaultValues);
      return true;
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan saat menyimpan.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = handleSubmit(submitInvoice);

  const handleDownload = async () => {
    if (!previewRef.current) return;

    try {
      const instance = html2pdf();

      instance.set({
        margin: 10,
        filename: `${watch("invoiceNumber") || "invoice"}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { orientation: "portrait" },
      });

      await instance.from(previewRef.current).save();
      toast.success("Invoice diunduh.");
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengunduh invoice.");
    }
  };

  const handleSaveAndDownload = () =>
    handleSubmit(async (values) => {
      const success = await submitInvoice(values);

      if (success) {
        await handleDownload();
      }
    })();

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between border-b pb-3">
        <div className="flex items-center justify-between md:justify-start w-full">
          <h1 className="text-2xl font-bold">Create New Invoice</h1>
          <span className="mx-3 hidden md:inline-block h-6 border-l-2 border-border"></span>
          <div className="flex items-center md:items-center space-x-2">
            <Label htmlFor="Show Preview">Show Preview</Label>
            <Switch id="Show Preview" checked={showPreview} onCheckedChange={setShowPreview} />
          </div>
        </div>

        <div className="flex items-center self-end space-x-2">
          <Button variant="outline" type="button" onClick={() => reset(defaultValues)}>
            Reset Draft
          </Button>
          <ButtonGroup>
            <Button onClick={onSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Invoice"}
            </Button>
            <ButtonGroupSeparator />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" aria-label="More Options">
                  <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={onSubmit}>
                    <Save />
                    Save Only
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleSaveAndDownload}
                  >
                    <Download />
                    Save & Download PDF
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </ButtonGroup>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4 items-start">
        <form className="space-y-4" onSubmit={onSubmit}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Invoice Details</CardTitle>
                <p className="text-sm text-muted-foreground">Isi informasi invoice</p>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  placeholder="INV-001"
                  {...register("invoiceNumber", { required: true })}
                  aria-invalid={!!errors.invoiceNumber}
                />
                {errors.invoiceNumber && (
                  <p className="text-sm text-destructive">{errors.invoiceNumber.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Invoice Date</Label>
                <Input type="date" id="date" {...register("date")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input type="date" id="dueDate" {...register("dueDate")} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>From</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromName">Your Name</Label>
                <Input
                  id="fromName"
                  placeholder="Nama Anda"
                  {...register("fromName", { required: true })}
                  aria-invalid={!!errors.fromName}
                />
                {errors.fromName && (
                  <p className="text-sm text-destructive">{errors.fromName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromPhone">Phone</Label>
                <Input id="fromPhone" placeholder="0812xxxx" {...register("fromPhone")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromEmail">Email</Label>
                <Input type="email" id="fromEmail" placeholder="you@mail.com" {...register("fromEmail")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromWebsite">Website</Label>
                <Input id="fromWebsite" placeholder="website.com" {...register("fromWebsite")} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="fromAddress">Address</Label>
                <Textarea id="fromAddress" placeholder="Alamat lengkap" {...register("fromAddress")} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bill To</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billToName">Client Name</Label>
                <Input
                  id="billToName"
                  placeholder="Nama penerima"
                  {...register("billToName", { required: true })}
                  aria-invalid={!!errors.billToName}
                />
                {errors.billToName && (
                  <p className="text-sm text-destructive">{errors.billToName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="billToCompany">Company</Label>
                <Input id="billToCompany" placeholder="Nama perusahaan" {...register("billToCompany")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="billToPhone">Phone</Label>
                <Input id="billToPhone" placeholder="0812xxxx" {...register("billToPhone")} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" placeholder="Catatan tambahan" {...register("notes")} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Items</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    name: "",
                    description: "",
                    quantity: 1,
                    rate: 0,
                  })
                }
              >
                <Plus className="h-4 w-4 mr-2" /> Add Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-lg border p-4 space-y-3 bg-muted/40"
                >
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor={`items.${index}.name`}>Item Name</Label>
                      <Input
                        id={`items.${index}.name`}
                        placeholder="Nama item"
                        {...register(`items.${index}.name` as const, { required: true })}
                        aria-invalid={!!errors.items?.[index]?.name}
                      />
                      {errors.items?.[index]?.name && (
                        <p className="text-sm text-destructive">{errors.items[index]?.name?.message}</p>
                      )}
                    </div>
                    <div className="md:w-36 space-y-2">
                      <Label htmlFor={`items.${index}.quantity`}>Qty</Label>
                      <InputNumber
                        id={`items.${index}.quantity`}
                        min={1}
                        value={items?.[index]?.quantity}
                        onValueChange={(val) => form.setValue(`items.${index}.quantity`, val ?? 0)}
                      />
                    </div>
                    <div className="md:w-48 space-y-2">
                      <Label htmlFor={`items.${index}.rate`}>Rate</Label>
                      <InputCurrency
                        id={`items.${index}.rate`}
                        currency={currencyCode}
                        value={items?.[index]?.rate}
                        onValueChange={(val) => form.setValue(`items.${index}.rate`, val ?? 0)}
                      />
                    </div>
                    <div className="md:w-20 flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => remove(index)}
                        aria-label="Remove item"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`items.${index}.description`}>Description</Label>
                    <Textarea
                      id={`items.${index}.description`}
                      placeholder="Deskripsi"
                      {...register(`items.${index}.description` as const)}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Amount: {formatCurrency((items?.[index]?.quantity || 0) * (items?.[index]?.rate || 0), currencyCode)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax (%)</Label>
                <InputNumber
                  id="taxRate"
                  min={0}
                  value={taxRate}
                  decimalScale={2}
                  onValueChange={(val) => form.setValue("taxRate", val ?? 0)}
                />
              </div>
              <div className="rounded-lg border p-4 space-y-2 bg-muted/40">
                <div className="flex items-center justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal, currencyCode)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Tax</span>
                  <span>{formatCurrency(taxAmount, currencyCode)}</span>
                </div>
                <div className="flex items-center justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(total, currencyCode)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Invoice"}
            </Button>
          </div>
        </form>

        {showPreview && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Invoice Preview</h2>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" /> Download PDF
              </Button>
            </div>
            <div
              ref={previewRef}
              className="rounded-xl border bg-white text-foreground shadow-sm p-6 space-y-6"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">From</p>
                  <p className="font-semibold">{watch("fromName") || "Nama pengirim"}</p>
                  {watch("fromAddress") && <p className="max-w-xs whitespace-pre-line">{watch("fromAddress")}</p>}
                  {(watch("fromPhone") || watch("fromEmail")) && (
                    <p className="text-sm text-muted-foreground">
                      {[watch("fromPhone"), watch("fromEmail")].filter(Boolean).join(" • ")}
                    </p>
                  )}
                  {watch("fromWebsite") && (
                    <p className="text-sm text-muted-foreground">{watch("fromWebsite")}</p>
                  )}
                </div>
                <div className="text-right space-y-1">
                  <p className="text-2xl font-bold">Invoice</p>
                  <p className="text-sm text-muted-foreground">
                    No: {watch("invoiceNumber") || "-"}
                  </p>
                  <p className="text-sm text-muted-foreground">Tanggal: {formatDate(watch("date"))}</p>
                  <p className="text-sm text-muted-foreground">Jatuh tempo: {formatDate(watch("dueDate"))}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border p-4 bg-muted/40">
                  <p className="text-sm text-muted-foreground">Bill To</p>
                  <p className="font-semibold">{watch("billToName") || "Nama penerima"}</p>
                  {watch("billToCompany") && <p>{watch("billToCompany")}</p>}
                  {watch("billToPhone") && (
                    <p className="text-sm text-muted-foreground">{watch("billToPhone")}</p>
                  )}
                </div>
                <div className="rounded-lg border p-4 bg-muted/40 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal, currencyCode)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Tax ({taxRate || 0}%)</span>
                    <span>{formatCurrency(taxAmount, currencyCode)}</span>
                  </div>
                  <div className="flex items-center justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(total, currencyCode)}</span>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-muted/60 text-sm font-semibold">
                  <div className="col-span-5">Item</div>
                  <div className="col-span-3">Description</div>
                  <div className="col-span-2 text-right">Qty</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>
                <div className="divide-y">
                  {items?.length ? (
                    items.map((item, index) => (
                      <div key={`${item.name}-${index}`} className="grid grid-cols-12 gap-3 px-4 py-3 text-sm">
                        <div className="col-span-5 font-medium">{item.name || "-"}</div>
                        <div className="col-span-3 text-muted-foreground whitespace-pre-line">
                          {item.description || "-"}
                        </div>
                        <div className="col-span-2 text-right">{item.quantity || 0}</div>
                        <div className="col-span-2 text-right">
                          {formatCurrency((item.quantity || 0) * (item.rate || 0), currencyCode)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-muted-foreground">Tidak ada item.</div>
                  )}
                </div>
              </div>

              {watch("notes") && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Notes</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{watch("notes")}</p>
                </div>
              )}

              <div className="flex justify-between items-center font-semibold">
                <span>Balance Due</span>
                <span>{formatCurrency(total, currencyCode)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
