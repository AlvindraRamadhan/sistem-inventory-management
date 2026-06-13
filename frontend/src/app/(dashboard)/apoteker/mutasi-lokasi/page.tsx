"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  ChevronsUpDown,
  History,
  MapPin,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { useBatchList } from "@/hooks/queries/use-batch";
import { useLokasiGudangList } from "@/hooks/queries/use-lokasi-gudang";
import { useObatList } from "@/hooks/queries/use-obat";
import type { BatchItem } from "@/services/batch.service";
import type { ObatItem } from "@/services/obat.service";
import type { LokasiGudang } from "@/types/inventory";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const CAPACITY_WARN = 0.9;

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewTab = "riwayat" | "buat";

interface LocCap {
  id: string;
  nama: string;
  path: string;
  terpakai: number;
  kapasitas: number;
}

interface MutasiLokasi {
  id: string;
  noMutasi: string;
  obatId: string;
  namaObat: string;
  batchId: string;
  batchNumber: string;
  expiredDate: string;
  dariLokasiId: string;
  dariLokasiNama: string;
  keLokasiId: string;
  keLokasiNama: string;
  qty: number;
  catatan?: string;
  createdAt: string;
  createdBy: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} ${months[m - 1]} ${y}`;
}

function formatDateLong(iso: string): string {
  const months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} ${months[m - 1]} ${y}`;
}

function formatTime(iso: string): string {
  return iso.slice(11, 16);
}

function groupByDate(items: MutasiLokasi[]): { date: string; label: string; items: MutasiLokasi[] }[] {
  const map = new Map<string, MutasiLokasi[]>();
  for (const item of items) {
    const key = item.createdAt.slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return Array.from(map.entries()).map(([date, grp]) => ({
    date,
    label: formatDateLong(date),
    items: grp,
  }));
}

function buildCapacityMap(lokasi: LokasiGudang[]): Map<string, LocCap> {
  const map = new Map<string, LocCap>();
  function visit(node: LokasiGudang) {
    if ((node.tipe === "RAK" || node.tipe === "LACI") && node.kapasitas !== undefined) {
      map.set(node.id, {
        id: node.id,
        nama: node.nama,
        path: node.path,
        terpakai: node.terpakai ?? 0,
        kapasitas: node.kapasitas ?? 0,
      });
    }
    node.children?.forEach(visit);
  }
  lokasi.forEach(visit);
  return map;
}

function getGroupedLokasi(lokasi: LokasiGudang[]): { group: string; items: LokasiGudang[] }[] {
  const result: { group: string; items: LokasiGudang[] }[] = [];
  for (const gudang of lokasi) {
    for (const ruang of gudang.children ?? []) {
      const items: LokasiGudang[] = [];
      function collect(node: LokasiGudang) {
        if (node.tipe === "RAK" || node.tipe === "LACI") items.push(node);
        node.children?.forEach(collect);
      }
      (ruang.children ?? []).forEach(collect);
      if (items.length > 0) {
        result.push({ group: `${gudang.nama} — ${ruang.nama}`, items });
      }
    }
  }
  return result;
}

function generateMutasiId(existing: MutasiLokasi[]): { id: string; noMutasi: string } {
  const nums = existing
    .map(m => m.id)
    .filter(id => /^ML-\d+$/.test(id))
    .map(id => parseInt(id.slice(3)))
    .filter(n => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  const padded = String(next).padStart(3, "0");
  const year = new Date().getFullYear();
  return { id: `ML-${padded}`, noMutasi: `MUT-${year}-${padded}` };
}

// ─── FieldWrapper ─────────────────────────────────────────────────────────────

function FieldWrapper({
  label, required, error, hint, children, className, htmlFor,
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

// ─── CapacityBar ──────────────────────────────────────────────────────────────

function CapacityBar({ terpakai, kapasitas, projectedQty = 0 }: {
  terpakai: number;
  kapasitas: number;
  projectedQty?: number;
}) {
  const currentPct   = kapasitas > 0 ? terpakai / kapasitas : 0;
  const projectedPct = kapasitas > 0 ? (terpakai + projectedQty) / kapasitas : 0;
  const displayPct   = projectedQty > 0 ? projectedPct : currentPct;
  const barColor =
    displayPct > 1 ? "bg-destructive" :
    displayPct > CAPACITY_WARN ? "bg-amber-500" :
    "bg-emerald-500";
  return (
    <div className="flex flex-col gap-1">
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${Math.min(displayPct * 100, 100)}%` }}
        />
      </div>
      <p className={cn(
        "text-xs",
        displayPct > 1 ? "text-destructive font-medium" :
        displayPct > CAPACITY_WARN ? "text-amber-600 dark:text-amber-400 font-medium" :
        "text-muted-foreground"
      )}>
        {terpakai + projectedQty}/{kapasitas} unit ({Math.round(displayPct * 100)}% penuh)
      </p>
    </div>
  );
}

// ─── Riwayat Mutasi View ──────────────────────────────────────────────────────

function RiwayatMutasiView({ mutations }: { mutations: MutasiLokasi[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return mutations;
    const q = search.toLowerCase();
    return mutations.filter(m =>
      (m.namaObat ?? "").toLowerCase().includes(q) ||
      m.batchNumber.toLowerCase().includes(q) ||
      (m.dariLokasiNama ?? "").toLowerCase().includes(q) ||
      (m.keLokasiNama ?? "").toLowerCase().includes(q) ||
      m.noMutasi.toLowerCase().includes(q)
    );
  }, [mutations, search]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari nama obat, batch, atau lokasi..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {grouped.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="Tidak ada riwayat mutasi"
          description={search ? "Tidak ada hasil yang cocok dengan pencarian." : "Belum ada mutasi lokasi yang tercatat."}
        />
      ) : (
        grouped.map(({ date, label, items }) => (
          <div key={date}>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-medium text-muted-foreground px-2.5 py-1 bg-muted rounded-full whitespace-nowrap">
                {label}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="space-y-2">
              {items.map(mutasi => (
                <Card key={mutasi.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <ArrowLeftRight className="h-4 w-4 text-primary" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{mutasi.namaObat}</p>
                        <p className="text-xs text-muted-foreground font-mono">{mutasi.batchNumber}</p>
                      </div>

                      <div className="flex items-center gap-2 text-sm flex-shrink-0">
                        <div className="bg-muted px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap">
                          {mutasi.dariLokasiNama}
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                        <div className="bg-primary/10 text-primary px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap">
                          {mutasi.keLokasiNama}
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-sm tabular-nums">{mutasi.qty.toLocaleString("id-ID")}</p>
                        <p className="text-xs text-muted-foreground">unit</p>
                      </div>

                      <div className="text-right text-xs text-muted-foreground flex-shrink-0 min-w-[36px]">
                        {formatTime(mutasi.createdAt)}
                      </div>
                    </div>

                    {mutasi.catatan && (
                      <p className="mt-2 text-xs text-muted-foreground pl-[52px] line-clamp-1">
                        {mutasi.catatan}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Buat Mutasi View (inline form) ──────────────────────────────────────────

interface BuatMutasiViewProps {
  batches: BatchItem[];
  capacityMap: Map<string, LocCap>;
  groupedLokasi: { group: string; items: LokasiGudang[] }[];
  onConfirm: (payload: {
    obatId: string; namaObat: string;
    batchId: string; batchNumber: string; expiredDate: string;
    dariLokasiId: string; dariLokasiNama: string;
    keLokasiId: string; keLokasiNama: string;
    qty: number; catatan: string;
  }) => void;
  onBack: () => void;
  activeObat: ObatItem[];
}

function BuatMutasiView({ batches, capacityMap, groupedLokasi, onConfirm, onBack, activeObat }: BuatMutasiViewProps) {
  const [obatPickerOpen, setObatPickerOpen]     = useState(false);
  const [lokasiPickerOpen, setLokasiPickerOpen] = useState(false);
  const [selectedObatId, setSelectedObatId]     = useState("");
  const [selectedBatchId, setSelectedBatchId]   = useState("");
  const [keLokasiId, setKeLokasiId]             = useState("");
  const [qtyRaw, setQtyRaw]                     = useState("");
  const [catatan, setCatatan]                   = useState("");
  const [isSubmitting, setIsSubmitting]         = useState(false);
  const [errors, setErrors]                     = useState<Record<string, string>>({});

  const selectedObat = useMemo(() => activeObat.find(o => o.id === selectedObatId), [activeObat, selectedObatId]);

  const activeBatches = useMemo(() =>
    batches
      .filter(b => b.obatId === selectedObatId && b.status === "AKTIF" && b.qty > 0)
      .sort((a, b) => a.expiredDate.localeCompare(b.expiredDate)),
    [selectedObatId, batches]
  );

  const selectedBatch = useMemo(() => batches.find(b => b.id === selectedBatchId), [selectedBatchId, batches]);
  const keLokasiCap   = keLokasiId ? capacityMap.get(keLokasiId) : undefined;
  const qty           = parseInt(qtyRaw, 10);
  const validQty      = !isNaN(qty) && qty > 0;

  const projectedPct = keLokasiCap && validQty
    ? (keLokasiCap.terpakai + qty) / keLokasiCap.kapasitas
    : keLokasiCap ? keLokasiCap.terpakai / keLokasiCap.kapasitas : 0;

  const capacityOverflow = keLokasiCap && validQty
    ? keLokasiCap.terpakai + qty > keLokasiCap.kapasitas
    : false;

  const capacityNearFull = !capacityOverflow && keLokasiCap && validQty && projectedPct > CAPACITY_WARN;

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!selectedObatId) errs.obat = "Pilih obat terlebih dahulu";
    if (!selectedBatchId) errs.batch = "Pilih batch yang akan dipindah";
    if (!keLokasiId) errs.keLokasi = "Pilih lokasi tujuan";
    else if (selectedBatch && keLokasiId === selectedBatch.lokasiId)
      errs.keLokasi = "Lokasi tujuan tidak boleh sama dengan lokasi asal";
    if (!validQty) errs.qty = "Masukkan jumlah yang valid (> 0)";
    else if (selectedBatch && qty > selectedBatch.qty)
      errs.qty = `Melebihi stok di lokasi asal (tersedia: ${selectedBatch.qty} ${selectedObat?.satuan?.nama.toLowerCase() ?? "unit"})`;
    if (capacityOverflow)
      errs.keLokasi = `Kapasitas tidak mencukupi (sisa: ${keLokasiCap!.kapasitas - keLokasiCap!.terpakai} unit)`;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || !selectedBatch || !selectedObat || !keLokasiCap) return;
    setIsSubmitting(true);
    await new Promise<void>(r => setTimeout(r, 400));
    onConfirm({
      obatId: selectedObatId,
      namaObat: selectedObat.nama,
      batchId: selectedBatchId,
      batchNumber: selectedBatch.batchNumber,
      expiredDate: selectedBatch.expiredDate,
      dariLokasiId: selectedBatch.lokasiId,
      dariLokasiNama: selectedBatch.lokasiNama ?? selectedBatch.lokasiId,
      keLokasiId,
      keLokasiNama: keLokasiCap.nama,
      qty,
      catatan: catatan.trim(),
    });
    setIsSubmitting(false);
  }

  return (
    <Card className="max-w-[600px]">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ArrowLeftRight className="h-4 w-4 text-primary" />
          Buat Mutasi Lokasi
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Pindahkan stok obat dari satu rak ke rak lainnya
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">

          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Obat &amp; Batch
          </p>

          {/* Obat picker */}
          <FieldWrapper label="Obat" required error={errors.obat}>
            <Popover open={obatPickerOpen} onOpenChange={setObatPickerOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  role="combobox"
                  aria-expanded={obatPickerOpen}
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
                  <CommandInput placeholder="Cari nama atau kode obat..." />
                  <CommandList>
                    <CommandEmpty>Obat tidak ditemukan</CommandEmpty>
                    <CommandGroup>
                      {activeObat.map(obat => {
                        const batchCount = batches.filter(b => b.obatId === obat.id && b.status === "AKTIF" && b.qty > 0).length;
                        return (
                          <CommandItem
                            key={obat.id}
                            value={`${obat.nama} ${obat.kode} ${obat.kategori?.nama}`}
                            onSelect={() => {
                              setSelectedObatId(obat.id);
                              setSelectedBatchId("");
                              setKeLokasiId("");
                              setQtyRaw("");
                              setErrors({});
                              setObatPickerOpen(false);
                            }}
                          >
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="text-sm font-medium">{obat.nama}</span>
                              <span className="text-xs text-muted-foreground">
                                {obat.kode} · {obat.kategori?.nama} · {batchCount} batch aktif
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

          {/* Batch select */}
          <FieldWrapper
            label="Batch (Lokasi Asal)"
            htmlFor="ml-batch"
            required
            error={errors.batch}
            hint={
              selectedObatId && activeBatches.length === 0
                ? "Tidak ada batch aktif untuk obat ini"
                : selectedObatId
                  ? `${activeBatches.length} batch tersedia`
                  : "Pilih obat terlebih dahulu"
            }
          >
            <Select
              value={selectedBatchId}
              onValueChange={v => {
                setSelectedBatchId(v);
                setQtyRaw("");
                setErrors(prev => ({ ...prev, batch: "", qty: "" }));
              }}
              disabled={!selectedObatId || activeBatches.length === 0}
            >
              <SelectTrigger
                id="ml-batch"
                className={cn("w-full h-auto py-2", errors.batch && "border-destructive")}
              >
                <SelectValue placeholder="Pilih batch yang akan dipindah..." />
              </SelectTrigger>
              <SelectContent>
                {activeBatches.map(b => {
                  const cap = capacityMap.get(b.lokasiId);
                  return (
                    <SelectItem key={b.id} value={b.id}>
                      <div className="flex flex-col py-0.5">
                        <span className="font-mono text-sm font-medium">{b.batchNumber}</span>
                        <span className="text-xs text-muted-foreground">
                          Stok: {b.qty} {selectedObat?.satuan?.nama.toLowerCase() ?? "unit"} ·
                          Lokasi: {cap?.nama ?? b.lokasiNama ?? b.lokasiId} ·
                          ED: {formatDate(b.expiredDate)}
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </FieldWrapper>

          {/* Lokasi asal (read-only) */}
          {selectedBatch && (
            <FieldWrapper label="Lokasi Asal">
              <div className="flex items-center gap-2 h-9 rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {capacityMap.get(selectedBatch.lokasiId)?.path ?? selectedBatch.lokasiNama ?? selectedBatch.lokasiId}
                </span>
                <span className="ml-auto text-xs text-primary whitespace-nowrap">
                  Stok: {selectedBatch.qty} {selectedObat?.satuan?.nama.toLowerCase() ?? "unit"}
                </span>
              </div>
            </FieldWrapper>
          )}

          <Separator />

          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Tujuan &amp; Jumlah
          </p>

          {/* Lokasi tujuan picker */}
          <FieldWrapper label="Lokasi Tujuan" required error={errors.keLokasi}>
            <Popover open={lokasiPickerOpen} onOpenChange={setLokasiPickerOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  role="combobox"
                  aria-expanded={lokasiPickerOpen}
                  disabled={!selectedBatchId}
                  className={cn(
                    "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    errors.keLokasi && "border-destructive"
                  )}
                >
                  <span className={cn("truncate", !keLokasiId && "text-muted-foreground")}>
                    {keLokasiCap ? keLokasiCap.nama : "Pilih lokasi tujuan..."}
                  </span>
                  <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Cari lokasi..." />
                  <CommandList>
                    <CommandEmpty>Lokasi tidak ditemukan</CommandEmpty>
                    {groupedLokasi.map(({ group, items }) => (
                      <CommandGroup key={group} heading={group}>
                        {items.map(lok => {
                          const cap = capacityMap.get(lok.id);
                          if (!cap) return null;
                          const pct = cap.kapasitas > 0 ? cap.terpakai / cap.kapasitas : 0;
                          const isSame = selectedBatch?.lokasiId === lok.id;
                          const barColor = pct > 1 ? "bg-destructive" : pct > CAPACITY_WARN ? "bg-amber-500" : "bg-emerald-500";
                          return (
                            <CommandItem
                              key={lok.id}
                              value={`${lok.nama} ${lok.path} ${group}`}
                              disabled={isSame}
                              onSelect={() => {
                                setKeLokasiId(lok.id);
                                setErrors(prev => ({ ...prev, keLokasi: "" }));
                                setLokasiPickerOpen(false);
                              }}
                            >
                              <div className="flex flex-col w-full min-w-0 gap-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className={cn("text-sm font-medium", isSame && "text-muted-foreground")}>
                                    {lok.nama}
                                    {isSame && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(lokasi asal)</span>}
                                  </span>
                                  <span className={cn(
                                    "text-xs shrink-0 tabular-nums",
                                    pct > 1 ? "text-destructive font-medium" :
                                    pct > CAPACITY_WARN ? "text-amber-600 dark:text-amber-400 font-medium" :
                                    "text-muted-foreground"
                                  )}>
                                    {cap.terpakai}/{cap.kapasitas}
                                  </span>
                                </div>
                                <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                                  <div className={cn("h-full rounded-full", barColor)} style={{ width: `${Math.min(pct * 100, 100)}%` }} />
                                </div>
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    ))}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </FieldWrapper>

          {/* Capacity preview */}
          {keLokasiCap && (
            <div className={cn(
              "-mt-2 rounded-md border px-3 py-2.5",
              capacityOverflow ? "bg-destructive/5 border-destructive/40" :
              capacityNearFull ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" :
              "bg-muted/30 border-border"
            )}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-foreground">{keLokasiCap.nama}</span>
                {(capacityOverflow || capacityNearFull) && (
                  <AlertTriangle className={cn("h-3.5 w-3.5", capacityOverflow ? "text-destructive" : "text-amber-500")} />
                )}
              </div>
              <CapacityBar
                terpakai={keLokasiCap.terpakai}
                kapasitas={keLokasiCap.kapasitas}
                projectedQty={validQty ? qty : 0}
              />
              {capacityOverflow && (
                <p className="text-xs text-destructive mt-1.5">
                  Kapasitas penuh — sisa {Math.max(0, keLokasiCap.kapasitas - keLokasiCap.terpakai)} unit.
                </p>
              )}
              {capacityNearFull && !capacityOverflow && (
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1.5">
                  Peringatan: lokasi akan {Math.round(projectedPct * 100)}% penuh setelah mutasi ini.
                </p>
              )}
            </div>
          )}

          {/* Jumlah */}
          <FieldWrapper
            label="Jumlah yang Dipindah"
            htmlFor="ml-qty"
            required
            error={errors.qty}
            hint={selectedBatch && !errors.qty
              ? `Maks: ${selectedBatch.qty} ${selectedObat?.satuan?.nama.toLowerCase() ?? "unit"}`
              : undefined}
          >
            <div className="flex items-center gap-2">
              <Input
                id="ml-qty"
                type="number"
                min={1}
                max={selectedBatch?.qty}
                value={qtyRaw}
                onChange={e => {
                  setQtyRaw(e.target.value);
                  if (errors.qty) setErrors(prev => ({ ...prev, qty: "" }));
                }}
                placeholder="0"
                inputMode="numeric"
                disabled={!selectedBatchId}
                className={cn("w-36 tabular-nums", errors.qty && "border-destructive")}
              />
              {selectedObat && (
                <span className="text-sm text-muted-foreground">
                  {selectedObat.satuan?.nama.toLowerCase() ?? "unit"}
                </span>
              )}
            </div>
          </FieldWrapper>

          {/* Route summary */}
          {selectedBatch && keLokasiCap && validQty && !errors.qty && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground -mt-2">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="font-medium text-foreground">
                {capacityMap.get(selectedBatch.lokasiId)?.nama ?? selectedBatch.lokasiNama}
              </span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0" />
              <span className="font-medium text-foreground">{keLokasiCap.nama}</span>
              <span>·</span>
              <span>{qty} {selectedObat?.satuan?.nama.toLowerCase() ?? "unit"}</span>
            </div>
          )}

          <Separator />

          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Keterangan
          </p>

          <FieldWrapper
            label="Alasan / Catatan"
            htmlFor="ml-catatan"
            hint="Opsional — jelaskan alasan pemindahan jika diperlukan"
          >
            <Textarea
              id="ml-catatan"
              value={catatan}
              onChange={e => setCatatan(e.target.value)}
              placeholder="Contoh: konsolidasi stok, penyesuaian kategori penyimpanan..."
              rows={2}
            />
          </FieldWrapper>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onBack}>
              Batal
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || !!capacityOverflow}
            >
              {isSubmitting ? "Memproses..." : "Pindahkan Stok →"}
            </Button>
          </div>

        </form>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MutasiLokasiPage() {
  const { data: obatResponse }   = useObatList({ isActive: true, limit: 100 });
  const { data: batchResponse }  = useBatchList({ status: "AKTIF", limit: 500 });
  const { data: lokasiResponse } = useLokasiGudangList();
  const activeObat = obatResponse?.data ?? [];

  const [view, setView]             = useState<ViewTab>("riwayat");
  const [mutations, setMutations]   = useState<MutasiLokasi[]>([]);
  const [batches, setBatches]       = useState<BatchItem[]>([]);
  const [capacityMap, setCapacityMap] = useState<Map<string, LocCap>>(() => new Map());

  // Sync batches from API
  useEffect(() => {
    if (batchResponse?.data) {
      setBatches(batchResponse.data);
    }
  }, [batchResponse?.data]);

  // Sync capacity map from API
  useEffect(() => {
    if (lokasiResponse) {
      setCapacityMap(buildCapacityMap(lokasiResponse));
    }
  }, [lokasiResponse]);

  const groupedLokasi = useMemo(
    () => getGroupedLokasi(lokasiResponse ?? []),
    [lokasiResponse]
  );

  const [filterPeriode, setFilterPeriode] = useState("semua");
  const [filterLokasi, setFilterLokasi]   = useState("semua");

  const uniqueLokasi = useMemo(() => {
    const set = new Set<string>();
    mutations.forEach(m => {
      if (m.dariLokasiNama) set.add(m.dariLokasiNama);
      if (m.keLokasiNama)   set.add(m.keLokasiNama);
    });
    return Array.from(set).sort();
  }, [mutations]);

  const filteredMutations = useMemo(() => {
    let result = mutations;
    if (filterPeriode !== "semua") {
      const now = new Date();
      if (filterPeriode === "minggu") {
        const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
        result = result.filter(m => m.createdAt.slice(0, 10) >= cutoff);
      } else if (filterPeriode === "bulan") {
        const prefix = now.toISOString().slice(0, 7);
        result = result.filter(m => m.createdAt.startsWith(prefix));
      }
    }
    if (filterLokasi !== "semua") {
      result = result.filter(m =>
        m.dariLokasiNama === filterLokasi || m.keLokasiNama === filterLokasi
      );
    }
    return result;
  }, [mutations, filterPeriode, filterLokasi]);

  function handleConfirm(payload: {
    obatId: string; namaObat: string;
    batchId: string; batchNumber: string; expiredDate: string;
    dariLokasiId: string; dariLokasiNama: string;
    keLokasiId: string; keLokasiNama: string;
    qty: number; catatan: string;
  }) {
    const now = new Date().toISOString();
    const { id, noMutasi } = generateMutasiId(mutations);

    const newMutation: MutasiLokasi = {
      id, noMutasi,
      obatId: payload.obatId, namaObat: payload.namaObat,
      batchId: payload.batchId, batchNumber: payload.batchNumber, expiredDate: payload.expiredDate,
      dariLokasiId: payload.dariLokasiId, dariLokasiNama: payload.dariLokasiNama,
      keLokasiId: payload.keLokasiId, keLokasiNama: payload.keLokasiNama,
      qty: payload.qty,
      catatan: payload.catatan || undefined,
      createdAt: now,
      createdBy: "Apoteker",
    };

    // Optimistic batch update
    setBatches(prev => {
      let updated = prev.map(b =>
        b.id === payload.batchId ? { ...b, qty: b.qty - payload.qty } : b
      );
      const existDest = prev.find(b =>
        b.id !== payload.batchId &&
        b.obatId === payload.obatId &&
        b.batchNumber === payload.batchNumber &&
        b.lokasiId === payload.keLokasiId
      );
      if (existDest) {
        updated = updated.map(b =>
          b.id === existDest.id ? { ...b, qty: b.qty + payload.qty } : b
        );
      } else {
        const src = prev.find(b => b.id === payload.batchId);
        if (src) {
          updated.push({
            ...src,
            id: `${payload.batchId}-${id}`,
            lokasiId: payload.keLokasiId,
            lokasiNama: payload.keLokasiNama,
            qty: payload.qty,
          });
        }
      }
      return updated;
    });

    // Optimistic capacity update
    setCapacityMap(prev => {
      const next = new Map(prev);
      const src = next.get(payload.dariLokasiId);
      if (src) next.set(payload.dariLokasiId, { ...src, terpakai: Math.max(0, src.terpakai - payload.qty) });
      const dst = next.get(payload.keLokasiId);
      if (dst) next.set(payload.keLokasiId, { ...dst, terpakai: dst.terpakai + payload.qty });
      return next;
    });

    setMutations(prev => [newMutation, ...prev]);
    setView("riwayat");

    toast.success("Mutasi lokasi berhasil dicatat", {
      description: `${payload.namaObat} — ${payload.qty} unit dipindah dari ${payload.dariLokasiNama} ke ${payload.keLokasiNama}`,
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mutasi Lokasi"
        description="Pindahkan stok obat antar rak atau gudang"
      />

      <div className="flex gap-6">
        {/* ── Sidebar ── */}
        <aside className="w-[220px] flex-shrink-0">
          <div className="bg-card border rounded-xl p-4 sticky top-6 space-y-4">

            <nav className="space-y-0.5">
              {[
                { value: "riwayat" as ViewTab, label: "Riwayat Mutasi",  icon: <History className="h-3.5 w-3.5" />,      count: String(mutations.length) },
                { value: "buat"    as ViewTab, label: "Buat Mutasi",     icon: <ArrowLeftRight className="h-3.5 w-3.5" />, count: null },
              ].map(item => (
                <button
                  key={item.value}
                  onClick={() => setView(item.value)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                    view === item.value
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.count && (
                    <span className={cn(
                      "text-xs px-1.5 py-0.5 rounded-md",
                      view === item.value
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {item.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            {view === "riwayat" && (
              <>
                <Separator />
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Filter
                  </p>
                  <div className="space-y-2">
                    <Select value={filterPeriode} onValueChange={setFilterPeriode}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Semua Periode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="semua">Semua waktu</SelectItem>
                        <SelectItem value="minggu">Minggu ini</SelectItem>
                        <SelectItem value="bulan">Bulan ini</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterLokasi} onValueChange={setFilterLokasi}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Semua Lokasi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="semua">Semua Lokasi</SelectItem>
                        {uniqueLokasi.map(lok => (
                          <SelectItem key={lok} value={lok}>{lok}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

          </div>
        </aside>

        {/* ── Content ── */}
        <main className="flex-1 min-w-0">
          {view === "riwayat" ? (
            <RiwayatMutasiView mutations={filteredMutations} />
          ) : (
            <BuatMutasiView
              key={view}
              batches={batches}
              capacityMap={capacityMap}
              groupedLokasi={groupedLokasi}
              onConfirm={handleConfirm}
              onBack={() => setView("riwayat")}
              activeObat={activeObat}
            />
          )}
        </main>
      </div>
    </div>
  );
}
