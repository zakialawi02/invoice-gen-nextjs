/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import InvoiceCard from "./_components/invoice-card";
import InvoicePreviewCard from "./_components/invoice-preview-card";
import { InvoiceData, InvoiceItem } from "@/types/invoice";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Save, Send, ChevronDown } from "lucide-react";
import { ButtonGroup, ButtonGroupSeparator } from "@/components/ui/button-group";

const initialInvoiceData: InvoiceData = {
  companyName: "Your Company Name",
  companyAddress: "yourcompany@email.com",
  clientName: "Brightstone Industries",
  clientAddress: "jacobpau@brightstone.industries",
  invoiceNumber: "",
  invoiceDate: new Date(),
  dueDate: (() => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);
    return dueDate;
  })(),
  items: [
    {
      id: "1",
      itemName: "Cloud Hosting Subscription",
      description: "Monthly subscription for premium cloud hosting services.",
      quantity: 1,
      unitPrice: 3500,
    },
    {
      id: "2",
      itemName: "Data Analytics Report",
      description: "Comprehensive quarterly data analytics and insights report.",
      quantity: 2,
      unitPrice: 750,
    },
    {
      id: "3",
      itemName: "On-Site Technical Support",
      description: "Emergency on-site technical support call.",
      quantity: 1,
      unitPrice: 400,
    },
  ],
  taxRate: 10,
  discount: 0,
  notes: "It was great doing business with you.",
  additionalInfo: "Please make the payment by the due date.",
  currency: "USD",
};

export default function CreateNewInvoicePage() {
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(initialInvoiceData);
  const [showPreview, setShowPreview] = useState(false);

  const handleDataChange = (field: keyof InvoiceData, value: any) => {
    setInvoiceData((prevData) => ({ ...prevData, [field]: value }));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...invoiceData.items];
    const item = { ...newItems[index] };
    if (field === "quantity" || field === "unitPrice") {
      item[field] = parseFloat(value) || 0;
    } else {
      item[field] = value;
    }
    newItems[index] = item;
    setInvoiceData((prevData) => ({ ...prevData, items: newItems }));
  };

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: new Date().getTime().toString(),
      itemName: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
    };
    setInvoiceData((prevData) => ({ ...prevData, items: [...prevData.items, newItem] }));
  };

  const handleRemoveItem = (index: number) => {
    const newItems = invoiceData.items.filter((_, i) => i !== index);
    setInvoiceData((prevData) => ({ ...prevData, items: newItems }));
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
          <Button variant={"outline"}>Save as Draft</Button>
          <ButtonGroup>
            <Button>Save and Send</Button>
            <ButtonGroupSeparator />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" aria-label="More Options">
                  <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <Save />
                    Save Only
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Send />
                    Save and Send Invoice
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </ButtonGroup>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 justify-between transition-all duration-300 ease-in-out">
        <InvoiceCard
          invoiceData={invoiceData}
          onDataChange={handleDataChange}
          onItemChange={handleItemChange}
          onAddItem={handleAddItem}
          onRemoveItem={handleRemoveItem}
          showPreview={showPreview}
        />
        <InvoicePreviewCard showPreview={showPreview} invoiceData={invoiceData} />
      </div>
    </div>
  );
}
