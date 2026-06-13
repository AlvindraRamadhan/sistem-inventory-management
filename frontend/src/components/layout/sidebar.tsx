"use client";

import { Package } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import { useSidebarStore } from "@/store/sidebar-store";
import { SidebarNav } from "./sidebar-nav";
import type { UserRole } from "@/lib/constants/roles";

function SidebarLogo({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className={cn(
        "flex h-[72px] shrink-0 items-center gap-3 border-b border-sidebar-border",
        collapsed ? "justify-center px-0" : "px-5"
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 shadow-sm">
        <Package className="h-5 w-5 text-white" aria-hidden="true" />
      </div>

      {!collapsed && (
        <div className="overflow-hidden">
          <p className="truncate text-sm font-semibold text-sidebar-foreground leading-none">
            Smart Clinic
          </p>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.15em] text-sidebar-foreground/50 leading-none whitespace-nowrap">
            Sistem Inventaris
          </p>
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const { isOpen, isMobile, setOpen } = useSidebarStore();

  if (!user) return null;

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-[1px]"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        aria-label="Navigasi Utama"
        className={cn(
          // Layout
          "flex h-full shrink-0 flex-col",

          // Visual
          "bg-sidebar border-r border-sidebar-border",

          // Transition
          "transition-[width] duration-300 ease-in-out",

          // Desktop
          !isMobile && (isOpen ? "w-72" : "w-[72px]"),

          // Mobile
          isMobile && "fixed left-0 top-0 z-40",
          isMobile &&
            (isOpen ? "w-72 translate-x-0" : "w-72 -translate-x-full"),
          isMobile && "transition-transform duration-300 ease-in-out"
        )}
      >
        {/*  Logo Header  */}
        <SidebarLogo collapsed={!isOpen} />

        {/*  Navigation  */}
        <div className="min-h-0 flex-1 overflow-hidden bg-sidebar">
          <SidebarNav
            role={user.role as UserRole}
            isCollapsed={!isOpen}
          />
        </div>

      </aside>
    </>
  );
}