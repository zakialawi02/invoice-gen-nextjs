import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Providers } from "./providers";
import NextTopLoader from "nextjs-toploader";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InvoiceGen",
  description:
    "InvoiceGen is a public marketing site with a protected admin dashboard for invoice management.",
  keywords: ["invoice", "management", "dashboard", "public", "marketing"],
  icons: {
    icon: [
      { url: "/assets/img/favicon.ico" },
      { url: "/assets/img/favicon.png", type: "image/png" },
    ],
    shortcut: "/assets/img/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextTopLoader showSpinner={false} />
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
