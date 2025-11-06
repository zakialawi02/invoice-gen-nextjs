import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScanEye } from "lucide-react";
import { useInvoice } from "./invoice-context";
import { getCurrencySymbol } from "@/lib/currency";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { forwardRef } from "react";

const InvoicePreviewCard = forwardRef<HTMLDivElement, { showPreview?: boolean }>(({ showPreview = false }, ref) => {
  const { invoiceData } = useInvoice();

  const subtotal = invoiceData.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxAmount = (subtotal * invoiceData.taxRate) / 100;
  const total = subtotal + taxAmount - invoiceData.discount;

  return (
    <>
      <style jsx global>{`
        @media print {
          body {
            background: #fff;
            margin: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .invoice-preview-print {
            display: block !important;
            width: 100% !important;
            max-width: 210mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: transparent !important;
          }

          .invoice-preview-print.hidden {
            display: block !important;
          }

          .invoice-preview-print .preview-container {
            box-shadow: none !important;
            border: none !important;
            max-width: 100% !important;
          }

          .invoice-preview-print .preview-container table {
            width: 100%;
          }

          @page {
            size: A4;
            margin: 12mm;
          }
        }
      `}</style>
      <Card ref={ref} className={`invoice-preview-print w-full ${showPreview ? "md:max-w-1/2" : "hidden"}`}>
        <CardHeader>
          <CardTitle>
            <span className="mr-2 inline-flex items-center">
              <span className="bg-primary/10 p-2 rounded-full mr-2">
                <ScanEye className="h-4 w-4 text-primary" />
              </span>
              Preview
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2">
          <div className="preview-container bg-white text-gray-800 p-4 rounded-lg shadow-md max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">INVOICE</h1>
              <p className="text-gray-600 text-sm">#{invoiceData.invoiceNumber || "INV-001"}</p>
            </div>
            <div className="text-right text-gray-600">
              <Avatar className="bg-gray-600 size-12 ml-auto">
                <AvatarImage
                  src="/placeholder-company.png"
                  className="bg-gray-600"
                  alt="Company Logo"
                />
                <AvatarFallback className="text-sm bg-gray-600 text-black">CN</AvatarFallback>
              </Avatar>
              <p className="font-bold mt-1 text-sm">Your Company Name</p>
              <p className="text-gray-600 text-xs">yourcompany@email.com</p>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div>
              <h3 className="font-bold text-gray-900 mb-1 text-sm">Bill To:</h3>
              <p className="font-medium text-sm">Brightstone Industries</p>
              <p className="text-gray-600 text-xs">jacobpau@brightstone.industries</p>
            </div>
            <div className="text-right">
              <div className="mb-1">
                <p className="text-gray-600 text-xs">Date Issued:</p>
                <p className="font-medium text-sm">
                  {invoiceData.dateIssued ? format(invoiceData.dateIssued, "PPP") : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-xs">Due Date:</p>
                <p className="font-medium text-sm">
                  {invoiceData.dateDue ? format(invoiceData.dateDue, "PPP") : "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-2 text-left font-bold text-gray-900">Item</th>
                  <th className="py-2 text-right font-bold text-gray-900">Qty</th>
                  <th className="py-2 text-right font-bold text-gray-900">Price</th>
                  <th className="py-2 text-right font-bold text-gray-900">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.items.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-2">
                      <p className="font-medium text-sm">{item.name}</p>
                      {item.description && (
                        <p className="text-gray-600 text-xs">{item.description}</p>
                      )}
                    </td>
                    <td className="py-2 text-right text-sm">{item.quantity}</td>
                    <td className="py-2 text-right text-sm">
                      {getCurrencySymbol(invoiceData.currency)}{" "}
                      {new Intl.NumberFormat("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(item.unitPrice)}
                    </td>
                    <td className="py-2 text-right text-sm">
                      {getCurrencySymbol(invoiceData.currency)}{" "}
                      {new Intl.NumberFormat("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(item.quantity * item.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="ml-auto max-w-[200px]">
            <div className="flex justify-between py-1">
              <span className="text-gray-600 text-sm">Subtotal:</span>
              <span className="font-medium text-sm">
                {getCurrencySymbol(invoiceData.currency)}{" "}
                {new Intl.NumberFormat("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(subtotal)}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-600 text-sm">Tax ({invoiceData.taxRate}%):</span>
              <span className="font-medium text-sm">
                {getCurrencySymbol(invoiceData.currency)}{" "}
                {new Intl.NumberFormat("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(taxAmount)}
              </span>
            </div>
            {invoiceData.discount > 0 && (
              <div className="flex justify-between py-1 text-red-500">
                <span className="text-gray-600 text-sm">Discount:</span>
                <span className="font-medium text-sm">
                  - {getCurrencySymbol(invoiceData.currency)}{" "}
                  {new Intl.NumberFormat("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(invoiceData.discount)}
                </span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-200 mt-1">
              <span className="text-lg font-bold">Total:</span>
              <span className="text-lg font-bold">
                {getCurrencySymbol(invoiceData.currency)}{" "}
                {new Intl.NumberFormat("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(total)}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            {invoiceData.note && (
              <div className="mb-3">
                <h3 className="font-bold text-gray-900 mb-1 text-sm">Note:</h3>
                <p className="text-gray-600 text-sm">{invoiceData.note}</p>
              </div>
            )}
            {invoiceData.terms && (
              <div>
                <h3 className="font-bold text-gray-900 mb-1 text-sm">Terms & Conditions:</h3>
                <p className="text-gray-600 text-sm">{invoiceData.terms}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      </Card>
    </>
  );
});

InvoicePreviewCard.displayName = "InvoicePreviewCard";

export default InvoicePreviewCard;
