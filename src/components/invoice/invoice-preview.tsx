"use client";

import { InvoiceFormData } from "./invoice-form";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface InvoicePreviewProps {
  data: InvoiceFormData;
}

export function InvoicePreview({ data }: InvoicePreviewProps) {
  // Calculate totals
  const subtotal = data.items.reduce((sum, item) => sum + item.amount, 0);

  let discountAmount = 0;
  if (data.discountType === "PERCENTAGE") {
    discountAmount = (subtotal * data.discount) / 100;
  } else {
    discountAmount = data.discount;
  }

  const afterDiscount = subtotal - discountAmount;
  const taxAmount = (afterDiscount * data.taxRate) / 100;
  const total = afterDiscount + taxAmount + data.shipping;
  const balanceDue = total;

  const formatCurrency = (amount: number) => {
    const symbols: Record<string, string> = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      IDR: "Rp",
    };
    const symbol = symbols[data.currency] || data.currency;
    return `${symbol}${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date?: Date | string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Card className="p-4 max-w-2xl mx-auto bg-white" id="invoice-preview">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">INVOICE</h1>
          <p className="text-xs text-gray-600">#{data.invoiceNumber}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-600">Invoice Date</p>
          <p className="text-sm font-semibold">{formatDate(data.date)}</p>
          <p className="text-xs text-gray-600 mt-1">Due Date</p>
          <p className="text-sm font-semibold">{formatDate(data.dueDate)}</p>
        </div>
      </div>

      <Separator className="my-3" />

      {/* From and Bill To */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* From */}
        <div>
          <h3 className="text-xs font-semibold text-gray-600 mb-1">FROM</h3>
          <div className="text-xs space-y-0.5">
            {data.fromName && <p className="font-semibold text-gray-900">{data.fromName}</p>}
            {data.fromAddress && <p className="text-gray-700">{data.fromAddress}</p>}
            {(data.fromCity || data.fromState || data.fromZip) && (
              <p className="text-gray-700">
                {[data.fromCity, data.fromState, data.fromZip].filter(Boolean).join(", ")}
              </p>
            )}
            {data.fromCountry && <p className="text-gray-700">{data.fromCountry}</p>}
            {data.fromPhone && <p className="text-gray-700">{data.fromPhone}</p>}
            {data.fromEmail && <p className="text-gray-700">{data.fromEmail}</p>}
            {data.fromWebsite && <p className="text-gray-700">{data.fromWebsite}</p>}
          </div>
        </div>

        {/* Bill To */}
        <div>
          <h3 className="text-xs font-semibold text-gray-600 mb-1">BILL TO</h3>
          <div className="text-xs space-y-0.5">
            {data.billToName && <p className="font-semibold text-gray-900">{data.billToName}</p>}
            {data.billToCompany && <p className="text-gray-700">{data.billToCompany}</p>}
            {data.billToAddress && <p className="text-gray-700">{data.billToAddress}</p>}
            {(data.billToCity || data.billToState || data.billToZip) && (
              <p className="text-gray-700">
                {[data.billToCity, data.billToState, data.billToZip].filter(Boolean).join(", ")}
              </p>
            )}
            {data.billToCountry && <p className="text-gray-700">{data.billToCountry}</p>}
            {data.billToPhone && <p className="text-gray-700">{data.billToPhone}</p>}
            {data.billToEmail && <p className="text-gray-700">{data.billToEmail}</p>}
          </div>
        </div>
      </div>

      {/* Payment Terms & PO */}
      {(data.paymentTerms || data.poNumber) && (
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
          {data.paymentTerms && (
            <div>
              <span className="text-gray-600">Payment Terms: </span>
              <span className="font-semibold">{data.paymentTerms}</span>
            </div>
          )}
          {data.poNumber && (
            <div>
              <span className="text-gray-600">PO Number: </span>
              <span className="font-semibold">{data.poNumber}</span>
            </div>
          )}
        </div>
      )}

      <Separator className="my-3" />

      {/* Items Table */}
      <div className="mb-4">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[25%]" />
            <col className="w-[35%]" />
            <col className="w-[12%]" />
            <col className="w-[14%]" />
            <col className="w-[14%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left py-1.5 text-xs font-semibold text-gray-700">ITEM</th>
              <th className="text-left py-1.5 text-xs font-semibold text-gray-700">DESCRIPTION</th>
              <th className="text-right py-1.5 text-xs font-semibold text-gray-700">QTY</th>
              <th className="text-right py-1.5 text-xs font-semibold text-gray-700">RATE</th>
              <th className="text-right py-1.5 text-xs font-semibold text-gray-700">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-1.5 text-xs text-gray-900 wrap-break-word">{item.name}</td>
                <td className="py-1.5 text-xs text-gray-700 wrap-break-word">
                  {item.description || "-"}
                </td>
                <td className="py-1.5 text-xs text-right text-gray-900 whitespace-nowrap">
                  {item.quantity}
                </td>
                <td className="py-1.5 text-xs text-right text-gray-900 whitespace-nowrap">
                  {formatCurrency(item.rate)}
                </td>
                <td className="py-1.5 text-xs text-right font-semibold text-gray-900 whitespace-nowrap">
                  {formatCurrency(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-4">
        <div className="w-48 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-semibold">{formatCurrency(subtotal)}</span>
          </div>

          {data.discount > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">
                Discount ({data.discountType === "PERCENTAGE" ? `${data.discount}%` : "Fixed"}):
              </span>
              <span className="font-semibold text-red-600">-{formatCurrency(discountAmount)}</span>
            </div>
          )}

          {data.taxRate > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Tax ({data.taxRate}%):</span>
              <span className="font-semibold">{formatCurrency(taxAmount)}</span>
            </div>
          )}

          {data.shipping > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Shipping:</span>
              <span className="font-semibold">{formatCurrency(data.shipping)}</span>
            </div>
          )}

          <Separator />

          <div className="flex justify-between text-sm font-bold">
            <span>Total:</span>
            <span>{formatCurrency(total)}</span>
          </div>

          <div className="flex justify-between text-sm font-bold bg-gray-100 p-2 rounded">
            <span>Balance Due:</span>
            <span className="text-blue-600">{formatCurrency(balanceDue)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      {data.notes && (
        <div className="mb-3">
          <h3 className="text-xs font-semibold text-gray-700 mb-1">NOTES</h3>
          <p className="text-xs text-gray-600 whitespace-pre-wrap">{data.notes}</p>
        </div>
      )}

      {/* Terms */}
      {data.terms && (
        <div className="mb-3">
          <h3 className="text-xs font-semibold text-gray-700 mb-1">TERMS & CONDITIONS</h3>
          <p className="text-xs text-gray-600 whitespace-pre-wrap">{data.terms}</p>
        </div>
      )}

      {/* Footer */}
      <Separator className="my-3" />
      <div className="text-center text-[10px] text-gray-500">
        <p>Thank you for your business!</p>
      </div>
    </Card>
  );
}
