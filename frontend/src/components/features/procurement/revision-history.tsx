"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ImageIcon,
  MessageSquare,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { RevisiGR } from "@/types/procurement";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return "—";
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
  const dt = new Date(dateStr);
  return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}, ${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}`;
}

// ─── Photo thumbnails with lightbox ──────────────────────────────────────────

function PhotoThumbnails({ urls }: { urls: string[] }) {
  const [zoomedUrl, setZoomedUrl] = useState<string | null>(null);

  return (
    <>
      <div className="grid grid-cols-4 gap-2">
        {urls.map((url, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setZoomedUrl(url)}
            className="relative aspect-video overflow-hidden rounded-md border border-border bg-muted hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Lihat foto ${i + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`Foto revisi ${i + 1}`}
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>

      <Dialog open={!!zoomedUrl} onOpenChange={(v) => !v && setZoomedUrl(null)}>
        <DialogContent className="max-w-3xl p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Foto Revisi</DialogTitle>
            <DialogDescription>Foto yang diupload pada saat revisi</DialogDescription>
          </DialogHeader>
          {zoomedUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={zoomedUrl}
              alt="Foto revisi"
              className="w-full rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface RevisionHistoryProps {
  revisions: RevisiGR[];
  className?: string;
}

export function RevisionHistory({ revisions, className }: RevisionHistoryProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  if (revisions.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">Belum ada riwayat revisi.</p>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {revisions.map((rev, i) => {
        const isOpen = openIdx === i;

        return (
          <div key={i} className="overflow-hidden rounded-lg border border-border">
            {/* ── Accordion header ── */}
            <button
              type="button"
              onClick={() => setOpenIdx(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-2.5">
                <Badge variant="secondary" className="shrink-0 text-[10px] font-mono">
                  Revisi ke-{rev.revisiKe}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDateTime(rev.submittedAt)}
                </span>
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  · oleh {rev.submittedBy}
                </span>
              </div>
              {isOpen ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
            </button>

            {/* ── Accordion body ── */}
            {isOpen && (
              <div className="divide-y divide-border/60 border-t border-border">

                {/* Rejection reason from Admin */}
                <div className="px-4 py-3">
                  <div className="mb-2 flex items-center gap-1.5">
                    <XCircle className="h-3.5 w-3.5 text-destructive" />
                    <p className="text-xs font-semibold text-destructive">
                      Alasan Penolakan Admin
                    </p>
                  </div>
                  <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2.5">
                    <p className="text-sm leading-relaxed text-foreground">
                      {rev.alasanPenolakan}
                    </p>
                  </div>
                </div>

                {/* Apoteker correction note */}
                {rev.catatanApoteker && (
                  <div className="px-4 py-3">
                    <div className="mb-2 flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                        Catatan Perbaikan Apoteker
                      </p>
                    </div>
                    <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2.5 dark:border-blue-800/30 dark:bg-blue-900/10">
                      <p className="text-sm leading-relaxed text-foreground">
                        {rev.catatanApoteker}
                      </p>
                    </div>
                  </div>
                )}

                {/* Photo thumbnails */}
                {rev.fotoUrls && rev.fotoUrls.length > 0 && (
                  <div className="px-4 py-3">
                    <div className="mb-2 flex items-center gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-xs font-semibold text-muted-foreground">
                        Foto Bukti ({rev.fotoUrls.length})
                      </p>
                    </div>
                    <PhotoThumbnails urls={rev.fotoUrls} />
                  </div>
                )}

                {/* Snapshot table */}
                <div className="px-4 py-3">
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">
                    Snapshot Data Revisi ini
                  </p>
                  <div className="overflow-x-auto rounded-md border border-border">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                            Obat
                          </th>
                          <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                            Qty PO
                          </th>
                          <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                            Qty Terima
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                            Batch
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                            Kondisi
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rev.snapshot.map((s, j) => (
                          <tr key={j} className="border-t border-border/50">
                            <td className="px-3 py-2">
                              <p className="font-medium text-foreground">{s.namaObat}</p>
                              <p className="text-muted-foreground">{s.satuanNama}</p>
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                              {s.qtyPO}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums font-medium">
                              {s.qtyTerima}
                            </td>
                            <td className="px-3 py-2 font-mono text-muted-foreground">
                              {s.batchNumber || "—"}
                            </td>
                            <td className="px-3 py-2">
                              <span
                                className={cn(
                                  "font-semibold",
                                  s.kondisi === "RUSAK"
                                    ? "text-destructive"
                                    : "text-emerald-600 dark:text-emerald-400"
                                )}
                              >
                                {s.kondisi === "BAIK" ? "Baik" : "Rusak"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
