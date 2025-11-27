"use client";

import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, Download, Loader2, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { InvoiceForm, InvoiceFormData } from "@/components/invoice/invoice-form";
import { InvoicePreview } from "@/components/invoice/invoice-preview";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function CreateNewInvoicePage() {
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [formData, setFormData] = useState<InvoiceFormData>({
    invoiceNumber: "",
    currency: "USD",
    discount: 0,
    discountType: "PERCENTAGE",
    taxRate: 0,
    shipping: 0,
    items: [
      {
        name: "Web Development Service",
        description: "Frontend development with React",
        quantity: 10,
        rate: 50,
        amount: 500,
      },
    ],
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const createInvoiceDraft = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/invoices", {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to create invoice");

      const invoice = await response.json();
      setInvoiceId(invoice.id);
      setFormData((prev) => ({
        ...prev,
        invoiceNumber: invoice.invoiceNumber,
        date: invoice.date,
      }));

      // Update URL with invoice ID
      router.replace(`/dashboard/invoice/create?id=${invoice.id}`);
      toast.success("Invoice draft created");
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error("Failed to create invoice draft");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const loadInvoice = useCallback(async (invoiceId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/invoices/${invoiceId}`);

      if (!response.ok) throw new Error("Failed to load invoice");

      const invoice = await response.json();

      // Map invoice data to form data
      setFormData({
        invoiceNumber: invoice.invoiceNumber,
        fromName: invoice.fromName,
        fromAddress: invoice.fromAddress,
        fromCity: invoice.fromCity,
        fromState: invoice.fromState,
        fromZip: invoice.fromZip,
        fromCountry: invoice.fromCountry,
        fromPhone: invoice.fromPhone,
        fromEmail: invoice.fromEmail,
        fromWebsite: invoice.fromWebsite,
        billToName: invoice.billToName,
        billToCompany: invoice.billToCompany,
        billToEmail: invoice.billToEmail,
        billToPhone: invoice.billToPhone,
        billToAddress: invoice.billToAddress,
        billToCity: invoice.billToCity,
        billToState: invoice.billToState,
        billToZip: invoice.billToZip,
        billToCountry: invoice.billToCountry,
        date: invoice.date,
        dueDate: invoice.dueDate,
        paymentTerms: invoice.paymentTerms,
        poNumber: invoice.poNumber,
        currency: invoice.currency,
        discount: invoice.discount,
        discountType: invoice.discountType,
        taxRate: invoice.taxRate,
        shipping: invoice.shipping,
        notes: invoice.notes,
        terms: invoice.terms,
        items: invoice.items || [],
      });
    } catch (error) {
      console.error("Error loading invoice:", error);
      toast.error("Failed to load invoice");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load existing invoice if ID is provided
  useEffect(() => {
    if (id) {
      setInvoiceId(id);
      loadInvoice(id);
    } else {
      // Create new invoice draft
      createInvoiceDraft();
    }
  }, [id, createInvoiceDraft, loadInvoice]);

  const handleSubmit = async (data: InvoiceFormData) => {
    if (!invoiceId) {
      toast.error("Invoice ID not found");
      return;
    }

    // Frontend validation
    if (!data.invoiceNumber) {
      toast.error("Invoice number is required");
      return;
    }

    if (!data.items || data.items.length === 0) {
      toast.error("Please add at least one item to the invoice");
      return;
    }

    // Validate items
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      if (!item.name) {
        toast.error(`Item ${i + 1}: Name is required`);
        return;
      }
      if (item.quantity <= 0) {
        toast.error(`Item ${i + 1}: Quantity must be greater than 0`);
        return;
      }
      if (item.rate < 0) {
        toast.error(`Item ${i + 1}: Rate must be a positive number`);
        return;
      }
    }

    // Validate email formats if provided
    if (data.fromEmail && data.fromEmail.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.fromEmail)) {
        toast.error("From email is not valid");
        return;
      }
    }

    if (data.billToEmail && data.billToEmail.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.billToEmail)) {
        toast.error("Bill to email is not valid");
        return;
      }
    }

    // Validate numeric fields
    if (data.discount < 0) {
      toast.error("Discount must be a positive number");
      return;
    }

    if (data.discountType === "PERCENTAGE" && data.discount > 100) {
      toast.error("Discount percentage cannot exceed 100%");
      return;
    }

    if (data.taxRate < 0 || data.taxRate > 100) {
      toast.error("Tax rate must be between 0 and 100");
      return;
    }

    if (data.shipping < 0) {
      toast.error("Shipping must be a positive number");
      return;
    }

    try {
      setIsSaving(true);

      // Calculate totals
      const subtotal = data.items.reduce((sum, item) => sum + item.amount, 0);
      let discountAmount = 0;
      if (data.discountType === "PERCENTAGE") {
        discountAmount = (subtotal * data.discount) / 100;
      } else {
        discountAmount = data.discount;
      }
      const afterDiscount = subtotal - discountAmount;
      const tax = (afterDiscount * data.taxRate) / 100;
      const total = afterDiscount + tax + data.shipping;

      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          subtotal,
          tax,
          total,
          balanceDue: total,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || "Failed to save invoice");
      }

      toast.success("Invoice saved successfully");
      setFormData(data);
    } catch (error) {
      console.error("Error saving invoice:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to save invoice";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndSend = async () => {
    // First save the invoice
    await handleSubmit(formData);

    // Then update status to SENT
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "SENT",
        }),
      });

      if (!response.ok) throw new Error("Failed to send invoice");

      toast.success("Invoice sent successfully");
      router.push("/dashboard/invoice");
    } catch (error) {
      console.error("Error sending invoice:", error);
      toast.error("Failed to send invoice");
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoiceId) {
      toast.error("Invoice ID not found");
      return;
    }

    try {
      toast.loading("Generating PDF...");

      // Call backend API to generate PDF
      const response = await fetch(`/api/invoices/${invoiceId}/download`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || "Failed to generate PDF");
      }

      // Get the PDF blob
      const blob = await response.blob();

      // Create a download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${formData.invoiceNumber || invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.dismiss();
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.dismiss();
      toast.error("Failed to download PDF");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between border-b pb-3 sticky top-16 bg-background z-10 pt-3">
        <div className="flex items-center justify-between md:justify-start w-full">
          <h1 className="text-2xl font-bold">Create New Invoice</h1>
          <span className="mx-3 hidden md:inline-block h-6 border-l-2 border-border"></span>
          <div className="flex items-center md:items-center space-x-2">
            <Label htmlFor="Show Preview">Show Preview</Label>
            <Switch id="Show Preview" checked={showPreview} onCheckedChange={setShowPreview} />
          </div>
        </div>

        <div className="flex items-center self-end space-x-2">
          <Button variant="outline" onClick={() => handleSubmit(formData)} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save as Draft"
            )}
          </Button>
          <ButtonGroup>
            <Button onClick={handleSaveAndSend} disabled={isSaving}>
              Save and Send
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
                  <DropdownMenuItem onClick={() => handleSubmit(formData)}>
                    <Save className="w-4 h-4" />
                    Save Only
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSaveAndSend}>
                    <Save className="w-4 h-4" />
                    Save and Send Invoice
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadPDF}>
                    <Download className="w-4 h-4" />
                    Download PDF
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </ButtonGroup>
        </div>
      </div>

      <div className="space-y-2 px-2">
        <div className={`grid ${showPreview ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"} gap-6`}>
          {/* Form */}
          <div className={showPreview ? "" : "max-w-5xl mx-auto w-full"}>
            <InvoiceForm initialData={formData} onSubmit={handleSubmit} onChange={setFormData} />
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="sticky top-40 h-fit">
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold">Preview</h2>
                <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </div>
              <div className="overflow-auto max-h-[calc(100vh-200px)] border rounded-lg">
                <InvoicePreview data={formData} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
