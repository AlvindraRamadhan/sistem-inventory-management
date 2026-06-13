"use client";

import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  History,
  ImageIcon,
  Loader2,
  MessageSquare,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { RevisionHistory } from "@/components/features/procurement/revision-history";
import { useGRDetail } from "@/hooks/queries/use-good-receipt";
import {
  GR_STATUS_LABEL,
  GR_STATUS_COLOR,
} from "@/lib/constants/status";
import { cn } from "@/lib/utils";
import type { GoodReceipt, GRItem } from "@/types/procurement";

//  Helpers

function formatDate(dateStr?: string): string {
  if (!dateStr) return "-";
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  return `${d} ${months[m - 1]} ${y}`;
}

function formatDateTime(dateStr?: string): string {
  if (!dateStr) return "-";
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
  const dt = new Date(dateStr);
  return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}, ${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}`;
}

function KondisiBadge({ kondisi }: { kondisi?: GRItem["kondisi"] }) {
  if (!kondisi) {
    return <Badge variant="secondary" className="text-xs">Belum diisi</Badge>;
  }
  return kondisi === "BAIK" ? (
    <Badge className="border-0 bg-emerald-100 text-xs text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
      <CheckCircle2 /> Baik
    </Badge>
  ) : (
    <Badge className="border-0 bg-red-100 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-400">
      <XCircle /> Rusak
    </Badge>
  );
}

function PhotoGallery({ urls }: { urls: string[] }) {
  if (urls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 py-8 text-muted-foreground">
        <ImageIcon className="h-8 w-8 opacity-40" />
        <p className="text-xs">Tidak ada foto bukti</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {urls.map((url, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={url} alt={`Foto penerimaan ${i + 1}`}
          className="aspect-video w-full rounded-md border border-border object-cover" />
      ))}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium text-foreground">{value ?? "-"}</span>
    </div>
  );
}

export default function AdminGRDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const { data: raw, isLoading } = useGRDetail(params.id);
  const gr = raw as GoodReceipt | undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!gr) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <ClipboardCheck className="h-12 w-12 text-muted-foreground opacity-40" />
        <div className="text-center">
          <p className="text-base font-medium">Good Receipt tidak ditemukan</p>
          <p className="mt-1 text-sm text-muted-foreground">GR dengan ID &quot;{params.id}&quot; tidak ada.</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/admin/procurement/good-receipt")}>
          <ArrowLeft />Kembali ke Daftar GR
        </Button>
      </div>
    );
  }

  const canReview = gr.status === "MENUNGGU_REVIEW";
  const hasPhotos = (gr.fotoUrls?.length ?? 0) > 0;
  const hasRevision = (gr.riwayatRevisi?.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={gr.noGR}
        description={`Good Receipt dari ${gr.noPO} · ${gr.supplierName}`}
        breadcrumb={[
          { label: "Procurement" },
          { label: "Good Receipt", href: "/admin/procurement/good-receipt" },
          { label: gr.noGR },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={GR_STATUS_COLOR[gr.status]} className="px-2.5 py-1 text-xs font-medium">
              {GR_STATUS_LABEL[gr.status]}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => router.push("/admin/procurement/good-receipt")}>
              <ArrowLeft />Kembali
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-5 items-start">
        <div className="md:col-span-3 flex flex-col gap-5">
          <Card>
            <CardHeader className="border-b"><CardTitle>Informasi Good Receipt</CardTitle></CardHeader>
            <CardContent className="pt-3">
              <div className="grid grid-cols-2 gap-x-8 divide-x divide-border">
                <div>
                  <InfoRow label="No. GR" value={<span className="font-mono">{gr.noGR}</span>} />
                  <InfoRow label="No. PO" value={<span className="font-mono">{gr.noPO}</span>} />
                  <InfoRow label="Supplier" value={gr.supplierName} />
                </div>
                <div className="pl-8">
                  <InfoRow label="Tgl. Perkiraan" value={formatDate(gr.tanggalPerkiraanDatang)} />
                  <InfoRow label="Tgl. Terima" value={formatDate(gr.tanggalTerima)} />
                  <InfoRow label="Revisi ke-" value={gr.revisiKe ?? 1} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b"><CardTitle>Daftar Item</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Nama Obat</TableHead>
                    <TableHead className="text-right">Qty PO</TableHead>
                    <TableHead className="text-right">Qty Terima</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Expired</TableHead>
                    <TableHead>Kondisi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(gr.items ?? []).map((item) => {
                    const diff = item.qtyTerima - item.qtyPO;
                    return (
                      <TableRow key={item.id} className={cn(
                        item.kondisi === "RUSAK" && "bg-red-50/50 dark:bg-red-950/10",
                        item.kondisi !== "RUSAK" && item.qtyTerima > 0 && item.qtyTerima < item.qtyPO &&
                          "bg-amber-50/50 dark:bg-amber-950/10"
                      )}>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{item.namaObat}</p>
                            <p className="text-xs text-muted-foreground">{item.satuanNama}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">{item.qtyPO.toLocaleString("id-ID")}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="font-medium">{item.qtyTerima || "-"}</span>
                            {item.qtyTerima > 0 && diff !== 0 && (
                              <span className={cn("text-xs font-medium", diff < 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400")}>
                                {diff > 0 ? `+${diff}` : diff}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell><span className="font-mono text-xs text-muted-foreground">{item.batchNumber || "-"}</span></TableCell>
                        <TableCell><span className="text-xs text-muted-foreground whitespace-nowrap">{item.expiredDate ? formatDate(item.expiredDate) : "-"}</span></TableCell>
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
              <CardContent className="pt-3">
                <p className="text-sm leading-relaxed text-foreground">{gr.catatanApoteker}</p>
              </CardContent>
            </Card>
          )}

          {hasPhotos && (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  Foto Bukti Penerimaan
                  <Badge variant="secondary" className="ml-1 text-xs">{gr.fotoUrls!.length} foto</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3"><PhotoGallery urls={gr.fotoUrls!} /></CardContent>
            </Card>
          )}
        </div>

        <div className="md:col-span-2 flex flex-col gap-4">
          {canReview && (
            <Card className="border-emerald-200 dark:border-emerald-800/50">
              <CardHeader className="border-b"><CardTitle>Tindakan</CardTitle></CardHeader>
              <CardContent className="pt-4">
                <p className="mb-3 text-xs text-muted-foreground">
                  Apoteker sudah menginput data fisik. Lakukan review untuk menyetujui atau mengembalikan ke Apoteker.
                </p>
                <Button className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => router.push(`/admin/procurement/good-receipt/${gr.id}/review`)}>
                  <ClipboardCheck />Review GR Ini
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="border-b"><CardTitle>Detail Status</CardTitle></CardHeader>
            <CardContent className="pt-3">
              <div className="flex flex-col gap-1">
                <InfoRow label="Status" value={<Badge variant={GR_STATUS_COLOR[gr.status]} className="text-xs">{GR_STATUS_LABEL[gr.status]}</Badge>} />
                <InfoRow label="Dibuat" value={formatDateTime(gr.createdAt)} />
                <InfoRow label="Dibuat oleh" value={gr.createdBy} />
                {gr.approvedBy && <InfoRow label="Disetujui oleh" value={gr.approvedBy} />}
                {gr.approvedAt && <InfoRow label="Disetujui pada" value={formatDateTime(gr.approvedAt)} />}
                {gr.rejectedReason && (
                  <div className="mt-2 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2.5">
                    <p className="mb-1 text-xs font-medium text-destructive">Alasan Penolakan</p>
                    <p className="text-xs text-foreground">{gr.rejectedReason}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {gr.catatanAdmin && (
            <Card>
              <CardHeader className="border-b"><CardTitle className="text-sm">Instruksi Admin</CardTitle></CardHeader>
              <CardContent className="pt-3">
                <p className="text-sm italic leading-relaxed text-muted-foreground">&ldquo;{gr.catatanAdmin}&rdquo;</p>
              </CardContent>
            </Card>
          )}

          {hasRevision && (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <History className="h-4 w-4 shrink-0 text-muted-foreground" />
                  Riwayat Revisi
                  <Badge variant="secondary" className="ml-1 text-xs">{gr.riwayatRevisi!.length}x</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3"><RevisionHistory revisions={gr.riwayatRevisi!} /></CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
