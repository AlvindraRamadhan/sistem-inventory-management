"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  AlertTriangle,
  Building2,
  ChevronRight,
  DoorOpen,
  LayoutGrid,
  Loader2,
  MapPin,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  QrCode,
  Trash2,
  Warehouse,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { cn } from "@/lib/utils";
import type { LokasiGudang, TipeLokasi, KondisiPenyimpanan } from "@/types/inventory";
import { useLokasiGudangList, useCreateLokasiGudang } from "@/hooks/queries/use-lokasi-gudang";
import type { CreateLokasiGudangDto } from "@/services/lokasi-gudang.service";

// ── Schema ────────────────────────────────────────────────────────────────────

const lokasiSchema = z.object({
  nama: z.string().min(2, "Nama minimal 2 karakter"),
  tipe: z.enum(["GUDANG", "RUANG", "RAK", "LACI"]),
  parentId: z.string().optional(),
  kapasitas: z.number().min(1, "Kapasitas minimal 1 unit"),
  kondisi: z.enum(["SUHU_RUANG", "DINGIN", "TERKONTROL"]),
  keterangan: z.string().optional(),
});

type LokasiFormValues = z.infer<typeof lokasiSchema>;

// ── Constants ─────────────────────────────────────────────────────────────────

const KONDISI_LABELS: Record<string, string> = {
  SUHU_RUANG: "Suhu Ruang",
  DINGIN: "Dingin (2–8°C)",
  TERKONTROL: "Terkontrol",
};

const TIPE_LABELS: Record<TipeLokasi, string> = {
  GUDANG: "Gudang",
  RUANG: "Ruang",
  RAK: "Rak",
  LACI: "Laci",
};

const TIPE_CHILD_MAP: Record<TipeLokasi, TipeLokasi | null> = {
  GUDANG: "RUANG",
  RUANG: "RAK",
  RAK: "LACI",
  LACI: null,
};

const TIPE_PARENT_MAP: Record<TipeLokasi, TipeLokasi | null> = {
  GUDANG: null,
  RUANG: "GUDANG",
  RAK: "RUANG",
  LACI: "RAK",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCapacityPct(node: LokasiGudang): number {
  if (!node.kapasitas || node.kapasitas === 0) return 0;
  return Math.min(100, Math.round(((node.terpakai ?? 0) / node.kapasitas) * 100));
}

function getProgressColor(pct: number): string {
  if (pct >= 90) return "text-destructive";
  if (pct >= 70) return "text-amber-500";
  return "text-emerald-600";
}

function getProgressBarColor(pct: number): string {
  if (pct >= 90) return "bg-destructive";
  if (pct >= 70) return "bg-amber-500";
  return "bg-emerald-500";
}

function flattenTree(nodes: LokasiGudang[]): LokasiGudang[] {
  return nodes.flatMap((n) => [n, ...(n.children ? flattenTree(n.children) : [])]);
}

function findNodeById(nodes: LokasiGudang[], id: string): LokasiGudang | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
}

function formatNumber(n: number): string {
  return n.toLocaleString("id-ID");
}

// ── QR Code View ──────────────────────────────────────────────────────────────

function QrCodeView({ kode, nama }: { kode: string; nama: string }) {
  const SIZE = 21;
  const CELL = 7;

  const matrix = useMemo((): boolean[][] => {
    const grid: boolean[][] = Array.from({ length: SIZE }, (_, r) =>
      Array.from({ length: SIZE }, (_, c) => {
        const idx = (r * SIZE + c) % kode.length;
        const code = kode.charCodeAt(idx);
        return ((r * 17 + c * 11 + code) % 3) !== 0;
      })
    );
    const drawFinder = (sr: number, sc: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          grid[sr + r][sc + c] =
            r === 0 || r === 6 || c === 0 || c === 6 ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4);
        }
      }
    };
    drawFinder(0, 0);
    drawFinder(0, SIZE - 7);
    drawFinder(SIZE - 7, 0);
    for (let i = 8; i < SIZE - 8; i++) {
      grid[6][i] = i % 2 === 0;
      grid[i][6] = i % 2 === 0;
    }
    return grid;
  }, [kode]);

  const svgSize = SIZE * CELL + 16;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-lg border border-border bg-white p-3 shadow-sm">
        <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} aria-label={`QR Code untuk ${nama}`}>
          <rect width={svgSize} height={svgSize} fill="white" />
          {matrix.flatMap((row, r) =>
            row.map((filled, c) =>
              filled ? (
                <rect key={`${r}-${c}`} x={8 + c * CELL} y={8 + r * CELL} width={CELL} height={CELL} fill="#0f172a" />
              ) : null
            )
          )}
        </svg>
      </div>
      <div className="text-center">
        <p className="font-mono text-sm font-semibold text-foreground">{kode}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{nama}</p>
      </div>
      <p className="text-[10px] text-muted-foreground text-center max-w-[200px] leading-relaxed">
        Scan untuk akses cepat ke informasi lokasi penyimpanan
      </p>
    </div>
  );
}

// ── Field Wrapper ─────────────────────────────────────────────────────────────

function FieldWrapper({
  label, required, error, hint, children, className, htmlFor,
}: {
  label: string; required?: boolean; error?: string; hint?: string;
  children: React.ReactNode; className?: string; htmlFor?: string;
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

// ── Lokasi Form Dialog ────────────────────────────────────────────────────────

interface LokasiFormDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  parentNode?: LokasiGudang;
  preselectedTipe?: TipeLokasi;
  allNodes: LokasiGudang[];
  onSave: (values: LokasiFormValues) => Promise<void>;
}

function LokasiFormDialog({ open, onOpenChange, parentNode, preselectedTipe, allNodes, onSave }: LokasiFormDialogProps) {
  const {
    register, control, handleSubmit, watch, reset, setError,
    formState: { errors, isSubmitting },
  } = useForm<LokasiFormValues>({
    resolver: zodResolver(lokasiSchema) as Resolver<LokasiFormValues>,
    defaultValues: { nama: "", tipe: "GUDANG", parentId: "", kapasitas: 100, kondisi: "SUHU_RUANG", keterangan: "" },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const selectedTipe = watch("tipe") as TipeLokasi;

  const parentCandidates = useMemo(() => {
    const requiredTipe = TIPE_PARENT_MAP[selectedTipe];
    if (!requiredTipe) return [];
    return flattenTree(allNodes).filter((n) => n.tipe === requiredTipe);
  }, [selectedTipe, allNodes]);

  useEffect(() => {
    if (open) {
      reset({
        nama: "",
        tipe: preselectedTipe ?? "GUDANG",
        parentId: parentNode?.id ?? "",
        kapasitas: 100,
        kondisi: parentNode?.kondisi ?? "SUHU_RUANG",
        keterangan: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, parentNode?.id, preselectedTipe]);

  async function onSubmit(values: LokasiFormValues) {
    if (values.tipe !== "GUDANG" && !values.parentId) {
      setError("parentId", { message: "Parent lokasi wajib dipilih" });
      return;
    }
    try {
      await onSave(values);
      toast.success("Lokasi berhasil ditambahkan", { description: values.nama });
      onOpenChange(false);
    } catch {
      toast.error("Gagal menyimpan data", { description: "Silakan coba lagi." });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Tambah Lokasi Baru</DialogTitle>
          <DialogDescription>
            {parentNode
              ? `Sub-lokasi dalam ${parentNode.nama} - ${parentNode.path}`
              : "Tambahkan gudang atau lokasi penyimpanan baru ke sistem."}
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <ScrollArea className="max-h-[70vh]">
          <form id="lokasi-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-5 px-6 py-5">
              <FieldWrapper label="Nama Lokasi" htmlFor="lok-nama" required error={errors.nama?.message}>
                <Input id="lok-nama" {...register("nama")} placeholder="Contoh: Ruang A, Rak A1, Laci 1" aria-invalid={!!errors.nama} />
              </FieldWrapper>
              <div className="grid grid-cols-2 gap-4">
                <FieldWrapper label="Level" htmlFor="lok-level" required error={errors.tipe?.message}>
                  <Controller control={control} name="tipe" render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="lok-level" className="w-full" aria-invalid={!!errors.tipe}>
                        <SelectValue placeholder="Pilih level..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(["GUDANG", "RUANG", "RAK", "LACI"] as const).map((t) => (
                          <SelectItem key={t} value={t}>{TIPE_LABELS[t]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )} />
                </FieldWrapper>
                <FieldWrapper label="Parent Lokasi" htmlFor="lok-parent" required={selectedTipe !== "GUDANG"}
                  error={errors.parentId?.message} hint={selectedTipe === "GUDANG" ? "Tidak diperlukan" : undefined}>
                  <Controller control={control} name="parentId" render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value ?? ""} disabled={selectedTipe === "GUDANG"}>
                      <SelectTrigger id="lok-parent" className="w-full">
                        <SelectValue placeholder="Pilih parent..." />
                      </SelectTrigger>
                      <SelectContent>
                        {parentCandidates.map((n) => (
                          <SelectItem key={n.id} value={n.id}>{n.nama}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )} />
                </FieldWrapper>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FieldWrapper label="Kapasitas (unit)" htmlFor="lok-kapasitas" required
                  error={errors.kapasitas?.message} hint="Jumlah total unit yang dapat disimpan">
                  <Input id="lok-kapasitas" {...register("kapasitas", { valueAsNumber: true })} type="number" min={1} placeholder="100" aria-invalid={!!errors.kapasitas} />
                </FieldWrapper>
                <FieldWrapper label="Kondisi Penyimpanan" htmlFor="lok-kondisi" required error={errors.kondisi?.message}>
                  <Controller control={control} name="kondisi" render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="lok-kondisi" className="w-full">
                        <SelectValue placeholder="Pilih kondisi..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SUHU_RUANG">Suhu Ruang</SelectItem>
                        <SelectItem value="DINGIN">Dingin (2–8°C)</SelectItem>
                        <SelectItem value="TERKONTROL">Terkontrol</SelectItem>
                      </SelectContent>
                    </Select>
                  )} />
                </FieldWrapper>
              </div>
              <FieldWrapper label="Keterangan" htmlFor="lok-keterangan" error={errors.keterangan?.message}>
                <Textarea id="lok-keterangan" {...register("keterangan")} placeholder="Catatan tambahan mengenai lokasi ini (opsional)" rows={3} className="resize-none" />
              </FieldWrapper>
            </div>
          </form>
        </ScrollArea>
        <Separator />
        <DialogFooter showCloseButton className="px-6 py-4">
          <Button type="submit" form="lokasi-form" disabled={isSubmitting} className="min-w-[120px]">
            {isSubmitting ? "Menyimpan..." : "Tambah Lokasi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── QR Modal ──────────────────────────────────────────────────────────────────

function QrModal({ open, onOpenChange, node }: { open: boolean; onOpenChange: (v: boolean) => void; node: LokasiGudang | null }) {
  if (!node) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>QR Code Lokasi</DialogTitle>
          <DialogDescription className="text-xs">{node.path}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center py-2">
          <QrCodeView kode={node.kode} nama={node.nama} />
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" className="w-full"
            onClick={() => toast.info("Unduh QR Code", { description: "Fitur unduh tersedia di versi berikutnya" })}>
            Unduh QR Code
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── RakRow ────────────────────────────────────────────────────────────────────

interface RakRowProps {
  rak: LokasiGudang;
  onQr: (n: LokasiGudang) => void;
}

function RakRow({ rak, onQr }: RakRowProps) {
  const pct = getCapacityPct(rak);
  const barColor = getProgressBarColor(pct);

  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-background transition-colors">
      <div className="flex items-center gap-2">
        <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
        <span className="text-sm">{rak.nama}</span>
        <span className="text-xs text-muted-foreground">
          ({formatNumber(rak.terpakai ?? 0)}/{formatNumber(rak.kapasitas ?? 0)} unit)
        </span>
        {pct >= 90 && (
          <Badge variant="destructive" className="text-[10px] h-4 px-1.5">Penuh</Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
          <div className={cn("h-full rounded-full", barColor)} style={{ width: `${pct}%` }} />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-6 w-6" aria-label={`Menu ${rak.nama}`}>
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => toast.info("Fitur edit akan segera hadir")}>
              <Pencil className="h-4 w-4 mr-2" />Edit Rak
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onQr(rak)}>
              <QrCode className="h-4 w-4 mr-2" />Generate QR
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => toast.error("Hapus (belum tersedia)")}>
              <Trash2 className="h-4 w-4 mr-2" />Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ── RuangRow ──────────────────────────────────────────────────────────────────

interface RuangRowProps {
  ruang: LokasiGudang;
  onAddRak: (node: LokasiGudang) => void;
  onQr: (n: LokasiGudang) => void;
}

function RuangRow({ ruang, onAddRak, onQr }: RuangRowProps) {
  const [ruangExpanded, setRuangExpanded] = useState(false);
  const rakList = (ruang.children ?? []).filter((c) => c.tipe === "RAK");
  const pct = getCapacityPct(ruang);
  const barColor = getProgressBarColor(pct);
  const pctColor = getProgressColor(pct);

  return (
    <div className="ml-3 border-l-2 border-blue-200 pl-3">
      <div
        className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-background cursor-pointer transition-colors"
        onClick={() => setRuangExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setRuangExpanded((v) => !v); }}
      >
        <div className="flex items-center gap-2.5">
          <ChevronRight className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", ruangExpanded && "rotate-90")} />
          <div className="w-7 h-7 bg-blue-50 rounded-md flex items-center justify-center flex-shrink-0">
            <DoorOpen className="h-3.5 w-3.5 text-blue-500" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-medium leading-none">{ruang.nama}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {KONDISI_LABELS[ruang.kondisi ?? "SUHU_RUANG"]} · {rakList.length} rak
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {ruang.kapasitas ? (
            <div className="flex items-center gap-2">
              <div className="w-20 h-1 bg-muted rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full", barColor)} style={{ width: `${pct}%` }} />
              </div>
              <span className={cn("text-xs font-medium", pctColor)}>
                {pct}%
                {pct >= 90 && <AlertTriangle className="inline h-3 w-3 ml-1" />}
              </span>
            </div>
          ) : null}

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Menu ${ruang.nama}`}>
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onAddRak(ruang)}>
                <Plus className="h-4 w-4 mr-2" />Tambah Rak
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Fitur edit akan segera hadir")}>
                <Pencil className="h-4 w-4 mr-2" />Edit Ruang
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onQr(ruang)}>
                <QrCode className="h-4 w-4 mr-2" />Generate QR
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => toast.error("Hapus (belum tersedia)")}>
                <Trash2 className="h-4 w-4 mr-2" />Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {ruangExpanded && (
        <div className="ml-6 mt-1 space-y-1">
          {rakList.map((rak) => (
            <RakRow key={rak.id} rak={rak} onQr={onQr} />
          ))}
          {rakList.length === 0 && (
            <p className="text-xs text-muted-foreground px-3 py-1.5">Belum ada rak</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── GudangCard ────────────────────────────────────────────────────────────────

interface GudangCardProps {
  gudang: LokasiGudang;
  onAddRuang: (node: LokasiGudang) => void;
  onAddRak: (node: LokasiGudang) => void;
  onQr: (n: LokasiGudang) => void;
}

function GudangCard({ gudang, onAddRuang, onAddRak, onQr }: GudangCardProps) {
  const [expanded, setExpanded] = useState(true);
  const ruangList = (gudang.children ?? []).filter((c) => c.tipe === "RUANG");
  const pct = getCapacityPct(gudang);
  const barColor = getProgressBarColor(pct);
  const pctColor = getProgressColor(pct);

  return (
    <Card className="border-l-[3px] border-l-primary overflow-hidden">
      {/* Gudang header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setExpanded((v) => !v); }}
      >
        <div className="flex items-center gap-3">
          <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", expanded && "rotate-90")} />
          <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Warehouse className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-sm">{gudang.nama}</p>
            <p className="text-xs text-muted-foreground">
              {ruangList.length} ruang · Kapasitas {formatNumber(gudang.kapasitas ?? 0)} unit
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {gudang.kapasitas ? (
            <div className="hidden sm:flex flex-col items-end gap-1 min-w-[140px]">
              <div className="flex justify-between w-full">
                <span className="text-xs text-muted-foreground">
                  {formatNumber(gudang.terpakai ?? 0)} / {formatNumber(gudang.kapasitas)} unit
                </span>
                <span className={cn("text-xs font-medium", pctColor)}>{pct}%</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
            </div>
          ) : null}

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Menu ${gudang.nama}`}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onAddRuang(gudang)}>
                <Plus className="h-4 w-4 mr-2" />Tambah Ruang
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Fitur edit akan segera hadir")}>
                <Building2 className="h-4 w-4 mr-2" />Edit Gudang
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onQr(gudang)}>
                <QrCode className="h-4 w-4 mr-2" />Generate QR
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => toast.error("Hapus (belum tersedia)")}>
                <Trash2 className="h-4 w-4 mr-2" />Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Ruang list (collapsible) */}
      {expanded && (
        <div className="border-t bg-muted/20 px-4 py-3 space-y-2">
          {ruangList.map((ruang) => (
            <RuangRow key={ruang.id} ruang={ruang} onAddRak={onAddRak} onQr={onQr} />
          ))}
          {ruangList.length === 0 && (
            <p className="text-xs text-muted-foreground px-3 py-2">Belum ada ruang dalam gudang ini</p>
          )}
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-colors border border-dashed border-border"
            onClick={(e) => { e.stopPropagation(); onAddRuang(gudang); }}
          >
            <Plus className="h-3 w-3" />
            Tambah Ruang
          </button>
        </div>
      )}
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LokasiPage() {
  const { data: lokasiData, isLoading } = useLokasiGudangList();
  const createMutation = useCreateLokasiGudang();

  const lokasi = (lokasiData ?? []) as LokasiGudang[];

  const [formOpen, setFormOpen] = useState(false);
  const [formParent, setFormParent] = useState<LokasiGudang | undefined>(undefined);
  const [formTipe, setFormTipe] = useState<TipeLokasi | undefined>(undefined);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrNode, setQrNode] = useState<LokasiGudang | null>(null);
  const [search, setSearch] = useState("");

  const flat = useMemo(() => flattenTree(lokasi), [lokasi]);

  const stats = useMemo(() => {
    const totalGudang = lokasi.length;
    const totalRuang = flat.filter((n) => n.tipe === "RUANG").length;
    const totalRak = flat.filter((n) => n.tipe === "RAK").length;
    const kritis = flat.filter((n) => n.kapasitas && getCapacityPct(n) >= 90).length;
    return { totalGudang, totalRuang, totalRak, kritis };
  }, [flat, lokasi]);

  const filteredGudang = useMemo(() => {
    if (!search.trim()) return lokasi;
    const q = search.toLowerCase();
    return lokasi.filter((g) => {
      if (g.nama.toLowerCase().includes(q)) return true;
      return flattenTree(g.children ?? []).some((c) => c.nama.toLowerCase().includes(q));
    });
  }, [lokasi, search]);

  function handleAddSub(node: LokasiGudang) {
    setFormParent(node);
    setFormTipe(TIPE_CHILD_MAP[node.tipe] ?? undefined);
    setFormOpen(true);
  }

  function handleAddRoot() {
    setFormParent(undefined);
    setFormTipe("GUDANG");
    setFormOpen(true);
  }

  async function handleSave(values: LokasiFormValues) {
    const dto: CreateLokasiGudangDto = {
      nama: values.nama,
      tipe: values.tipe as TipeLokasi,
      parentId: values.parentId || undefined,
      kapasitas: values.kapasitas,
      kondisi: values.kondisi as KondisiPenyimpanan,
      keterangan: values.keterangan || undefined,
    };
    await createMutation.mutateAsync(dto);
  }

  function handleQr(node: LokasiGudang) {
    setQrNode(node);
    setQrOpen(true);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <PageHeader
        title="Lokasi Gudang"
        description="Kelola hierarki penyimpanan: Gudang → Ruang → Rak → Laci"
        breadcrumb={[{ label: "Master Data", href: "#" }, { label: "Lokasi Gudang" }]}
        actions={
          <Button onClick={handleAddRoot} size="action">
            <Plus className="h-4 w-4" />
            Tambah Gudang
          </Button>
        }
      />

      {/* Stats — 4 cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatsCard title="Total Gudang" value={stats.totalGudang} icon={Warehouse} variant="default" subtitle="Gudang aktif" />
        <StatsCard title="Total Ruang" value={stats.totalRuang} icon={DoorOpen} variant="default" subtitle="Semua gudang" />
        <StatsCard title="Total Rak" value={stats.totalRak} icon={LayoutGrid} variant="default" subtitle="Semua ruang" />
        <StatsCard title="Lokasi Kritis" value={stats.kritis} icon={AlertTriangle} variant={stats.kritis > 0 ? "danger" : "default"} subtitle="≥ 90% kapasitas" />
      </div>

      {/* Search + filter */}
      <div className="flex gap-3">
        <div className="relative max-w-sm flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Cari nama lokasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select defaultValue="semua">
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Level</SelectItem>
            <SelectItem value="GUDANG">Gudang</SelectItem>
            <SelectItem value="RUANG">Ruang</SelectItem>
            <SelectItem value="RAK">Rak</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Accordion tree */}
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm">Memuat data lokasi...</span>
        </div>
      ) : filteredGudang.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
          <Package className="h-10 w-10 opacity-20" />
          <p className="text-sm">Tidak ada lokasi yang sesuai pencarian</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGudang.map((gudang) => (
            <GudangCard
              key={gudang.id}
              gudang={gudang}
              onAddRuang={handleAddSub}
              onAddRak={handleAddSub}
              onQr={handleQr}
            />
          ))}
        </div>
      )}

      {/* Form dialog */}
      <LokasiFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        parentNode={formParent}
        preselectedTipe={formTipe}
        allNodes={lokasi}
        onSave={handleSave}
      />

      {/* QR modal */}
      <QrModal open={qrOpen} onOpenChange={setQrOpen} node={qrNode} />
    </div>
  );
}
