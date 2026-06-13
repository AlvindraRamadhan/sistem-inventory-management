import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import { ThemeProvider } from "next-themes";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Smart Clinic Inventory",
    template: "%s | Smart Clinic",
  },
  description:
    "Sistem Manajemen Inventori Klinik — procurement, stok, e-prescribing, dan alat kesehatan.",
  keywords: [
    "inventory management",
    "klinik",
    "manajemen stok",
    "e-prescribing",
    "farmasi",
    "alat kesehatan",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning className="h-full">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
        >
          <TooltipProvider delayDuration={150}>
            <Providers>
              {children}
            </Providers>
            <Toaster richColors position="top-right" />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
