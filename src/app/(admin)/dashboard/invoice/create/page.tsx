"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import InvoiceCard from "./_components/invoice-card";
import InvoicePreviewCard from "./_components/invoice-preview-card";
import { InvoiceProvider, useInvoice } from "./_components/invoice-context";

export default function CreateNewInvoicePage() {
  return (
    <InvoiceProvider>
      <CreateNewInvoicePageContent />
    </InvoiceProvider>
  );
}

function CreateNewInvoicePageContent() {
  const [showPreview, setShowPreview] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { invoiceData } = useInvoice();

  const handleDownloadPreview = async () => {
    if (!invoiceData.items.length) {
      alert("Please add at least one item before downloading the preview.");
      return;
    }

    setIsDownloading(true);
    try {
      const fileSafeInvoiceNumber = (invoiceData.invoiceNumber || "preview").replace(/[^a-zA-Z0-9-_]+/g, "-");
      const response = await fetch("/api/invoices/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoiceData: {
            ...invoiceData,
            dateIssued: invoiceData.dateIssued ? invoiceData.dateIssued.toISOString() : null,
            dateDue: invoiceData.dateDue ? invoiceData.dateDue.toISOString() : null,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate invoice preview");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `invoice-preview-${fileSafeInvoiceNumber}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Failed to download invoice preview. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

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
          <Button variant={"outline"} onClick={handleDownloadPreview} disabled={isDownloading}>
            {isDownloading ? "Preparing..." : "Download Preview"}
          </Button>
          <Button variant={"outline"}>Save as Draft</Button>
          <Button>Send Invoice</Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 justify-between transition-all duration-300 ease-in-out">
        <InvoiceCard showPreview={showPreview} />
        <InvoicePreviewCard showPreview={showPreview} />
      </div>
    </div>
  );
}
