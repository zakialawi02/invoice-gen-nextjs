import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
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
import { getCurrencySymbol } from "@/lib/currency";
import { Textarea } from "@/components/ui/textarea";
import { InputNumber } from "@/components/input-number";

type InvoiceItem = {
  name: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
};

export default function InvoiceCard({ showPreview = false }: { showPreview?: boolean }) {
  const [dateIssued, setDateIssued] = useState<Date>(new Date());
  const [dateDue, setDateDue] = useState<Date | undefined>(undefined);
  const [currency, setCurrency] = useState<string>("USD");
  const [items, setItems] = useState<InvoiceItem[]>([
    { name: "Cloud Hosting Subscription", description: null, quantity: 1, unitPrice: 3500 },
    { name: "Data Analytics Report", description: null, quantity: 2, unitPrice: 750 },
    { name: "On-Site Technical Support", description: null, quantity: 1, unitPrice: 400 },
  ]);
  const [taxRate, setTaxRate] = useState<number>(10);
  const [discount, setDiscount] = useState<number>(0);

  const currencyData = [
    { name: "USD", symbol: "$", label: "US Dollar" },
    { name: "EUR", symbol: "€", label: "Euro" },
    { name: "IDR", symbol: "Rp", label: "Indonesian Rupiah" },
    { name: "JPY", symbol: "¥", label: "Japanese Yen" },
    { name: "SGD", symbol: "$", label: "Singapore Dollar" },
  ];

  const handleAddItem = (): void => {
    setItems([...items, { name: "", description: null, quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number): void => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number,
  ): void => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount - discount;

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
      <CardContent>
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invoiceNumber">Invoice Number</Label>
            <Input type="text" id="invoiceNumber" placeholder="ZKDEV_ _ _ _ _ _ _ _ _ _ _" />
          </div>

          <div className="flex w-full flex-col md:flex-row gap-3 space-y-2">
            <div className="space-y-2 w-full">
              <Label htmlFor="dateIssued">Date Issued</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    data-empty={!dateIssued}
                    className="data-[empty=true]:text-muted-foreground w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon />
                    {dateIssued ? format(dateIssued, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    id="dateIssued"
                    mode="single"
                    selected={dateIssued}
                    onSelect={(selectedDate) => selectedDate && setDateIssued(selectedDate)}
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
                    data-empty={!dateDue}
                    className="data-[empty=true]:text-muted-foreground w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon />
                    {dateDue ? format(dateDue, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    id="dateDue"
                    mode="single"
                    selected={dateDue}
                    onSelect={setDateDue}
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
            <div className="flex justify-between items-center">
              <Label htmlFor="invoiceItems">Invoice Items/Service</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="w-50">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencyData.map((value, index) => (
                    <SelectItem key={index} value={value.name}>
                      ({value.symbol}) {value.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-12 gap-3 items-start">
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

            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-1 items-start">
                <div className="col-span-5 space-y-3">
                  <Input
                    type="text"
                    name="itemName"
                    placeholder="Item name"
                    value={item.name}
                    onChange={(e) => handleItemChange(index, "name", e.target.value)}
                  />
                  <Textarea
                    name="itemDescription"
                    placeholder="Description"
                    value={item.description ?? ""}
                    onChange={(e) => handleItemChange(index, "description", e.target.value)}
                    className="min-h-16"
                  />
                </div>
                <InputNumber
                  className="col-span-2"
                  value={item.quantity}
                  min={0}
                  onValueChange={(value) => handleItemChange(index, "quantity", value || 0)}
                />
                <InputCurrency
                  currency={currency}
                  name="itemUnitPrice"
                  className="col-span-2"
                  value={item.unitPrice}
                  onValueChange={(value) =>
                    handleItemChange(index, "unitPrice", value === undefined ? 0 : value)
                  }
                />
                <Input
                  type="text"
                  name="itemTotal"
                  className="col-span-2"
                  value={`${getCurrencySymbol(currency)} ${(item.quantity * item.unitPrice).toLocaleString()}`}
                  readOnly
                  disabled
                />
                <div className="col-span-1 flex items-center justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="hover:text-error hover:bg-error/20 h-6 w-6"
                    onClick={() => handleRemoveItem(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" className="w-full" onClick={handleAddItem}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Item
            </Button>
          </div>

          {/* Tax and Discount */}
          <div className="border-t pt-4 grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax Percentage</Label>
              <Select
                value={taxRate.toString()}
                onValueChange={(value) => setTaxRate(parseInt(value))}
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
                currency={currency}
                placeholder="Enter discount amount"
                value={discount}
                onValueChange={(value) => setDiscount(value || 0)}
              />
            </div>
          </div>
        </form>
      </CardContent>

      {/* Summary */}
      <CardFooter className="border-t">
        <div className="w-full space-y-3 rounded-lg">
          <div className="flex justify-between items-center py-2">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">
              {getCurrencySymbol(currency)} {subtotal.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center py-2">
            <span className="text-muted-foreground">Tax ({taxRate}%)</span>
            <span className="font-medium">
              {getCurrencySymbol(currency)} {taxAmount.toLocaleString()}
            </span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between items-center py-2 text-error">
              <span className="text-muted-foreground">Discount</span>
              <span className="font-medium">
                - {getCurrencySymbol(currency)} {discount.toLocaleString()}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-border">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-xl font-bold">
              {getCurrencySymbol(currency)} {total.toLocaleString()}
            </span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
