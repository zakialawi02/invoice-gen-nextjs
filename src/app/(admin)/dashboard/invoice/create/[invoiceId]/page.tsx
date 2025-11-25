"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Download, Loader2, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

interface InvoiceItemForm {
  name: string;
  description?: string;
  quantity: number;
  rate: number;
  amount: number;
  notes?: string;
}

interface InvoiceFormState {
  invoiceNumber?: string;
  fromName: string;
  fromAddress?: string;
  fromPhone?: string;
  fromEmail?: string;
  fromWebsite?: string;
  billToName?: string;
  billToCompany?: string;
  billToPhone?: string;
  date?: string;
  dueDate?: string;
  balanceDue?: number;
  notes?: string;
  subtotal?: number;
  tax?: number;
  total?: number;
  items: InvoiceItemForm[];
}

type Html2Pdf = () => {
  set: (options: unknown) => {
    from: (element: HTMLElement) => { save: () => Promise<void> };
  };
};

const emptyItem: InvoiceItemForm = {
  name: "",
  description: "",
  quantity: 1,
  rate: 0,
  amount: 0,
  notes: "",
};

const baseInvoice: InvoiceFormState = {
  invoiceNumber: "",
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
  balanceDue: 0,
  notes: "",
  subtotal: 0,
  tax: 0,
  total: 0,
  items: [{ ...emptyItem }],
};

export default function CreateInvoiceDetailPage({ params }: { params: { invoiceId: string } }) {
  const router = useRouter();
  const previewRef = useRef<HTMLDivElement>(null);
  const [invoice, setInvoice] = useState<InvoiceFormState>(baseInvoice);
  const [showPreview, setShowPreview] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const totals = useMemo(() => {
    const subtotal = invoice.items.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
    const taxAmount = Number(invoice.tax) || 0;
    const total = subtotal + taxAmount;

    return {
      subtotal,
      tax: taxAmount,
      total,
      balanceDue: total,
    };
  }, [invoice.items, invoice.tax]);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/invoices/${params.invoiceId}`);

        if (!response.ok) {
          throw new Error("Invoice tidak ditemukan atau tidak bisa dimuat");
        }

        const data = await response.json();

        setInvoice({
          invoiceNumber: data.invoiceNumber ?? "",
          fromName: data.fromName ?? "",
          fromAddress: data.fromAddress ?? "",
          fromPhone: data.fromPhone ?? "",
          fromEmail: data.fromEmail ?? "",
          fromWebsite: data.fromWebsite ?? "",
          billToName: data.billToName ?? "",
          billToCompany: data.billToCompany ?? "",
          billToPhone: data.billToPhone ?? "",
          date: data.date ? String(data.date).slice(0, 10) : "",
          dueDate: data.dueDate ? String(data.dueDate).slice(0, 10) : "",
          balanceDue: data.balanceDue ?? 0,
          notes: data.notes ?? "",
          subtotal: data.subtotal ?? 0,
          tax: data.tax ?? 0,
          total: data.total ?? 0,
          items:
            Array.isArray(data.items) && data.items.length > 0
              ? data.items.map((item: InvoiceItemForm) => ({
                  ...emptyItem,
                  ...item,
                  quantity: Number(item.quantity) || 0,
                  rate: Number(item.rate) || 0,
                  amount: Number(item.amount) || 0,
                }))
              : [{ ...emptyItem }],
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Terjadi kesalahan";
        toast.error(message);
        router.push("/dashboard/invoice");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoice();
  }, [params.invoiceId, router]);

  const handleFieldChange = (field: keyof InvoiceFormState, value: string | number) => {
    setInvoice((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItemForm, value: string | number) => {
    setInvoice((prev) => {
      const nextItems = prev.items.map((item, idx) => {
        if (idx !== index) return item;

        const updated: InvoiceItemForm = { ...item, [field]: value } as InvoiceItemForm;
        const quantity = field === "quantity" ? Number(value) || 0 : Number(item.quantity) || 0;
        const rate = field === "rate" ? Number(value) || 0 : Number(item.rate) || 0;
        updated.quantity = quantity;
        updated.rate = rate;
        updated.amount = quantity * rate;
        return updated;
      });

      return { ...prev, items: nextItems };
    });
  };

  const addItem = () => {
    setInvoice((prev) => ({ ...prev, items: [...prev.items, { ...emptyItem }] }));
  };

  const removeItem = (index: number) => {
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index),
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const payload = {
        ...invoice,
        ...totals,
        items: invoice.items,
      };

      const response = await fetch(`/api/invoices/${params.invoiceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Gagal menyimpan invoice");
      }

      toast.success("Invoice berhasil disimpan");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = async () => {
    if (!previewRef.current) return;

    try {
      setIsDownloading(true);
      const html2pdf = (await import("html2pdf.js")).default as unknown as Html2Pdf;

      if (!html2pdf) {
        throw new Error("Fitur download tidak tersedia");
      }

      const options = {
        margin: 0.3,
        filename: `${invoice.invoiceNumber || "invoice"}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
      };

      await html2pdf().set(options).from(previewRef.current).save();
      toast.success("Preview berhasil diunduh");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal mengunduh preview";
      toast.error(message);
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-6 w-48 rounded bg-muted" />
            <div className="h-4 w-64 rounded bg-muted" />
          </div>
          <div className="h-10 w-40 rounded bg-muted" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="col-span-2 space-y-3">
            <div className="h-40 rounded bg-muted" />
            <div className="h-64 rounded bg-muted" />
          </div>
          <div className="h-full min-h-[400px] rounded bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Invoice #{invoice.invoiceNumber || params.invoiceId}</p>
          <h1 className="text-2xl font-bold">Lengkapi Detail Invoice</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/invoice">Kembali</Link>
          </Button>
          <Button variant="outline" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Menyimpan...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Simpan Invoice
              </span>
            )}
          </Button>
          <Button onClick={handleDownload} disabled={isDownloading || isSaving}>
            {isDownloading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Mengunduh...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download Preview
              </span>
            )}
          </Button>
          <div className="flex items-center gap-2 rounded-md border px-3 py-2">
            <Label htmlFor="toggle-preview">Tampilkan Preview</Label>
            <Switch
              id="toggle-preview"
              checked={showPreview}
              onCheckedChange={(value) => setShowPreview(Boolean(value))}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Pengirim</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fromName">Nama / Perusahaan</Label>
                  <Input
                    id="fromName"
                    value={invoice.fromName}
                    onChange={(event) => handleFieldChange("fromName", event.target.value)}
                    placeholder="PT Maju Mundur"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromPhone">Telepon</Label>
                  <Input
                    id="fromPhone"
                    value={invoice.fromPhone}
                    onChange={(event) => handleFieldChange("fromPhone", event.target.value)}
                    placeholder="0812-3456-7890"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromEmail">Email</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={invoice.fromEmail}
                    onChange={(event) => handleFieldChange("fromEmail", event.target.value)}
                    placeholder="finance@contoh.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fromWebsite">Website</Label>
                  <Input
                    id="fromWebsite"
                    value={invoice.fromWebsite}
                    onChange={(event) => handleFieldChange("fromWebsite", event.target.value)}
                    placeholder="https://contoh.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromAddress">Alamat</Label>
                <Textarea
                  id="fromAddress"
                  value={invoice.fromAddress}
                  onChange={(event) => handleFieldChange("fromAddress", event.target.value)}
                  placeholder="Jl. Sudirman No. 1, Jakarta"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informasi Klien</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="billToName">Nama Klien</Label>
                  <Input
                    id="billToName"
                    value={invoice.billToName}
                    onChange={(event) => handleFieldChange("billToName", event.target.value)}
                    placeholder="Nama klien"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billToCompany">Perusahaan</Label>
                  <Input
                    id="billToCompany"
                    value={invoice.billToCompany}
                    onChange={(event) => handleFieldChange("billToCompany", event.target.value)}
                    placeholder="PT Client Jaya"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billToPhone">Telepon</Label>
                  <Input
                    id="billToPhone"
                    value={invoice.billToPhone}
                    onChange={(event) => handleFieldChange("billToPhone", event.target.value)}
                    placeholder="0812-0000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoiceDate">Tanggal Invoice</Label>
                  <Input
                    id="invoiceDate"
                    type="date"
                    value={invoice.date || ""}
                    onChange={(event) => handleFieldChange("date", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Jatuh Tempo</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={invoice.dueDate || ""}
                    onChange={(event) => handleFieldChange("dueDate", event.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Item & Harga</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {invoice.items.map((item, index) => (
                  <div key={index} className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">Item #{index + 1}</p>
                      {invoice.items.length > 1 && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeItem(index)}
                          aria-label={`Hapus item ${index + 1}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`item-name-${index}`}>Nama Item</Label>
                        <Input
                          id={`item-name-${index}`}
                          value={item.name}
                          onChange={(event) => handleItemChange(index, "name", event.target.value)}
                          placeholder="Desain landing page"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`item-quantity-${index}`}>Jumlah</Label>
                        <Input
                          id={`item-quantity-${index}`}
                          type="number"
                          min={0}
                          value={item.quantity}
                          onChange={(event) => handleItemChange(index, "quantity", Number(event.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`item-rate-${index}`}>Rate</Label>
                        <Input
                          id={`item-rate-${index}`}
                          type="number"
                          min={0}
                          value={item.rate}
                          onChange={(event) => handleItemChange(index, "rate", Number(event.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`item-amount-${index}`}>Jumlah (otomatis)</Label>
                        <Input id={`item-amount-${index}`} value={item.amount} disabled />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`item-desc-${index}`}>Deskripsi</Label>
                      <Textarea
                        id={`item-desc-${index}`}
                        value={item.description}
                        onChange={(event) => handleItemChange(index, "description", event.target.value)}
                        placeholder="Catatan tambahan untuk item ini"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={addItem} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Tambah Item
                </Button>
                <div className="flex items-center gap-2">
                  <Label htmlFor="taxInput">Pajak / Biaya Lain (Rp)</Label>
                  <Input
                    id="taxInput"
                    type="number"
                    min={0}
                    className="w-32"
                    value={invoice.tax ?? 0}
                    onChange={(event) => handleFieldChange("tax", Number(event.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Catatan</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={invoice.notes}
                onChange={(event) => handleFieldChange("notes", event.target.value)}
                placeholder="Sertakan informasi pembayaran, nomor rekening, atau catatan lainnya"
              />
            </CardContent>
          </Card>
        </div>

        {showPreview && (
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-3">
              <Card>
                <CardHeader>
                  <CardTitle>Preview Invoice</CardTitle>
                </CardHeader>
                <CardContent>
                  <div ref={previewRef} className="space-y-4 rounded-lg border bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-bold">{invoice.fromName || "Nama Pengirim"}</p>
                        {invoice.fromAddress && <p className="text-sm text-muted-foreground">{invoice.fromAddress}</p>}
                        {invoice.fromPhone && <p className="text-sm text-muted-foreground">{invoice.fromPhone}</p>}
                        {invoice.fromEmail && <p className="text-sm text-muted-foreground">{invoice.fromEmail}</p>}
                        {invoice.fromWebsite && <p className="text-sm text-muted-foreground">{invoice.fromWebsite}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Invoice</p>
                        <p className="text-xl font-extrabold">#{invoice.invoiceNumber || params.invoiceId}</p>
                        {invoice.date && <p className="text-sm text-muted-foreground">Tanggal: {invoice.date}</p>}
                        {invoice.dueDate && <p className="text-sm text-muted-foreground">Jatuh tempo: {invoice.dueDate}</p>}
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Ditagihkan Kepada</p>
                        <p className="font-semibold">{invoice.billToName || "Nama klien"}</p>
                        {invoice.billToCompany && (
                          <p className="text-sm text-muted-foreground">{invoice.billToCompany}</p>
                        )}
                        {invoice.billToPhone && (
                          <p className="text-sm text-muted-foreground">Telepon: {invoice.billToPhone}</p>
                        )}
                      </div>
                      <div className="space-y-1 text-right">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Ringkasan</p>
                        <p className="text-sm text-muted-foreground">Subtotal: Rp {totals.subtotal.toLocaleString("id-ID")}</p>
                        <p className="text-sm text-muted-foreground">Pajak/Biaya: Rp {totals.tax.toLocaleString("id-ID")}</p>
                        <p className="text-lg font-bold">Total: Rp {totals.total.toLocaleString("id-ID")}</p>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-md border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold">Item</th>
                            <th className="px-3 py-2 text-left font-semibold">Jumlah</th>
                            <th className="px-3 py-2 text-left font-semibold">Rate</th>
                            <th className="px-3 py-2 text-right font-semibold">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoice.items.map((item, index) => (
                            <tr key={index} className="border-t">
                              <td className="px-3 py-2">
                                <p className="font-semibold">{item.name || `Item ${index + 1}`}</p>
                                {item.description && (
                                  <p className="text-xs text-muted-foreground">{item.description}</p>
                                )}
                              </td>
                              <td className="px-3 py-2">{item.quantity}</td>
                              <td className="px-3 py-2">Rp {item.rate.toLocaleString("id-ID")}</td>
                              <td className="px-3 py-2 text-right">Rp {item.amount.toLocaleString("id-ID")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-end">
                      <div className="w-full max-w-xs space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span className="font-semibold">Rp {totals.subtotal.toLocaleString("id-ID")}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Pajak / Biaya</span>
                          <span className="font-semibold">Rp {totals.tax.toLocaleString("id-ID")}</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between text-base font-bold">
                          <span>Total</span>
                          <span>Rp {totals.total.toLocaleString("id-ID")}</span>
                        </div>
                        <div className="flex items-center justify-between text-base font-bold">
                          <span>Saldo Terhutang</span>
                          <span>Rp {totals.balanceDue.toLocaleString("id-ID")}</span>
                        </div>
                      </div>
                    </div>

                    {invoice.notes && (
                      <div className="rounded-md bg-muted/40 p-3 text-sm">
                        <p className="font-semibold">Catatan</p>
                        <p className="text-muted-foreground">{invoice.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
