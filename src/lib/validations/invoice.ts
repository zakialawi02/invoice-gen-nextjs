import { z } from "zod";

// Invoice Item validation schema
export const invoiceItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  rate: z.number().min(0, "Rate must be a positive number"),
  amount: z.number().min(0, "Amount must be a positive number"),
  notes: z.string().optional(),
});

// Invoice validation schema
export const invoiceSchema = z.object({
  // From Information
  fromName: z.string().optional(),
  fromAddress: z.string().optional(),
  fromCity: z.string().optional(),
  fromState: z.string().optional(),
  fromZip: z.string().optional(),
  fromCountry: z.string().optional(),
  fromPhone: z.string().optional(),
  fromEmail: z.string().email("Invalid email format").optional().or(z.literal("")),
  fromWebsite: z.string().optional(),

  // Bill To Information
  billToName: z.string().optional(),
  billToCompany: z.string().optional(),
  billToEmail: z.string().email("Invalid email format").optional().or(z.literal("")),
  billToPhone: z.string().optional(),
  billToAddress: z.string().optional(),
  billToCity: z.string().optional(),
  billToState: z.string().optional(),
  billToZip: z.string().optional(),
  billToCountry: z.string().optional(),

  // Client Selection (optional - if not provided, use manual Bill To fields)
  clientId: z.string().optional(),

  // Invoice Details
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  date: z.union([z.string(), z.date()]).optional(),
  dueDate: z.union([z.string(), z.date()]).optional(),
  paymentTerms: z.string().optional(),
  poNumber: z.string().optional(),

  // Financial
  currency: z.string().min(1, "Currency is required"),
  discount: z.number().min(0, "Discount must be a positive number"),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  taxRate: z
    .number()
    .min(0, "Tax rate must be a positive number")
    .max(100, "Tax rate cannot exceed 100%"),
  shipping: z.number().min(0, "Shipping must be a positive number"),

  // Additional
  notes: z.string().optional(),
  terms: z.string().optional(),

  // Items
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),

  // Calculated fields (optional for validation)
  subtotal: z.number().optional(),
  tax: z.number().optional(),
  total: z.number().optional(),
  balanceDue: z.number().optional(),
  status: z.enum(["DRAFT", "SENT", "PAID", "PARTIALLY_PAID", "OVERDUE", "CANCELLED"]).optional(),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;
export type InvoiceItemData = z.infer<typeof invoiceItemSchema>;
