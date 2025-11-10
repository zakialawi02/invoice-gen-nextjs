import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DashboardNavbar } from "@/components/dashboard-navbar";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Suspense } from "react";
import { Metadata } from "next";
import Loading from "./loading";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: {
    default: "Dashboard",
    template: "%s | InvoiceGen",
  },
  description:
    "InvoiceGen is a public marketing site with a protected admin dashboard for invoice management.",
  keywords: ["dashboard", "admin", "application"],
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return redirect("/auth");
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardNavbar />
          <Suspense fallback={<Loading />}>
            <main className="flex-1 px-6 py-4 bg-background">{children}</main>
            <Toaster />
          </Suspense>
        </div>
      </div>
    </SidebarProvider>
  );
}
