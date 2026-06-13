"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileImage,
  ImageIcon,
  Loader2,
  Package,
  RotateCcw,
  Send,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { useGRDetail, useSaveDraftGR, useSubmitGRQC } from "@/hooks/queries/use-good-receipt";
import { cn } from "@/lib/utils";
import type { GoodReceipt, GRItem } from "@/types/procurement";

// ── Constants ─────────────────────────────────────────────────────────────────

const TODAY = new Date();
const SIX_MONTHS_LATER = new Date(TODAY);
SIX_MONTHS_LATER.setMonth(SIX_MONTHS_LATER.getMonth() + 6);
const MAX_PHOTOS = 5;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "application/pdf"];

// ── State types ───────────────────────────────────────────────────────────────

interface ItemFormState {
  qtyTerima: number | "";
  batchNumber: string;
  tanggalProduksi: string;
  expiredDate: string;
  kondisi: "BAIK" | "RUSAK" | "";
  keterangan: string;
}

interface PhotoEntry {
  id: string;
  previewUrl: string;
  fileName: string;
  fileSize: number;
  keterangan: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr?: string): string {
  if (!dateStr) return "-";
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  return `${d} ${months[m - 1]} ${y}`;
}

function isExpiringSoon(dateStr: string): boolean {
  if (!dateStr) return false;
  const expDate = new Date(dateStr);
  return expDate <= SIX_MONTHS_LATER && expDate >= TODAY;
}

function isAlreadyExpired(dateStr: string): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < TODAY;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function initItemState(item: GRItem): ItemFormState {
  return {
    qtyTerima: item.qtyTerima > 0 ? item.qtyTerima : "",
    batchNumber: item.batchNumber ?? "",
    tanggalProduksi: item.tanggalProduksi ?? "",
    expiredDate: item.expiredDate ?? "",
    kondisi: item.kondisi ?? "",
    keterangan: item.keteranganKondisi ?? "",
  };
}

// ── Kondisi radio ─────────────────────────────────────────────────────────────

function KondisiRadio({
  value, onChange, error,
}: {
  value: "BAIK" | "RUSAK" | "";
  onChange: (v: "BAIK" | "RUSAK") => void;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">Kondisi <span className="text-destructive">*</span></span>
      <div className="flex gap-3">
        {(["BAIK", "RUSAK"] as const).map((opt) => (
          <button key={opt} type="button" role="radio" aria-checked={value === opt} onClick={() => onChange(opt)}
            className={cn(
              "flex items-center gap-2 rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all",
              value === opt
                ? opt === "BAIK"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                  : "border-destructive bg-red-50 text-destructive dark:bg-red-900/20"
                : "border-border bg-background text-muted-foreground hover:border-border/80 hover:bg-muted/50"
            )}>
            {opt === "BAIK" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {opt === "BAIK" ? "Baik" : "Rusak"}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ── Per-item form card ────────────────────────────────────────────────────────

interface ItemCardProps {
  item: GRItem;
  index: number;
  state: ItemFormState;
  errors: Partial<Record<keyof ItemFormState, string>>;
  onChange: (field: keyof ItemFormState, value: string | number | "") => void;
}

function ItemCard({ item, index, state, errors, onChange }: ItemCardProps) {
  const isRusak = state.kondisi === "RUSAK";
  const expWarning = state.expiredDate
    ? isAlreadyExpired(state.expiredDate) ? "error"
    : isExpiringSoon(state.expiredDate) ? "warn" : null
    : null;

  return (
    <Card>
      <CardHeader className="border-b py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {index + 1}
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">{item.namaObat}</p>
              <p className="text-xs text-muted-foreground">Qty PO: {item.qtyPO} {item.satuanNama}</p>
            </div>
          </div>
          {state.kondisi && (
            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full",
              state.kondisi === "BAIK"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            )}>
              {state.kondisi === "BAIK" ? "✓ Baik" : "✗ Rusak"}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Qty Diterima */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Qty Diterima <span className="text-destructive">*</span></label>
            <div className="relative">
              <Input type="number" min={0} max={item.qtyPO * 2} placeholder={`maks ${item.qtyPO}`}
                value={state.qtyTerima}
                onChange={(e) => onChange("qtyTerima", e.target.value === "" ? "" : Number(e.target.value))}
                className={cn("pr-16", errors.qtyTerima && "border-destructive focus-visible:ring-destructive/30")} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground select-none">{item.satuanNama}</span>
            </div>
            {errors.qtyTerima ? (
              <p className="text-xs text-destructive">{errors.qtyTerima}</p>
            ) : state.qtyTerima !== "" && Number(state.qtyTerima) < item.qtyPO ? (
              <p className="text-xs text-amber-600 dark:text-amber-400">Kurang {item.qtyPO - Number(state.qtyTerima)} dari PO</p>
            ) : null}
          </div>

          {/* No. Batch */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              No. Batch{state.kondisi === "BAIK" && <span className="text-destructive ml-0.5">*</span>}
            </label>
            <Input placeholder="Contoh: BT-OME-0526" value={state.batchNumber}
              onChange={(e) => onChange("batchNumber", e.target.value)}
              className={cn("font-mono", errors.batchNumber && "border-destructive focus-visible:ring-destructive/30")} />
            {errors.batchNumber && <p className="text-xs text-destructive">{errors.batchNumber}</p>}
          </div>

          {/* Tgl Produksi */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Tgl. Produksi</label>
            <Input type="date" value={state.tanggalProduksi}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => onChange("tanggalProduksi", e.target.value)} />
          </div>

          {/* Expired Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Expired Date{state.kondisi === "BAIK" && <span className="text-destructive ml-0.5">*</span>}
            </label>
            <Input type="date" value={state.expiredDate}
              onChange={(e) => onChange("expiredDate", e.target.value)}
              className={cn(
                errors.expiredDate && "border-destructive focus-visible:ring-destructive/30",
                expWarning === "error" && !errors.expiredDate && "border-destructive/50",
                expWarning === "warn" && !errors.expiredDate && "border-amber-400"
              )} />
            {errors.expiredDate ? (
              <p className="text-xs text-destructive">{errors.expiredDate}</p>
            ) : expWarning === "error" ? (
              <p className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Obat sudah kadaluarsa</p>
            ) : expWarning === "warn" ? (
              <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Exp. kurang dari 6 bulan</p>
            ) : null}
          </div>

          {/* Kondisi — full width */}
          <div className="col-span-2">
            <KondisiRadio value={state.kondisi} onChange={(v) => onChange("kondisi", v)} error={errors.kondisi} />
          </div>

          {/* Keterangan kerusakan */}
          {isRusak && (
            <div className="col-span-2 flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Keterangan Kerusakan <span className="text-destructive">*</span></label>
              <Textarea placeholder="Jelaskan jenis dan kondisi kerusakan secara rinci." rows={2} value={state.keterangan}
                onChange={(e) => onChange("keterangan", e.target.value)}
                className={cn(errors.keterangan && "border-destructive focus-visible:ring-destructive/30")} />
              {errors.keterangan && <p className="text-xs text-destructive">{errors.keterangan}</p>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Photo upload area ─────────────────────────────────────────────────────────

function PhotoUpload({ photos, onChange, error }: { photos: PhotoEntry[]; onChange: (photos: PhotoEntry[]) => void; error?: string }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function processFiles(files: FileList) {
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) { toast.error(`Maksimal ${MAX_PHOTOS} foto`); return; }
    const validFiles = Array.from(files).slice(0, remaining).filter((f) => {
      if (!ACCEPTED_TYPES.includes(f.type)) { toast.error(`${f.name}: format tidak didukung.`); return false; }
      return true;
    });
    const newEntries: PhotoEntry[] = validFiles.map((file) => ({
      id: crypto.randomUUID(),
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : "",
      fileName: file.name, fileSize: file.size, keterangan: "",
    }));
    onChange([...photos, ...newEntries]);
  }

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false); processFiles(e.dataTransfer.files);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) { processFiles(e.target.files); e.target.value = ""; }
  }

  function handleRemove(id: string) {
    const photo = photos.find((p) => p.id === id);
    if (photo?.previewUrl) URL.revokeObjectURL(photo.previewUrl);
    onChange(photos.filter((p) => p.id !== id));
  }

  function handleCaptionChange(id: string, caption: string) {
    onChange(photos.map((p) => (p.id === id ? { ...p, keterangan: caption } : p)));
  }

  const canAdd = photos.length < MAX_PHOTOS;

  return (
    <div className="flex flex-col gap-3">
      {canAdd && (
        <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()} role="button" tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 transition-all",
            isDragging ? "border-primary bg-primary/5"
              : error ? "border-destructive/50 bg-destructive/5"
              : "border-border bg-muted/30 hover:border-primary/50 hover:bg-primary/5"
          )}>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Upload className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">{isDragging ? "Lepaskan file di sini" : "Klik atau seret file"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG, PDF - maks. {MAX_PHOTOS} file ({photos.length}/{MAX_PHOTOS} dipilih)</p>
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,application/pdf" multiple className="hidden" onChange={handleFileChange} />
      {error && <p className="text-xs text-destructive">{error}</p>}

      {photos.length > 0 && (
        <div className="flex flex-col gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
              <div className="flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                {photo.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo.previewUrl} alt={photo.fileName} className="h-full w-full object-cover" />
                ) : (
                  <FileImage className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-foreground truncate max-w-[200px]">{photo.fileName}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(photo.fileSize)}</p>
                  </div>
                  <button type="button" onClick={() => handleRemove(photo.id)}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    aria-label="Hapus foto">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <Input placeholder="Keterangan foto (opsional)" value={photo.keterangan}
                  onChange={(e) => handleCaptionChange(photo.id, e.target.value)} className="h-7 text-xs" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Validation ────────────────────────────────────────────────────────────────

type ItemErrors = Partial<Record<keyof ItemFormState, string>>;

function validateItems(items: GRItem[], states: Record<string, ItemFormState>): Record<string, ItemErrors> {
  const allErrors: Record<string, ItemErrors> = {};
  for (const item of items) {
    const s = states[item.id];
    const errs: ItemErrors = {};
    if (s.qtyTerima === "" || Number(s.qtyTerima) < 0) errs.qtyTerima = "Qty diterima harus diisi";
    if (!s.kondisi) errs.kondisi = "Kondisi harus dipilih";
    if (s.kondisi === "BAIK") {
      if (!s.batchNumber.trim()) errs.batchNumber = "No. Batch wajib diisi";
      if (!s.expiredDate) errs.expiredDate = "Expired date wajib diisi";
      else if (isAlreadyExpired(s.expiredDate)) errs.expiredDate = "Obat sudah kadaluarsa - tidak dapat diterima";
    }
    if (s.kondisi === "RUSAK" && !s.keterangan.trim()) errs.keterangan = "Keterangan kerusakan wajib diisi";
    if (Object.keys(errs).length > 0) allErrors[item.id] = errs;
  }
  return allErrors;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ApotekerInputFisikPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const { data: raw, isLoading } = useGRDetail(params.id);
  const saveDraft = useSaveDraftGR();
  const submitQC = useSubmitGRQC();

  const gr = raw as GoodReceipt | undefined;

  const [itemStates, setItemStates] = useState<Record<string, ItemFormState>>({});
  const [itemErrors, setItemErrors] = useState<Record<string, ItemErrors>>({});
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [photoError, setPhotoError] = useState("");
  const [catatanUmum, setCatatanUmum] = useState("");
  const [sendConfirmOpen, setSendConfirmOpen] = useState(false);

  // Initialize item states when gr loads
  const initializedRef = useRef(false);
  if (gr && !initializedRef.current) {
    initializedRef.current = true;
    const init = Object.fromEntries((gr.items ?? []).map((it) => [it.id, initItemState(it)]));
    // Only set if not already initialized
    if (Object.keys(itemStates).length === 0) {
      // use functional update won't work outside render, inline it
    }
    void init; // will be used in the derived state below
  }

  // Derived states for items
  const effectiveItemStates = useMemo(() => {
    if (!gr) return itemStates;
    const items = gr.items ?? [];
    const result: Record<string, ItemFormState> = {};
    for (const it of items) {
      result[it.id] = itemStates[it.id] ?? initItemState(it);
    }
    return result;
  }, [gr, itemStates]);

  // Catatan initial value from gr
  const [catatanInitialized, setCatatanInitialized] = useState(false);
  if (gr && !catatanInitialized) {
    setCatatanInitialized(true);
    if (gr.catatanApoteker) setCatatanUmum(gr.catatanApoteker);
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!gr) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Package className="h-12 w-12 text-muted-foreground opacity-40" />
        <div className="text-center">
          <p className="text-base font-medium">Good Receipt tidak ditemukan</p>
          <p className="text-sm text-muted-foreground mt-1">GR dengan ID &quot;{params.id}&quot; tidak tersedia.</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/apoteker/good-receipt")}>
          <ArrowLeft className="h-4 w-4" />Kembali
        </Button>
      </div>
    );
  }

  if (gr.status !== "MENUNGGU_INPUT" && gr.status !== "DITOLAK") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <CheckCircle2 className="h-12 w-12 text-muted-foreground opacity-40" />
        <div className="text-center">
          <p className="text-base font-medium">GR Tidak Dapat Diedit</p>
          <p className="text-sm text-muted-foreground mt-1">{gr.noGR} berstatus <strong>{gr.status}</strong>.</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/apoteker/good-receipt")}><ArrowLeft className="h-4 w-4" />Kembali</Button>
      </div>
    );
  }

  const isRevisi = gr.status === "DITOLAK";
  const items = gr.items ?? [];

  function updateItemField(itemId: string, field: keyof ItemFormState, value: string | number | "") {
    setItemStates((prev) => ({ ...prev, [itemId]: { ...(prev[itemId] ?? initItemState(items.find(i => i.id === itemId)!)), [field]: value } }));
    if (itemErrors[itemId]?.[field]) {
      setItemErrors((prev) => {
        const copy = { ...prev };
        if (copy[itemId]) {
          const itemCopy = { ...copy[itemId] };
          delete itemCopy[field];
          if (Object.keys(itemCopy).length === 0) delete copy[itemId];
          else copy[itemId] = itemCopy;
        }
        return copy;
      });
    }
  }

  function validate(requirePhotos: boolean): boolean {
    const errs = validateItems(items, effectiveItemStates);
    setItemErrors(errs);
    let photoErr = "";
    if (requirePhotos && photos.length === 0) {
      photoErr = "Minimal 1 foto bukti penerimaan wajib diupload";
      setPhotoError(photoErr);
    } else {
      setPhotoError("");
    }
    return Object.keys(errs).length === 0 && !photoErr;
  }

  async function handleSaveDraft() {
    if (!gr) return;
    await saveDraft.mutateAsync({
      id: gr.id,
      payload: {
        items: items.map((item) => {
          const s = effectiveItemStates[item.id];
          return {
            poItemId: item.id,
            qtyDiterima: Number(s?.qtyTerima ?? 0),
            batchNumber: s?.batchNumber,
            expiredDate: s?.expiredDate,
            tanggalProduksi: s?.tanggalProduksi,
            kondisi: (s?.kondisi || "BAIK") as "BAIK" | "RUSAK",
            keteranganKondisi: s?.keterangan,
          };
        }),
        catatanApoteker: catatanUmum || undefined,
      },
    });
  }

  function handleSendClick() {
    if (!validate(true)) {
      toast.error("Lengkapi semua data sebelum mengirim");
      return;
    }
    setSendConfirmOpen(true);
  }

  async function handleConfirmSend() {
    if (!gr) return;
    await submitQC.mutateAsync(gr.id);
    setSendConfirmOpen(false);
    router.push("/apoteker/good-receipt");
  }

  const isProcessing = saveDraft.isPending || submitQC.isPending;

  return (
    <div className="flex flex-col gap-6 pb-28">
      <PageHeader
        title={`Input Fisik ${gr.noGR}`}
        description={`Dari ${gr.noPO} · ${gr.supplierName} · Perkiraan tiba: ${formatDate(gr.tanggalPerkiraanDatang)}`}
        breadcrumb={[
          { label: "Good Receipt", href: "/apoteker/good-receipt" },
          { label: gr.noGR, href: `/apoteker/good-receipt/${gr.id}` },
          { label: isRevisi ? "Revisi" : "Input Fisik" },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push("/apoteker/good-receipt")}>
            <ArrowLeft className="h-4 w-4" />Batal
          </Button>
        }
      />

      {isRevisi && (
        <div className="rounded-lg border-2 border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/10 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
              <RotateCcw className="h-4 w-4 text-amber-700 dark:text-amber-400" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Revisi ke-{gr.revisiKe}</p>
                <span className="rounded-full bg-amber-200 dark:bg-amber-800/60 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                  Dikembalikan oleh Admin
                </span>
              </div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mt-1">Alasan penolakan:</p>
              <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">{gr.rejectedReason}</p>
              {gr.catatanAdmin && (
                <>
                  <Separator className="my-1 bg-amber-200 dark:bg-amber-700/50" />
                  <p className="text-xs text-amber-600 dark:text-amber-400 italic">
                    Instruksi Admin: &ldquo;{gr.catatanAdmin}&rdquo;
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {!isRevisi && gr.catatanAdmin && (
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800/50 dark:bg-blue-900/10 px-4 py-3">
          <div className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400">ℹ</div>
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Instruksi Admin</p>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-0.5">{gr.catatanAdmin}</p>
          </div>
        </div>
      )}

      {/* Per-item input */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-foreground">Input Per Item</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{items.length} item</span>
        </div>
        {items.map((item, index) => (
          <ItemCard key={item.id} item={item} index={index}
            state={effectiveItemStates[item.id] ?? initItemState(item)}
            errors={itemErrors[item.id] ?? {}}
            onChange={(field, value) => updateItemField(item.id, field, value)} />
        ))}
      </div>

      {/* Upload Bukti */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            Upload Bukti Penerimaan
            <span className="text-destructive text-base ml-0.5">*</span>
            <span className="ml-1 text-xs font-normal text-muted-foreground">(min. 1, maks. {MAX_PHOTOS} file)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <PhotoUpload photos={photos} onChange={(p) => { setPhotos(p); if (p.length > 0) setPhotoError(""); }} error={photoError} />
        </CardContent>
      </Card>

      {/* Catatan Umum */}
      <Card>
        <CardHeader className="border-b"><CardTitle>Catatan untuk Admin</CardTitle></CardHeader>
        <CardContent className="pt-4">
          <Textarea
            placeholder="Catatan tambahan untuk Admin - kondisi pengiriman, hal yang perlu diperhatikan, atau informasi lainnya..."
            rows={3} value={catatanUmum} onChange={(e) => setCatatanUmum(e.target.value)} />
        </CardContent>
      </Card>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm px-6 py-4 shadow-md">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground hidden sm:block">
            Pastikan semua data sudah benar sebelum mengirim ke Admin.
          </p>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleSaveDraft} disabled={isProcessing}>
              {saveDraft.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan Draft
            </Button>
            <Button onClick={handleSendClick} disabled={isProcessing}
              className={cn(isRevisi && "bg-amber-600 hover:bg-amber-700 text-white")}>
              {isRevisi ? (
                <><RotateCcw className="h-4 w-4" />Kirim Revisi ke Admin</>
              ) : (
                <><Send className="h-4 w-4" />Kirim ke Admin untuk Review</>
              )}
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={sendConfirmOpen}
        onOpenChange={(v) => { if (!v) setSendConfirmOpen(false); }}
        title={isRevisi ? "Kirim Revisi ke Admin?" : "Kirim ke Admin untuk Review?"}
        description={
          isRevisi
            ? "Pastikan semua data sudah diperbaiki sesuai catatan Admin. Data akan dikirim untuk direview ulang."
            : "Data input fisik akan dikirimkan ke Admin untuk disetujui. Pastikan semua data sudah benar."
        }
        confirmLabel={isRevisi ? "Kirim Revisi" : "Kirim ke Admin"}
        cancelLabel="Periksa Lagi"
        onConfirm={handleConfirmSend}
        isLoading={submitQC.isPending}
      />
    </div>
  );
}
