"use client";

import { useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  AlertTriangle,
  CalendarIcon,
  CheckCircle2,
  ClipboardList,
  ImageIcon,
  Loader2,
  ShieldAlert,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import {
  useDefektaList,
  useDefektaStats,
  useApproveDefekta,
  useRejectDefekta,
} from "@/hooks/queries/use-defekta";
import {
  ALASAN_LABEL,
  type DefektaItem,
  type AlasanDefekta,
  type StatusDefekta,
} from "@/services/defekta.service";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} ${months[m - 1]} ${y}`;
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
  const dt = new Date(iso);
  return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}, ${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}`;
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: StatusDefekta }) {
  const cfg: Record<StatusDefekta, { cls: string; label: string }> = {
    menunggu:    { cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",     label: "Menunggu Review" },
    disetujui:   { cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", label: "Disetujui" },
    ditolak:     { cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",         label: "Ditolak" },
    dimusnahkan: { cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",        label: "Dimusnahkan" },
  };
  const { cls, label } = cfg[status] ?? { cls: "", label: status };
  return <Badge className={cn("border-0 text-xs font-medium", cls)}>{label}</Badge>;
}

function AlasanBadge({ alasan }: { alasan: AlasanDefekta }) {
  const cls: Record<AlasanDefekta, string> = {
    rusak:       "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    expired:     "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    salah_simpan:"bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    lainnya:     "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  };
  return (
    <Badge className={cn("border-0 text-xs font-medium", cls[alasan])}>
      {ALASAN_LABEL[alasan]}
    </Badge>
  );
}

// ─── Foto gallery ─────────────────────────────────────────────────────────────

function FotoGallery({ urls }: { urls: string[] }) {
  const [zoomedUrl, setZoomedUrl] = useState<string | null>(null);
  if (urls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 py-8">
        <ImageIcon className="h-8 w-8 text-muted-foreground opacity-40" />
        <p className="text-xs text-muted-foreground">Tidak ada foto bukti</p>
      </div>
    );
  }
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {urls.map((url, i) => (
          <button key={i} type="button" onClick={() => setZoomedUrl(url)}
            className="relative aspect-video overflow-hidden rounded-md border border-border bg-muted hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Foto ${i + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Foto bukti ${i + 1}`} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
      <Dialog open={!!zoomedUrl} onOpenChange={(v) => !v && setZoomedUrl(null)}>
        <DialogContent className="max-w-3xl p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Foto Bukti Defekta</DialogTitle>
            <DialogDescription>Foto bukti kerusakan obat</DialogDescription>
          </DialogHeader>
          {zoomedUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={zoomedUrl} alt="Foto bukti" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Info row ──────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{value}</span>
    </div>
  );
}

// ─── RejectDialog ─────────────────────────────────────────────────────────────

function RejectDialog({
  open, onOpenChange, namaObat, onConfirm, isLoading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  namaObat: string;
  onConfirm: (catatan: string) => void;
  isLoading: boolean;
}) {
  const [catatan, setCatatan] = useState("");
  function handleClose(v: boolean) {
    if (!v) setCatatan("");
    onOpenChange(v);
  }
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            Tolak Laporan Defekta?
          </DialogTitle>
          <DialogDescription>
            Laporan <strong>{namaObat}</strong> akan ditolak. Stok akan dikembalikan ke aktif.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Catatan Penolakan
          </label>
          <Textarea
            placeholder="Contoh: Setelah ditinjau, kondisi obat masih layak digunakan..."
            rows={4}
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={isLoading}>Batal</Button>
          <Button variant="destructive" onClick={() => onConfirm(catatan.trim())} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Tolak &amp; Kembalikan Stok
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── ApproveDialog ────────────────────────────────────────────────────────────

function ApproveDialog({
  open, onOpenChange, namaObat, qty, noBatch, onConfirm, isLoading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  namaObat: string;
  qty: number;
  noBatch: string;
  onConfirm: (jadwal: string) => void;
  isLoading: boolean;
}) {
  const [jadwal, setJadwal] = useState("");
  function handleClose(v: boolean) {
    if (!v) setJadwal("");
    onOpenChange(v);
  }
  const today = new Date().toISOString().split("T")[0];
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <Trash2 className="h-5 w-5" />
            Setujui Pemusnahan?
          </DialogTitle>
          <DialogDescription>
            <strong>{qty} unit {namaObat}</strong> (batch {noBatch || "—"}) akan dihapus permanen dari sistem.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Jadwal Pemusnahan <span className="text-xs text-muted-foreground font-normal">(opsional)</span>
          </label>
          <div className="relative">
            <CalendarIcon className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input type="date" min={today} value={jadwal} onChange={(e) => setJadwal(e.target.value)} className="pl-8" />
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-md bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800 px-3 py-2.5">
          <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
          <p className="text-xs text-rose-700 dark:text-rose-400">Stok akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={isLoading}>Periksa Lagi</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => onConfirm(jadwal)} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Ya, Setujui Pemusnahan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── ReviewDialog ─────────────────────────────────────────────────────────────

function ReviewDialog({
  item, open, onOpenChange, onApproveClick, onRejectClick,
}: {
  item: DefektaItem | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onApproveClick: () => void;
  onRejectClick: () => void;
}) {
  if (!item) return null;
  const fotoUrls = item.fotoUrl ? [item.fotoUrl] : [];
  const noBatch = item.noBatch ?? item.batchAllocations?.[0]?.noBatch ?? "—";
  const expiredDate = item.batchAllocations?.[0]?.expiredDate ?? null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            Review Defekta — {item.obat?.nama}
          </DialogTitle>
          <DialogDescription>
            DEF #{item.id.slice(0, 8)} · Dilaporkan oleh {item.createdBy?.nama ?? "—"} pada {formatDateTime(item.createdAt)}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="flex flex-col gap-4 p-4 sm:p-6 lg:grid lg:grid-cols-5 lg:gap-0">
            {/* Left panel */}
            <div className="flex flex-col gap-4 lg:col-span-3 lg:pr-6 lg:border-r lg:border-border">
              <Card>
                <CardHeader className="border-b py-3 px-4">
                  <CardTitle className="text-sm">Informasi Defekta</CardTitle>
                </CardHeader>
                <CardContent className="py-2 px-4">
                  <InfoRow label="Nama Obat" value={item.obat?.nama} />
                  <InfoRow label="Kategori" value={item.obat?.kategori} />
                  <InfoRow label="No. Batch" value={<span className="font-mono">{noBatch}</span>} />
                  <InfoRow label="Expired Date" value={formatDate(expiredDate)} />
                  <InfoRow label="Jenis Kerusakan" value={<AlasanBadge alasan={item.alasan} />} />
                  <InfoRow label="Qty Defekta" value={
                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                      {item.qty.toLocaleString("id-ID")} unit
                    </span>
                  } />
                </CardContent>
              </Card>
              {item.catatan && (
                <Card>
                  <CardHeader className="border-b py-3 px-4">
                    <CardTitle className="text-sm">Catatan</CardTitle>
                  </CardHeader>
                  <CardContent className="py-3 px-4">
                    <p className="text-sm text-foreground leading-relaxed">{item.catatan}</p>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardHeader className="border-b py-3 px-4">
                  <CardTitle className="text-sm flex items-center gap-1.5">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    Foto Bukti
                    <Badge variant="secondary" className="text-xs ml-1">{fotoUrls.length} foto</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-3 px-4">
                  <FotoGallery urls={fotoUrls} />
                </CardContent>
              </Card>
            </div>
            {/* Right panel */}
            <div className="flex flex-col gap-4 lg:col-span-2 lg:pl-6">
              <Card>
                <CardHeader className="border-b py-3 px-4">
                  <CardTitle className="text-sm">Stok Aktif Saat Ini</CardTitle>
                </CardHeader>
                <CardContent className="py-3 px-4 space-y-2">
                  <div className="flex items-center justify-between rounded-md bg-rose-50 dark:bg-rose-900/20 px-3 py-2">
                    <span className="text-xs text-rose-700 dark:text-rose-400">Qty dilaporkan defekta</span>
                    <span className="text-sm font-semibold tabular-nums text-rose-700 dark:text-rose-400">
                      -{item.qty.toLocaleString("id-ID")} unit
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-md bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2">
                    <span className="text-xs text-emerald-700 dark:text-emerald-400">Stok obat saat ini</span>
                    <span className="text-sm font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                      {(item.obat?.stokSaatIni ?? 0).toLocaleString("id-ID")} unit
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-dashed">
                <CardContent className="py-4 px-4 space-y-2">
                  <p className="text-xs font-medium text-foreground">Panduan Keputusan</p>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-start gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span><strong className="text-foreground">Setujui</strong> jika kerusakan terkonfirmasi. Stok dihapus permanen.</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <X className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <span><strong className="text-foreground">Tolak</strong> jika obat masih layak pakai.</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="flex flex-col gap-2 mt-auto">
                <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/5 hover:text-destructive w-full" onClick={onRejectClick}>
                  <X className="h-4 w-4" />Tolak Laporan
                </Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white w-full" onClick={onApproveClick}>
                  <Trash2 className="h-4 w-4" />Setujui Pemusnahan
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ─── Column definitions ───────────────────────────────────────────────────────

function buildPendingColumns(onReview: (item: DefektaItem) => void): ColumnDef<DefektaItem>[] {
  return [
    {
      id: "createdAt", accessorKey: "createdAt", header: "Tgl. Lapor", size: 100,
      cell: ({ row }) => <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(row.original.createdAt)}</span>,
    },
    {
      id: "namaObat", header: "Nama Obat",
      cell: ({ row }) => (
        <div className="min-w-[140px]">
          <p className="text-sm font-medium text-foreground leading-snug">{row.original.obat?.nama}</p>
          <p className="text-xs text-muted-foreground">{row.original.obat?.kategori}</p>
        </div>
      ),
    },
    {
      id: "noBatch", header: "Batch",
      cell: ({ row }) => {
        const noBatch = row.original.noBatch ?? row.original.batchAllocations?.[0]?.noBatch ?? "—";
        return <span className="font-mono text-xs text-foreground">{noBatch}</span>;
      },
    },
    {
      id: "alasan", accessorKey: "alasan", header: "Jenis", size: 130,
      cell: ({ row }) => <AlasanBadge alasan={row.original.alasan} />,
    },
    {
      id: "qty", accessorKey: "qty", header: "Qty", size: 60,
      cell: ({ row }) => <span className="text-sm font-semibold tabular-nums text-rose-600 dark:text-rose-400">{row.original.qty.toLocaleString("id-ID")}</span>,
    },
    {
      id: "reportedBy", header: "Apoteker", size: 90,
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.createdBy?.nama ?? "—"}</span>,
    },
    {
      id: "aksi", header: "Aksi", size: 90,
      cell: ({ row }) => (
        <Button size="sm" variant="outline" onClick={() => onReview(row.original)} className="h-7 text-xs gap-1">
          <ClipboardList className="h-3.5 w-3.5" />Review
        </Button>
      ),
    },
  ];
}

function buildHistoryColumns(): ColumnDef<DefektaItem>[] {
  return [
    {
      id: "approvedAt", header: "Tgl. Keputusan", size: 110,
      cell: ({ row }) => <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(row.original.approvedAt)}</span>,
    },
    {
      id: "namaObat", header: "Nama Obat",
      cell: ({ row }) => (
        <div className="min-w-[140px]">
          <p className="text-sm font-medium text-foreground leading-snug">{row.original.obat?.nama}</p>
          <p className="text-xs text-muted-foreground">{row.original.obat?.kategori}</p>
        </div>
      ),
    },
    {
      id: "noBatch", header: "Batch",
      cell: ({ row }) => {
        const noBatch = row.original.noBatch ?? row.original.batchAllocations?.[0]?.noBatch ?? "—";
        return <span className="font-mono text-xs text-foreground">{noBatch}</span>;
      },
    },
    {
      id: "alasan", header: "Jenis", size: 130,
      cell: ({ row }) => <AlasanBadge alasan={row.original.alasan} />,
    },
    {
      id: "qty", header: "Qty", size: 60,
      cell: ({ row }) => <span className="text-sm font-semibold tabular-nums">{row.original.qty.toLocaleString("id-ID")}</span>,
    },
    {
      id: "status", header: "Status", size: 130,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "catatan", header: "Catatan",
      cell: ({ row }) => {
        const text = row.original.status === "disetujui"
          ? row.original.jadwalPemusnahan ? `Jadwal musnah: ${formatDate(row.original.jadwalPemusnahan)}` : "Pemusnahan segera"
          : row.original.catatanPenolakan ?? "—";
        return <span className="text-xs text-muted-foreground max-w-[200px] block truncate" title={text}>{text}</span>;
      },
    },
  ];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type TabStatus = "menunggu" | "disetujui" | "ditolak" | "dimusnahkan";

export default function AdminDefektaPage() {
  const [activeTab, setActiveTab] = useState<TabStatus>("menunggu");
  const [reviewingItem, setReviewingItem] = useState<DefektaItem | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const { data: listData, isLoading } = useDefektaList({ status: activeTab, limit: 50 });
  const { data: statsData } = useDefektaStats();
  const approveMutation = useApproveDefekta();
  const rejectMutation = useRejectDefekta();

  const items = listData?.data ?? [];
  const stats = statsData ?? { menunggu: 0, aktif: 0, selesaiBulanIni: 0 };

  // Tab counts from stats
  const tabCounts = useMemo(() => ({
    menunggu: stats.menunggu,
    disetujui: stats.aktif - stats.menunggu,
    ditolak: 0,
    dimusnahkan: stats.selesaiBulanIni,
  }), [stats]);

  function handleReview(item: DefektaItem) {
    setReviewingItem(item);
    setReviewOpen(true);
  }

  function handleApproveClick() {
    setReviewOpen(false);
    setApproveOpen(true);
  }

  function handleRejectClick() {
    setReviewOpen(false);
    setRejectOpen(true);
  }

  async function handleApproveConfirm(jadwalPemusnahan: string) {
    if (!reviewingItem) return;
    await approveMutation.mutateAsync({
      id: reviewingItem.id,
      dto: { jadwalPemusnahan: jadwalPemusnahan || undefined },
    });
    if (!approveMutation.isError) {
      toast.success(`Pemusnahan ${reviewingItem.obat?.nama} disetujui`, {
        description: jadwalPemusnahan ? `Jadwal: ${formatDate(jadwalPemusnahan)}` : "Pemusnahan dilaksanakan segera.",
      });
      setApproveOpen(false);
      setReviewingItem(null);
      setActiveTab("disetujui");
    }
  }

  async function handleRejectConfirm(catatanPenolakan: string) {
    if (!reviewingItem) return;
    await rejectMutation.mutateAsync({
      id: reviewingItem.id,
      dto: { catatanPenolakan: catatanPenolakan || undefined },
    });
    if (!rejectMutation.isError) {
      setRejectOpen(false);
      setReviewingItem(null);
      setActiveTab("ditolak");
    }
  }

  const pendingColumns = useMemo(() => buildPendingColumns(handleReview), []);
  const historyColumns = useMemo(() => buildHistoryColumns(), []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Defekta &amp; Quarantine"
        description="Tinjau dan putuskan laporan obat rusak atau kadaluarsa dari Apoteker"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Menunggu Review" value={stats.menunggu} icon={ShieldAlert}
          variant={stats.menunggu > 0 ? "warning" : "default"} subtitle="Laporan belum diproses" />
        <StatsCard title="Aktif (Karantina)" value={stats.aktif} icon={CheckCircle2}
          variant="success" subtitle="Menunggu + disetujui" />
        <StatsCard title="Selesai Bulan Ini" value={stats.selesaiBulanIni} icon={XCircle}
          variant="danger" subtitle="Sudah dimusnahkan" />
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabStatus)}>
        <TabsList>
          {(["menunggu", "disetujui", "ditolak", "dimusnahkan"] as const).map((tab) => {
            const labels = { menunggu: "Menunggu Review", disetujui: "Disetujui", ditolak: "Ditolak", dimusnahkan: "Dimusnahkan" };
            return (
              <TabsTrigger key={tab} value={tab}>
                {labels[tab]}
                <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums">
                  {tabCounts[tab]}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          columns={activeTab === "menunggu" ? pendingColumns : historyColumns}
          data={items}
          pageSize={15}
        />
      )}

      <ReviewDialog item={reviewingItem} open={reviewOpen} onOpenChange={setReviewOpen}
        onApproveClick={handleApproveClick} onRejectClick={handleRejectClick} />

      <ApproveDialog open={approveOpen} onOpenChange={setApproveOpen}
        namaObat={reviewingItem?.obat?.nama ?? ""}
        qty={reviewingItem?.qty ?? 0}
        noBatch={reviewingItem?.noBatch ?? reviewingItem?.batchAllocations?.[0]?.noBatch ?? ""}
        onConfirm={handleApproveConfirm}
        isLoading={approveMutation.isPending} />

      <RejectDialog open={rejectOpen} onOpenChange={setRejectOpen}
        namaObat={reviewingItem?.obat?.nama ?? ""}
        onConfirm={handleRejectConfirm}
        isLoading={rejectMutation.isPending} />
    </div>
  );
}
