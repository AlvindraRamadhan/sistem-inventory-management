"use client";

import { useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  History,
  ImageIcon,
  Loader2,
  MessageSquare,
  PackageCheck,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { RevisionHistory } from "@/components/features/procurement/revision-history";
import { useGRDetail, useReviewGR } from "@/hooks/queries/use-good-receipt";
import { cn } from "@/lib/utils";
import type { GoodReceipt, GRItem } from "@/types/procurement";

//  Helpers

function formatDate(dateStr?: string): string {
  if (!dateStr) return "-";
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  return `${d} ${months[m - 1]} ${y}`;
}

function getRowVariant(item: GRItem): "ok" | "short" | "rusak" {
  if (item.kondisi === "RUSAK") return "rusak";
  if (item.qtyTerima < item.qtyPO) return "short";
  return "ok";
}

function KondisiBadge({ kondisi }: { kondisi?: GRItem["kondisi"] }) {
  if (!kondisi) return <Badge variant="secondary" className="text-xs">Belum diisi</Badge>;
  return kondisi === "BAIK" ? (
    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 text-xs">
      <CheckCircle2 />Baik
    </Badge>
  ) : (
    <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0 text-xs">
      <XCircle />Rusak
    </Badge>
  );
}

function SelisihCell({ item }: { item: GRItem }) {
  const diff = item.qtyTerima - item.qtyPO;
  if (diff === 0) return <span className="text-sm text-muted-foreground">-</span>;
  return (
    <span className={cn("text-sm font-medium tabular-nums", diff < 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400")}>
      {diff > 0 ? `+${diff}` : diff}
    </span>
  );
}

function PhotoGallery({ urls }: { urls: string[] }) {
  const [zoomedUrl, setZoomedUrl] = useState<string | null>(null);
  if (urls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 py-8 text-muted-foreground">
        <ImageIcon className="h-8 w-8 opacity-40" /><p className="text-xs">Tidak ada foto bukti</p>
      </div>
    );
  }
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {urls.map((url, i) => (
          <button key={i} type="button" onClick={() => setZoomedUrl(url)}
            className="relative aspect-video overflow-hidden rounded-md border border-border bg-muted hover:opacity-80 transition-opacity"
            aria-label={`Foto ${i + 1}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Foto penerimaan ${i + 1}`} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
      <Dialog open={!!zoomedUrl} onOpenChange={(v) => !v && setZoomedUrl(null)}>
        <DialogContent className="max-w-3xl p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Foto Penerimaan</DialogTitle>
            <DialogDescription>Foto bukti penerimaan barang</DialogDescription>
          </DialogHeader>
          {zoomedUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={zoomedUrl} alt="Foto penerimaan" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

interface RejectDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
}

function RejectDialog({ open, onOpenChange, onConfirm, isLoading }: RejectDialogProps) {
  const [reason, setReason] = useState("");

  function handleSubmit() {
    if (reason.trim()) onConfirm(reason.trim());
  }

  function handleClose(v: boolean) {
    if (!v) setReason("");
    onOpenChange(v);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />Tolak Good Receipt?
          </DialogTitle>
          <DialogDescription>
            GR akan dikembalikan ke Apoteker untuk direvisi. Berikan alasan penolakan yang jelas.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="reject-reason" className="text-sm font-medium text-foreground">
            Alasan Penolakan <span className="text-destructive" aria-hidden="true">*</span>
          </label>
          <Textarea id="reject-reason"
            placeholder="Contoh: Batch number tidak sesuai faktur. Foto bukti tidak terbaca."
            rows={4} value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
          {reason.trim().length > 0 && reason.trim().length < 10 && (
            <p className="text-xs text-destructive">Alasan minimal 10 karakter.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={isLoading}>Batal</Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={reason.trim().length < 10 || isLoading}>
            {isLoading && <Loader2 className="animate-spin" />}
            Kirim Balik ke Apoteker
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function GRReviewPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const { data: raw, isLoading } = useGRDetail(params.id);
  const reviewGR = useReviewGR();

  const gr = raw as GoodReceipt | undefined;

  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const itemStats = useMemo(() => {
    if (!gr) return { sesuai: 0, selisih: 0, rusak: 0 };
    const items = gr.items ?? [];
    const sesuai = items.filter((it) => it.kondisi !== "RUSAK" && it.qtyTerima === it.qtyPO).length;
    const selisih = items.filter((it) => it.kondisi !== "RUSAK" && it.qtyTerima !== it.qtyPO).length;
    const rusak = items.filter((it) => it.kondisi === "RUSAK").length;
    return { sesuai, selisih, rusak };
  }, [gr]);

  if (isLoading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!gr) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <ClipboardCheck className="h-12 w-12 text-muted-foreground opacity-40" />
        <div className="text-center">
          <p className="text-base font-medium">Good Receipt tidak ditemukan</p>
          <p className="text-sm text-muted-foreground mt-1">GR dengan ID &quot;{params.id}&quot; tidak ada dalam sistem.</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/admin/procurement/good-receipt")}><ArrowLeft />Kembali</Button>
      </div>
    );
  }

  if (gr.status !== "MENUNGGU_REVIEW") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <AlertTriangle className="h-12 w-12 text-amber-500 opacity-60" />
        <div className="text-center">
          <p className="text-base font-medium">GR Tidak Dapat Direview</p>
          <p className="text-sm text-muted-foreground mt-1">
            {gr.noGR} berstatus <strong>{gr.status}</strong> dan tidak memerlukan review.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/admin/procurement/good-receipt")}><ArrowLeft />Kembali</Button>
      </div>
    );
  }

  async function handleApprove() {
    await reviewGR.mutateAsync({ id: gr!.id, payload: { action: "approve" } });
    setApproveOpen(false);
    router.push("/admin/procurement/good-receipt");
  }

  async function handleReject(reason: string) {
    await reviewGR.mutateAsync({ id: gr!.id, payload: { action: "reject", catatan: reason } });
    setRejectOpen(false);
    router.push("/admin/procurement/good-receipt");
  }

  const hasRusak = (gr.items ?? []).some((it) => it.kondisi === "RUSAK");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Review ${gr.noGR}`}
        description={`Tinjau hasil input fisik dari Apoteker untuk ${gr.supplierName}`}
        breadcrumb={[
          { label: "Procurement" },
          { label: "Good Receipt", href: "/admin/procurement/good-receipt" },
          { label: gr.noGR, href: `/admin/procurement/good-receipt/${gr.id}` },
          { label: "Review" },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push("/admin/procurement/good-receipt")}>
            <ArrowLeft />Kembali
          </Button>
        }
      />

      {hasRusak && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/50 dark:bg-amber-900/10">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Terdapat item berkondisi RUSAK</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              Jika disetujui, item rusak akan otomatis masuk ke antrian <strong>Defekta</strong>. Item kondisi baik akan masuk ke stok inventori.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 items-start gap-6">
        <div className="lg:col-span-3 flex flex-col gap-5">
          <Card>
            <CardHeader className="border-b"><CardTitle>Informasi Good Receipt</CardTitle></CardHeader>
            <CardContent className="pt-3">
              <div className="grid grid-cols-2 gap-x-8">
                <div className="flex flex-col gap-1">
                  {[
                    { label: "No. GR", value: <span className="font-mono">{gr.noGR}</span> },
                    { label: "No. PO", value: <span className="font-mono">{gr.noPO}</span> },
                    { label: "Supplier", value: gr.supplierName },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-baseline justify-between py-1.5 gap-4">
                      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
                      <span className="text-sm font-medium text-foreground text-right">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-1">
                  {[
                    { label: "Tgl. Perkiraan", value: formatDate(gr.tanggalPerkiraanDatang) },
                    { label: "Tgl. Terima", value: formatDate(gr.tanggalTerima) },
                    { label: "Revisi", value: `ke-${gr.revisiKe ?? 1}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-baseline justify-between py-1.5 gap-4">
                      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
                      <span className="text-sm font-medium text-foreground text-right">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Perbandingan Item</CardTitle>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-sm bg-emerald-100 dark:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-700" />
                    <span className="text-muted-foreground">Sesuai ({itemStats.sesuai})</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-sm bg-amber-100 dark:bg-amber-900/50 border border-amber-300 dark:border-amber-700" />
                    <span className="text-muted-foreground">Selisih ({itemStats.selisih})</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-sm bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700" />
                    <span className="text-muted-foreground">Rusak ({itemStats.rusak})</span>
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Nama Obat</TableHead>
                    <TableHead className="text-right">Qty PO</TableHead>
                    <TableHead className="text-right">Qty Fisik</TableHead>
                    <TableHead className="text-right">Selisih</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Exp. Date</TableHead>
                    <TableHead>Kondisi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(gr.items ?? []).map((item) => {
                    const variant = getRowVariant(item);
                    return (
                      <TableRow key={item.id} className={cn(
                        "hover:opacity-90",
                        variant === "ok" && "bg-emerald-50/60 dark:bg-emerald-950/20",
                        variant === "short" && "bg-amber-50/60 dark:bg-amber-950/20",
                        variant === "rusak" && "bg-red-50/60 dark:bg-red-950/20"
                      )}>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <p className="text-sm font-medium text-foreground">{item.namaObat}</p>
                            <p className="text-xs text-muted-foreground">{item.satuanNama}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{item.qtyPO.toLocaleString("id-ID")}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{item.qtyTerima.toLocaleString("id-ID")}</TableCell>
                        <TableCell className="text-right"><SelisihCell item={item} /></TableCell>
                        <TableCell><span className="font-mono text-xs">{item.batchNumber || "-"}</span></TableCell>
                        <TableCell><span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(item.expiredDate) || "-"}</span></TableCell>
                        <TableCell><KondisiBadge kondisi={item.kondisi} /></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {gr.catatanApoteker && (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2"><MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />Catatan dari Apoteker</CardTitle>
              </CardHeader>
              <CardContent className="pt-3"><p className="text-sm text-foreground leading-relaxed">{gr.catatanApoteker}</p></CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                Foto Bukti Penerimaan
                {gr.fotoUrls && gr.fotoUrls.length > 0 && (
                  <Badge variant="secondary" className="text-xs ml-1">{gr.fotoUrls.length} foto</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3"><PhotoGallery urls={gr.fotoUrls ?? []} /></CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-4">
          {gr.catatanAdmin && (
            <Card>
              <CardHeader className="border-b"><CardTitle className="text-sm">Instruksi Admin</CardTitle></CardHeader>
              <CardContent className="pt-3"><p className="text-sm text-muted-foreground leading-relaxed italic">&ldquo;{gr.catatanAdmin}&rdquo;</p></CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="border-b"><CardTitle>Ringkasan Cek</CardTitle></CardHeader>
            <CardContent className="pt-3">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between rounded-md bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2">
                  <span className="text-sm text-emerald-700 dark:text-emerald-400">Item sesuai PO</span>
                  <span className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">{itemStats.sesuai} item</span>
                </div>
                <div className="flex items-center justify-between rounded-md bg-amber-50 dark:bg-amber-900/20 px-3 py-2">
                  <span className="text-sm text-amber-700 dark:text-amber-400">Item selisih qty</span>
                  <span className="font-semibold tabular-nums text-amber-700 dark:text-amber-400">{itemStats.selisih} item</span>
                </div>
                <div className="flex items-center justify-between rounded-md bg-red-50 dark:bg-red-900/20 px-3 py-2">
                  <span className="text-sm text-red-700 dark:text-red-400">Item rusak → Defekta</span>
                  <span className="font-semibold tabular-nums text-red-700 dark:text-red-400">{itemStats.rusak} item</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {(gr.riwayatRevisi?.length ?? 0) > 0 && (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <History className="h-4 w-4 shrink-0 text-muted-foreground" />
                  Riwayat Revisi
                  <Badge variant="secondary" className="text-xs ml-1">{gr.riwayatRevisi!.length}x</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3"><RevisionHistory revisions={gr.riwayatRevisi!} /></CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Sticky action panel */}
      <div className="sticky bottom-0 -mx-6 border-t border-border bg-background/95 backdrop-blur-sm px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">Keputusan Admin</p>
            <p className="text-xs text-muted-foreground">Setujui untuk masukkan stok, atau tolak untuk minta revisi Apoteker.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline"
              className="border-destructive/50 text-destructive hover:bg-destructive/5 hover:text-destructive"
              onClick={() => setRejectOpen(true)} disabled={reviewGR.isPending}>
              <X />Tolak
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setApproveOpen(true)} disabled={reviewGR.isPending}>
              <PackageCheck />Setujui &amp; Masukkan Stok
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title="Setujui Good Receipt?"
        description={
          hasRusak
            ? `Item kondisi BAIK akan masuk ke stok inventori. ${itemStats.rusak} item rusak akan otomatis masuk ke antrian Defekta. Tindakan ini tidak dapat dibatalkan.`
            : "Semua item akan masuk ke stok inventori. Tindakan ini tidak dapat dibatalkan."
        }
        confirmLabel="Ya, Setujui"
        cancelLabel="Periksa Lagi"
        onConfirm={handleApprove}
        isLoading={reviewGR.isPending}
      />

      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onConfirm={handleReject}
        isLoading={reviewGR.isPending}
      />
    </div>
  );
}
