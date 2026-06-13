"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  Minus,
  Plus,
  TrendingDown,
  TrendingUp,
  X,
  XCircle,
} from "lucide-react";

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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import {
  useStokOpnameList,
  useStokOpnameDetail,
  useFinalizeOpname,
  useRejectOpname,
} from "@/hooks/queries/use-stok-opname";
import type { OpnameListItem, OpnameDetailItem } from "@/services/stok-opname.service";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type DiffFilter = "ALL" | "PLUS" | "MINUS";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} ${months[m - 1]} ${y}`;
}

function formatDateTime(iso: string): string {
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
  const dt = new Date(iso);
  return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}, ${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}`;
}

function formatRupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function OpnameStatusBadge({ status }: { status: OpnameListItem["status"] }) {
  const cfg = {
    PENDING:  { cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",        label: "Menunggu Validasi" },
    APPROVED: { cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", label: "Disetujui" },
    REJECTED: { cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",             label: "Ditolak" },
  }[status];
  return (
    <Badge className={cn("border-0 text-xs font-medium", cfg.cls)}>
      {cfg.label}
    </Badge>
  );
}

// ─── Info row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{value}</span>
    </div>
  );
}

// ─── Reject dialog ────────────────────────────────────────────────────────────

function RejectDialog({
  open,
  onOpenChange,
  noOpname,
  onConfirm,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  noOpname: string;
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
            Tolak Opname {noOpname}?
          </DialogTitle>
          <DialogDescription>
            Opname akan dikembalikan ke Apoteker dengan catatan. Apoteker perlu
            melakukan penghitungan ulang sebelum mengirim kembali.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Catatan Penolakan <span className="text-destructive">*</span>
          </label>
          <Textarea
            placeholder="Contoh: Ditemukan perbedaan yang terlalu besar pada Cetirizine (selisih -5 unit). Mohon hitung ulang dan pastikan tidak ada obat yang terlewat."
            rows={4}
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            autoFocus
          />
          {catatan.trim().length > 0 && catatan.trim().length < 15 && (
            <p className="text-xs text-destructive">Catatan minimal 15 karakter.</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={isLoading}>
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm(catatan.trim())}
            disabled={catatan.trim().length < 15 || isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Tolak &amp; Kirim Balik
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Approve confirm dialog ───────────────────────────────────────────────────

function ApproveDialog({
  open,
  onOpenChange,
  noOpname,
  diffCount,
  nilaiPenyusutan,
  onConfirm,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  noOpname: string;
  diffCount: number;
  nilaiPenyusutan: number;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
            Setujui Opname {noOpname}?
          </DialogTitle>
          <DialogDescription>
            Stok akan diperbarui sesuai hasil hitungan fisik. Tindakan ini tidak dapat
            dibatalkan dan akan dicatat di audit log.
          </DialogDescription>
        </DialogHeader>

        {diffCount > 0 && (
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Item ada selisih</span>
              <span className="font-medium text-foreground">{diffCount} item</span>
            </div>
            {nilaiPenyusutan < 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimasi nilai penyusutan</span>
                <span className="font-semibold text-rose-600 dark:text-rose-400">
                  {formatRupiah(nilaiPenyusutan)}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-start gap-2 rounded-md bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 px-3 py-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            Stok akan diperbarui permanen dan transaksi keluar akan dibuka kembali.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Periksa Lagi
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Ya, Setujui Opname
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Opname list item card ────────────────────────────────────────────────────

function OpnameCard({
  opname,
  onReview,
}: {
  opname: OpnameListItem;
  onReview: (op: OpnameListItem) => void;
}) {
  return (
    <Card className="flex flex-row items-center gap-4 px-5 py-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
        <ClipboardCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-mono text-sm font-semibold text-foreground">
            {opname.noOpname}
          </span>
          <OpnameStatusBadge status={opname.status} />
        </div>
        <p className="text-xs text-muted-foreground">
          Dikirim oleh {opname.createdBy} pada {formatDate(opname.tanggalOpname)} ·{" "}
          {opname.totalItems} item dihitung ·{" "}
          <span className="text-emerald-600 dark:text-emerald-400">+{opname.selisihPlus}</span>{" "}
          /{" "}
          <span className="text-rose-600 dark:text-rose-400">-{opname.selisihMinus}</span>
        </p>
        {opname.catatan && (
          <p className="mt-1 text-xs text-muted-foreground/70 line-clamp-1">{opname.catatan}</p>
        )}
      </div>
      <Button size="sm" variant="outline" onClick={() => onReview(opname)} className="gap-1.5 shrink-0">
        <ClipboardCheck className="h-3.5 w-3.5" />
        Review
      </Button>
    </Card>
  );
}

// ─── Review panel ─────────────────────────────────────────────────────────────

function ReviewPanel({
  opname,
  detail,
  isDetailLoading,
  onBack,
  onApprove,
  onReject,
}: {
  opname: OpnameListItem;
  detail: OpnameDetailItem[];
  isDetailLoading: boolean;
  onBack: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const [diffFilter, setDiffFilter] = useState<DiffFilter>("ALL");

  const withDiff    = useMemo(() => detail.filter((d) => d.stokFisik !== d.stokSistem), [detail]);
  const withoutDiff = useMemo(() => detail.filter((d) => d.stokFisik === d.stokSistem), [detail]);

  const filtered = useMemo(() => {
    if (diffFilter === "PLUS")  return detail.filter((d) => d.stokFisik > d.stokSistem);
    if (diffFilter === "MINUS") return detail.filter((d) => d.stokFisik < d.stokSistem);
    return withDiff;
  }, [detail, diffFilter, withDiff]);

  const summary = useMemo(() => {
    const nilaiPenyusutan = withDiff.reduce((sum, d) => {
      const selisih = d.stokFisik - d.stokSistem;
      return sum + selisih * d.hargaBeli;
    }, 0);
    const totalPlus  = withDiff.filter((d) => d.stokFisik > d.stokSistem).reduce((s, d) => s + (d.stokFisik - d.stokSistem), 0);
    const totalMinus = withDiff.filter((d) => d.stokFisik < d.stokSistem).reduce((s, d) => s + (d.stokSistem - d.stokFisik), 0);
    return { nilaiPenyusutan, totalPlus, totalMinus };
  }, [withDiff]);

  return (
    <div className="flex flex-col gap-5">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke daftar
      </button>

      <Card>
        <CardHeader className="border-b py-3 px-5">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-amber-500" />
            Review Opname — {opname.noOpname}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 py-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
            <div>
              <InfoRow label="No. Opname" value={<span className="font-mono">{opname.noOpname}</span>} />
              <InfoRow label="Tanggal Opname" value={formatDate(opname.tanggalOpname)} />
              <InfoRow label="Dikirim oleh" value={opname.createdBy} />
            </div>
            <div>
              <InfoRow label="Total Item Dihitung" value={`${opname.totalItems} item`} />
              <InfoRow
                label="Selisih"
                value={
                  <span className="flex items-center gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400">+{opname.selisihPlus}</span>
                    <span className="text-rose-600 dark:text-rose-400">-{opname.selisihMinus}</span>
                  </span>
                }
              />
              <InfoRow label="Status" value={<OpnameStatusBadge status={opname.status} />} />
            </div>
          </div>
          {opname.catatan && (
            <p className="mt-2 text-sm text-muted-foreground border-t border-border pt-2">
              {opname.catatan}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/15 dark:border-amber-700 px-4 py-3">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-sm text-amber-800 dark:text-amber-300">
          <strong>Transaksi keluar sedang dinonaktifkan</strong> selama opname ini belum diproses.
          Segera tindaklanjuti untuk membuka kembali transaksi.
        </p>
      </div>

      {/* Filter + diff table */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {(["ALL", "PLUS", "MINUS"] as DiffFilter[]).map((f) => {
              const labels = { ALL: "Semua Selisih", PLUS: "Selisih Positif", MINUS: "Selisih Negatif" };
              const counts = {
                ALL:   withDiff.length,
                PLUS:  detail.filter((d) => d.stokFisik > d.stokSistem).length,
                MINUS: detail.filter((d) => d.stokFisik < d.stokSistem).length,
              };
              return (
                <Button
                  key={f}
                  variant={diffFilter === f ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDiffFilter(f)}
                  className="h-8 text-xs"
                >
                  {labels[f]}
                  <span className="ml-1.5 rounded-full bg-muted/60 dark:bg-muted px-1.5 py-0.5 text-[10px] tabular-nums">
                    {counts[f]}
                  </span>
                </Button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {isDetailLoading ? "Memuat..." : `${withoutDiff.length} item tanpa selisih tidak ditampilkan`}
          </p>
        </div>

        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide min-w-[200px]">Nama Obat</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide min-w-[130px]">Batch / ED</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[110px]">Stok Sistem</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[110px]">Stok Fisik</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[90px]">Selisih</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[150px]">Nilai Penyusutan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isDetailLoading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                      Memuat detail opname...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      {detail.length === 0 ? "Tidak ada data item untuk opname ini." : "Tidak ada item yang cocok dengan filter ini."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => {
                    const selisih = item.stokFisik - item.stokSistem;
                    const nilai = selisih * item.hargaBeli;
                    return (
                      <tr key={item.batchId} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground leading-snug">{item.namaObat}</p>
                          <p className="text-xs text-muted-foreground">{item.kategoriNama} · {item.lokasiNama ?? "—"}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-foreground block">{item.batchNumber}</span>
                          <span className="text-xs text-muted-foreground">ED: {formatDate(item.expiredDate)}</span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium text-foreground">
                          {item.stokSistem.toLocaleString("id-ID")}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium text-foreground">
                          {item.stokFisik.toLocaleString("id-ID")}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={cn(
                            "text-sm font-semibold tabular-nums",
                            selisih > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                          )}>
                            {selisih > 0 ? "+" : ""}{selisih.toLocaleString("id-ID")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={cn(
                            "text-xs font-medium tabular-nums",
                            nilai >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                          )}>
                            {nilai >= 0 ? "+" : ""}{formatRupiah(nilai)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Summary + actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="border-b py-3 px-4">
            <CardTitle className="text-sm">Ringkasan Selisih</CardTitle>
          </CardHeader>
          <CardContent className="py-3 px-4 space-y-2">
            <div className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2">
              <span className="text-xs text-muted-foreground">Item ada selisih</span>
              <span className="text-sm font-semibold tabular-nums text-foreground">{withDiff.length} item</span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2">
              <span className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                <TrendingUp className="h-3.5 w-3.5" />
                Total selisih positif
              </span>
              <span className="text-sm font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                +{summary.totalPlus} unit
              </span>
            </div>
            <div className="flex items-center justify-between rounded-md bg-rose-50 dark:bg-rose-900/20 px-3 py-2">
              <span className="flex items-center gap-1.5 text-xs text-rose-700 dark:text-rose-400">
                <TrendingDown className="h-3.5 w-3.5" />
                Total selisih negatif
              </span>
              <span className="text-sm font-semibold tabular-nums text-rose-700 dark:text-rose-400">
                -{summary.totalMinus} unit
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-medium text-foreground">Total nilai penyusutan</span>
              <span className={cn(
                "text-sm font-bold tabular-nums",
                summary.nilaiPenyusutan >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              )}>
                {summary.nilaiPenyusutan >= 0 ? "+" : ""}{formatRupiah(summary.nilaiPenyusutan)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="border-b py-3 px-4">
            <CardTitle className="text-sm">Keputusan</CardTitle>
          </CardHeader>
          <CardContent className="py-4 px-4 flex flex-col justify-between flex-1 gap-4">
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Setujui</strong> jika data hitungan
                  sudah akurat. Stok sistem akan diperbarui dan transaksi dibuka kembali.
                </span>
              </div>
              <div className="flex items-start gap-1.5">
                <X className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Tolak</strong> jika ada kejanggalan.
                  Apoteker akan dikirim kembali untuk menghitung ulang.
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="border-destructive/50 text-destructive hover:bg-destructive/5 hover:text-destructive w-full"
                onClick={onReject}
              >
                <X className="h-4 w-4" />
                Tolak + Kirim Balik
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white w-full"
                onClick={onApprove}
              >
                <CheckCircle2 className="h-4 w-4" />
                Setujui Opname
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminOpnamePage() {
  const { data: listResponse, isLoading: listLoading } = useStokOpnameList();
  const finalizeOpname = useFinalizeOpname();
  const rejectOpname   = useRejectOpname();

  const [reviewing, setReviewing] = useState<OpnameListItem | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen]   = useState(false);

  const { data: detailResponse, isLoading: detailLoading } = useStokOpnameDetail(reviewing?.id ?? "");

  const opnames = useMemo(() => {
    const data = listResponse?.data ?? [];
    return [...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [listResponse]);

  const stats = useMemo(() => ({
    pending:  opnames.filter((o) => o.status === "PENDING").length,
    approved: opnames.filter((o) => o.status === "APPROVED").length,
    rejected: opnames.filter((o) => o.status === "REJECTED").length,
  }), [opnames]);

  const pendingOpnames  = useMemo(() => opnames.filter((o) => o.status === "PENDING"),  [opnames]);
  const resolvedOpnames = useMemo(() => opnames.filter((o) => o.status !== "PENDING"),  [opnames]);

  const detail = detailResponse?.items ?? [];

  const reviewingSummary = useMemo(() => {
    if (!reviewing) return { diffCount: 0, nilaiPenyusutan: 0 };
    const withDiff = detail.filter((d) => d.stokFisik !== d.stokSistem);
    const nilaiPenyusutan = withDiff.reduce((sum, d) => sum + (d.stokFisik - d.stokSistem) * d.hargaBeli, 0);
    return { diffCount: withDiff.length, nilaiPenyusutan };
  }, [reviewing, detail]);

  async function handleApprove() {
    if (!reviewing) return;
    try {
      await finalizeOpname.mutateAsync(reviewing.id);
      const now = new Date().toISOString();
      toast.info("Audit log dicatat", {
        description: `Admin menyetujui opname ${reviewing.noOpname} pada ${formatDateTime(now)}.`,
      });
      setApproveOpen(false);
      setReviewing(null);
    } catch {
      // error handled by hook
    }
  }

  async function handleReject(catatanPenolakan: string) {
    if (!reviewing) return;
    try {
      await rejectOpname.mutateAsync({ id: reviewing.id, catatanPenolakan });
      setRejectOpen(false);
      setReviewing(null);
    } catch {
      // error handled by hook
    }
  }

  const isProcessing = finalizeOpname.isPending || rejectOpname.isPending;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Validasi Opname"
        description="Tinjau hasil stock opname dari Apoteker dan putuskan perubahan stok"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="Menunggu Validasi"
          value={stats.pending}
          icon={ClipboardCheck}
          variant={stats.pending > 0 ? "warning" : "default"}
          subtitle="Opname perlu diproses"
        />
        <StatsCard
          title="Disetujui"
          value={stats.approved}
          icon={CheckCircle2}
          variant="success"
          subtitle="Stok berhasil diperbarui"
        />
        <StatsCard
          title="Ditolak / Dikembalikan"
          value={stats.rejected}
          icon={XCircle}
          variant="danger"
          subtitle="Apoteker hitung ulang"
        />
      </div>

      {reviewing ? (
        <ReviewPanel
          opname={reviewing}
          detail={detail}
          isDetailLoading={detailLoading}
          onBack={() => setReviewing(null)}
          onApprove={() => setApproveOpen(true)}
          onReject={() => setRejectOpen(true)}
        />
      ) : (
        <div className="flex flex-col gap-5">
          {listLoading ? (
            <Card className="flex flex-col items-center justify-center gap-3 py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Memuat data opname...</p>
            </Card>
          ) : (
            <>
              {pendingOpnames.length > 0 && (
                <div className="flex flex-col gap-3">
                  <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    Menunggu Validasi
                    <span className="rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-bold px-1.5 py-0.5 tabular-nums">
                      {pendingOpnames.length}
                    </span>
                  </h2>
                  {pendingOpnames.map((op) => (
                    <OpnameCard key={op.id} opname={op} onReview={setReviewing} />
                  ))}
                </div>
              )}

              {pendingOpnames.length === 0 && (
                <Card className="flex flex-col items-center justify-center gap-3 py-12 border-dashed">
                  <CheckCircle2 className="h-9 w-9 text-emerald-500" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">Tidak ada opname yang perlu divalidasi</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Semua opname sudah diproses.</p>
                  </div>
                </Card>
              )}

              {resolvedOpnames.length > 0 && (
                <div className="flex flex-col gap-3">
                  <h2 className="text-sm font-semibold text-foreground">Riwayat</h2>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b border-border">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tgl. Opname</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">No. Opname</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                          <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Selisih</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Diproses oleh</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Catatan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {resolvedOpnames.map((op) => (
                          <tr key={op.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                              {formatDate(op.tanggalOpname)}
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-mono text-sm font-medium text-foreground">{op.noOpname}</span>
                            </td>
                            <td className="px-4 py-3">
                              <OpnameStatusBadge status={op.status} />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="flex items-center justify-end gap-2">
                                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                                  <Plus className="h-3 w-3" />{op.selisihPlus}
                                </span>
                                <span className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                                  <Minus className="h-3 w-3" />{op.selisihMinus}
                                </span>
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {op.approvedBy ?? "—"}
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">
                              {op.status === "REJECTED" ? (op.catatanPenolakan ?? "—") : (op.catatan ?? "—")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <ApproveDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        noOpname={reviewing?.noOpname ?? ""}
        diffCount={reviewingSummary.diffCount}
        nilaiPenyusutan={reviewingSummary.nilaiPenyusutan}
        onConfirm={handleApprove}
        isLoading={isProcessing}
      />

      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        noOpname={reviewing?.noOpname ?? ""}
        onConfirm={handleReject}
        isLoading={isProcessing}
      />
    </div>
  );
}
