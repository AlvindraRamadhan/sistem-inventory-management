"use client";

import { useEffect } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { AuthProvider } from "@/components/layout/auth-provider";
import { useSidebarStore } from "@/store/sidebar-store";

const MOBILE_BREAKPOINT = 768;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const setMobile = useSidebarStore((s) => s.setMobile);
  const setOpen = useSidebarStore((s) => s.setOpen);

  // Responsive: track viewport and update sidebar store
  useEffect(() => {
    function onResize() {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setMobile(mobile);
      if (mobile) setOpen(false);
    }

    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [setMobile, setOpen]);

  return (
    <AuthProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
