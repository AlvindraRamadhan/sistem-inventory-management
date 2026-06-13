"use client";

import { useMemo } from "react";
import { AlertTriangle, Package, MapPin, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Batch } from "@/types/inventory";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BatchRow {
  batch: Batch;
  daysUntilExpiry: number;
  isFEFOFirst: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split("T")[0];

function daysUntil(isoDate: string): number {
  return Math.ceil(
    (new Date(isoDate).getTime() - new Date(TODAY).getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

function formatDate(iso: string): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Ags", "Sep", "Okt", "Nov", "Des",
  ];
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} ${months[m - 1]} ${y}`;
}

function getExpiryColorClass(days: number): string {
  if (days < 0) return "text-rose-600 dark:text-rose-400 font-semibold";
  if (days < 7) return "text-rose-600 dark:text-rose-400 font-semibold";
  if (days < 30) return "text-amber-600 dark:text-amber-400 font-medium";
  if (days < 90) return "text-yellow-600 dark:text-yellow-400";
  return "text-emerald-600 dark:text-emerald-400";
}

function getExpiryLabel(days: number): string {
  if (days < 0) return "Kadaluarsa";
  if (days < 7) return `${days} hari lagi · Kritis`;
  if (days < 30) return `${days} hari lagi · Mendekat`;
  if (days < 90) return `${days} hari lagi · Normal`;
  return `${days} hari lagi · Aman`;
}

function getExpiryBadgeClass(days: number): string {
  if (days < 0)
    return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400";
  if (days < 7)
    return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400";
  if (days < 30)
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  if (days < 90)
    return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
}

// ─── BatchCard ────────────────────────────────────────────────────────────────

function BatchCard({ row, satuanNama }: { row: BatchRow; satuanNama: string }) {
  const { batch, daysUntilExpiry, isFEFOFirst } = row;

  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 space-y-2 transition-colors",
        isFEFOFirst
          ? "border-amber-300 bg-amber-50/60 dark:border-amber-700 dark:bg-amber-900/10"
          : "border-border bg-muted/20"
      )}
    >
      {/* Row 1: batch number + FEFO indicator + ED badge */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-sm font-semibold text-foreground truncate">
            Batch {batch.batchNumber}
          </span>
          {isFEFOFirst && (
            <Badge className="border-0 text-xs shrink-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              FEFO
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-xs shrink-0">
          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
          <span className={cn("text-xs", getExpiryColorClass(daysUntilExpiry))}>
            ED: {formatDate(batch.expiredDate)}
          </span>
        </div>
      </div>

      {/* Row 2: qty + lokasi + expiry label */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            <span className="font-semibold text-foreground">
              {batch.qty.toLocaleString("id-ID")}
            </span>
            <span>{satuanNama.toLowerCase()}</span>
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {batch.lokasiNama ?? "—"}
          </span>
        </div>
        <Badge
          className={cn(
            "border-0 text-xs shrink-0",
            getExpiryBadgeClass(daysUntilExpiry)
          )}
        >
          {getExpiryLabel(daysUntilExpiry)}
        </Badge>
      </div>
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/10 px-4 py-5 text-center">
      <Package className="h-8 w-8 text-rose-400 mx-auto mb-2" />
      <p className="text-sm font-medium text-rose-700 dark:text-rose-400">
        Tidak ada stok aktif
      </p>
      <p className="text-xs text-rose-500 dark:text-rose-500 mt-0.5">
        Semua batch habis atau berstatus non-aktif
      </p>
    </div>
  );
}

// ─── StokAvailability ─────────────────────────────────────────────────────────

interface StokAvailabilityProps {
  obatId: string;
  batches: Batch[];
  satuanNama?: string;
  stokMinimal?: number;
  className?: string;
}

export function StokAvailability({
  obatId,
  batches,
  satuanNama = "unit",
  stokMinimal = 0,
  className,
}: StokAvailabilityProps) {
  const rows = useMemo<BatchRow[]>(() => {
    return batches
      .filter((b) => b.obatId === obatId && b.status === "AKTIF" && b.qty > 0)
      .sort((a, b) => a.expiredDate.localeCompare(b.expiredDate))
      .map((batch, idx) => ({
        batch,
        daysUntilExpiry: daysUntil(batch.expiredDate),
        isFEFOFirst: idx === 0,
      }));
  }, [obatId, batches]);

  const totalStok = useMemo(
    () => rows.reduce((sum, r) => sum + r.batch.qty, 0),
    [rows]
  );

  const isBelowMinimum = totalStok <= stokMinimal && stokMinimal > 0;

  return (
    <div className={cn("space-y-3", className)}>
      {/* ── Header: total stok ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-medium text-muted-foreground">
          Total Stok Aktif
        </span>
        <span
          className={cn(
            "text-lg font-bold tabular-nums",
            isBelowMinimum
              ? "text-rose-600 dark:text-rose-400"
              : "text-foreground"
          )}
        >
          {totalStok.toLocaleString("id-ID")}{" "}
          <span className="text-sm font-normal text-muted-foreground">
            {satuanNama.toLowerCase()}
          </span>
        </span>
      </div>

      {/* ── Low-stock warning ──────────────────────────────────────────────── */}
      {isBelowMinimum && (
        <div className="flex items-start gap-2 rounded-md bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 px-3 py-2.5">
          <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
          <p className="text-xs text-rose-700 dark:text-rose-400">
            Stok di bawah batas minimum{" "}
            <strong>
              ({stokMinimal} {satuanNama.toLowerCase()})
            </strong>
            . Segera lakukan pemesanan ulang.
          </p>
        </div>
      )}

      <Separator />

      {/* ── Batch breakdown ───────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
          Breakdown per Batch{" "}
          {rows.length > 0 && (
            <span className="normal-case font-normal">
              ({rows.length} batch · urut ED terdekat)
            </span>
          )}
        </p>

        {rows.length === 0 ? (
          <EmptyState />
        ) : (
          rows.map((row) => (
            <BatchCard
              key={row.batch.id}
              row={row}
              satuanNama={satuanNama}
            />
          ))
        )}
      </div>
    </div>
  );
}
