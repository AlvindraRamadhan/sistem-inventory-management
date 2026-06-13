"use client";

import { Package } from "lucide-react";

export const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background">

      {/* Logo — identik dengan halaman login */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
          <Package className="w-6 h-6 text-white" aria-hidden="true" />
        </div>
        <div>
          <p className="font-bold text-foreground text-lg leading-none">
            Smart Clinic
          </p>
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.15em] mt-0.5 leading-none">
            Sistem Inventaris
          </p>
        </div>
      </div>

      {/* Loading indicator */}
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-8 h-8 rounded-full border-2 border-muted border-t-emerald-500 animate-spin"
          role="status"
          aria-label="Memuat sesi"
        />
        <p className="text-sm text-muted-foreground">Memuat sesi...</p>
      </div>

    </div>
  );
};
