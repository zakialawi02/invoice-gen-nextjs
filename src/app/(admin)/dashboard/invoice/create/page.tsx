import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function CreateNewInvoicePage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Create New Invoice</h1>
        <p className="text-sm text-muted-foreground">
          Klik tombol <strong>Create Invoice</strong> pada halaman daftar invoice untuk membuat nomor
          invoice baru secara otomatis. Anda akan diarahkan ke formulir dengan ID yang baru dibuat.
        </p>
        <div className="flex items-center gap-3 pt-2">
          <Button asChild>
            <Link href="/dashboard/invoice">Kembali ke Invoice</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/invoice">Buat Invoice Baru</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
