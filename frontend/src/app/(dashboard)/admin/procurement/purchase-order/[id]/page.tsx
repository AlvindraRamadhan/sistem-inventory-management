"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Loader2,
  PackageCheck,
  ReceiptText,
  Send,
  ShoppingCart,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import { usePODetail, useUpdatePOStatus } from "@/hooks/queries/use-purchase-order";
import {
  PO_STATUS_LABEL,
  PO_STATUS_COLOR,
} from "@/lib/constants/status";
import { TERMIN_LABEL } from "@/types/procurement";
import { cn } from "@/lib/utils";
import type { PurchaseOrder, POStatus } from "@/types/procurement";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

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

// ─── Timeline step definition ─────────────────────────────────────────────────

const TIMELINE_STEPS: { status: POStatus; label: string; icon: React.ElementType }[] = [
  { status: "DRAFT",            label: "Draft",           icon: FileText },
  { status: "SENT",             label: "Terkirim",        icon: Send },
  { status: "PARTIAL_RECEIVED", label: "Diterima Sebagian", icon: Clock },
  { status: "RECEIVED",         label: "Diterima",        icon: PackageCheck },
  { status: "INVOICED",         label: "Diinvoice",       icon: ReceiptText },
  { status: "PAID",             label: "Lunas",           icon: Wallet },
];

// ─── Timeline component ───────────────────────────────────────────────────────

function StatusTimeline({ current }: { current: POStatus }) {
  const statusOrder: POStatus[] = ["DRAFT","SENT","PARTIAL_RECEIVED","RECEIVED","INVOICED","PAID"];
  const currentIdx = statusOrder.indexOf(current);

  return (
    <div className="flex items-start gap-0">
      {TIMELINE_STEPS.map((step, i) => {
        const stepIdx = statusOrder.indexOf(step.status);
        const isCompleted = stepIdx < currentIdx;
        const isCurrent = stepIdx === currentIdx;
        const isLast = i === TIMELINE_STEPS.length - 1;
        const Icon = step.icon;
        return (
          <div key={step.status} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full items-center">
              <div className={cn("h-0.5 flex-1 transition-colors", i === 0 ? "invisible" : isCompleted || isCurrent ? "bg-primary" : "bg-border")} />
              <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                isCompleted && "border-primary bg-primary text-primary-foreground",
                isCurrent && "border-primary bg-primary/10 text-primary",
                !isCompleted && !isCurrent && "border-border bg-background text-muted-foreground"
              )}>
                {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
              </div>
              <div className={cn("h-0.5 flex-1 transition-colors", isLast ? "invisible" : isCompleted ? "bg-primary" : "bg-border")} />
            </div>
            <span className={cn("text-center text-[10px] leading-tight",
              isCurrent && "font-semibold text-primary",
              isCompleted && "text-muted-foreground",
              !isCompleted && !isCurrent && "text-muted-foreground/60"
            )}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

//  Info row

function InfoRow({ label, value, mono }: { label: string; value?: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className={cn("text-sm font-medium text-foreground text-right", mono && "font-mono")}>
        {value ?? "-"}
      </span>
    </div>
  );
}

//  Action panel

function ActionPanel({
  po,
  onSend,
  onCreateGR,
  onInputInvoice,
}: {
  po: PurchaseOrder;
  onSend: () => void;
  onCreateGR: () => void;
  onInputInvoice: () => void;
}) {
  if (po.status === "DRAFT") {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground">PO ini masih berstatus Draft. Edit jika perlu, lalu kirim ke supplier.</p>
        <Button size="sm" onClick={onSend}><Send className="h-4 w-4" />Kirim ke Supplier</Button>
      </div>
    );
  }
  if (po.status === "SENT") {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground">PO sudah terkirim. Buat Pre-GR saat barang tiba dari supplier.</p>
        <Button size="sm" onClick={onCreateGR}><ClipboardList className="h-4 w-4" />Buat Pre-GR</Button>
      </div>
    );
  }
  if (po.status === "RECEIVED") {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground">Barang sudah diterima. Input invoice dari supplier untuk proses pembayaran.</p>
        <Button size="sm" onClick={onInputInvoice}><ReceiptText className="h-4 w-4" />Input Invoice</Button>
      </div>
    );
  }
  return null;
}

//  Page

export default function PurchaseOrderDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [sendConfirmOpen, setSendConfirmOpen] = useState(false);

  const { data: raw, isLoading } = usePODetail(params.id);
  const updateStatus = useUpdatePOStatus();

  const po = raw as PurchaseOrder | undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!po) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <ShoppingCart className="h-12 w-12 text-muted-foreground opacity-40" />
        <div className="text-center">
          <p className="text-base font-medium">Purchase Order tidak ditemukan</p>
          <p className="text-sm text-muted-foreground mt-1">PO dengan ID &quot;{params.id}&quot; tidak ada dalam sistem.</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/admin/procurement/purchase-order")}>
          <ArrowLeft className="h-4 w-4" />Kembali ke Daftar PO
        </Button>
      </div>
    );
  }

  async function handleConfirmSend() {
    await updateStatus.mutateAsync({ id: po!.id, payload: { status: "SENT" } });
    setSendConfirmOpen(false);
  }

  function handleCreateGR() {
    router.push(`/admin/procurement/good-receipt/buat?poId=${po!.id}`);
  }

  function handleInputInvoice() {
    router.push(`/admin/procurement/invoice/buat?poId=${po!.id}`);
  }

  const statusColor = PO_STATUS_COLOR[po.status];

  return (
    <div className="flex flex-col gap-6">
      {/*  Header  */}
      <PageHeader
        title={po.noPO}
        description={`Purchase Order kepada ${po.supplierName}`}
        breadcrumb={[
          { label: "Procurement" },
          { label: "Purchase Order", href: "/admin/procurement/purchase-order" },
          { label: po.noPO },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={statusColor} className="text-xs font-medium px-2.5 py-1">
              {PO_STATUS_LABEL[po.status]}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => router.push("/admin/procurement/purchase-order")}>
              <ArrowLeft className="h-4 w-4" />Kembali
            </Button>
          </div>
        }
      />

      {/*  Timeline  */}
      <Card>
        <CardContent className="pt-5 pb-4 px-6">
          <StatusTimeline current={po.status} />
        </CardContent>
      </Card>

      {/*  Two-column detail  */}
      <div className="grid grid-cols-3 gap-6 items-start">

        {/* Left: info + items table (2/3) */}
        <div className="col-span-2 flex flex-col gap-5">

          {/* PO Info */}
          <Card>
            <CardHeader className="border-b"><CardTitle>Informasi PO</CardTitle></CardHeader>
            <CardContent className="pt-3">
              <div className="grid grid-cols-2 gap-x-8 divide-x divide-border">
                <div>
                  <InfoRow label="Nomor PO" value={<span className="font-mono">{po.noPO}</span>} />
                  <InfoRow label="Supplier" value={po.supplierName} />
                  <InfoRow label="Tanggal PO" value={formatDate(po.tanggalPO)} />
                  <InfoRow label="Tanggal Kirim" value={formatDate(po.tanggalKirim)} />
                </div>
                <div className="pl-8">
                  <InfoRow label="Termin" value={TERMIN_LABEL[po.terminPembayaran]} />
                  <InfoRow label="PPN" value={po.ppnIncluded ? "Termasuk (11%)" : "Tidak termasuk"} />
                  <InfoRow label="Dibuat oleh" value={po.createdBy} />
                  <InfoRow label="Tanggal Dibuat" value={formatDateTime(po.createdAt)} />
                </div>
              </div>
              {po.catatan && (
                <>
                  <Separator className="my-3" />
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-medium text-muted-foreground">Catatan</p>
                    <p className="text-sm text-foreground">{po.catatan}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Items Table */}
          <Card>
            <CardHeader className="border-b"><CardTitle>Daftar Item</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Nama Obat</TableHead>
                    <TableHead>Satuan</TableHead>
                    <TableHead className="text-right">Qty Order</TableHead>
                    <TableHead className="text-right">Harga / Unit</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(po.items ?? []).map((item) => (
                    <TableRow key={item.id ?? item.obatId}>
                      <TableCell><p className="text-sm font-medium text-foreground">{item.namaObat}</p></TableCell>
                      <TableCell><span className="text-sm text-muted-foreground">{item.satuanNama}</span></TableCell>
                      <TableCell className="text-right tabular-nums">{item.qty.toLocaleString("id-ID")}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatRupiah(item.hargaBeli)}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">{formatRupiah(item.subtotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="border-t px-4 py-3">
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-8 text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="tabular-nums font-medium w-32 text-right">{formatRupiah(po.subtotalNilai)}</span>
                  </div>
                  {po.ppnIncluded && (
                    <div className="flex items-center gap-8 text-sm">
                      <span className="text-muted-foreground">PPN 11%</span>
                      <span className="tabular-nums w-32 text-right">{formatRupiah(po.totalPPN)}</span>
                    </div>
                  )}
                  <Separator className="w-64 my-0.5" />
                  <div className="flex items-center gap-8">
                    <span className="text-sm font-semibold">Total</span>
                    <span className="text-base font-bold tabular-nums w-32 text-right">{formatRupiah(po.totalNilai)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: actions + info (1/3) */}
        <div className="flex flex-col gap-4">
          {(po.status === "DRAFT" || po.status === "SENT" || po.status === "RECEIVED") && (
            <Card>
              <CardHeader className="border-b"><CardTitle>Tindakan</CardTitle></CardHeader>
              <CardContent className="pt-4">
                <ActionPanel po={po} onSend={() => setSendConfirmOpen(true)} onCreateGR={handleCreateGR} onInputInvoice={handleInputInvoice} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="border-b"><CardTitle>Ringkasan</CardTitle></CardHeader>
            <CardContent className="pt-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm text-muted-foreground">Total Item</span>
                  <span className="text-sm font-medium">{(po.items ?? []).length} jenis</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm text-muted-foreground">Total Qty</span>
                  <span className="text-sm font-medium tabular-nums">
                    {(po.items ?? []).reduce((a, it) => a + it.qty, 0).toLocaleString("id-ID")}
                  </span>
                </div>
                <Separator className="my-1" />
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="text-sm font-medium tabular-nums">{formatRupiah(po.subtotalNilai)}</span>
                </div>
                {po.ppnIncluded && (
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm text-muted-foreground">PPN 11%</span>
                    <span className="text-sm tabular-nums">{formatRupiah(po.totalPPN)}</span>
                  </div>
                )}
                <Separator className="my-1" />
                <div className="flex items-center justify-between py-1">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="text-base font-bold tabular-nums">{formatRupiah(po.totalNilai)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Send confirm ──────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={sendConfirmOpen}
        onOpenChange={(v) => { if (!v) setSendConfirmOpen(false); }}
        title={`Kirim PO ke ${po.supplierName}?`}
        description="PO yang sudah dikirim tidak dapat diedit lagi. Pastikan semua item dan harga sudah benar."
        confirmLabel="Ya, Kirim"
        cancelLabel="Batal"
        onConfirm={handleConfirmSend}
        isLoading={updateStatus.isPending}
      />
    </div>
  );
}
