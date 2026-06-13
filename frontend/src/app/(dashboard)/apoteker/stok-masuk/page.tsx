"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type ColumnDef } from "@tanstack/react-table";
import {
  AlertTriangle,
  CalendarIcon,
  ChevronsUpDown,
  PackagePlus,
  PlusCircle,
  RotateCcw,
  Search,
  Truck,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { useLokasiGudangList } from "@/hooks/queries/use-lokasi-gudang";
import type { LokasiGudang } from "@/types/inventory";
import { useObatList } from "@/hooks/queries/use-obat";
import { useSupplierList } from "@/hooks/queries/use-supplier";
import { useStokMasukList, useStokMasukStats, useCreateStokMasuk } from "@/hooks/queries/use-stok-masuk";
import type { ObatItem } from "@/services/obat.service";
import type { StokMasukItem, StokMasukSumber } from "@/services/stok-masuk.service";
import {
  SUMBER_LABEL,
  SUMBER_MANUAL_OPTIONS,
} from "@/services/stok-masuk.service";
import {
  stokMasukManualSchema,
  type StokMasukManualFormValues,
} from "@/lib/validations/inventory";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split("T")[0];
const SIX_MONTHS = new Date();
SIX_MONTHS.setMonth(SIX_MONTHS.getMonth() + 6);
const SIX_MONTHS_STR = SIX_MONTHS.toISOString().split("T")[0];

function flattenLokasi(nodes: LokasiGudang[]): LokasiGudang[] {
  return nodes.flatMap((n) => [n, ...(n.children ? flattenLokasi(n.children) : [])]);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const months = [
    "Jan","Feb","Mar","Apr","Mei","Jun",
    "Jul","Ags","Sep","Okt","Nov","Des",
  ];
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} ${months[m - 1]} ${y}`;
}

function getEdDaysLeft(expiredDate: string): number {
  const today = new Date(TODAY);
  const ed = new Date(expiredDate);
  return Math.ceil((ed.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getEdVariant(expiredDate: string): "ok" | "warning" | "critical" | "expired" {
  const days = getEdDaysLeft(expiredDate);
  if (days < 0) return "expired";
  if (days < 7) return "critical";
  if (days < 30) return "warning";
  return "ok";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldWrapper({
  label,
  required,
  error,
  hint,
  children,
  className,
  htmlFor,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground leading-none">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function SumberBadge({ sumber }: { sumber: StokMasukSumber }) {
  const styles: Record<StokMasukSumber, string> = {
    GR: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    PEMBELIAN_REGULAR: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    DONASI: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    HIBAH: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    KOREKSI: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  };
  return (
    <Badge className={cn("border-0 text-xs font-medium", styles[sumber])}>
      {SUMBER_LABEL[sumber]}
    </Badge>
  );
}

function EdBadge({ expiredDate }: { expiredDate: string }) {
  const variant = getEdVariant(expiredDate);
  const styles: Record<typeof variant, string> = {
    ok: "text-muted-foreground",
    warning: "text-amber-600 dark:text-amber-400 font-medium",
    critical: "text-rose-600 dark:text-rose-400 font-semibold",
    expired: "text-rose-700 dark:text-rose-400 font-semibold line-through",
  };
  return (
    <span className={cn("text-xs whitespace-nowrap", styles[variant])}>
      {formatDate(expiredDate)}
    </span>
  );
}

// ─── Column definitions ───────────────────────────────────────────────────────

function buildColumns(): ColumnDef<StokMasukItem>[] {
  return [
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: "Tanggal",
      size: 120,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "namaObat",
      accessorKey: "namaObat",
      header: "Nama Obat",
      cell: ({ row }) => (
        <div className="min-w-[160px]">
          <p className="text-sm font-medium text-foreground leading-snug">
            {row.original.namaObat}
          </p>
          <p className="text-xs text-muted-foreground">
            {row.original.kategoriNama} · {row.original.satuanNama}
          </p>
        </div>
      ),
    },
    {
      id: "batchNumber",
      accessorKey: "batchNumber",
      header: "No. Batch",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-foreground">
          {row.original.batchNumber}
        </span>
      ),
    },
    {
      id: "qty",
      accessorKey: "qty",
      header: "Qty",
      size: 80,
      cell: ({ row }) => (
        <span className="text-sm font-medium tabular-nums">
          {row.original.qty.toLocaleString("id-ID")}
        </span>
      ),
    },
    {
      id: "expiredDate",
      accessorKey: "expiredDate",
      header: "Expired",
      size: 110,
      cell: ({ row }) => <EdBadge expiredDate={row.original.expiredDate} />,
    },
    {
      id: "sumber",
      accessorKey: "sumber",
      header: "Sumber",
      size: 130,
      cell: ({ row }) => <SumberBadge sumber={row.original.sumber} />,
    },
    {
      id: "lokasiNama",
      accessorKey: "lokasiNama",
      header: "Lokasi",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.lokasiNama}
        </span>
      ),
    },
    {
      id: "createdBy",
      accessorKey: "createdBy",
      header: "User",
      size: 90,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.original.createdBy}</span>
      ),
    },
  ];
}

// ─── StokMasukSheet ───────────────────────────────────────────────────────────

interface StokMasukSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeObat: ObatItem[];
  activeSuppliers: { id: string; nama: string }[];
  onDone: (namaObat: string, qty: number, lokasiNama?: string) => void;
}

function StokMasukSheet({
  open,
  onOpenChange,
  activeObat,
  activeSuppliers,
  onDone,
}: StokMasukSheetProps) {
  const [obatOpen, setObatOpen] = useState(false);
  const createStokMasuk = useCreateStokMasuk();

  const { data: lokasiResponseSheet } = useLokasiGudangList();
  const flatLokasi = useMemo(
    () => flattenLokasi(lokasiResponseSheet ?? []),
    [lokasiResponseSheet]
  );
  const selectableLokasi = useMemo(
    () => flatLokasi.filter((l) => l.tipe === "RAK" || l.tipe === "LACI"),
    [flatLokasi]
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StokMasukManualFormValues>({
    resolver: zodResolver(stokMasukManualSchema) as Resolver<StokMasukManualFormValues>,
    defaultValues: {
      obatId: "",
      batchNumber: "",
      tglProduksi: "",
      expiredDate: "",
      qty: undefined as unknown as number,
      lokasiId: "",
      supplierId: "",
      sumber: undefined as unknown as "PEMBELIAN_REGULAR",
      keterangan: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      obatId: "",
      batchNumber: "",
      tglProduksi: "",
      expiredDate: "",
      qty: undefined as unknown as number,
      lokasiId: "",
      supplierId: "",
      sumber: undefined as unknown as "PEMBELIAN_REGULAR",
      keterangan: "",
    });
    setObatOpen(false);
  }, [open, reset]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const watchedObatId = watch("obatId");
  const watchedExpiredDate = watch("expiredDate");
  const watchedLokasiId = watch("lokasiId");
  const watchedQty = watch("qty");
  const watchedBatchNumber = watch("batchNumber");

  const selectedObat = useMemo(
    () => activeObat.find((o) => o.id === watchedObatId),
    [activeObat, watchedObatId]
  );

  const selectedLokasi = useMemo(
    () => flatLokasi.find((l) => l.id === watchedLokasiId),
    [watchedLokasiId, flatLokasi]
  );

  const remainingCapacity = useMemo(() => {
    if (!selectedLokasi) return null;
    return (selectedLokasi.kapasitas ?? 0) - (selectedLokasi.terpakai ?? 0);
  }, [selectedLokasi]);

  const edWarning = useMemo(() => {
    if (!watchedExpiredDate) return null;
    if (watchedExpiredDate <= TODAY) return null;
    if (watchedExpiredDate < SIX_MONTHS_STR) {
      const days = getEdDaysLeft(watchedExpiredDate);
      return `ED kurang dari 6 bulan dari sekarang (${days} hari lagi)`;
    }
    return null;
  }, [watchedExpiredDate]);

  const capacityWarning = useMemo(() => {
    if (remainingCapacity === null || !watchedQty) return null;
    if (watchedQty > remainingCapacity) {
      return `Qty melebihi sisa kapasitas lokasi (sisa: ${remainingCapacity})`;
    }
    return null;
  }, [remainingCapacity, watchedQty]);

  const onSubmit = useCallback(async (values: StokMasukManualFormValues) => {
    if (!values.obatId || !selectedObat) return;

    if (values.expiredDate <= TODAY) return;
    if (capacityWarning) return;

    await createStokMasuk.mutateAsync(
      {
        supplierId: values.supplierId || undefined,
        tanggalMasuk: TODAY,
        sumber: values.sumber as StokMasukSumber,
        catatan: values.keterangan || undefined,
        items: [
          {
            obatId: values.obatId,
            qty: values.qty,
            expiredDate: values.expiredDate,
            tglProduksi: values.tglProduksi || undefined,
            batchNumber: values.batchNumber,
            lokasiId: values.lokasiId,
          },
        ],
      },
      {
        onSuccess: () => {
          const lokasi = selectableLokasi.find((l) => l.id === values.lokasiId);
          toast.success("Stok manual berhasil dicatat", {
            description: `${selectedObat.nama} — ${values.qty} unit masuk ke ${lokasi?.nama ?? values.lokasiId}`,
          });
          onDone(selectedObat.nama, values.qty, lokasi?.nama);
          onOpenChange(false);
        },
      }
    );
  }, [createStokMasuk, capacityWarning, selectedObat, onDone, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg flex flex-col gap-0 p-0"
      >
        <SheetHeader className="px-5 pt-5 pb-4">
          <SheetTitle>Input Stok Manual</SheetTitle>
          <SheetDescription>
            Catat penerimaan stok di luar proses PO/GR. Kolom bertanda * wajib diisi.
          </SheetDescription>
        </SheetHeader>

        <Separator />

        <ScrollArea className="flex-1">
          <form id="stok-masuk-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-5 px-5 py-5">

              {/* Pilih Obat */}
              <FieldWrapper label="Obat" required error={errors.obatId?.message}>
                <Controller
                  control={control}
                  name="obatId"
                  render={({ field }) => (
                    <Popover open={obatOpen} onOpenChange={setObatOpen}>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          role="combobox"
                          aria-expanded={obatOpen}
                          aria-label="Pilih obat"
                          className={cn(
                            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs ring-offset-background",
                            "hover:bg-accent hover:text-accent-foreground",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                            errors.obatId && "border-destructive"
                          )}
                        >
                          <span className={cn("truncate", !field.value && "text-muted-foreground")}>
                            {field.value
                              ? activeObat.find((o) => o.id === field.value)?.nama
                              : "Pilih obat..."}
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
                              {activeObat.map((obat) => (
                                <CommandItem
                                  key={obat.id}
                                  value={`${obat.nama} ${obat.kode} ${obat.kategori?.nama}`}
                                  onSelect={() => {
                                    field.onChange(obat.id);
                                    setValue("lokasiId", obat.lokasiDefaultId ?? "");
                                    setObatOpen(false);
                                  }}
                                >
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">{obat.nama}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {obat.kode} · {obat.kategori?.nama}
                                    </span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                />
              </FieldWrapper>

              {/* Nomor Batch */}
              <FieldWrapper
                label="Nomor Batch"
                htmlFor="sm-batch"
                required
                error={errors.batchNumber?.message}
                hint="Contoh: BT2026-AMX001"
              >
                <Input
                  id="sm-batch"
                  placeholder="Nomor batch sesuai kemasan"
                  className={cn("font-mono uppercase", errors.batchNumber && "border-destructive")}
                  aria-invalid={!!errors.batchNumber}
                  onChange={(e) => setValue("batchNumber", e.target.value.toUpperCase())}
                  value={watchedBatchNumber}
                />
              </FieldWrapper>

              {/* Tgl Produksi + Expired Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldWrapper label="Tgl. Produksi" htmlFor="sm-tgl-prod" error={errors.tglProduksi?.message}>
                  <Input id="sm-tgl-prod" {...register("tglProduksi")} type="date" max={TODAY} />
                </FieldWrapper>

                <FieldWrapper label="Expired Date" htmlFor="sm-expired" required error={errors.expiredDate?.message}>
                  <Input
                    id="sm-expired"
                    {...register("expiredDate")}
                    type="date"
                    min={TODAY}
                    aria-invalid={!!errors.expiredDate}
                    className={cn(
                      watchedExpiredDate && watchedExpiredDate <= TODAY && "border-destructive"
                    )}
                  />
                </FieldWrapper>
              </div>

              {/* ED warning */}
              {edWarning && (
                <div className="flex items-start gap-2 rounded-md bg-amber-50 dark:bg-amber-900/20 px-3 py-2.5 -mt-3">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">{edWarning}</p>
                </div>
              )}

              {/* Jumlah */}
              <FieldWrapper label="Jumlah" htmlFor="sm-qty" required error={errors.qty?.message}>
                <Input
                  id="sm-qty"
                  {...register("qty", { valueAsNumber: true })}
                  type="number"
                  min={1}
                  placeholder="0"
                  inputMode="numeric"
                  aria-invalid={!!errors.qty}
                />
              </FieldWrapper>

              {/* Lokasi */}
              <FieldWrapper
                label="Lokasi Penyimpanan"
                htmlFor="sm-lokasi"
                required
                error={errors.lokasiId?.message}
                hint={
                  selectedLokasi
                    ? `Sisa kapasitas: ${remainingCapacity} unit`
                    : "Pilih rak atau laci tujuan"
                }
              >
                <Controller
                  control={control}
                  name="lokasiId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="sm-lokasi"
                        className={cn(errors.lokasiId && "border-destructive")}
                      >
                        <SelectValue placeholder="Pilih lokasi..." />
                      </SelectTrigger>
                      <SelectContent>
                        {selectableLokasi.map((lokasi) => {
                          const remaining = (lokasi.kapasitas ?? 0) - (lokasi.terpakai ?? 0);
                          const isFull = remaining <= 0;
                          return (
                            <SelectItem key={lokasi.id} value={lokasi.id} disabled={isFull}>
                              <div className="flex flex-col">
                                <span>{lokasi.nama}</span>
                                <span className={cn("text-xs", isFull ? "text-destructive" : remaining < 20 ? "text-amber-500" : "text-muted-foreground")}>
                                  {isFull ? "Penuh" : `Sisa: ${remaining} unit`}
                                </span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FieldWrapper>

              {/* Supplier */}
              <FieldWrapper label="Supplier" htmlFor="sm-supplier" hint="Opsional — isi jika berasal dari supplier">
                <Controller
                  control={control}
                  name="supplierId"
                  render={({ field }) => (
                    <Select value={field.value ?? ""} onValueChange={(v) => field.onChange(v === "_none" ? "" : v)}>
                      <SelectTrigger id="sm-supplier">
                        <SelectValue placeholder="Tidak ada / tidak diketahui" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">— Tidak ada / tidak diketahui —</SelectItem>
                        {activeSuppliers.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.nama}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FieldWrapper>

              {/* Sumber */}
              <FieldWrapper label="Sumber" htmlFor="sm-sumber" required error={errors.sumber?.message}>
                <Controller
                  control={control}
                  name="sumber"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="sm-sumber" className={cn(errors.sumber && "border-destructive")}>
                        <SelectValue placeholder="Pilih sumber stok..." />
                      </SelectTrigger>
                      <SelectContent>
                        {SUMBER_MANUAL_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FieldWrapper>

              {/* Keterangan */}
              <FieldWrapper
                label="Keterangan"
                htmlFor="sm-keterangan"
                hint="Opsional — catatan tambahan atau nomor referensi dokumen"
              >
                <Textarea
                  id="sm-keterangan"
                  {...register("keterangan")}
                  placeholder="Contoh: Donasi dari Dinas Kesehatan Kota, no. surat SH/2026/001"
                  rows={3}
                />
              </FieldWrapper>
            </div>
          </form>
        </ScrollArea>

        <Separator />

        <SheetFooter className="px-5 py-4 gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            type="submit"
            form="stok-masuk-form"
            disabled={isSubmitting || createStokMasuk.isPending}
            className="min-w-[120px]"
          >
            {(isSubmitting || createStokMasuk.isPending) ? "Menyimpan..." : "Simpan Stok"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StokMasukPage() {
  const { data: obatResponse }   = useObatList({ isActive: true, limit: 100 });
  const { data: lokasiResponse } = useLokasiGudangList();
  const activeObat = obatResponse?.data ?? [];

  const flatLokasi = useMemo(
    () => flattenLokasi(lokasiResponse ?? []),
    [lokasiResponse]
  );
  const selectableLokasi = useMemo(
    () => flatLokasi.filter((l) => l.tipe === "RAK" || l.tipe === "LACI"),
    [flatLokasi]
  );

  const { data: supplierResponse } = useSupplierList({ isActive: true, limit: 100 });
  const activeSuppliers = supplierResponse?.data ?? [];

  const { data: listResponse, isLoading } = useStokMasukList({ limit: 100 });
  const { data: statsData } = useStokMasukStats();

  const items: StokMasukItem[] = listResponse?.data ?? [];

  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("semua");
  const [search, setSearch] = useState("");
  const [filterTanggal, setFilterTanggal] = useState("");
  const [filterSumber, setFilterSumber] = useState("semua");

  // Stats — prefer API stats, fallback to computed
  const stats = useMemo(() => ({
    total: statsData?.total ?? items.length,
    fromGR: statsData?.fromGR ?? items.filter((i) => i.sumber === "GR").length,
    manual: statsData?.manual ?? items.filter((i) => i.sumber !== "GR").length,
  }), [statsData, items]);

  // Filtered data
  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchTab =
        activeTab === "semua" ||
        (activeTab === "gr" && item.sumber === "GR") ||
        (activeTab === "manual" && item.sumber !== "GR");

      const matchSearch =
        !search ||
        item.namaObat.toLowerCase().includes(search.toLowerCase()) ||
        item.batchNumber.toLowerCase().includes(search.toLowerCase()) ||
        (item.lokasiNama?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        (item.supplierNama?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        item.createdBy.toLowerCase().includes(search.toLowerCase());

      const matchTanggal = !filterTanggal || item.createdAt.startsWith(filterTanggal);
      const matchSumber = filterSumber === "semua" || item.sumber === filterSumber;

      return matchTab && matchSearch && matchTanggal && matchSumber;
    });
  }, [items, activeTab, search, filterTanggal, filterSumber]);

  const hasActiveFilter = search || filterTanggal || filterSumber !== "semua";

  function handleReset() {
    setSearch("");
    setFilterTanggal("");
    setFilterSumber("semua");
  }

  const tabCounts = useMemo(() => ({
    semua: items.length,
    gr: items.filter((i) => i.sumber === "GR").length,
    manual: items.filter((i) => i.sumber !== "GR").length,
  }), [items]);

  const columns = useMemo(() => buildColumns(), []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Stok Masuk"
        description="Riwayat penerimaan stok obat dari proses GR maupun input manual"
        actions={
          <Button onClick={() => setSheetOpen(true)} size="action">
            <PlusCircle className="h-4 w-4" />
            Input Stok Manual
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Total Penerimaan" value={stats.total} icon={PackagePlus} variant="default" subtitle="Semua sumber stok masuk" />
        <StatsCard title="Dari Good Receipt" value={stats.fromGR} icon={Truck} variant="success" subtitle="Terintegrasi proses PO/GR" />
        <StatsCard title="Input Manual" value={stats.manual} icon={PackagePlus} variant={stats.manual > 0 ? "warning" : "default"} subtitle="Donasi, hibah, koreksi, dll." />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="semua">
            Riwayat Stok Masuk
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums">{tabCounts.semua}</span>
          </TabsTrigger>
          <TabsTrigger value="gr">
            Dari GR
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums">{tabCounts.gr}</span>
          </TabsTrigger>
          <TabsTrigger value="manual">
            Manual
            <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums">{tabCounts.manual}</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Cari obat, batch, atau lokasi"
            placeholder="Cari obat, batch, lokasi..."
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

        <Select value={filterSumber} onValueChange={setFilterSumber}>
          <SelectTrigger className="w-[175px]">
            <SelectValue placeholder="Semua Sumber" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Sumber</SelectItem>
            <SelectItem value="GR">Dari GR</SelectItem>
            <SelectItem value="PEMBELIAN_REGULAR">Pembelian Regular</SelectItem>
            <SelectItem value="DONASI">Donasi</SelectItem>
            <SelectItem value="HIBAH">Hibah</SelectItem>
            <SelectItem value="KOREKSI">Koreksi</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilter && (
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground gap-1.5">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset filter
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        pageSize={10}
        isLoading={isLoading}
      />

      <StokMasukSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        activeObat={activeObat}
        activeSuppliers={activeSuppliers}
        onDone={() => {}}
      />
    </div>
  );
}
