"use client";

import { useRouter, useParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  History,
  ImageIcon,
  Loader2,
  Package,
  PenLine,
  RotateCcw,
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
import { GR_STATUS_LABEL, GR_STATUS_COLOR } from "@/lib/constants/status";
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
  if (!kondisi) return <Badge variant="secondary" className="text-xs">Belum diisi</Badge>;
  return kondisi === "BAIK" ? (
    <Badge className="border-0 bg-emerald-100 text-xs text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
      <CheckCircle2 className="mr-0.5 h-3 w-3" />Baik
    </Badge>
  ) : (
    <Badge className="border-0 bg-red-100 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-400">
      <XCircle className="mr-0.5 h-3 w-3" />Rusak
    </Badge>
  );
}

export default function ApotekerGRDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const { data: raw, isLoading } = useGRDetail(params.id);
  const gr = raw as GoodReceipt | undefined;

  if (isLoading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!gr) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Package className="h-12 w-12 text-muted-foreground opacity-40" />
        <div className="text-center">
          <p className="text-base font-medium">Good Receipt tidak ditemukan</p>
          <p className="mt-1 text-sm text-muted-foreground">GR dengan ID &quot;{params.id}&quot; tidak tersedia.</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/apoteker/good-receipt")}><ArrowLeft className="h-4 w-4" />Kembali</Button>
      </div>
    );
  }

  const isActionable = gr.status === "MENUNGGU_INPUT" || gr.status === "DITOLAK";
  const hasPhotos = (gr.fotoUrls?.length ?? 0) > 0;
  const hasRevision = (gr.riwayatRevisi?.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={gr.noGR}
        description={`Dari ${gr.noPO} · ${gr.supplierName}`}
        breadcrumb={[{ label: "Good Receipt", href: "/apoteker/good-receipt" }, { label: gr.noGR }]}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={GR_STATUS_COLOR[gr.status]} className="px-2.5 py-1 text-xs font-medium">
              {GR_STATUS_LABEL[gr.status]}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => router.push("/apoteker/good-receipt")}>
              <ArrowLeft className="h-4 w-4" />Kembali
            </Button>
          </div>
        }
      />

      {gr.status === "DITOLAK" && gr.rejectedReason && (
        <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/10">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
              <RotateCcw className="h-4 w-4 text-amber-700 dark:text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">GR ini Ditolak - Revisi ke-{gr.revisiKe}</p>
              </div>
              <p className="mt-1 text-sm font-medium text-amber-800 dark:text-amber-200">Alasan penolakan:</p>
              <p className="text-sm leading-relaxed text-amber-700 dark:text-amber-300">{gr.rejectedReason}</p>
            </div>
          </div>
        </div>
      )}

      {gr.status === "MENUNGGU_INPUT" && gr.catatanAdmin && (
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800/50 dark:bg-blue-900/10">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Instruksi Admin</p>
            <p className="mt-0.5 text-sm text-blue-700 dark:text-blue-400">{gr.catatanAdmin}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-5 items-start">
        <div className="md:col-span-3 flex flex-col gap-5">
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
                    <div key={label} className="flex items-baseline justify-between gap-4 py-1.5">
                      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
                      <span className="text-right text-sm font-medium text-foreground">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-1">
                  {[
                    { label: "Tgl. Perkiraan", value: formatDate(gr.tanggalPerkiraanDatang) },
                    { label: "Tgl. Terima", value: formatDate(gr.tanggalTerima) },
                    { label: "Revisi ke-", value: String(gr.revisiKe ?? 1) },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-baseline justify-between gap-4 py-1.5">
                      <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
                      <span className="text-right text-sm font-medium text-foreground">{value}</span>
                    </div>
                  ))}
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
                    <TableHead>Kondisi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(gr.items ?? []).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{item.namaObat}</p>
                          <p className="text-xs text-muted-foreground">{item.satuanNama}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">{item.qtyPO.toLocaleString("id-ID")}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {item.qtyTerima > 0 ? item.qtyTerima.toLocaleString("id-ID") : "-"}
                      </TableCell>
                      <TableCell><span className="font-mono text-xs text-muted-foreground">{item.batchNumber || "-"}</span></TableCell>
                      <TableCell><KondisiBadge kondisi={item.kondisi} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {hasPhotos && (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  Foto Bukti Penerimaan
                  <Badge variant="secondary" className="ml-1 text-xs">{gr.fotoUrls!.length} foto</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {gr.fotoUrls!.map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={url} alt={`Foto ${i + 1}`}
                      className="aspect-video w-full rounded-md border border-border object-cover" />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {hasRevision && (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  Riwayat Revisi
                  <Badge variant="secondary" className="ml-1 text-xs">{gr.riwayatRevisi!.length}x</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3"><RevisionHistory revisions={gr.riwayatRevisi!} /></CardContent>
            </Card>
          )}
        </div>

        <div className="md:col-span-2 flex flex-col gap-4">
          <Card>
            <CardHeader className="border-b"><CardTitle>Tindakan</CardTitle></CardHeader>
            <CardContent className="pt-4 flex flex-col gap-3">
              {isActionable ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    {gr.status === "DITOLAK"
                      ? "GR ini ditolak Admin. Perbaiki data sesuai catatan, lalu kirim ulang."
                      : "Admin telah membuat Pre-GR ini. Input data fisik penerimaan barang."}
                  </p>
                  <Button
                    className={cn("w-full", gr.status === "DITOLAK" && "bg-amber-600 text-white hover:bg-amber-700")}
                    onClick={() => router.push(`/apoteker/good-receipt/${gr.id}/input`)}
                  >
                    {gr.status === "DITOLAK" ? (
                      <><RotateCcw className="h-4 w-4" />Revisi &amp; Kirim Ulang</>
                    ) : (
                      <><PenLine className="h-4 w-4" />Input Fisik Penerimaan</>
                    )}
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {gr.status === "MENUNGGU_REVIEW"
                    ? "Data sudah dikirim ke Admin untuk direview."
                    : "GR ini sudah selesai diproses."}
                </p>
              )}
            </CardContent>
          </Card>

          {gr.catatanApoteker && (
            <Card>
              <CardHeader className="border-b"><CardTitle className="text-sm">Catatan Anda</CardTitle></CardHeader>
              <CardContent className="pt-3"><p className="text-sm leading-relaxed text-foreground">{gr.catatanApoteker}</p></CardContent>
            </Card>
          )}

          {gr.catatanAdmin && gr.status !== "DITOLAK" && (
            <Card>
              <CardHeader className="border-b"><CardTitle className="text-sm">Instruksi Admin</CardTitle></CardHeader>
              <CardContent className="pt-3"><p className="text-sm italic leading-relaxed text-muted-foreground">&ldquo;{gr.catatanAdmin}&rdquo;</p></CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="border-b"><CardTitle className="text-sm">Waktu</CardTitle></CardHeader>
            <CardContent className="pt-3 flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-4 py-1">
                <span className="text-xs text-muted-foreground shrink-0">Dibuat</span>
                <span className="text-xs font-medium text-right">{formatDateTime(gr.createdAt)}</span>
              </div>
              {gr.approvedAt && (
                <div className="flex items-baseline justify-between gap-4 py-1">
                  <span className="text-xs text-muted-foreground shrink-0">Disetujui</span>
                  <span className="text-xs font-medium text-right">{formatDateTime(gr.approvedAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
