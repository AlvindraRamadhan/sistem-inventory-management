"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  FileText,
  MessageSquare,
  Package,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { useGRList } from "@/hooks/queries/use-good-receipt";
import { cn } from "@/lib/utils";
import type { GoodReceipt, GRStatus } from "@/types/procurement";
import type { PaginatedResponse } from "@/lib/api-client";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  return `${d} ${months[m - 1]} ${y}`;
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<GRStatus, {
  label: string;
  dotColor: string;
  countStyle: string | null;
  borderClass: string;
  badgeClass: string;
}> = {
  MENUNGGU_INPUT: {
    label: "Perlu Diolah",
    dotColor: "bg-destructive",
    countStyle: "bg-destructive/10 text-destructive font-semibold",
    borderClass: "border-l-[3px] border-l-destructive",
    badgeClass: "bg-destructive/10 text-destructive",
  },
  MENUNGGU_REVIEW: {
    label: "Sedang Review",
    dotColor: "bg-amber-500",
    countStyle: "bg-amber-100 text-amber-700",
    borderClass: "border-l-[3px] border-l-amber-500",
    badgeClass: "bg-amber-100 text-amber-700",
  },
  DITOLAK: {
    label: "Ditolak Admin",
    dotColor: "bg-orange-500",
    countStyle: "bg-orange-100 text-orange-700",
    borderClass: "border-l-[3px] border-l-orange-500",
    badgeClass: "bg-orange-100 text-orange-700",
  },
  SELESAI: {
    label: "Selesai",
    dotColor: "bg-emerald-500",
    countStyle: null,
    borderClass: "border-l-[3px] border-l-emerald-500",
    badgeClass: "bg-emerald-100 text-emerald-700",
  },
};

// ─── GR Status Badge ──────────────────────────────────────────────────────────

function GRStatusBadge({ status }: { status: GRStatus }) {
  const cfg = STATUS_CFG[status];
  return <Badge className={cn("border-0 text-xs font-medium", cfg.badgeClass)}>{cfg.label}</Badge>;
}

// ─── GR Card ──────────────────────────────────────────────────────────────────

function GRCard({ gr }: { gr: GoodReceipt }) {
  const router = useRouter();
  const cfg = STATUS_CFG[gr.status];
  const totalQty = (gr.items ?? []).reduce((s, item) => s + item.qtyTerima, 0);

  return (
    <Card className={cn("transition-shadow hover:shadow-sm", cfg.borderClass, gr.status === "SELESAI" && "opacity-80")}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <GRStatusBadge status={gr.status} />
              {(gr.revisiKe ?? 0) > 0 && (
                <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">Revisi ke-{gr.revisiKe}</Badge>
              )}
            </div>
            <p className="font-semibold text-sm">{gr.noGR}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{gr.noPO}</span>
              <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{gr.supplierName}</span>
              {gr.tanggalPerkiraanDatang && (
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />Perkiraan: {formatDate(gr.tanggalPerkiraanDatang)}
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            {gr.status === "MENUNGGU_INPUT" && (
              <Button size="sm" className="h-8 text-xs" onClick={() => router.push(`/apoteker/good-receipt/${gr.id}/input`)}>
                Olah Sekarang<ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            )}
            {gr.status === "DITOLAK" && (
              <Button size="sm" variant="outline" className="h-8 text-xs border-orange-300 text-orange-600 hover:bg-orange-50"
                onClick={() => router.push(`/apoteker/good-receipt/${gr.id}/input`)}>
                Revisi &amp; Kirim Ulang
              </Button>
            )}
            {(gr.status === "MENUNGGU_REVIEW" || gr.status === "SELESAI") && (
              <Button size="sm" variant="outline" className="h-8 text-xs"
                onClick={() => router.push(`/apoteker/good-receipt/${gr.id}`)}>
                Lihat Detail
              </Button>
            )}
          </div>
        </div>

        {gr.status === "DITOLAK" && gr.rejectedReason && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2.5 flex gap-2">
            <MessageSquare className="h-3.5 w-3.5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-orange-700 mb-0.5">Catatan dari Admin:</p>
              <p className="text-xs text-orange-600 italic">&quot;{gr.rejectedReason}&quot;</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 text-xs text-muted-foreground border-t pt-2">
          <span>{(gr.items ?? []).length} jenis obat</span>
          <span>•</span>
          <span>Total terima: {totalQty.toLocaleString("id-ID")} unit</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Sidebar config ───────────────────────────────────────────────────────────

type FilterStatus = "SEMUA" | GRStatus;

interface SidebarItem {
  value: FilterStatus;
  label: string;
  dotColor: string;
  countStyle?: string | null;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { value: "SEMUA",           label: "Semua",          dotColor: "bg-muted-foreground" },
  { value: "MENUNGGU_INPUT",  label: "Perlu Diolah",   dotColor: "bg-destructive",  countStyle: "bg-destructive/10 text-destructive font-semibold" },
  { value: "MENUNGGU_REVIEW", label: "Sedang Review",  dotColor: "bg-amber-500",    countStyle: "bg-amber-100 text-amber-700" },
  { value: "DITOLAK",         label: "Ditolak Admin",  dotColor: "bg-orange-500",   countStyle: "bg-orange-100 text-orange-700" },
  { value: "SELESAI",         label: "Selesai",        dotColor: "bg-emerald-500" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ApotekerGoodReceiptPage() {
  const [filter, setFilter] = useState<FilterStatus>("SEMUA");

  const { data: grRaw } = useGRList({ limit: 200 });

  const grList = useMemo<GoodReceipt[]>(() => {
    if (!grRaw) return [];
    const p = grRaw as PaginatedResponse<GoodReceipt> | undefined;
    return p?.data ?? [];
  }, [grRaw]);

  const counts = useMemo<Record<FilterStatus, number>>(() => ({
    SEMUA:           grList.length,
    MENUNGGU_INPUT:  grList.filter(g => g.status === "MENUNGGU_INPUT").length,
    MENUNGGU_REVIEW: grList.filter(g => g.status === "MENUNGGU_REVIEW").length,
    DITOLAK:         grList.filter(g => g.status === "DITOLAK").length,
    SELESAI:         grList.filter(g => g.status === "SELESAI").length,
  }), [grList]);

  const filtered = useMemo(
    () => filter === "SEMUA" ? grList : grList.filter(g => g.status === filter),
    [grList, filter]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Good Receipt"
        description="Olah barang masuk dari supplier berdasarkan data dari Admin"
        breadcrumb={[{ label: "Good Receipt" }]}
      />

      <div className="flex gap-6">
        {/* ── Sidebar ── */}
        <aside className="w-[220px] flex-shrink-0">
          <div className="bg-card border rounded-xl p-4 sticky top-6 space-y-5">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Status GR</p>
              <nav className="space-y-0.5">
                {SIDEBAR_ITEMS.map(item => (
                  <button key={item.value} onClick={() => setFilter(item.value)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                      filter === item.value
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full flex-shrink-0", item.dotColor)} />
                      <span>{item.label}</span>
                    </div>
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded-md",
                      filter === item.value ? "bg-primary/20 text-primary" : (item.countStyle ?? "bg-muted text-muted-foreground")
                    )}>
                      {counts[item.value]}
                    </span>
                  </button>
                ))}
              </nav>
            </div>

            <Separator />

            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Periode</p>
              <Select defaultValue="bulan-ini">
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="minggu-ini">Minggu ini</SelectItem>
                  <SelectItem value="bulan-ini">Bulan ini</SelectItem>
                  <SelectItem value="semua">Semua waktu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </aside>

        {/* ── Content ── */}
        <main className="flex-1 min-w-0 space-y-3">
          {filtered.length === 0 ? (
            <EmptyState icon={Package} title="Tidak ada GR" description="Tidak ada Good Receipt dengan status yang dipilih." />
          ) : (
            filtered.map(gr => <GRCard key={gr.id} gr={gr} />)
          )}
        </main>
      </div>
    </div>
  );
}
