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
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  clientId?: string | null;
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

interface Client {
  id: string;
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
  image?: string | null;
}

export function InvoiceForm({ initialData, onSubmit, onChange }: InvoiceFormProps) {
  const [formData, setFormData] = useState<InvoiceFormData>(() => ({
    invoiceNumber: initialData?.invoiceNumber || "",
    currency: initialData?.currency || "USD",
    discount: initialData?.discount || 0,
    discountType: initialData?.discountType || "PERCENTAGE",
    taxRate: initialData?.taxRate || 0,
    shipping: initialData?.shipping || 0,
    items: initialData?.items || [],
    ...initialData,
    date: initialData?.date || new Date(),
    dueDate: initialData?.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  }));
  const [clients, setClients] = useState<Client[]>([]);
  const [isClientDrawerOpen, setIsClientDrawerOpen] = useState(false);
  const [newClient, setNewClient] = useState<Partial<Client>>({
    name: "",
    company: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  });
  const [isSavingClient, setIsSavingClient] = useState(false);

  // Use ref to avoid infinite loop with onChange in useEffect
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Notify parent of changes
  useEffect(() => {
    onChangeRef.current?.(formData);
  }, [formData]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch("/api/clients");
        if (!response.ok) return;
        const data = (await response.json()) as Client[];
        setClients(data);
      } catch (error) {
        console.error("Failed to load clients", error);
      }
    };

    fetchClients();
  }, []);

  useEffect(() => {
    if (formData.clientId) {
      handleSelectClient(formData.clientId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.clientId, clients]);

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

  const handleSelectClient = (clientId: string) => {
    if (!clientId) {
      setFormData((prev) => ({ ...prev, clientId: null }));
      return;
    }

    const client = clients.find((item) => item.id === clientId);
    if (!client) return;

    setFormData((prev) => ({
      ...prev,
      clientId,
      billToName: client.name,
      billToCompany: client.company || undefined,
      billToEmail: client.email || undefined,
      billToPhone: client.phone || undefined,
      billToAddress: client.address || undefined,
      billToCity: client.city || undefined,
      billToState: client.state || undefined,
      billToZip: client.zip || undefined,
      billToCountry: client.country || undefined,
    }));
  };

  const handleCreateClient = async () => {
    if (!newClient.name?.trim()) return;

    try {
      setIsSavingClient(true);
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClient),
      });

      if (!response.ok) {
        throw new Error("Failed to create client");
      }

      const client = (await response.json()) as Client;
      setClients((prev) => [client, ...prev]);
      handleSelectClient(client.id);
      setIsClientDrawerOpen(false);
      setNewClient({
        name: "",
        company: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        zip: "",
        country: "",
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSavingClient(false);
    }
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
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Bill To (Client Information)</CardTitle>
            <Button variant="link" size="sm" type="button" onClick={() => setIsClientDrawerOpen(true)}>
              Add New Client
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="billToName">Client</Label>
              <Select
                value={formData.clientId || ""}
                onValueChange={(value) => handleSelectClient(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="" className="text-left">
                    <div className="flex flex-col">
                      <span className="font-medium">Manual entry</span>
                      <span className="text-muted-foreground text-xs">Keep editing the fields below</span>
                    </div>
                  </SelectItem>
                  {clients.length === 0 && (
                    <div className="text-muted-foreground p-2 text-sm">No clients available</div>
                  )}
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id} className="text-left">
                    <div className="flex flex-col">
                      <span className="font-medium">{client.name}</span>
                      {(client.company || client.email) && (
                        <span className="text-muted-foreground text-xs">
                          {client.company || client.email}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
              <SelectTrigger className="w-full">
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
              <SelectTrigger className="w-full">
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
            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div
                  key={index}
                  className="group relative rounded-lg border-2 border-dashed border-border/50 bg-card p-6 hover:border-primary/30 transition-all duration-200"
                >
                  {/* Item Name Row with Delete Button */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor={`item-name-${index}`} className="text-sm font-medium">
                          Item Name
                        </Label>
                        <Input
                          id={`item-name-${index}`}
                          value={item.name}
                          onChange={(e) => updateItem(index, "name", e.target.value)}
                          placeholder="New line item"
                          required
                          className="h-11 bg-background"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        className="mt-8 h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Description Row - Full Width */}
                  <div className="space-y-2 mb-4">
                    <Label htmlFor={`item-description-${index}`} className="text-sm font-medium">
                      Description
                    </Label>
                    <Textarea
                      id={`item-description-${index}`}
                      value={item.description || ""}
                      onChange={(e) => updateItem(index, "description", e.target.value)}
                      placeholder="Describe the service or product"
                      className="min-h-[80px] resize-none bg-background"
                      rows={3}
                    />
                  </div>

                  {/* Quantity, Rate, Total Row */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`item-quantity-${index}`} className="text-sm font-medium">
                        Quantity
                      </Label>
                      <Input
                        id={`item-quantity-${index}`}
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(index, "quantity", parseFloat(e.target.value) || 0)
                        }
                        required
                        className="h-11 bg-background"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`item-rate-${index}`} className="text-sm font-medium">
                        Rate
                      </Label>
                      <Input
                        id={`item-rate-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) => updateItem(index, "rate", parseFloat(e.target.value) || 0)}
                        required
                        className="h-11 bg-background"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`item-total-${index}`} className="text-sm font-medium">
                        Total
                      </Label>
                      <Input
                        id={`item-total-${index}`}
                        value={`$${item.amount.toFixed(2)}`}
                        disabled
                        className="h-11 bg-muted/50 font-semibold"
                      />
                    </div>
                  </div>

                  {/* Row number indicator */}
                  <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center shadow-md">
                    {index + 1}
                  </div>
                </div>
              ))}
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
                max={formData.discountType === "PERCENTAGE" ? "100" : undefined}
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
              max="100"
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

      <Sheet open={isClientDrawerOpen} onOpenChange={setIsClientDrawerOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Add New Client</SheetTitle>
          </SheetHeader>
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newClientName">Client Name</Label>
              <Input
                id="newClientName"
                value={newClient.name || ""}
                onChange={(e) => setNewClient((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Acme Corp"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newClientCompany">Company</Label>
              <Input
                id="newClientCompany"
                value={newClient.company || ""}
                onChange={(e) => setNewClient((prev) => ({ ...prev, company: e.target.value }))}
                placeholder="Company Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newClientEmail">Email</Label>
              <Input
                id="newClientEmail"
                type="email"
                value={newClient.email || ""}
                onChange={(e) => setNewClient((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="client@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newClientPhone">Phone</Label>
              <Input
                id="newClientPhone"
                value={newClient.phone || ""}
                onChange={(e) => setNewClient((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="+1 234 567 890"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newClientAddress">Address</Label>
              <Input
                id="newClientAddress"
                value={newClient.address || ""}
                onChange={(e) => setNewClient((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="Street Address"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newClientCity">City</Label>
                <Input
                  id="newClientCity"
                  value={newClient.city || ""}
                  onChange={(e) => setNewClient((prev) => ({ ...prev, city: e.target.value }))}
                  placeholder="City"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newClientState">State/Province</Label>
                <Input
                  id="newClientState"
                  value={newClient.state || ""}
                  onChange={(e) => setNewClient((prev) => ({ ...prev, state: e.target.value }))}
                  placeholder="State"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newClientZip">ZIP/Postal Code</Label>
                <Input
                  id="newClientZip"
                  value={newClient.zip || ""}
                  onChange={(e) => setNewClient((prev) => ({ ...prev, zip: e.target.value }))}
                  placeholder="ZIP"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newClientCountry">Country</Label>
                <Input
                  id="newClientCountry"
                  value={newClient.country || ""}
                  onChange={(e) => setNewClient((prev) => ({ ...prev, country: e.target.value }))}
                  placeholder="Country"
                />
              </div>
            </div>
          </div>
          <SheetFooter>
            <div className="flex w-full justify-end gap-2">
              <SheetClose asChild>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </SheetClose>
              <Button onClick={handleCreateClient} disabled={isSavingClient || !newClient.name?.trim()} type="button">
                {isSavingClient ? "Saving..." : "Save Client"}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <input type="submit" hidden />
    </form>
  );
}
