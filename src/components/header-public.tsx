import Link from "next/link";
import { ModeToggle } from "./mode-toggle";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const navigationItems = [
  { href: "/", label: "Home" },
  { href: "/auth", label: "Sign In" },
  { href: "/dashboard", label: "Dashboard" },
];

export const HeaderPublic = async () => {
  const session = await getServerSession(authOptions);

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-foreground">
          InvoiceGen
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
          {navigationItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-foreground">
              {item.href === "/auth" && session ? "Account" : item.label}
            </Link>
          ))}
          <ModeToggle />
        </nav>
      </div>
    </header>
  );
};
