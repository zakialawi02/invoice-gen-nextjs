"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCallback, useEffect, useRef, useState } from "react";
import InvoiceCard from "./_components/invoice-card";
import InvoicePreviewCard from "./_components/invoice-preview-card";
import { InvoiceProvider } from "./_components/invoice-context";

export default function CreateNewInvoicePage() {
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const pendingPrintRef = useRef(false);

  const handleDownloadPreview = useCallback(() => {
    if (!previewRef.current || !showPreview) {
      pendingPrintRef.current = true;
      setShowPreview(true);
      return;
    }

    if (typeof window !== "undefined") {
      window.print();
    }
  }, [showPreview]);

  useEffect(() => {
    if (pendingPrintRef.current && previewRef.current && showPreview) {
      pendingPrintRef.current = false;

      if (typeof window !== "undefined") {
        window.print();
      }
    }
  }, [showPreview]);

  return (
    <InvoiceProvider>
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between border-b pb-3 no-print">
          <div className="flex items-center justify-between md:justify-start w-full">
            <h1 className="text-2xl font-bold">Create New Invoice</h1>
            <span className="mx-3 hidden md:inline-block h-6 border-l-2 border-border"></span>
            <div className="flex items-center md:items-center space-x-2">
              <Label htmlFor="Show Preview">Show Preview</Label>
              <Switch id="Show Preview" checked={showPreview} onCheckedChange={setShowPreview} />
            </div>
          </div>

          <div className="flex items-center self-end space-x-2">
            <Button variant={"secondary"} onClick={handleDownloadPreview}>
              Download Preview
            </Button>
            <Button variant={"outline"}>Save as Draft</Button>
            <Button>Send Invoice</Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 justify-between transition-all duration-300 ease-in-out">
          <InvoiceCard showPreview={showPreview} />
          <InvoicePreviewCard ref={previewRef} showPreview={showPreview} />
        </div>
      </div>
    </InvoiceProvider>
  );
}
