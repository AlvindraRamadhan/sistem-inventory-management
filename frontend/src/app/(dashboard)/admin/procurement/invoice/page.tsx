"use client";

import React, { useMemo, useRef, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  AlertCircle,
  AlertTriangle,
  Banknote,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileImage,
  FilePlus,
  LayoutList,
  Loader2,
  Receipt,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import {
  useInvoiceList,
  useInvoiceStats,
  useAvailableGRsForInvoice,
  useCreateInvoice,
  useUpdateInvoicePayment,
} from "@/hooks/queries/use-purchase-invoice";
import {
  INVOICE_STATUS_LABEL,
  INVOICE_STATUS_COLOR,
} from "@/lib/constants/status";
import { TERMIN_OPTIONS, TERMIN_LABEL } from "@/types/procurement";
import { cn } from "@/lib/utils";
import type { PurchaseInvoice, TerminPembayaran } from "@/types/procurement";
import type { PaginatedResponse } from "@/lib/api-client";

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function getInvoiceDueDays(tanggalJatuhTempo: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(tanggalJatuhTempo);
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function addDaysToDate(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function terminToDays(t: TerminPembayaran): number {
  if (t === "7_HARI") return 7;
  if (t === "14_HARI") return 14;
  if (t === "30_HARI") return 30;
  return 0;
}

type InvoiceCategory = "belum" | "jatuh_tempo" | "overdue" | "lunas";

function getCategory(inv: PurchaseInvoice): InvoiceCategory {
  if (inv.status === "PAID") return "lunas";
  if (!inv.tanggalJatuhTempo) return "belum";
  const days = getInvoiceDueDays(inv.tanggalJatuhTempo);
  if (days < 0) return "overdue";
  if (days <= 7) return "jatuh_tempo";
  return "belum";
}

// ── Sidebar filter config ─────────────────────────────────────────────────────

const INVOICE_FILTERS = [
  { value: "semua",      label: "Semua",              icon: <LayoutList className="h-3.5 w-3.5" />,                             urgentStyle: null as string | null },
  { value: "belum",      label: "Belum Jatuh Tempo",  icon: <Clock className="h-3.5 w-3.5 text-blue-500" />,                    urgentStyle: null as string | null },
  { value: "jatuh_tempo",label: "Jatuh Tempo",        icon: <AlertCircle className="h-3.5 w-3.5 text-amber-500" />,             urgentStyle: "bg-amber-100 text-amber-700" },
  { value: "overdue",    label: "Overdue",             icon: <AlertTriangle className="h-3.5 w-3.5 text-destructive" />,         urgentStyle: "bg-red-100 text-destructive" },
  { value: "lunas",      label: "Lunas",               icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,         urgentStyle: null as string | null },
] as const;

// ── Due date cell ─────────────────────────────────────────────────────────────

function DueDateCell({ inv }: { inv: PurchaseInvoice }) {
  if (!inv.tanggalJatuhTempo) return <span className="text-sm text-muted-foreground">-</span>;
  if (inv.status === "PAID") {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(inv.tanggalJatuhTempo)}</span>
        <span className="text-xs text-emerald-600 dark:text-emerald-400">Lunas {formatDate(inv.tanggalBayar)}</span>
      </div>
    );
  }
  const days = getInvoiceDueDays(inv.tanggalJatuhTempo);
  const cat = getCategory(inv);
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm whitespace-nowrap">{formatDate(inv.tanggalJatuhTempo)}</span>
      <span className={cn("text-xs font-medium",
        cat === "overdue"     && "text-destructive",
        cat === "jatuh_tempo" && "text-amber-600 dark:text-amber-400",
        cat === "belum"       && "text-muted-foreground"
      )}>
        {days < 0 ? `Terlambat ${Math.abs(days)} hari` : days === 0 ? "Jatuh tempo hari ini" : `${days} hari lagi`}
      </span>
    </div>
  );
}

function InvoiceStatusBadge({ inv }: { inv: PurchaseInvoice }) {
  const cat = getCategory(inv);
  if (cat === "overdue") {
    return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0 text-xs font-medium whitespace-nowrap"><XCircle className="h-3 w-3" />Overdue</Badge>;
  }
  if (cat === "jatuh_tempo") {
    return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 text-xs font-medium whitespace-nowrap"><Clock className="h-3 w-3" />Jatuh Tempo</Badge>;
  }
  return <Badge variant={INVOICE_STATUS_COLOR[inv.status]} className="text-xs font-medium whitespace-nowrap">{INVOICE_STATUS_LABEL[inv.status]}</Badge>;
}

// ── Column definitions ────────────────────────────────────────────────────────

function buildColumns(
  onMarkPaid: (inv: PurchaseInvoice) => void,
  onViewDetail: (inv: PurchaseInvoice) => void
): ColumnDef<PurchaseInvoice>[] {
  return [
    {
      id: "noInvoice", accessorKey: "noInvoice", header: "No. Invoice",
      cell: ({ row }) => {
        const inv = row.original; const cat = getCategory(inv);
        return (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              {cat === "overdue" && <AlertTriangle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />}
              <span className="font-mono text-xs font-medium text-foreground whitespace-nowrap">{inv.noInvoice}</span>
            </div>
            {inv.noInvoiceSupplier && <span className="text-[10px] text-muted-foreground font-mono">{inv.noInvoiceSupplier}</span>}
          </div>
        );
      },
    },
    {
      id: "noPO", accessorKey: "noPO", header: "No. PO",
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">{row.original.noPO}</span>,
    },
    {
      id: "supplierName", accessorKey: "supplierName", header: "Supplier",
      cell: ({ row }) => <p className="text-sm font-medium text-foreground min-w-[140px] leading-snug">{row.original.supplierName}</p>,
    },
    {
      id: "totalNilai", accessorKey: "totalNilai", header: "Total Tagihan", enableSorting: true,
      cell: ({ row }) => <span className="text-sm font-medium tabular-nums text-foreground whitespace-nowrap">{formatRupiah(row.original.totalNilai)}</span>,
    },
    {
      id: "tanggalJatuhTempo", accessorKey: "tanggalJatuhTempo", header: "Jatuh Tempo", enableSorting: true,
      cell: ({ row }) => <DueDateCell inv={row.original} />,
    },
    {
      id: "status", header: "Status",
      cell: ({ row }) => <InvoiceStatusBadge inv={row.original} />,
    },
    {
      id: "aksi", header: "Aksi", size: 140,
      cell: ({ row }) => {
        const inv = row.original;
        return (
          <div className="flex items-center gap-1">
            {inv.status !== "PAID" && (
              <Button size="sm" variant="outline"
                className="h-7 px-2 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400"
                onClick={(e) => { e.stopPropagation(); onMarkPaid(inv); }}>
                <CheckCircle2 className="h-3.5 w-3.5" />Lunas
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs"
              onClick={(e) => { e.stopPropagation(); onViewDetail(inv); }}>
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0"
              onClick={(e) => { e.stopPropagation(); toast.info("Fitur export PDF akan segera hadir"); }}
              aria-label="Download invoice">
              <Download className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      },
    },
  ];
}

// ── PDF Upload ────────────────────────────────────────────────────────────────

function PdfUpload({ fileName, onChange }: { fileName: string; onChange: (name: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFiles(files: FileList) {
    const file = files[0];
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) { toast.error("Hanya file PDF yang diterima"); return; }
    onChange(file.name);
  }

  return (
    <div className="flex flex-col gap-2">
      {fileName ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
          <FileImage className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="flex-1 text-sm text-foreground truncate">{fileName}</span>
          <button type="button" onClick={() => onChange("")} className="text-muted-foreground hover:text-destructive transition-colors" aria-label="Hapus file">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => ref.current?.click()} role="button" tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && ref.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-2 border-dashed py-5 transition-all",
            isDragging ? "border-primary bg-primary/5" : "border-border bg-muted/30 hover:border-primary/50 hover:bg-primary/5"
          )}>
          <Upload className="h-5 w-5 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Klik atau seret file PDF invoice</p>
        </div>
      )}
      <input ref={ref} type="file" accept="application/pdf" className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
    </div>
  );
}

// ── Available GR type ─────────────────────────────────────────────────────────

interface AvailableGR {
  id: string;
  noGR: string;
  noPO?: string;
  supplierName?: string;
  totalNilai?: number;
  supplierNama?: string;
}

// ── Create Invoice Sheet ──────────────────────────────────────────────────────

interface CreateInvoiceSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

function CreateInvoiceSheet({ open, onOpenChange }: CreateInvoiceSheetProps) {
  const today = new Date().toISOString().slice(0, 10);

  const [grId, setGrId] = useState("");
  const [noInvoiceSupplier, setNoInvoiceSupplier] = useState("");
  const [tanggalInvoice, setTanggalInvoice] = useState(today);
  const [totalNilai, setTotalNilai] = useState<number | "">("");
  const [ppnIncluded, setPpnIncluded] = useState(false);
  const [termin, setTermin] = useState<TerminPembayaran>("30_HARI");
  const [catatan, setCatatan] = useState("");
  const [filePdfName, setFilePdfName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: availableRaw } = useAvailableGRsForInvoice();
  const createInvoice = useCreateInvoice();

  const availableGRs = useMemo<AvailableGR[]>(() => {
    if (!availableRaw) return [];
    if (Array.isArray(availableRaw)) return availableRaw as AvailableGR[];
    const r = availableRaw as { data?: AvailableGR[] };
    return r.data ?? [];
  }, [availableRaw]);

  const selectedGR = useMemo(() => availableGRs.find((g) => g.id === grId), [availableGRs, grId]);

  const tanggalJatuhTempo = useMemo(() => {
    if (!tanggalInvoice || termin === "COD") return tanggalInvoice || today;
    return addDaysToDate(tanggalInvoice, terminToDays(termin));
  }, [tanggalInvoice, termin, today]);

  const subtotal = useMemo(() => {
    if (!totalNilai) return 0;
    return ppnIncluded ? Math.round(Number(totalNilai) / 1.11) : Number(totalNilai);
  }, [totalNilai, ppnIncluded]);

  const nilaiPPN = ppnIncluded ? Number(totalNilai) - subtotal : 0;

  const overBudgetWarning = useMemo(() => {
    if (!selectedGR?.totalNilai || !totalNilai) return false;
    return Number(totalNilai) > selectedGR.totalNilai * 1.1;
  }, [selectedGR, totalNilai]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!noInvoiceSupplier.trim()) e.noInvoiceSupplier = "Nomor invoice supplier wajib diisi";
    if (!grId) e.grId = "GR wajib dipilih";
    if (!tanggalInvoice) e.tanggalInvoice = "Tanggal invoice wajib diisi";
    if (!totalNilai || Number(totalNilai) <= 0) e.totalNilai = "Total tagihan harus lebih dari 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleReset() {
    setGrId(""); setNoInvoiceSupplier(""); setTanggalInvoice(today);
    setTotalNilai(""); setPpnIncluded(false); setTermin("30_HARI");
    setCatatan(""); setFilePdfName(""); setErrors({});
  }

  async function handleSave() {
    if (!validate()) return;
    await createInvoice.mutateAsync({
      goodReceiptId: grId,
      noInvoiceSupplier: noInvoiceSupplier.trim(),
      tanggalInvoice,
      tanggalJatuhTempo: termin === "COD" ? tanggalInvoice : tanggalJatuhTempo,
      totalNilai: Number(totalNilai),
      subtotalNilai: ppnIncluded ? subtotal : undefined,
      nilaiPPN: ppnIncluded ? nilaiPPN : undefined,
      ppnIncluded,
      terminPembayaran: termin,
      filePdfName: filePdfName || undefined,
      catatan: catatan.trim() || undefined,
    });
    handleReset();
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) handleReset(); onOpenChange(v); }}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col overflow-y-auto">
        <SheetHeader className="border-b pb-3">
          <SheetTitle>Input Invoice Supplier</SheetTitle>
          <SheetDescription>Catat tagihan invoice dari supplier untuk pemrosesan pembayaran.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 px-4 py-4">
          {/* No. Invoice Supplier */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">No. Invoice dari Supplier <span className="text-destructive">*</span></label>
            <Input placeholder="Contoh: SI/ENS/2026/0410-01" value={noInvoiceSupplier}
              onChange={(e) => setNoInvoiceSupplier(e.target.value)} className={cn(errors.noInvoiceSupplier && "border-destructive")} />
            {errors.noInvoiceSupplier && <p className="text-xs text-destructive">{errors.noInvoiceSupplier}</p>}
          </div>

          {/* Pilih GR */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Good Receipt <span className="text-destructive">*</span></label>
            <Select value={grId} onValueChange={setGrId}>
              <SelectTrigger className={cn(errors.grId && "border-destructive")}>
                <SelectValue placeholder="Pilih GR yang sudah diterima..." />
              </SelectTrigger>
              <SelectContent>
                {availableGRs.length === 0 ? (
                  <div className="py-4 text-center text-sm text-muted-foreground">Tidak ada GR yang tersedia</div>
                ) : (
                  availableGRs.map((gr) => (
                    <SelectItem key={gr.id} value={gr.id}>
                      <span className="font-mono">{gr.noGR}</span>
                      {gr.noPO && <span className="ml-2 text-muted-foreground text-xs">· {gr.noPO}</span>}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.grId && <p className="text-xs text-destructive">{errors.grId}</p>}
            {selectedGR && (
              <div className="mt-1 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{selectedGR.supplierName ?? selectedGR.supplierNama ?? ""}</span>
                {selectedGR.totalNilai != null && (
                  <><span className="mx-2">·</span>Nilai PO: <span className="font-medium text-foreground">{formatRupiah(selectedGR.totalNilai)}</span></>
                )}
              </div>
            )}
          </div>

          {/* Tanggal Invoice */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Tanggal Invoice <span className="text-destructive">*</span></label>
            <Input type="date" value={tanggalInvoice} max={today}
              onChange={(e) => setTanggalInvoice(e.target.value)} className={cn(errors.tanggalInvoice && "border-destructive")} />
            {errors.tanggalInvoice && <p className="text-xs text-destructive">{errors.tanggalInvoice}</p>}
          </div>

          {/* Total + PPN */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Total Tagihan <span className="text-destructive">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none">Rp</span>
              <Input type="number" min={0} placeholder="0" value={totalNilai}
                onChange={(e) => setTotalNilai(e.target.value === "" ? "" : Number(e.target.value))}
                className={cn("pl-9 tabular-nums", errors.totalNilai && "border-destructive")} />
            </div>
            {errors.totalNilai && <p className="text-xs text-destructive">{errors.totalNilai}</p>}
            {overBudgetWarning && (
              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-900/10 px-3 py-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Total tagihan melebihi nilai PO. Pastikan angka ini sudah benar.
                </p>
              </div>
            )}
            <div className="flex items-center gap-2 mt-1">
              <button type="button" role="checkbox" aria-checked={ppnIncluded} onClick={() => setPpnIncluded((v) => !v)}
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors",
                  ppnIncluded ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"
                )}>
                {ppnIncluded && <Check className="h-3 w-3" />}
              </button>
              <span className="text-sm text-foreground">Total sudah termasuk PPN 11%</span>
            </div>
            {ppnIncluded && totalNilai !== "" && (
              <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                <div className="flex justify-between"><span>Subtotal (DPP)</span><span className="tabular-nums">{formatRupiah(subtotal)}</span></div>
                <div className="flex justify-between"><span>PPN 11%</span><span className="tabular-nums">{formatRupiah(nilaiPPN)}</span></div>
              </div>
            )}
          </div>

          {/* Termin */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Termin Pembayaran</label>
            <Select value={termin} onValueChange={(v) => setTermin(v as TerminPembayaran)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TERMIN_OPTIONS.map((t) => <SelectItem key={t} value={t}>{TERMIN_LABEL[t]}</SelectItem>)}</SelectContent>
            </Select>
            {termin !== "COD" && tanggalInvoice && (
              <p className="text-xs text-muted-foreground">
                Jatuh tempo: <span className="font-medium text-foreground">{formatDate(tanggalJatuhTempo)}</span>
              </p>
            )}
          </div>

          {/* PDF Upload */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Upload PDF Invoice</label>
            <PdfUpload fileName={filePdfName} onChange={setFilePdfName} />
          </div>

          {/* Catatan */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Catatan</label>
            <Textarea placeholder="Catatan tambahan mengenai invoice ini..." rows={2} value={catatan} onChange={(e) => setCatatan(e.target.value)} />
          </div>
        </div>

        <SheetFooter className="border-t">
          <Button variant="outline" onClick={() => { handleReset(); onOpenChange(false); }} disabled={createInvoice.isPending}>Batal</Button>
          <Button onClick={handleSave} disabled={createInvoice.isPending}>
            {createInvoice.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FilePlus className="h-4 w-4" />}
            Simpan Invoice
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ── Detail Sheet ──────────────────────────────────────────────────────────────

function DetailSheet({ inv, open, onOpenChange }: { inv: PurchaseInvoice | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  if (!inv) return null;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col overflow-y-auto">
        <SheetHeader className="border-b pb-3">
          <SheetTitle className="font-mono">{inv.noInvoice}</SheetTitle>
          <SheetDescription>{inv.supplierName}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-0 px-4 py-4 divide-y divide-border">
          {([
            { label: "No. Invoice Internal", value: <span className="font-mono text-xs">{inv.noInvoice}</span> },
            { label: "No. Invoice Supplier", value: inv.noInvoiceSupplier ? <span className="font-mono text-xs">{inv.noInvoiceSupplier}</span> : <span className="text-muted-foreground">-</span> },
            { label: "No. PO", value: <span className="font-mono text-xs">{inv.noPO}</span> },
            { label: "Supplier", value: inv.supplierName },
            { label: "Tanggal Invoice", value: formatDate(inv.tanggalInvoice) },
            { label: "Termin", value: inv.terminPembayaran ? TERMIN_LABEL[inv.terminPembayaran] : "-" },
            { label: "Jatuh Tempo", value: <DueDateCell inv={inv} /> },
            ...(inv.tanggalBayar ? [{ label: "Tanggal Bayar", value: formatDate(inv.tanggalBayar) }] : []),
            { label: "Status", value: <InvoiceStatusBadge inv={inv} /> },
          ] as { label: string; value: React.ReactNode }[]).map(({ label, value }, i) => (
            <div key={i} className="flex items-start justify-between gap-4 py-2.5">
              <span className="text-sm text-muted-foreground shrink-0">{label}</span>
              <span className="text-sm font-medium text-foreground text-right">{value}</span>
            </div>
          ))}
          <Separator className="my-1" />
          <div className="flex flex-col gap-2 pt-3">
            {inv.subtotalNilai != null && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal (DPP)</span>
                <span className="tabular-nums">{formatRupiah(inv.subtotalNilai)}</span>
              </div>
            )}
            {inv.nilaiPPN != null && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">PPN 11%</span>
                <span className="tabular-nums">{formatRupiah(inv.nilaiPPN)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm font-semibold">Total Tagihan</span>
              <span className="text-base font-bold tabular-nums">{formatRupiah(inv.totalNilai)}</span>
            </div>
          </div>
          {inv.filePdfName && (
            <>
              <Separator className="my-1" />
              <div className="flex items-center gap-2 pt-3">
                <FileImage className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-foreground flex-1 truncate">{inv.filePdfName}</span>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => toast.info("Fitur export PDF akan segera hadir")}>
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </div>
            </>
          )}
          {inv.catatan && (
            <>
              <Separator className="my-1" />
              <div className="pt-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Catatan</p>
                <p className="text-sm text-foreground">{inv.catatan}</p>
              </div>
            </>
          )}
          {inv.markedLunasByAt && (
            <>
              <Separator className="my-1" />
              <div className="pt-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Ditandai Lunas</p>
                <p className="text-sm text-foreground">{formatDateTime(inv.markedLunasByAt)}</p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InvoicePage() {
  const [activeFilter, setActiveFilter] = useState("semua");
  const [supplierFilter, setSupplierFilter] = useState("semua");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailInv, setDetailInv] = useState<PurchaseInvoice | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [markPaidTarget, setMarkPaidTarget] = useState<PurchaseInvoice | null>(null);

  const { data: invoiceRaw, isLoading } = useInvoiceList({ limit: 200 });
  const { data: statsRaw } = useInvoiceStats();
  const updatePayment = useUpdateInvoicePayment();

  const invoices = useMemo<PurchaseInvoice[]>(() => {
    if (!invoiceRaw) return [];
    const p = invoiceRaw as PaginatedResponse<PurchaseInvoice> | undefined;
    return p?.data ?? [];
  }, [invoiceRaw]);

  // Stats
  const stats = useMemo(() => {
    const s = statsRaw as { total?: number; unpaid?: number; jatuhTempo?: number; overdue?: number; paid?: number; totalUnpaidValue?: number } | undefined;
    if (s?.total !== undefined) {
      return {
        total: s.total ?? 0,
        unpaid: s.unpaid ?? 0,
        jatuhTempo: s.jatuhTempo ?? 0,
        overdue: s.overdue ?? 0,
        paid: s.paid ?? 0,
        totalUnpaidValue: s.totalUnpaidValue ?? 0,
      };
    }
    // Fallback: compute from list
    return {
      total: invoices.length,
      unpaid: invoices.filter((i) => i.status !== "PAID").length,
      jatuhTempo: invoices.filter((i) => getCategory(i) === "jatuh_tempo").length,
      overdue: invoices.filter((i) => getCategory(i) === "overdue").length,
      paid: invoices.filter((i) => i.status === "PAID").length,
      totalUnpaidValue: invoices.filter((i) => i.status !== "PAID").reduce((acc, i) => acc + i.totalNilai, 0),
    };
  }, [statsRaw, invoices]);

  // Unique suppliers for filter
  const suppliers = useMemo(() => {
    const seen = new Set<string>();
    return invoices.filter((inv) => {
      if (seen.has(inv.supplierId)) return false;
      seen.add(inv.supplierId);
      return true;
    }).map((inv) => ({ id: inv.supplierId, nama: inv.supplierName }));
  }, [invoices]);

  // Counts per category
  const counts = useMemo(() => ({
    semua:       invoices.length,
    belum:       invoices.filter((i) => getCategory(i) === "belum").length,
    jatuh_tempo: invoices.filter((i) => getCategory(i) === "jatuh_tempo").length,
    overdue:     invoices.filter((i) => getCategory(i) === "overdue").length,
    lunas:       invoices.filter((i) => i.status === "PAID").length,
  }), [invoices]);

  // Filtered data
  const filteredData = useMemo<PurchaseInvoice[]>(() => {
    let data = invoices;
    if (activeFilter !== "semua") data = data.filter((i) => getCategory(i) === activeFilter);
    if (supplierFilter !== "semua") data = data.filter((i) => i.supplierId === supplierFilter);
    return data;
  }, [invoices, activeFilter, supplierFilter]);

  function getRowClassName(inv: PurchaseInvoice): string {
    const cat = getCategory(inv);
    if (cat === "overdue")     return "bg-red-50/60 hover:bg-red-50 dark:bg-red-950/20 dark:hover:bg-red-950/30";
    if (cat === "jatuh_tempo") return "bg-amber-50/60 hover:bg-amber-50 dark:bg-amber-950/20 dark:hover:bg-amber-950/30";
    return "";
  }

  async function handleConfirmMarkPaid() {
    if (!markPaidTarget) return;
    const today = new Date().toISOString().slice(0, 10);
    await updatePayment.mutateAsync({ id: markPaidTarget.id, payload: { status: "PAID", tanggalBayar: today } });
    setMarkPaidTarget(null);
  }

  function handleViewDetail(inv: PurchaseInvoice) {
    setDetailInv(inv);
    setDetailOpen(true);
  }

  const columns = useMemo(
    () => buildColumns((inv) => setMarkPaidTarget(inv), handleViewDetail),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Purchase Invoice"
        description="Kelola tagihan dari supplier dan pantau status pembayaran"
        breadcrumb={[{ label: "Procurement" }, { label: "Invoice" }]}
        actions={
          <Button size="action" onClick={() => setCreateOpen(true)}>
            <FilePlus className="h-4 w-4" />Input Invoice
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatsCard title="Total Invoice" value={stats.total} icon={Receipt} variant="default" subtitle="Semua status" />
        <StatsCard title="Belum Dibayar" value={formatRupiah(stats.totalUnpaidValue)} icon={Banknote}
          variant={stats.overdue > 0 ? "danger" : "warning"} subtitle={`${stats.unpaid} invoice unpaid`} />
        <StatsCard title="Jatuh Tempo" value={stats.jatuhTempo + stats.overdue} icon={AlertTriangle}
          variant={stats.overdue > 0 ? "danger" : stats.jatuhTempo > 0 ? "warning" : "default"}
          subtitle={stats.overdue > 0 ? `${stats.overdue} overdue` : "Perlu segera dibayar"} />
        <StatsCard title="Lunas" value={stats.paid} icon={CheckCircle2} variant="success" subtitle="Pembayaran selesai" />
      </div>

      {/* 2-column layout */}
      <div className="flex gap-6 items-start">

        {/* Sidebar kiri */}
        <aside className="w-[220px] flex-shrink-0">
          <div className="bg-card border rounded-xl p-4 sticky top-6 space-y-5">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Status Invoice</p>
              <nav className="space-y-0.5">
                {INVOICE_FILTERS.map((item) => {
                  const count = counts[item.value as keyof typeof counts] ?? 0;
                  const isActive = activeFilter === item.value;
                  return (
                    <button key={item.value} onClick={() => setActiveFilter(item.value)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                        isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}>
                      <div className="flex items-center gap-2">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded-md font-medium",
                        item.urgentStyle ?? (isActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")
                      )}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <Separator />

            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Supplier</p>
              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Semua" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Supplier</SelectItem>
                  {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.nama}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </aside>

        {/* Konten kanan */}
        <main className="flex-1 min-w-0">
          {isLoading ? (
            <TableSkeleton />
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <DataTable
                columns={columns}
                data={filteredData}
                pageSize={10}
                searchKey="noInvoice"
                searchPlaceholder="Cari No. Invoice..."
                onRowClick={handleViewDetail}
                getRowClassName={getRowClassName}
              />
            </div>
          )}
        </main>
      </div>

      {/* Sheets & dialogs */}
      <CreateInvoiceSheet open={createOpen} onOpenChange={setCreateOpen} />
      <DetailSheet inv={detailInv} open={detailOpen} onOpenChange={setDetailOpen} />
      <ConfirmDialog
        open={!!markPaidTarget}
        onOpenChange={(v) => { if (!v) setMarkPaidTarget(null); }}
        title={`Tandai Invoice ${markPaidTarget?.noInvoice} Lunas?`}
        description={`Konfirmasi bahwa pembayaran sebesar ${markPaidTarget ? formatRupiah(markPaidTarget.totalNilai) : ""} kepada ${markPaidTarget?.supplierName} sudah diselesaikan. Status tidak dapat dikembalikan.`}
        confirmLabel="Ya, Tandai Lunas"
        cancelLabel="Batal"
        onConfirm={handleConfirmMarkPaid}
        isLoading={updatePayment.isPending}
      />
    </div>
  );
}
