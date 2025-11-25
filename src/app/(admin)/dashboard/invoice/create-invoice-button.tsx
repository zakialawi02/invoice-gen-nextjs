"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface CreateInvoiceButtonProps {
  label?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link";
}

export function CreateInvoiceButton({
  label = "Create Invoice",
  size = "default",
  variant = "default",
}: CreateInvoiceButtonProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const handleClick = async () => {
    setIsCreating(true);
    try {
      const response = await fetch("/api/invoices", { method: "POST" });

      if (!response.ok) {
        throw new Error("Failed to create invoice");
      }

      const invoice = (await response.json()) as { id: string };
      toast.success("Invoice draft created");
      router.push(`/dashboard/invoice/create/${invoice.id}`);
    } catch (error) {
      console.error(error);
      toast.error("Unable to start a new invoice");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Button
      data-create-invoice
      size={size}
      variant={variant}
      disabled={isCreating}
      onClick={handleClick}
    >
      {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isCreating ? "Preparing..." : label}
    </Button>
  );
}
