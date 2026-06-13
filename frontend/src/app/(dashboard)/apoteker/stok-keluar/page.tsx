"use client";

import { useEffect, useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  AlertTriangle,
  CalendarIcon,
  ChevronsUpDown,
  PackageMinus,
  PlusCircle,
  RotateCcw,
  Search,
  TrendingDown,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { useObatList } from "@/hooks/queries/use-obat";
import { useStokKeluarList, useStokKeluarStats, useCreateStokKeluar } from "@/hooks/queries/use-stok-keluar";
import { useBatchList } from "@/hooks/queries/use-batch";
import type { ObatItem } from "@/services/obat.service";
import type { StokKeluarItem } from "@/services/stok-keluar.service";
import type { BatchItem } from "@/services/batch.service";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split("T")[0];
const LOW_STOK_THRESHOLD = 30;

// ─── Types ────────────────────────────────────────────────────────────────────

interface FEFODeduction {
  batchId: string;
  noBatch: string;
  expiredDate: string;
  lokasiId: string;
  lokasiNama: string;
  qtyDiambil: number;
  qtyTersedia: number;
}

type TujuanKeluar = "" | "RESEP" | "INTERNAL" | "LAIN";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} ${months[m - 1]} ${y}`;
}

function formatRupiahShort(value: number): string {
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1).replace(".", ",")}jt`;
  if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}rb`;
  return `Rp ${value.toLocaleString("id-ID")}`;
}

// FEFO engine: sort batches by expiredDate ASC, deduct from earliest first
function fefoDeduct(
  obatId: string,
  qtyRequested: number,
  batches: BatchItem[]
): { deductions: FEFODeduction[]; isEnough: boolean; totalAvailable: number } {
  const activeBatches = batches
    .filter((b) => b.obatId === obatId && b.status === "AKTIF" && b.qty > 0)
    .sort((a, b) => a.expiredDate.localeCompare(b.expiredDate));

  const totalAvailable = activeBatches.reduce((sum, b) => sum + b.qty, 0);
  const isEnough = totalAvailable >= qtyRequested;
  const toDeduct = Math.min(qtyRequested, totalAvailable);

  const deductions: FEFODeduction[] = [];
  let remaining = toDeduct;

  for (const batch of activeBatches) {
    if (remaining <= 0) break;
    const take = Math.min(batch.qty, remaining);
    deductions.push({
      batchId: batch.id,
      noBatch: batch.batchNumber,
      expiredDate: batch.expiredDate,
      lokasiId: batch.lokasiId,
      lokasiNama: batch.lokasiNama ?? "",
      qtyDiambil: take,
      qtyTersedia: batch.qty,
    });
    remaining -= take;
  }

  return { deductions, isEnough, totalAvailable };
}

function getTotalStokObat(obatId: string, batches: BatchItem[]): number {
  return batches
    .filter((b) => b.obatId === obatId && b.status === "AKTIF")
    .reduce((sum, b) => sum + b.qty, 0);
}

// ─── FieldWrapper ─────────────────────────────────────────────────────────────

function FieldWrapper({
  label, required, error, hint, children, className, htmlFor,
}: {
  label: string; required?: boolean; error?: string; hint?: string;
  children: React.ReactNode; className?: string; htmlFor?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground leading-none">
        {label}{required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p>
        : hint ? <p className="text-xs text-muted-foreground">{hint}</p>
        : null}
    </div>
  );
}

// ─── TujuanBadge ──────────────────────────────────────────────────────────────

function TujuanBadge({ item }: { item: StokKeluarItem }) {
  if (item.referenceType === "RESEP") {
    return <Badge className="border-0 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Resep Pasien</Badge>;
  }
  if (item.alasan.toLowerCase().includes("internal")) {
    return <Badge className="border-0 text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">Pemakaian Internal</Badge>;
  }
  const display = item.alasan.length > 22 ? item.alasan.slice(0, 22) + "…" : item.alasan;
  return <Badge className="border-0 text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{display}</Badge>;
}

// ─── Column definitions ───────────────────────────────────────────────────────

function buildColumns(): ColumnDef<StokKeluarItem>[] {
  return [
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: "Tanggal",
      size: 110,
      cell: ({ row }) => <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(row.original.createdAt)}</span>,
    },
    {
      id: "namaObat",
      accessorKey: "namaObat",
      header: "Nama Obat",
      cell: ({ row }) => <p className="text-sm font-medium text-foreground min-w-[140px] leading-snug">{row.original.namaObat}</p>,
    },
    {
      id: "batchNumber",
      accessorKey: "batchNumber",
      header: "Batch Diambil",
      cell: ({ row }) => (
        <div className="min-w-[130px]">
          <span className="font-mono text-xs text-foreground block">{row.original.batchNumber}</span>
          <span className="text-xs text-muted-foreground">ED: {formatDate(row.original.expiredDate)}</span>
        </div>
      ),
    },
    {
      id: "qty",
      accessorKey: "qty",
      header: "Qty",
      size: 70,
      cell: ({ row }) => <span className="text-sm font-semibold tabular-nums text-rose-600 dark:text-rose-400">-{row.original.qty.toLocaleString("id-ID")}</span>,
    },
    {
      id: "lokasiNama",
      accessorKey: "lokasiNama",
      header: "Lokasi",
      size: 90,
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.lokasiNama}</span>,
    },
    {
      id: "tujuan",
      header: "Tujuan",
      size: 140,
      cell: ({ row }) => <TujuanBadge item={row.original} />,
    },
    {
      id: "referenceId",
      header: "No. Referensi",
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.referenceId ?? "—"}</span>,
    },
  ];
}

// ─── FEFOBatchCard ────────────────────────────────────────────────────────────

function FEFOBatchCard({ obatId, batches, satuanNama }: { obatId: string; batches: BatchItem[]; satuanNama: string }) {
  const activeBatches = useMemo(() =>
    batches
      .filter((b) => b.obatId === obatId && b.status === "AKTIF" && b.qty > 0)
      .sort((a, b) => a.expiredDate.localeCompare(b.expiredDate)),
    [obatId, batches]
  );

  const totalStok = activeBatches.reduce((sum, b) => sum + b.qty, 0);
  const firstBatch = activeBatches[0];

  if (!firstBatch) {
    return (
      <div className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/10 px-4 py-3">
        <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">Tidak ada stok tersedia untuk obat ini</p>
      </div>
    );
  }

  const daysLeft = Math.ceil((new Date(firstBatch.expiredDate).getTime() - new Date(TODAY).getTime()) / (1000 * 60 * 60 * 24));
  const edColor = daysLeft < 0 ? "text-rose-700 dark:text-rose-400 font-semibold"
    : daysLeft < 7 ? "text-rose-600 dark:text-rose-400 font-semibold"
    : daysLeft < 30 ? "text-amber-600 dark:text-amber-400 font-medium"
    : "text-muted-foreground";

  return (
    <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Stok</span>
        <span className="text-sm font-semibold text-foreground tabular-nums">{totalStok.toLocaleString("id-ID")} {satuanNama.toLowerCase()}</span>
      </div>
      <Separator />
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-foreground">Batch terpilih (FEFO):</span>
          <Badge className="border-0 text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">ED terdekat</Badge>
        </div>
        <p className="font-mono text-sm font-semibold text-foreground">{firstBatch.batchNumber}</p>
        <p className={cn("text-xs", edColor)}>ED: {formatDate(firstBatch.expiredDate)}{daysLeft >= 0 && ` · ${daysLeft} hari lagi`}</p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Lokasi: {firstBatch.lokasiNama}</span>
          <span>Stok batch: {firstBatch.qty.toLocaleString("id-ID")} {satuanNama.toLowerCase()}</span>
        </div>
      </div>
      {activeBatches.length > 1 && (
        <>
          <Separator />
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Batch lainnya ({activeBatches.length - 1} batch):</p>
            {activeBatches.slice(1).map((b) => (
              <div key={b.id} className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-mono">{b.batchNumber}</span>
                <span>ED: {formatDate(b.expiredDate)} · {b.qty} {satuanNama.toLowerCase()}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── StokKeluarSheet ──────────────────────────────────────────────────────────

interface StokKeluarSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batches: BatchItem[];
  activeObat: ObatItem[];
  onSubmitDone: (namaObat: string, satuanNama: string, totalQty: number, newTotalStok: number) => void;
}

function StokKeluarSheet({ open, onOpenChange, batches, onSubmitDone, activeObat }: StokKeluarSheetProps) {
  const [obatPickerOpen, setObatPickerOpen] = useState(false);
  const [selectedObatId, setSelectedObatId] = useState("");
  const [qtyRaw, setQtyRaw] = useState("");
  const [tujuan, setTujuan] = useState<TujuanKeluar>("");
  const [noResep, setNoResep] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createStokKeluar = useCreateStokKeluar();

  useEffect(() => {
    if (!open) return;
    setObatPickerOpen(false);
    setSelectedObatId("");
    setQtyRaw("");
    setTujuan("");
    setNoResep("");
    setKeterangan("");
    setIsSubmitting(false);
    setErrors({});
  }, [open]);

  const qty = parseInt(qtyRaw, 10);
  const validQty = !isNaN(qty) && qty > 0;

  const selectedObat = useMemo(() => activeObat.find((o) => o.id === selectedObatId), [activeObat, selectedObatId]);
  const fefoResult = useMemo(() => {
    if (!selectedObatId || !validQty) return null;
    return fefoDeduct(selectedObatId, qty, batches);
  }, [selectedObatId, qty, batches, validQty]);

  const totalStok = useMemo(
    () => (selectedObatId ? getTotalStokObat(selectedObatId, batches) : 0),
    [selectedObatId, batches]
  );

  const stokSetelah = validQty ? totalStok - qty : null;
  const willBeLow = stokSetelah !== null && selectedObat !== undefined && stokSetelah >= 0 && stokSetelah < selectedObat.stokMinimal;

  const breakdownText = useMemo(() => {
    if (!fefoResult || fefoResult.deductions.length === 0) return null;
    if (fefoResult.deductions.length === 1) {
      const d = fefoResult.deductions[0];
      return `${d.qtyDiambil} dari Batch ${d.noBatch}`;
    }
    return fefoResult.deductions.map((d) => `${d.qtyDiambil} dari ${d.noBatch}`).join(" + ");
  }, [fefoResult]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!selectedObatId) errs.obat = "Pilih obat terlebih dahulu";
    if (!validQty) errs.qty = "Masukkan jumlah yang valid (> 0)";
    else if (fefoResult && !fefoResult.isEnough)
      errs.qty = `Stok tidak mencukupi (tersedia: ${fefoResult.totalAvailable} ${selectedObat?.satuan?.nama.toLowerCase() ?? "unit"})`;
    if (!tujuan) errs.tujuan = "Pilih tujuan pengeluaran";
    if (tujuan === "RESEP" && !noResep.trim())
      errs.noResep = "No. resep wajib diisi untuk tujuan Resep Pasien";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !fefoResult || !selectedObat) return;
    setIsSubmitting(true);

    const alasan =
      tujuan === "RESEP" ? "Resep pasien"
      : tujuan === "INTERNAL" ? "Pemakaian internal klinik"
      : keterangan || "Lain-lain";

    const referenceType: "RESEP" | "MANUAL" = tujuan === "RESEP" ? "RESEP" : "MANUAL";
    const totalQtyDeducted = fefoResult.deductions.reduce((sum, d) => sum + d.qtyDiambil, 0);
    const newTotalStok = totalStok - totalQtyDeducted;

    try {
      await createStokKeluar.mutateAsync(
        {
          tanggalKeluar: TODAY,
          tujuan,
          referenceId: tujuan === "RESEP" ? noResep.trim() : undefined,
          referenceType,
          catatan: keterangan.trim() || undefined,
          items: fefoResult.deductions.map((d) => ({
            obatId: selectedObatId,
            qty: d.qtyDiambil,
            batchId: d.batchId,
            lokasiId: d.lokasiId,
          })),
        },
        {
          onSuccess: () => {
            toast.success("Transaksi keluar berhasil dicatat", {
              description: `${selectedObat.nama} — ${totalQtyDeducted} ${selectedObat.satuan?.nama.toLowerCase()} dikeluarkan`,
            });
            if (newTotalStok < LOW_STOK_THRESHOLD) {
              toast.warning(`Stok ${selectedObat.nama} Menipis!`, {
                description: `Sisa stok: ${newTotalStok} ${selectedObat.satuan?.nama.toLowerCase()} — segera lakukan pemesanan ulang.`,
              });
            }
            onSubmitDone(selectedObat.nama, selectedObat.satuan?.nama ?? "unit", totalQtyDeducted, newTotalStok);
            onOpenChange(false);
          },
        }
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
        <SheetHeader className="px-5 pt-5 pb-4">
          <SheetTitle>Transaksi Stok Keluar</SheetTitle>
          <SheetDescription>Keluarkan stok menggunakan metode FEFO — batch dengan expired date terdekat diambil lebih dulu.</SheetDescription>
        </SheetHeader>

        <Separator />

        <ScrollArea className="flex-1">
          <form id="stok-keluar-form" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-5 px-5 py-5">

              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Section 1 — Pilih Obat</p>

              <FieldWrapper label="Obat" required error={errors.obat}>
                <Popover open={obatPickerOpen} onOpenChange={setObatPickerOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      role="combobox"
                      aria-expanded={obatPickerOpen}
                      className={cn(
                        "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs",
                        "hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        errors.obat && "border-destructive"
                      )}
                    >
                      <span className={cn("truncate", !selectedObat && "text-muted-foreground")}>
                        {selectedObat ? selectedObat.nama : "Cari nama atau kode obat..."}
                      </span>
                      <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Cari nama atau kode obat..." />
                      <CommandList>
                        <CommandEmpty>Obat tidak ditemukan</CommandEmpty>
                        <CommandGroup>
                          {activeObat.map((obat) => {
                            const stokObat = getTotalStokObat(obat.id, batches);
                            return (
                              <CommandItem
                                key={obat.id}
                                value={`${obat.nama} ${obat.kode} ${obat.kategori?.nama}`}
                                onSelect={() => {
                                  setSelectedObatId(obat.id);
                                  setQtyRaw("");
                                  setErrors({});
                                  setObatPickerOpen(false);
                                }}
                              >
                                <div className="flex flex-col flex-1 min-w-0">
                                  <span className="text-sm font-medium">{obat.nama}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {obat.kode} · {obat.kategori?.nama} · Stok: {stokObat.toLocaleString("id-ID")} {obat.satuan?.nama.toLowerCase()}
                                  </span>
                                </div>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </FieldWrapper>

              {selectedObat && (
                <FEFOBatchCard obatId={selectedObatId} batches={batches} satuanNama={selectedObat.satuan?.nama ?? "unit"} />
              )}

              <FieldWrapper
                label="Jumlah yang Diminta"
                htmlFor="sk-qty"
                required
                error={errors.qty}
                hint={selectedObat && !errors.qty
                  ? `Tersedia: ${totalStok.toLocaleString("id-ID")} ${selectedObat.satuan?.nama.toLowerCase() ?? "unit"}`
                  : undefined}
              >
                <div className="flex items-center gap-2">
                  <Input
                    id="sk-qty"
                    type="number"
                    min={1}
                    value={qtyRaw}
                    onChange={(e) => { setQtyRaw(e.target.value); if (errors.qty) setErrors((prev) => ({ ...prev, qty: "" })); }}
                    placeholder="0"
                    inputMode="numeric"
                    disabled={!selectedObatId}
                    className={cn("w-36 tabular-nums", errors.qty && "border-destructive")}
                  />
                  {selectedObat && <span className="text-sm text-muted-foreground">{selectedObat.satuan?.nama.toLowerCase() ?? "unit"}</span>}
                </div>
              </FieldWrapper>

              {fefoResult && fefoResult.deductions.length > 0 && (
                <div className={cn(
                  "rounded-md px-3 py-2.5 -mt-2 border",
                  fefoResult.isEnough
                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                    : "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800"
                )}>
                  <p className="text-xs font-medium text-foreground mb-1">
                    {fefoResult.isEnough ? "FEFO Breakdown:" : "FEFO Breakdown (stok tidak mencukupi):"}
                  </p>
                  <p className={cn("text-xs font-mono leading-relaxed", fefoResult.isEnough ? "text-emerald-700 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                    {breakdownText}
                  </p>
                </div>
              )}

              {willBeLow && fefoResult?.isEnough && stokSetelah !== null && (
                <div className="flex items-start gap-2 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2.5 -mt-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Stok akan menipis setelah transaksi ini (sisa: <strong>{stokSetelah}</strong> {selectedObat?.satuan?.nama.toLowerCase()})
                  </p>
                </div>
              )}

              <Separator />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Section 2 — Detail Transaksi</p>

              <FieldWrapper label="Tujuan" htmlFor="sk-tujuan" required error={errors.tujuan}>
                <Select value={tujuan} onValueChange={(v) => { setTujuan(v as TujuanKeluar); if (errors.tujuan) setErrors((prev) => ({ ...prev, tujuan: "" })); }}>
                  <SelectTrigger id="sk-tujuan" className={cn(errors.tujuan && "border-destructive")}>
                    <SelectValue placeholder="Pilih tujuan pengeluaran..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RESEP">Resep Pasien</SelectItem>
                    <SelectItem value="INTERNAL">Pemakaian Internal</SelectItem>
                    <SelectItem value="LAIN">Lain-lain</SelectItem>
                  </SelectContent>
                </Select>
              </FieldWrapper>

              {tujuan === "RESEP" && (
                <FieldWrapper label="No. Resep" htmlFor="sk-no-resep" required error={errors.noResep} hint="Contoh: RES-2026-0530-001">
                  <Input
                    id="sk-no-resep"
                    value={noResep}
                    onChange={(e) => { setNoResep(e.target.value.toUpperCase()); if (errors.noResep) setErrors((prev) => ({ ...prev, noResep: "" })); }}
                    placeholder="No. resep..."
                    className={cn("font-mono", errors.noResep && "border-destructive")}
                  />
                </FieldWrapper>
              )}

              <FieldWrapper label="Keterangan" htmlFor="sk-keterangan" hint="Opsional — catatan tambahan atau alasan pengeluaran">
                <Textarea
                  id="sk-keterangan"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder={tujuan === "LAIN" ? "Jelaskan alasan pengeluaran stok..." : "Catatan tambahan..."}
                  rows={3}
                />
              </FieldWrapper>
            </div>
          </form>
        </ScrollArea>

        <Separator />

        <SheetFooter className="px-5 py-4 gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button type="submit" form="stok-keluar-form" disabled={isSubmitting || createStokKeluar.isPending} className="min-w-[140px]">
            {(isSubmitting || createStokKeluar.isPending) ? "Menyimpan..." : "Konfirmasi Keluar"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StokKeluarPage() {
  const { data: obatResponse } = useObatList({ isActive: true, limit: 100 });
  const activeObat = obatResponse?.data ?? [];

  const { data: batchResponse } = useBatchList({ status: "AKTIF", limit: 500 });
  const batches: BatchItem[] = batchResponse?.data ?? [];

  const { data: listResponse, isLoading } = useStokKeluarList({ limit: 100 });
  const { data: statsData } = useStokKeluarStats();
  const transactions: StokKeluarItem[] = listResponse?.data ?? [];

  const [sheetOpen, setSheetOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterTanggal, setFilterTanggal] = useState("");
  const [filterTujuan, setFilterTujuan] = useState("semua");

  // Stats — prefer API, fallback to computed from today's transactions
  const statsHariIni = useMemo(() => {
    if (statsData) {
      return {
        transaksi: statsData.todayCount,
        totalQty: statsData.todayQty,
        totalNilai: statsData.todayNilai,
      };
    }
    const todayTx = transactions.filter((t) => t.createdAt.startsWith(TODAY));
    const totalQty = todayTx.reduce((sum, t) => sum + t.qty, 0);
    const totalNilai = todayTx.reduce((sum, t) => {
      const obat = activeObat.find((o) => o.id === t.obatId);
      return sum + (parseFloat(obat?.hargaJual ?? "0") || 0) * t.qty;
    }, 0);
    return { transaksi: todayTx.length, totalQty, totalNilai };
  }, [statsData, transactions, activeObat]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch =
        !search ||
        t.namaObat.toLowerCase().includes(search.toLowerCase()) ||
        t.batchNumber.toLowerCase().includes(search.toLowerCase()) ||
        (t.lokasiNama?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        t.alasan.toLowerCase().includes(search.toLowerCase()) ||
        (t.referenceId?.toLowerCase().includes(search.toLowerCase()) ?? false);

      const matchTanggal = !filterTanggal || t.createdAt.startsWith(filterTanggal);
      const matchTujuan =
        filterTujuan === "semua" ||
        (filterTujuan === "resep" && t.referenceType === "RESEP") ||
        (filterTujuan === "manual" && t.referenceType === "MANUAL");

      return matchSearch && matchTanggal && matchTujuan;
    });
  }, [transactions, search, filterTanggal, filterTujuan]);

  const hasActiveFilter = search || filterTanggal || filterTujuan !== "semua";

  function handleReset() {
    setSearch("");
    setFilterTanggal("");
    setFilterTujuan("semua");
  }

  const columns = useMemo(() => buildColumns(), []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Stok Keluar (FEFO)"
        description="Catat pengeluaran stok obat — sistem otomatis memilih batch dengan expired date terdekat"
        actions={
          <Button onClick={() => setSheetOpen(true)} size="action">
            <PlusCircle className="h-4 w-4" />
            Transaksi Keluar
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Transaksi Hari Ini" value={statsHariIni.transaksi} icon={PackageMinus} variant="default" subtitle="Total transaksi keluar" />
        <StatsCard title="Total Qty Keluar" value={`${statsHariIni.totalQty.toLocaleString("id-ID")} unit`} icon={TrendingDown} variant={statsHariIni.totalQty > 0 ? "warning" : "default"} subtitle="Unit dikeluarkan hari ini" />
        <StatsCard title="Nilai Keluar" value={formatRupiahShort(statsHariIni.totalNilai)} icon={PackageMinus} variant="danger" subtitle="Estimasi nilai stok keluar" />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Cari obat, batch, atau referensi"
            placeholder="Cari obat, batch, referensi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="relative">
          <CalendarIcon className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input type="date" value={filterTanggal} onChange={(e) => setFilterTanggal(e.target.value)} className="pl-8 w-[160px]" aria-label="Filter tanggal" />
        </div>
        <Select value={filterTujuan} onValueChange={setFilterTujuan}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Semua Tujuan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Tujuan</SelectItem>
            <SelectItem value="resep">Resep Pasien</SelectItem>
            <SelectItem value="manual">Manual / Internal</SelectItem>
          </SelectContent>
        </Select>
        {hasActiveFilter && (
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset filter
          </Button>
        )}
      </div>

      <DataTable columns={columns} data={filtered} pageSize={10} isLoading={isLoading} />

      <StokKeluarSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        batches={batches}
        activeObat={activeObat}
        onSubmitDone={() => {}}
      />
    </div>
  );
}
