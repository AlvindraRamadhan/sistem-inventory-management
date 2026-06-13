"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Loader2,
  PackageCheck,
  Plus,
  PlusCircle,
  RotateCcw,
  Search,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { useGRList, useReceivablePOs, useCreateGR } from "@/hooks/queries/use-good-receipt";
import {
  GR_STATUS_LABEL,
  GR_STATUS_COLOR,
} from "@/lib/constants/status";
import { cn } from "@/lib/utils";
import type { GoodReceipt, GRStatus, PurchaseOrder } from "@/types/procurement";
import type { PaginatedResponse } from "@/lib/api-client";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr?: string): string {
  if (!dateStr) return "-";
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  return `${d} ${months[m - 1]} ${y}`;
}

// ── Status badge ──────────────────────────────────────────────────────────────

function GRStatusBadge({ status }: { status: GRStatus }) {
  return (
    <Badge variant={GR_STATUS_COLOR[status]} className="text-xs font-medium whitespace-nowrap">
      {GR_STATUS_LABEL[status]}
    </Badge>
  );
}

// ── Sidebar filter config ─────────────────────────────────────────────────────

const GR_STATUS_FILTERS = [
  { value: "semua",            label: "Semua",            dotColor: "bg-muted-foreground" },
  { value: "MENUNGGU_INPUT",   label: "Menunggu Input",   dotColor: "bg-blue-500"        },
  { value: "MENUNGGU_REVIEW",  label: "Menunggu Review",  dotColor: "bg-amber-500"       },
  { value: "DITOLAK",          label: "Ditolak",          dotColor: "bg-destructive"     },
  { value: "SELESAI",          label: "Selesai",          dotColor: "bg-emerald-500"     },
] as const;

// ── GR Card ───────────────────────────────────────────────────────────────────

function GRCard({ gr, onView, onReview }: { gr: GoodReceipt; onView: (gr: GoodReceipt) => void; onReview: (gr: GoodReceipt) => void }) {
  return (
    <Card className={cn(
      "hover:shadow-sm transition-shadow",
      gr.status === "MENUNGGU_INPUT"  && "border-l-[3px] border-l-blue-500",
      gr.status === "MENUNGGU_REVIEW" && "border-l-[3px] border-l-amber-500",
      gr.status === "DITOLAK"         && "border-l-[3px] border-l-destructive",
      gr.status === "SELESAI"         && "border-l-[3px] border-l-emerald-500",
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <GRStatusBadge status={gr.status} />
              {(gr.revisiKe ?? 0) > 0 && (
                <Badge variant="outline" className="text-xs"><RotateCcw />Revisi ke-{gr.revisiKe}</Badge>
              )}
            </div>
            <p className="font-semibold text-sm font-mono">{gr.noGR}</p>
            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{gr.noPO}</span>
              <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{gr.supplierName}</span>
              <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{formatDate(gr.tanggalPerkiraanDatang)}</span>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => onView(gr)}>Detail</Button>
            {gr.status === "MENUNGGU_REVIEW" && (
              <Button size="sm" className="h-8 text-xs" onClick={() => onReview(gr)}>
                Review<ArrowRight />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Pre-GR Sheet ──────────────────────────────────────────────────────────────

interface PreGRSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function PreGRSheet({ open, onOpenChange }: PreGRSheetProps) {
  const [selectedPoId, setSelectedPoId] = useState("");
  const [tanggalPerkiraan, setTanggalPerkiraan] = useState("");
  const [catatanAdmin, setCatatanAdmin] = useState("");

  const { data: receivableRaw, isLoading: isLoadingPOs } = useReceivablePOs();
  const createGR = useCreateGR();

  const sentPOs = useMemo<PurchaseOrder[]>(() => {
    if (!receivableRaw) return [];
    if (Array.isArray(receivableRaw)) return receivableRaw as PurchaseOrder[];
    const r = receivableRaw as { data?: PurchaseOrder[] };
    return r.data ?? [];
  }, [receivableRaw]);

  const selectedPO = useMemo(() => sentPOs.find((po) => po.id === selectedPoId), [sentPOs, selectedPoId]);

  function handleReset() {
    setSelectedPoId(""); setTanggalPerkiraan(""); setCatatanAdmin("");
  }

  async function handleSubmit() {
    if (!selectedPoId || !tanggalPerkiraan) return;
    await createGR.mutateAsync({
      purchaseOrderId: selectedPoId,
      tanggalPerkiraanDatang: tanggalPerkiraan,
      tanggalTerima: tanggalPerkiraan,
      catatanAdmin: catatanAdmin.trim() || undefined,
    });
    handleReset();
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) handleReset(); onOpenChange(v); }}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col overflow-y-auto">
        <SheetHeader className="border-b pb-3">
          <SheetTitle>Buat Pre-GR</SheetTitle>
          <SheetDescription>Pilih PO terkirim dan atur data penerimaan untuk dikirim ke Apoteker.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 px-4 py-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Purchase Order <span className="text-destructive">*</span>
            </label>
            <Select value={selectedPoId} onValueChange={setSelectedPoId} disabled={isLoadingPOs}>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingPOs ? "Memuat PO…" : "Pilih PO dengan status Terkirim..."} />
              </SelectTrigger>
              <SelectContent>
                {sentPOs.length === 0 ? (
                  <div className="py-4 text-center text-sm text-muted-foreground">Tidak ada PO berstatus Terkirim</div>
                ) : (
                  sentPOs.map((po) => (
                    <SelectItem key={po.id} value={po.id}>
                      <span className="font-mono">{po.noPO}</span>
                      <span className="ml-2 text-muted-foreground text-xs">- {po.supplierName.split(" ").slice(0, 3).join(" ")}</span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedPO && (
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Barang dalam PO ini</p>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Supplier</span>
                  <span className="font-medium text-foreground text-right max-w-[60%] truncate">{selectedPO.supplierName}</span>
                </div>
                <Separator />
                {(selectedPO.items ?? []).map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-foreground">{item.namaObat}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap tabular-nums">
                      {item.qty} {item.satuanNama}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Tanggal Perkiraan Datang <span className="text-destructive">*</span>
            </label>
            <Input type="date" value={tanggalPerkiraan}
              onChange={(e) => setTanggalPerkiraan(e.target.value)}
              min={new Date().toISOString().slice(0, 10)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Catatan untuk Apoteker</label>
            <Textarea
              placeholder="Instruksi khusus, hal yang perlu diperhatikan Apoteker saat menerima barang..."
              rows={4} value={catatanAdmin} onChange={(e) => setCatatanAdmin(e.target.value)} />
          </div>
        </div>

        <SheetFooter className="border-t">
          <Button variant="outline" onClick={() => { handleReset(); onOpenChange(false); }} disabled={createGR.isPending}>Batal</Button>
          <Button onClick={handleSubmit} disabled={!selectedPO || !tanggalPerkiraan || createGR.isPending}>
            {createGR.isPending ? <Loader2 className="animate-spin" /> : <ClipboardList />}
            Kirim Data ke Apoteker
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminGoodReceiptPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<string>("semua");
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: grRaw } = useGRList({ limit: 200 });

  const grList = useMemo<GoodReceipt[]>(() => {
    if (!grRaw) return [];
    const p = grRaw as PaginatedResponse<GoodReceipt> | undefined;
    return p?.data ?? [];
  }, [grRaw]);

  // Counts per status
  const counts = useMemo(() => ({
    semua:          grList.length,
    MENUNGGU_INPUT:  grList.filter((g) => g.status === "MENUNGGU_INPUT").length,
    MENUNGGU_REVIEW: grList.filter((g) => g.status === "MENUNGGU_REVIEW").length,
    DITOLAK:         grList.filter((g) => g.status === "DITOLAK").length,
    SELESAI:         grList.filter((g) => g.status === "SELESAI").length,
  }), [grList]);

  // Filtered GR list
  const filteredGR = useMemo(() => {
    return grList
      .filter((gr) => {
        if (activeFilter !== "semua" && gr.status !== activeFilter) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          return gr.noGR.toLowerCase().includes(q) || gr.supplierName.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        const ORDER: Record<GRStatus, number> = {
          MENUNGGU_REVIEW: 0,
          MENUNGGU_INPUT: 1,
          DITOLAK: 2,
          SELESAI: 3,
        };
        return (ORDER[a.status] ?? 4) - (ORDER[b.status] ?? 4);
      });
  }, [grList, activeFilter, search]);

  function handleView(gr: GoodReceipt) {
    router.push(`/admin/procurement/good-receipt/${gr.id}`);
  }

  function handleReview(gr: GoodReceipt) {
    router.push(`/admin/procurement/good-receipt/${gr.id}/review`);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <PageHeader
        title="Good Receipt"
        description="Kelola penerimaan barang dari supplier - mulai Pre-GR hingga persetujuan stok masuk"
        breadcrumb={[{ label: "Procurement" }, { label: "Good Receipt" }]}
        actions={
          <Button size="action" onClick={() => setSheetOpen(true)}>
            <PlusCircle />Buat Pre-GR Baru
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatsCard title="Total GR" value={counts.semua} icon={ClipboardList} variant="default" subtitle="Semua status" />
        <StatsCard title="Menunggu Input" value={counts.MENUNGGU_INPUT} icon={PackageCheck} variant="warning" subtitle="Menunggu Apoteker" />
        <StatsCard title="Menunggu Review" value={counts.MENUNGGU_REVIEW} icon={ClipboardCheck}
          variant={counts.MENUNGGU_REVIEW > 0 ? "warning" : "default"} subtitle="Perlu ditinjau" />
        <StatsCard title="Selesai" value={counts.SELESAI} icon={ShieldCheck} variant="success" subtitle="Stok telah masuk" />
      </div>

      {/* 2-column: sidebar + content */}
      <div className="flex gap-6 items-start">

        {/* Sidebar kiri */}
        <aside className="w-[220px] flex-shrink-0">
          <div className="bg-card border rounded-xl p-4 sticky top-6 space-y-5">

            {/* Status filter */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Status GR</p>
              <nav className="space-y-0.5">
                {GR_STATUS_FILTERS.map((item) => {
                  const count = counts[item.value as keyof typeof counts] ?? 0;
                  const isActive = activeFilter === item.value;
                  return (
                    <button key={item.value} onClick={() => setActiveFilter(item.value)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                        isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full flex-shrink-0", item.dotColor)} />
                        <span>{item.label}</span>
                      </div>
                      <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded-md",
                        isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <Separator />

            {/* Periode filter */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Periode</p>
              <Select defaultValue="bulan-ini">
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hari-ini">Hari ini</SelectItem>
                  <SelectItem value="minggu-ini">Minggu ini</SelectItem>
                  <SelectItem value="bulan-ini">Bulan ini</SelectItem>
                  <SelectItem value="semua">Semua waktu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </aside>

        {/* Konten kanan */}
        <main className="flex-1 min-w-0 space-y-4">
          {/* Search + action */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input placeholder="Cari No. GR atau supplier..." value={search}
                onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Button onClick={() => setSheetOpen(true)}>
              <Plus />Buat Pre-GR
            </Button>
          </div>

          {/* GR cards */}
          {filteredGR.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground border rounded-xl">
              <ClipboardList className="h-10 w-10 opacity-20" />
              <p className="text-sm">Tidak ada Good Receipt yang sesuai filter</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredGR.map((gr) => (
                <GRCard key={gr.id} gr={gr} onView={handleView} onReview={handleReview} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Pre-GR Sheet */}
      <PreGRSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
