"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  AlertTriangle,
  ChevronsUpDown,
  Clock,
  ImageIcon,
  Loader2,
  PackageX,
  PlusCircle,
  Upload,
  X,
} from "lucide-react";

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
import { useObatList } from "@/hooks/queries/use-obat";
import {
  useDefektaList,
  useDefektaStats,
  useCreateDefekta,
} from "@/hooks/queries/use-defekta";
import { useBatchList } from "@/hooks/queries/use-batch";
import {
  ALASAN_LABEL,
  type DefektaItem,
  type AlasanDefekta,
  type StatusDefekta,
  type CreateDefektaDto,
} from "@/services/defekta.service";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} ${months[m - 1]} ${y}`;
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

// ─── Column definitions ───────────────────────────────────────────────────────

function buildColumns(): ColumnDef<DefektaItem>[] {
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
        return (
          <div className="min-w-[120px]">
            <span className="font-mono text-xs text-foreground block">{noBatch}</span>
            <span className="text-xs text-muted-foreground">
              {row.original.batchAllocations?.[0]?.expiredDate
                ? `ED: ${formatDate(row.original.batchAllocations[0].expiredDate)}`
                : ""}
            </span>
          </div>
        );
      },
    },
    {
      id: "alasan", header: "Jenis", size: 130,
      cell: ({ row }) => <AlasanBadge alasan={row.original.alasan} />,
    },
    {
      id: "qty", header: "Qty", size: 70,
      cell: ({ row }) => <span className="text-sm font-semibold tabular-nums text-foreground">{row.original.qty.toLocaleString("id-ID")}</span>,
    },
    {
      id: "foto", header: "Foto", size: 60,
      cell: ({ row }) => (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <ImageIcon className="h-3.5 w-3.5" />
          <span>{row.original.fotoUrl ? 1 : 0}</span>
        </div>
      ),
    },
    {
      id: "status", header: "Status", size: 130,
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
  ];
}

// ─── FieldWrapper ──────────────────────────────────────────────────────────────

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
        : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

// ─── FotoUploadZone ───────────────────────────────────────────────────────────

function FotoUploadZone({
  fotoUrl, onSet, onRemove, error,
}: {
  fotoUrl: string | null;
  onSet: (url: string) => void;
  onRemove: () => void;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onSet(url);
    e.target.value = "";
  }

  return (
    <div className="space-y-2">
      {fotoUrl ? (
        <div className="relative aspect-video rounded-md overflow-hidden border border-border bg-muted group max-w-xs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fotoUrl} alt="Foto bukti" className="h-full w-full object-cover" />
          <button type="button" onClick={onRemove}
            className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Hapus foto"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()}
          className={cn(
            "aspect-video max-w-xs w-full rounded-md border-2 border-dashed flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:bg-muted/50 transition-colors",
            error ? "border-destructive bg-destructive/5" : "border-border bg-muted/20"
          )}
        >
          <Upload className="h-5 w-5" />
          <span className="text-xs font-medium">Tambah Foto Bukti</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ─── DefektaSheet ─────────────────────────────────────────────────────────────

const ALASAN_OPTIONS: { value: AlasanDefekta; label: string }[] = [
  { value: "rusak",       label: "Rusak Fisik" },
  { value: "expired",     label: "Kadaluarsa" },
  { value: "salah_simpan",label: "Salah Simpan" },
  { value: "lainnya",     label: "Lainnya" },
];

function DefektaSheet({
  open, onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: obatResponse } = useObatList({ isActive: true, limit: 100 });
  const activeObat = obatResponse?.data ?? [];

  const [obatPickerOpen, setObatPickerOpen] = useState(false);
  const [selectedObatId, setSelectedObatId] = useState("");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [alasan, setAlasan] = useState<AlasanDefekta | "">("");
  const [qtyRaw, setQtyRaw] = useState("");
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [catatan, setCatatan] = useState("");
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().split("T")[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateDefekta();

  const { data: batchResponse } = useBatchList(
    selectedObatId ? { obatId: selectedObatId, onlyAvailable: true, limit: 50 } : undefined
  );
  const obatBatches = batchResponse?.data ?? [];

  const selectedObat = useMemo(() => activeObat.find((o) => o.id === selectedObatId), [activeObat, selectedObatId]);
  const selectedBatch = useMemo(() => obatBatches.find((b) => b.id === selectedBatchId), [obatBatches, selectedBatchId]);

  useEffect(() => {
    if (!open) {
      setObatPickerOpen(false);
      setSelectedObatId("");
      setSelectedBatchId("");
      setAlasan("");
      setQtyRaw("");
      setFotoUrl(null);
      setCatatan("");
      setTanggal(new Date().toISOString().split("T")[0]);
      setErrors({});
    }
  }, [open]);

  const qty = parseInt(qtyRaw, 10);
  const validQty = !isNaN(qty) && qty > 0;

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!selectedObatId) errs.obat = "Pilih obat terlebih dahulu";
    if (!alasan) errs.alasan = "Pilih jenis kerusakan";
    if (!validQty) errs.qty = "Masukkan jumlah yang valid (> 0)";
    else if (selectedBatch && qty > selectedBatch.qtyTersedia)
      errs.qty = `Melebihi stok batch (tersedia: ${selectedBatch.qtyTersedia})`;
    if (!tanggal) errs.tanggal = "Tanggal wajib diisi";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const payload: CreateDefektaDto = {
      obatId: selectedObatId,
      qty,
      noBatch: selectedBatch?.noBatch,
      alasan: alasan as AlasanDefekta,
      tanggal,
      catatan: catatan.trim() || undefined,
      fotoUrl: fotoUrl ?? undefined,
    };

    await createMutation.mutateAsync(payload);
    if (!createMutation.isError) {
      onOpenChange(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col gap-0 p-0">
        <SheetHeader className="px-5 pt-5 pb-4">
          <SheetTitle>Lapor Defekta</SheetTitle>
          <SheetDescription>
            Laporkan obat rusak atau kadaluarsa untuk ditinjau Admin.
          </SheetDescription>
        </SheetHeader>
        <Separator />
        <ScrollArea className="flex-1">
          <form id="defekta-form" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-5 px-5 py-5">

              {/* Tanggal */}
              <FieldWrapper label="Tanggal Kejadian" htmlFor="dfk-tanggal" required error={errors.tanggal}>
                <Input id="dfk-tanggal" type="date" value={tanggal} max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setTanggal(e.target.value)}
                  className={cn(errors.tanggal && "border-destructive")} />
              </FieldWrapper>

              {/* Pilih Obat */}
              <FieldWrapper label="Obat" required error={errors.obat}>
                <Popover open={obatPickerOpen} onOpenChange={setObatPickerOpen}>
                  <PopoverTrigger asChild>
                    <button type="button" role="combobox" aria-expanded={obatPickerOpen}
                      className={cn(
                        "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs",
                        "hover:bg-accent hover:text-accent-foreground",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
                      <CommandInput placeholder="Cari obat..." />
                      <CommandList>
                        <CommandEmpty>Obat tidak ditemukan</CommandEmpty>
                        <CommandGroup>
                          {activeObat.map((obat) => (
                            <CommandItem key={obat.id} value={`${obat.nama} ${obat.kode}`}
                              onSelect={() => { setSelectedObatId(obat.id); setSelectedBatchId(""); setErrors({}); setObatPickerOpen(false); }}
                            >
                              <div className="flex flex-col flex-1 min-w-0">
                                <span className="text-sm font-medium">{obat.nama}</span>
                                <span className="text-xs text-muted-foreground">{obat.kode} · {obat.kategori?.nama}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </FieldWrapper>

              {/* Pilih Batch (opsional) */}
              <FieldWrapper label="Batch" htmlFor="dfk-batch" error={errors.batch}
                hint={!selectedObatId ? "Pilih obat dulu" : obatBatches.length === 0 ? "Tidak ada batch aktif" : undefined}
              >
                <Select value={selectedBatchId} onValueChange={setSelectedBatchId}
                  disabled={!selectedObatId || obatBatches.length === 0}
                >
                  <SelectTrigger id="dfk-batch">
                    <SelectValue placeholder="Pilih batch (opsional)..." />
                  </SelectTrigger>
                  <SelectContent>
                    {obatBatches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        <div className="flex flex-col">
                          <span className="font-mono text-sm">{b.noBatch}</span>
                          <span className="text-xs text-muted-foreground">
                            {b.expiredDate ? `ED: ${formatDate(b.expiredDate)}` : ""} · Stok: {b.qtyTersedia}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldWrapper>

              {/* Jenis Kerusakan */}
              <FieldWrapper label="Jenis Kerusakan" htmlFor="dfk-alasan" required error={errors.alasan}>
                <Select value={alasan} onValueChange={(v) => { setAlasan(v as AlasanDefekta); if (errors.alasan) setErrors((p) => ({ ...p, alasan: "" })); }}>
                  <SelectTrigger id="dfk-alasan" className={cn(errors.alasan && "border-destructive")}>
                    <SelectValue placeholder="Pilih jenis kerusakan..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ALASAN_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldWrapper>

              {/* Jumlah */}
              <FieldWrapper label="Jumlah yang Defekta" htmlFor="dfk-qty" required error={errors.qty}
                hint={selectedBatch && !errors.qty ? `Stok batch: ${selectedBatch.qtyTersedia} ${selectedObat?.satuan?.nama ?? "unit"}` : undefined}
              >
                <div className="flex items-center gap-2">
                  <Input id="dfk-qty" type="number" min={1} max={selectedBatch?.qtyTersedia}
                    value={qtyRaw} onChange={(e) => { setQtyRaw(e.target.value); if (errors.qty) setErrors((p) => ({ ...p, qty: "" })); }}
                    placeholder="0" inputMode="numeric"
                    className={cn("w-36 tabular-nums", errors.qty && "border-destructive")}
                  />
                  {selectedObat && <span className="text-sm text-muted-foreground">{selectedObat.satuan?.nama.toLowerCase() ?? "unit"}</span>}
                </div>
              </FieldWrapper>

              {/* Warning jika seluruh batch */}
              {selectedBatch && validQty && qty === selectedBatch.qtyTersedia && (
                <div className="flex items-start gap-2 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2.5 -mt-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-400">Seluruh stok batch ini akan masuk karantina.</p>
                </div>
              )}

              {/* Upload Foto Bukti */}
              <FieldWrapper label="Foto Bukti" error={errors.foto}>
                <FotoUploadZone fotoUrl={fotoUrl} onSet={setFotoUrl} onRemove={() => setFotoUrl(null)} error={errors.foto} />
              </FieldWrapper>

              {/* Catatan */}
              <FieldWrapper label="Catatan" htmlFor="dfk-catatan"
                hint="Jelaskan kondisi kerusakan secara lengkap (opsional)"
              >
                <Textarea id="dfk-catatan" value={catatan} onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Contoh: Strip packaging rusak di pojok kiri bawah..."
                  rows={4} />
              </FieldWrapper>
            </div>
          </form>
        </ScrollArea>
        <Separator />
        <SheetFooter className="px-5 py-4 gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button type="submit" form="defekta-form" disabled={createMutation.isPending} className="min-w-[140px]">
            {createMutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Mengirim...</>
            ) : "Kirim Laporan"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type TabStatus = "menunggu" | "disetujui" | "ditolak" | "dimusnahkan";

export default function ApotekerDefektaPage() {
  const [activeTab, setActiveTab] = useState<TabStatus>("menunggu");
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: listData, isLoading } = useDefektaList({ status: activeTab, limit: 50 });
  const { data: statsData } = useDefektaStats();

  const items = listData?.data ?? [];
  const stats = statsData ?? { menunggu: 0, aktif: 0, selesaiBulanIni: 0 };

  const columns = useMemo(() => buildColumns(), []);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Defekta & Quarantine"
        description="Laporkan obat rusak, kadaluarsa, atau bermasalah untuk ditinjau Admin"
        actions={
          <Button onClick={() => setSheetOpen(true)} size="action">
            <PlusCircle className="h-4 w-4" />
            Lapor Defekta
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Menunggu Review" value={stats.menunggu} icon={Clock}
          variant={stats.menunggu > 0 ? "warning" : "default"} subtitle="Laporan belum diproses Admin" />
        <StatsCard title="Disetujui" value={Math.max(0, stats.aktif - stats.menunggu)} icon={PackageX}
          variant="success" subtitle="Dijadwalkan untuk pemusnahan" />
        <StatsCard title="Dimusnahkan Bulan Ini" value={stats.selesaiBulanIni} icon={PackageX}
          variant="danger" subtitle="Sudah dimusnahkan" />
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabStatus)}>
        <TabsList>
          {(["menunggu", "disetujui", "ditolak", "dimusnahkan"] as const).map((tab) => {
            const labels = { menunggu: "Menunggu Review", disetujui: "Disetujui", ditolak: "Ditolak", dimusnahkan: "Dimusnahkan" };
            return (
              <TabsTrigger key={tab} value={tab}>
                {labels[tab]}
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
        <DataTable columns={columns} data={items} pageSize={10} />
      )}

      <DefektaSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </div>
  );
}
