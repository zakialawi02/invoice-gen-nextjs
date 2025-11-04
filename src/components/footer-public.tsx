import Link from "next/link";

export const FooterPublic = () => {
  return (
    <footer className="border-t border-border bg-background/80 py-6 text-sm text-muted-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; {new Date().getFullYear()} InvoiceGen. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link href="/auth" className="transition hover:text-foreground">
            Sign In
          </Link>
          <Link href="/dashboard" className="transition hover:text-foreground">
            Dashboard
          </Link>
        </div>
      </div>
    </footer>
  );
};
