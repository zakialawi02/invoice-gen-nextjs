import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDown, ScanEye } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { InvoiceData } from "@/types/invoice";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type InvoicePreviewProps = {
  showPreview?: boolean;
  invoiceData: InvoiceData;
};

export default function InvoicePreviewCard({
  showPreview = false,
  invoiceData,
}: InvoicePreviewProps) {
  const subtotal = invoiceData.items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const taxAmount = (subtotal * invoiceData.taxRate) / 100;
  const total = subtotal + taxAmount - invoiceData.discount;

  return (
    <Card className={`w-full ${showPreview ? "md:max-w-1/2" : "hidden"} h-fit`}>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span className="mr-2 inline-flex items-center">
            <span className="bg-primary/10 p-2 rounded-full mr-2">
              <ScanEye className="h-4 w-4 text-primary" />
            </span>
            Preview
          </span>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="secondary"
              className="inline-flex items-center"
              onClick={() => {
                alert("Download Preview");
              }}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Download Preview
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2">
        <div className="preview-container bg-white text-gray-800 p-4 rounded-lg shadow-md max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">INVOICE</h1>
              <p className="text-gray-600 text-sm">#{invoiceData.invoiceNumber || "ZKDEV001"}</p>
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
                  {invoiceData.invoiceDate ? format(invoiceData.invoiceDate, "d MMM yyyy") : "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-xs">Due Date:</p>
                <p className="font-medium text-sm">
                  {invoiceData.dueDate ? format(invoiceData.dueDate, "d MMM yyyy") : "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%] font-bold">Item</TableHead>
                  <TableHead className="text-right font-bold">Qty</TableHead>
                  <TableHead className="text-right font-bold">Price</TableHead>
                  <TableHead className="text-right font-bold">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="border-b">
                {invoiceData.items.length > 0 ? (
                  invoiceData.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.itemName}</div>
                        {item.description && (
                          <div className="text-xs text-muted-foreground whitespace-pre-wrap">
                            {item.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.unitPrice, invoiceData.currency)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.quantity * item.unitPrice, invoiceData.currency)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                      No items added yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Totals */}
          <div className="ml-auto max-w-[200px]">
            <div className="flex justify-between py-1">
              <span className="text-gray-600 text-sm">Subtotal:</span>
              <span className="font-medium text-sm">
                {formatCurrency(subtotal, invoiceData.currency)}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-600 text-sm">Tax ({invoiceData.taxRate}%):</span>
              <span className="font-medium text-sm">
                {formatCurrency(taxAmount, invoiceData.currency)}
              </span>
            </div>
            {invoiceData.discount > 0 && (
              <div className="flex justify-between py-1 text-red-500">
                <span className="text-gray-600 text-sm">Discount:</span>
                <span className="font-medium text-sm">
                  - {formatCurrency(invoiceData.discount, invoiceData.currency)}
                </span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-200 mt-1">
              <span className="text-lg font-bold">Total:</span>
              <span className="text-lg font-bold">
                {formatCurrency(total, invoiceData.currency)}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            {invoiceData.notes && (
              <div className="mb-3">
                <h3 className="font-bold text-gray-900 mb-1 text-sm">Note:</h3>
                <p className="text-gray-600 text-sm">{invoiceData.notes}</p>
              </div>
            )}
            {invoiceData.additionalInfo && (
              <div>
                <h3 className="font-bold text-gray-900 mb-1 text-sm">Terms & Conditions:</h3>
                <p className="text-gray-600 text-sm">{invoiceData.additionalInfo}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
