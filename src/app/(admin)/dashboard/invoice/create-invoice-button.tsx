"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function CreateInvoiceButton() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateInvoice = async () => {
    try {
      setIsCreating(true);
      const response = await fetch("/api/invoices", { method: "POST" });

      if (!response.ok) {
        throw new Error("Gagal membuat invoice baru");
      }

      const data = await response.json();
      toast.success("Invoice baru berhasil dibuat");
      router.push(`/dashboard/invoice/create/${data.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan";
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Button onClick={handleCreateInvoice} disabled={isCreating}>
      {isCreating ? (
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Membuat...
        </span>
      ) : (
        "Create Invoice"
      )}
    </Button>
  );
}
