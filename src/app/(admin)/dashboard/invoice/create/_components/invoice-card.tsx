"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, PlusCircle, ReceiptText, Trash2 } from "lucide-react";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import InputCurrency from "@/components/input-currency";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import { Textarea } from "@/components/ui/textarea";
import { InputNumber } from "@/components/input-number";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { InvoiceData, InvoiceItem } from "@/types/invoice";

interface InvoiceFormProps {
  invoiceData: InvoiceData;
  onDataChange: <T extends keyof InvoiceData>(field: T, value: InvoiceData[T]) => void;
  onItemChange: <T extends keyof InvoiceItem>(
    index: number,
    field: T,
    value: InvoiceItem[T],
  ) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  showPreview?: boolean;
}

export default function InvoiceCard({
  invoiceData,
  onDataChange,
  onItemChange,
  onAddItem,
  onRemoveItem,
  showPreview = false,
}: InvoiceFormProps) {
  const [tabSection, setTabSection] = useState<string>("general");
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const currencyData = [
    { name: "USD", label: "US Dollar" },
    { name: "EUR", label: "Euro" },
    { name: "IDR", label: "Indonesian Rupiah" },
    { name: "JPY", label: "Japanese Yen" },
    { name: "SGD", label: "Singapore Dollar" },
  ];

  const subtotal = invoiceData.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxAmount = (subtotal * invoiceData.taxRate) / 100;
  const total = subtotal + taxAmount - invoiceData.discount;

  return (
    <Card className={`w-full ${showPreview ? "md:max-w-1/2" : ""}`}>
      <CardHeader>
        <CardTitle>
          <span className="mr-2 inline-flex items-center">
            <span className="bg-primary/10 p-2 rounded-full mr-2">
              <ReceiptText className="h-4 w-4 text-primary" />
            </span>
            Invoice Details
          </span>
        </CardTitle>
      </CardHeader>

      <Tabs className="w-full px-6" defaultValue={tabSection} onValueChange={setTabSection}>
        <TabsList className="w-full">
          <TabsTrigger value="layout">Layout</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="other">Other</TabsTrigger>
        </TabsList>
      </Tabs>

      {tabSection === "layout" && (
        <CardContent>
          <div className="flex w-full flex-col md:flex-row gap-3 space-y-2">
            <div className="space-y-2 w-full">
              <Label htmlFor="template">Template</Label>
              <Select defaultValue="template-1">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="template-1">Template 1</SelectItem>
                  <SelectItem value="template-2">Template 2</SelectItem>
                  <SelectItem value="template-3">Template 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      )}

      {tabSection === "general" && (
        <CardContent>
          <form className="space-y-4">
            {/* Billed From */}
            <div className="space-y-2">
              <Label htmlFor="billedTo">Billed</Label>
              <div className="flex items-start gap-3 border p-3 rounded-lg bg-muted/30">
                <Avatar className="size-12">
                  <AvatarImage src="/placeholder-company.png" alt="Company Logo" />
                  <AvatarFallback>{getInitials(invoiceData.companyName)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">Your Company Name</p>
                  <p className="text-sm text-muted-foreground">yourcompany@email.com</p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  alert("Add My Company");
                }}
              >
                Add My Company
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                type="text"
                id="invoiceNumber"
                placeholder="ZKDEV_ _ _ _ _ _ _ _ _ _ _"
                value={invoiceData.invoiceNumber}
                onChange={(e) => onDataChange("invoiceNumber", e.target.value)}
              />
            </div>

            <div className="flex w-full flex-col md:flex-row gap-3 space-y-2">
              <div className="space-y-2 w-full">
                <Label htmlFor="dateIssued">Date of Issue</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="data-[empty=true]:text-muted-foreground w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon />
                      {invoiceData.invoiceDate ? (
                        format(invoiceData.invoiceDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      id="dateIssued"
                      mode="single"
                      selected={invoiceData.invoiceDate}
                      onSelect={(date) => onDataChange("invoiceDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2 w-full">
                <Label htmlFor="dateDue">Date Due</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="data-[empty=true]:text-muted-foreground w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon />
                      {invoiceData.dueDate ? (
                        format(invoiceData.dueDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      id="dateDue"
                      mode="single"
                      selected={invoiceData.dueDate}
                      onSelect={(date) => onDataChange("dueDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Billed To */}
            <div className="border-t pt-4">
              <Label htmlFor="billedTo">Billed To</Label>
              <div className="mt-2 border p-3 rounded-lg bg-muted/30">
                <p className="font-medium">Brightstone Industries</p>
                <p className="text-sm text-muted-foreground">jacobpau@brightstone.industries</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  alert("Add New Client");
                }}
              >
                Add New Client
              </Button>
            </div>

            {/* Invoice Items */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <Label htmlFor="invoiceItems">Invoice Items/Service</Label>
                <Select
                  defaultValue={invoiceData.currency}
                  value={invoiceData.currency}
                  onValueChange={(value) => onDataChange("currency", value)}
                >
                  <SelectTrigger className="w-full md:w-50">
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencyData.map((value, index) => (
                      <SelectItem key={index} value={value.name}>
                        {value.name} - {value.label} ({getCurrencySymbol(value.name)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="hidden md:grid grid-cols-12 gap-3 items-start">
                <div className="col-span-5 space-y-3">
                  <Label className="font-bold" htmlFor="itemName">
                    Item Name
                  </Label>
                </div>
                <div className="col-span-2 space-y-3">
                  <Label className="font-bold" htmlFor="itemQuantity">
                    Quantity
                  </Label>
                </div>
                <div className="col-span-2 space-y-3">
                  <Label className="font-bold" htmlFor="itemUnitPrice">
                    Unit Price
                  </Label>
                </div>
                <div className="col-span-2 space-y-3">
                  <Label className="font-bold" htmlFor="itemTotal">
                    Total
                  </Label>
                </div>
              </div>

              {invoiceData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-1 items-start">
                  <div className="col-span-12 md:col-span-5 mb-2 md:mb-0 space-y-3">
                    <Input
                      className="mb-1"
                      type="text"
                      name="itemName"
                      placeholder="Item name"
                      value={item.itemName}
                      onChange={(e) => onItemChange(index, "itemName", e.target.value)}
                    />
                    <Textarea
                      name="itemDescription"
                      placeholder="Description"
                      value={item.description ?? ""}
                      onChange={(e) => onItemChange(index, "description", e.target.value)}
                      className="min-h-16"
                    />
                  </div>
                  <div className="col-span-6 md:col-span-2">
                    <InputNumber
                      className="w-full"
                      value={item.quantity}
                      min={0}
                      onValueChange={(value) => onItemChange(index, "quantity", value || 0)}
                    />
                  </div>
                  <div className="col-span-6 md:col-span-2">
                    <InputCurrency
                      currency={invoiceData.currency}
                      name="itemUnitPrice"
                      className="w-full"
                      value={item.unitPrice}
                      onValueChange={(value) => onItemChange(index, "unitPrice", value || 0)}
                    />
                  </div>
                  <div className="col-span-6 md:col-span-2">
                    <InputCurrency
                      currency={invoiceData.currency}
                      type="text"
                      name="itemTotal"
                      className="w-full"
                      value={item.quantity * item.unitPrice}
                      readOnly
                      disabled
                    />
                  </div>
                  <div className="col-span-6 md:col-span-1 flex items-center justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="hover:text-error hover:bg-error/20 h-8 w-8"
                      onClick={() => onRemoveItem(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button type="button" variant="outline" className="w-full" onClick={onAddItem}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Item
              </Button>
            </div>

            {/* Tax and Discount */}
            <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax Percentage</Label>
                <Select
                  value={invoiceData.taxRate.toString()}
                  onValueChange={(value) => onDataChange("taxRate", parseInt(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select tax" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0%</SelectItem>
                    <SelectItem value="5">5%</SelectItem>
                    <SelectItem value="10">10%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount">Discount (Optional)</Label>
                <InputCurrency
                  id="discount"
                  currency={invoiceData.currency}
                  placeholder="Enter discount amount"
                  value={invoiceData.discount}
                  onValueChange={(value) => onDataChange("discount", value || 0)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                name="note"
                placeholder="Note"
                value={invoiceData.notes}
                onChange={(e) => onDataChange("notes", e.target.value)}
                className="min-h-16"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="anotherNote">Additional Field</Label>
              <Textarea
                name="anotherNote"
                placeholder="Terms & Conditions"
                value={invoiceData.additionalInfo}
                onChange={(e) => onDataChange("additionalInfo", e.target.value)}
                className="min-h-16"
              />
            </div>

            {/* Summary */}
            <div className="w-full border-t space-y-3 py-3 mt-8">
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">
                  {formatCurrency(subtotal, invoiceData.currency)}
                </span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Tax ({invoiceData.taxRate}%)</span>
                <span className="font-medium">
                  {formatCurrency(taxAmount, invoiceData.currency)}
                </span>
              </div>

              {invoiceData.discount > 0 && (
                <div className="flex justify-between items-center py-2 text-error">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-medium">
                    - {formatCurrency(invoiceData.discount, invoiceData.currency)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-border">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-xl font-bold">
                  {formatCurrency(total, invoiceData.currency)}
                </span>
              </div>
            </div>
          </form>
        </CardContent>
      )}
    </Card>
  );
}
