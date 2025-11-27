"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

export interface InvoiceItem {
  id?: string;
  name: string;
  description?: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface InvoiceFormData {
  // From Information
  fromName?: string;
  fromAddress?: string;
  fromCity?: string;
  fromState?: string;
  fromZip?: string;
  fromCountry?: string;
  fromPhone?: string;
  fromEmail?: string;
  fromWebsite?: string;

  // Bill To Information
  billToName?: string;
  billToCompany?: string;
  billToEmail?: string;
  billToPhone?: string;
  billToAddress?: string;
  billToCity?: string;
  billToState?: string;
  billToZip?: string;
  billToCountry?: string;

  // Invoice Details
  invoiceNumber: string;
  date?: Date | string;
  dueDate?: Date | string;
  paymentTerms?: string;
  poNumber?: string;

  // Financial
  currency: string;
  discount: number;
  discountType: "PERCENTAGE" | "FIXED";
  taxRate: number;
  shipping: number;

  // Additional
  notes?: string;
  terms?: string;

  // Items
  items: InvoiceItem[];
}

interface InvoiceFormProps {
  initialData?: Partial<InvoiceFormData>;
  onSubmit: (data: InvoiceFormData) => void;
  onChange?: (data: InvoiceFormData) => void;
}

export function InvoiceForm({ initialData, onSubmit, onChange }: InvoiceFormProps) {
  const [formData, setFormData] = useState<InvoiceFormData>({
    invoiceNumber: initialData?.invoiceNumber || "",
    currency: initialData?.currency || "USD",
    discount: initialData?.discount || 0,
    discountType: initialData?.discountType || "PERCENTAGE",
    taxRate: initialData?.taxRate || 0,
    shipping: initialData?.shipping || 0,
    items: initialData?.items || [],
    ...initialData,
  });

  // Use ref to avoid infinite loop with onChange in useEffect
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Notify parent of changes
  useEffect(() => {
    onChangeRef.current?.(formData);
  }, [formData]);

  const updateField = (field: keyof InvoiceFormData, value: string | number | Date) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { name: "", description: "", quantity: 1, rate: 0, amount: 0 }],
    }));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Calculate amount
    if (field === "quantity" || field === "rate") {
      newItems[index].amount = newItems[index].quantity * newItems[index].rate;
    }

    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  const removeItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* From Section */}
      <Card>
        <CardHeader>
          <CardTitle>From (Your Information)</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fromName">Name/Business Name</Label>
            <Input
              id="fromName"
              value={formData.fromName || ""}
              onChange={(e) => updateField("fromName", e.target.value)}
              placeholder="Your Name or Business"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fromEmail">Email</Label>
            <Input
              id="fromEmail"
              type="email"
              value={formData.fromEmail || ""}
              onChange={(e) => updateField("fromEmail", e.target.value)}
              placeholder="your@email.com"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="fromAddress">Address</Label>
            <Input
              id="fromAddress"
              value={formData.fromAddress || ""}
              onChange={(e) => updateField("fromAddress", e.target.value)}
              placeholder="Street Address"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fromCity">City</Label>
            <Input
              id="fromCity"
              value={formData.fromCity || ""}
              onChange={(e) => updateField("fromCity", e.target.value)}
              placeholder="City"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fromState">State/Province</Label>
            <Input
              id="fromState"
              value={formData.fromState || ""}
              onChange={(e) => updateField("fromState", e.target.value)}
              placeholder="State"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fromZip">ZIP/Postal Code</Label>
            <Input
              id="fromZip"
              value={formData.fromZip || ""}
              onChange={(e) => updateField("fromZip", e.target.value)}
              placeholder="ZIP"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fromCountry">Country</Label>
            <Input
              id="fromCountry"
              value={formData.fromCountry || ""}
              onChange={(e) => updateField("fromCountry", e.target.value)}
              placeholder="Country"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fromPhone">Phone</Label>
            <Input
              id="fromPhone"
              value={formData.fromPhone || ""}
              onChange={(e) => updateField("fromPhone", e.target.value)}
              placeholder="+1 234 567 8900"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fromWebsite">Website</Label>
            <Input
              id="fromWebsite"
              value={formData.fromWebsite || ""}
              onChange={(e) => updateField("fromWebsite", e.target.value)}
              placeholder="www.yourwebsite.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Bill To Section */}
      <Card>
        <CardHeader>
          <CardTitle>Bill To (Client Information)</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="billToName">Client Name</Label>
            <Input
              id="billToName"
              value={formData.billToName || ""}
              onChange={(e) => updateField("billToName", e.target.value)}
              placeholder="Client Name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="billToCompany">Company</Label>
            <Input
              id="billToCompany"
              value={formData.billToCompany || ""}
              onChange={(e) => updateField("billToCompany", e.target.value)}
              placeholder="Company Name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="billToEmail">Email</Label>
            <Input
              id="billToEmail"
              type="email"
              value={formData.billToEmail || ""}
              onChange={(e) => updateField("billToEmail", e.target.value)}
              placeholder="client@email.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="billToPhone">Phone</Label>
            <Input
              id="billToPhone"
              value={formData.billToPhone || ""}
              onChange={(e) => updateField("billToPhone", e.target.value)}
              placeholder="+1 234 567 8900"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="billToAddress">Address</Label>
            <Input
              id="billToAddress"
              value={formData.billToAddress || ""}
              onChange={(e) => updateField("billToAddress", e.target.value)}
              placeholder="Street Address"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="billToCity">City</Label>
            <Input
              id="billToCity"
              value={formData.billToCity || ""}
              onChange={(e) => updateField("billToCity", e.target.value)}
              placeholder="City"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="billToState">State/Province</Label>
            <Input
              id="billToState"
              value={formData.billToState || ""}
              onChange={(e) => updateField("billToState", e.target.value)}
              placeholder="State"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="billToZip">ZIP/Postal Code</Label>
            <Input
              id="billToZip"
              value={formData.billToZip || ""}
              onChange={(e) => updateField("billToZip", e.target.value)}
              placeholder="ZIP"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="billToCountry">Country</Label>
            <Input
              id="billToCountry"
              value={formData.billToCountry || ""}
              onChange={(e) => updateField("billToCountry", e.target.value)}
              placeholder="Country"
            />
          </div>
        </CardContent>
      </Card>

      {/* Invoice Details */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="invoiceNumber">Invoice Number</Label>
            <Input
              id="invoiceNumber"
              value={formData.invoiceNumber}
              onChange={(e) => updateField("invoiceNumber", e.target.value)}
              placeholder="INV-2024-0001"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={formData.currency}
              onValueChange={(value) => updateField("currency", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
                <SelectItem value="IDR">IDR (Rp)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Invoice Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date ? new Date(formData.date).toISOString().split("T")[0] : ""}
              onChange={(e) => updateField("date", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate ? new Date(formData.dueDate).toISOString().split("T")[0] : ""}
              onChange={(e) => updateField("dueDate", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentTerms">Payment Terms</Label>
            <Select
              value={formData.paymentTerms || ""}
              onValueChange={(value) => updateField("paymentTerms", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select terms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                <SelectItem value="Net 15">Net 15</SelectItem>
                <SelectItem value="Net 30">Net 30</SelectItem>
                <SelectItem value="Net 60">Net 60</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="poNumber">PO Number (Optional)</Label>
            <Input
              id="poNumber"
              value={formData.poNumber || ""}
              onChange={(e) => updateField("poNumber", e.target.value)}
              placeholder="PO-12345"
            />
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Items</CardTitle>
          <Button type="button" onClick={addItem} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.items.length > 0 && (
            <div className="overflow-x-auto">
              {/* Table Header */}
              <div className="hidden md:grid md:grid-cols-12 gap-3 pb-3 px-4 border-b-2 border-border/50 font-medium text-sm text-muted-foreground">
                <div className="col-span-5">Item Name</div>
                <div className="col-span-2 text-center">Quantity</div>
                <div className="col-span-2 text-right">Rate</div>
                <div className="col-span-2 text-right">Amount</div>
                <div className="col-span-1 text-center">Action</div>
              </div>

              {/* Table Body */}
              <div className="space-y-3 mt-2">
                {formData.items.map((item, index) => (
                  <div
                    key={index}
                    className="group relative rounded-lg border border-border/50 bg-card hover:bg-accent/5 hover:border-primary/20 transition-all duration-200"
                  >
                    {/* Main Row: Item Name, Quantity, Rate, Amount, Action */}
                    <div className="grid grid-cols-12 gap-3 p-4 pb-2">
                      {/* Item Name Column */}
                      <div className="col-span-12 md:col-span-5 space-y-1.5">
                        <Label className="text-xs md:hidden text-muted-foreground">Item Name</Label>
                        <Input
                          value={item.name}
                          onChange={(e) => updateItem(index, "name", e.target.value)}
                          placeholder="Enter item name"
                          required
                          className="h-9 bg-background font-medium"
                        />
                      </div>

                      {/* Quantity Column */}
                      <div className="col-span-4 md:col-span-2 space-y-1.5">
                        <Label className="text-xs md:hidden text-muted-foreground">Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItem(index, "quantity", parseFloat(e.target.value) || 0)
                          }
                          required
                          className="h-9 bg-background text-center"
                        />
                      </div>

                      {/* Rate Column */}
                      <div className="col-span-4 md:col-span-2 space-y-1.5">
                        <Label className="text-xs md:hidden text-muted-foreground">Rate</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.rate}
                          onChange={(e) =>
                            updateItem(index, "rate", parseFloat(e.target.value) || 0)
                          }
                          required
                          className="h-9 bg-background text-right"
                        />
                      </div>

                      {/* Amount Column */}
                      <div className="col-span-3 md:col-span-2 space-y-1.5">
                        <Label className="text-xs md:hidden text-muted-foreground">Amount</Label>
                        <Input
                          value={item.amount.toFixed(2)}
                          disabled
                          className="h-9 bg-muted/50 text-right font-semibold"
                        />
                      </div>

                      {/* Action Column */}
                      <div className="col-span-1 md:col-span-1 flex items-end justify-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                          className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Full Width Description Row */}
                    <div className="px-4 pb-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          Description (Optional)
                        </Label>
                        <Textarea
                          value={item.description || ""}
                          onChange={(e) => updateItem(index, "description", e.target.value)}
                          placeholder="Add item description..."
                          className="min-h-[60px] resize-none bg-background text-sm w-full"
                          rows={2}
                        />
                      </div>
                    </div>

                    {/* Row number indicator */}
                    <div className="absolute -left-3 top-6 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {formData.items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-border/50 rounded-lg bg-muted/20">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Plus className="w-8 h-8 text-primary/50" />
              </div>
              <p className="text-muted-foreground font-medium mb-1">No items added yet</p>
              <p className="text-sm text-muted-foreground/70 mb-4">
                Click &quot;Add Item&quot; to start building your invoice
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Details */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Charges</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="discount">Discount</Label>
            <div className="flex gap-2">
              <Input
                id="discount"
                type="number"
                min="0"
                step="0.01"
                value={formData.discount}
                onChange={(e) => updateField("discount", parseFloat(e.target.value) || 0)}
              />
              <Select
                value={formData.discountType}
                onValueChange={(value: "PERCENTAGE" | "FIXED") =>
                  updateField("discountType", value)
                }
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">%</SelectItem>
                  <SelectItem value="FIXED">Fixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxRate">Tax Rate (%)</Label>
            <Input
              id="taxRate"
              type="number"
              min="0"
              step="0.01"
              value={formData.taxRate}
              onChange={(e) => updateField("taxRate", parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shipping">Shipping</Label>
            <Input
              id="shipping"
              type="number"
              min="0"
              step="0.01"
              value={formData.shipping}
              onChange={(e) => updateField("shipping", parseFloat(e.target.value) || 0)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notes and Terms */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Any additional notes or comments"
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="terms">Terms & Conditions</Label>
            <Textarea
              id="terms"
              value={formData.terms || ""}
              onChange={(e) => updateField("terms", e.target.value)}
              placeholder="Payment terms, late fees, etc."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <input type="submit" hidden />
    </form>
  );
}
