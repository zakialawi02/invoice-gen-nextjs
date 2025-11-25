"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function CreateInvoiceButton() {
  const [isCreating, setIsCreating] = useState(false);
  const [isPending, startTransition] = useTransition();
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
      startTransition(() => {
        router.push(`/dashboard/invoice/create/${invoice.id}`);
      });
    } catch (error) {
      console.error(error);
      toast.error("Unable to start a new invoice");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Button onClick={handleCreate} disabled={isCreating || isPending} aria-busy={isCreating || isPending}>
      {isCreating || isPending ? (
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Creating...
        </span>
      ) : (
        "Create Invoice"
      )}
    </Button>
  );
}
