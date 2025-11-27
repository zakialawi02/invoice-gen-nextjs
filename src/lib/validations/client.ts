import { z } from "zod";

// Client validation schema
export const clientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Client name is required"),
  company: z.string().optional(),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
  logo: z.string().url("Invalid URL format").optional().or(z.literal("")),
  userId: z.string().optional(), // Will be set server-side
});

// Client form schema (for frontend forms)
export const clientFormSchema = clientSchema.omit({ id: true, userId: true });

// Type exports
export type Client = z.infer<typeof clientSchema>;
export type ClientFormData = z.infer<typeof clientFormSchema>;
