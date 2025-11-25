"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function CreateInvoiceButton() {
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    try {
      setIsCreating(true);
      const response = await fetch("/api/invoices", { method: "POST" });

      if (!response.ok) {
        throw new Error("Failed to create invoice");
      }

      const invoice = await response.json();
      toast.success("Draft invoice created");
      router.push(`/dashboard/invoice/create/${invoice.id}`);
    } catch (error) {
      console.error(error);
      toast.error("Unable to start a new invoice");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Button onClick={handleCreate} disabled={isCreating} aria-busy={isCreating}>
      {isCreating ? "Creating..." : "Create Invoice"}
    </Button>
  );
}
