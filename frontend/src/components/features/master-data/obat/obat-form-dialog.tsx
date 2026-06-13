"use client";

import { useEffect } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { obatBaseSchema, type ObatFormValues } from "@/lib/validations/obat";
import {
  KATEGORI_OBAT,
  SATUAN_OBAT,
  generateObatKode,
} from "@/lib/constants/obat-reference";
import type { Obat } from "@/types/inventory";
import type { LokasiGudang } from "@/services/lokasi-gudang.service";
import { useLokasiGudangList } from "@/hooks/queries/use-lokasi-gudang";

// ─── Field primitives ─────────────────────────────────────────────────────────

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

// ─── Lokasi grouped select ────────────────────────────────────────────────────
// Renders RAK and LACI under their parent Gudang label

function LokasiSelectItems({ nodes = [] }: { nodes?: LokasiGudang[] }) {
  return (
    <>
      {nodes.map((node) => {
        if (node.tipe === "GUDANG" || node.tipe === "RUANG") {
          if (!node.children?.length) return null;
          return (
            <SelectGroup key={node.id}>
              <SelectLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {node.nama}
              </SelectLabel>
              <LokasiSelectItems nodes={node.children} />
            </SelectGroup>
          );
        }
        // RAK and LACI are selectable
        const indent = node.tipe === "LACI" ? "pl-5" : "pl-3";
        return (
          <SelectItem key={node.id} value={node.id} className={indent}>
            {node.nama}
          </SelectItem>
        );
      })}
    </>
  );
}

// ─── Main dialog component ────────────────────────────────────────────────────

interface ObatFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingObat?: Obat;
  existingObat: Obat[];
  onSave: (values: ObatFormValues, editingId?: string) => Promise<void>;
}

export function ObatFormDialog({
  open,
  onOpenChange,
  editingObat,
  existingObat,
  onSave,
}: ObatFormDialogProps) {
  const isEdit = !!editingObat;
  const { data: lokasiData } = useLokasiGudangList();

  const form = useForm<ObatFormValues>({
    resolver: zodResolver(obatBaseSchema) as Resolver<ObatFormValues>,
    defaultValues: {
      kode: "",
      nama: "",
      kategoriId: "",
      satuanId: "",
      hargaBeli: 0,
      lokasiDefaultId: "",
      stokMinimal: 0,
      stokMaksimal: 0,
      keterangan: "",
      isActive: true,
    },
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  // Reset form whenever dialog opens/closes or editing obat changes
  useEffect(() => {
    if (open) {
      reset(
        editingObat
          ? {
              kode: editingObat.kode,
              nama: editingObat.nama,
              kategoriId: editingObat.kategoriId,
              satuanId: editingObat.satuanId,
              hargaBeli: editingObat.hargaBeli,
              lokasiDefaultId: editingObat.lokasiDefaultId ?? "",
              stokMinimal: editingObat.stokMinimal,
              stokMaksimal: editingObat.stokMaksimal ?? 0,
              keterangan: "",
              isActive: editingObat.isActive,
            }
          : {
              kode: generateObatKode(existingObat),
              nama: "",
              kategoriId: "",
              satuanId: "",
              hargaBeli: 0,
              lokasiDefaultId: "",
              stokMinimal: 0,
              stokMaksimal: 0,
              keterangan: "",
              isActive: true,
            }
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingObat]);

  async function onSubmit(values: ObatFormValues) {
    // Check kode uniqueness (skip for edit if kode unchanged)
    const isDuplicate = existingObat.some(
      (o) =>
        o.kode === values.kode &&
        (!isEdit || o.id !== editingObat?.id)
    );
    if (isDuplicate) {
      setError("kode", { message: "Kode obat sudah digunakan" });
      return;
    }

    try {
      await onSave(values, editingObat?.id);
      toast.success(isEdit ? "Obat berhasil diperbarui" : "Obat berhasil ditambahkan", {
        description: `${values.nama} (${values.kode})`,
      });
      onOpenChange(false);
    } catch {
      toast.error("Gagal menyimpan data", { description: "Silakan coba lagi." });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl gap-0 p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>{isEdit ? "Edit Obat" : "Tambah Obat Baru"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Perbarui data obat ${editingObat?.nama}`
              : "Lengkapi informasi obat. Kolom bertanda * wajib diisi."}
          </DialogDescription>
        </DialogHeader>

        <Separator />

        {/* Form body — scrollable */}
        <ScrollArea className="max-h-[60vh]">
          <form id="obat-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-5 px-6 py-5">

              {/* ── Row 1: ID + Nama ────────────────────────────────────── */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FieldWrapper
                  label="ID Obat"
                  htmlFor="obat-kode"
                  required
                  error={errors.kode?.message}
                  hint="Format: OBT-XXX"
                >
                  <Input
                    id="obat-kode"
                    {...register("kode")}
                    placeholder="OBT-021"
                    className="font-mono"
                    aria-invalid={!!errors.kode}
                  />
                </FieldWrapper>

                <FieldWrapper label="Nama Obat" htmlFor="obat-nama" required error={errors.nama?.message}>
                  <Input
                    id="obat-nama"
                    {...register("nama")}
                    placeholder="Contoh: Amoxicillin 500mg"
                    aria-invalid={!!errors.nama}
                  />
                </FieldWrapper>
              </div>

              {/* ── Row 2: Kategori + Satuan ─────────────────────────────── */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FieldWrapper label="Kategori" htmlFor="obat-kategori" required error={errors.kategoriId?.message}>
                  <Controller
                    control={control}
                    name="kategoriId"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger
                          id="obat-kategori"
                          className="w-full"
                          aria-invalid={!!errors.kategoriId}
                        >
                          <SelectValue placeholder="Pilih kategori..." />
                        </SelectTrigger>
                        <SelectContent>
                          {KATEGORI_OBAT.map((k) => (
                            <SelectItem key={k.id} value={k.id}>
                              {k.nama}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FieldWrapper>

                <FieldWrapper label="Satuan" htmlFor="obat-satuan" required error={errors.satuanId?.message}>
                  <Controller
                    control={control}
                    name="satuanId"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="obat-satuan" className="w-full" aria-invalid={!!errors.satuanId}>
                          <SelectValue placeholder="Pilih satuan..." />
                        </SelectTrigger>
                        <SelectContent>
                          {SATUAN_OBAT.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.nama}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FieldWrapper>
              </div>

              {/* ── Row 3: Harga + Lokasi ────────────────────────────────── */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FieldWrapper
                  label="Harga Satuan (Rp)"
                  htmlFor="obat-harga"
                  required
                  error={errors.hargaBeli?.message}
                >
                  <Input
                    id="obat-harga"
                    {...register("hargaBeli", { valueAsNumber: true })}
                    type="number"
                    min={0}
                    placeholder="2500"
                    aria-invalid={!!errors.hargaBeli}
                  />
                </FieldWrapper>

                <FieldWrapper
                  label="Lokasi Default"
                  htmlFor="obat-lokasi"
                  error={errors.lokasiDefaultId?.message}
                  hint="Rak atau laci penyimpanan utama"
                >
                  <Controller
                    control={control}
                    name="lokasiDefaultId"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value ?? ""}>
                        <SelectTrigger id="obat-lokasi" className="w-full">
                          <SelectValue placeholder="Pilih lokasi..." />
                        </SelectTrigger>
                        <SelectContent>
                          <LokasiSelectItems nodes={lokasiData ?? []} />
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FieldWrapper>
              </div>

              {/* ── Row 4: Stok Min + Stok Max ──────────────────────────── */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FieldWrapper
                  label="Stok Minimum"
                  htmlFor="obat-stok-min"
                  error={errors.stokMinimal?.message}
                  hint="Safety stock — pemicu alert stok kritis"
                >
                  <Input
                    id="obat-stok-min"
                    {...register("stokMinimal", { valueAsNumber: true })}
                    type="number"
                    min={0}
                    placeholder="100"
                    aria-invalid={!!errors.stokMinimal}
                  />
                </FieldWrapper>

                <FieldWrapper
                  label="Stok Maksimum"
                  htmlFor="obat-stok-max"
                  error={errors.stokMaksimal?.message}
                  hint="Batas kapasitas penyimpanan"
                >
                  <Input
                    id="obat-stok-max"
                    {...register("stokMaksimal", { valueAsNumber: true })}
                    type="number"
                    min={0}
                    placeholder="1000"
                    aria-invalid={!!errors.stokMaksimal}
                  />
                </FieldWrapper>
              </div>

              {/* ── Keterangan ───────────────────────────────────────────── */}
              <FieldWrapper label="Keterangan" htmlFor="obat-keterangan" error={errors.keterangan?.message}>
                <Textarea
                  id="obat-keterangan"
                  {...register("keterangan")}
                  placeholder="Catatan tambahan mengenai obat ini (opsional)"
                  rows={3}
                  className="resize-none"
                />
              </FieldWrapper>

              {/* ── Status toggle ─────────────────────────────────────────── */}
              <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div>
                  <p id="obat-status-label" className="text-sm font-medium text-foreground">Status Obat</p>
                  <p className="text-xs text-muted-foreground">
                    Obat aktif dapat digunakan di semua modul
                  </p>
                </div>
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "text-xs font-medium",
                          field.value ? "text-primary" : "text-muted-foreground"
                        )}
                      >
                        {field.value ? "Aktif" : "Tidak Aktif"}
                      </span>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-labelledby="obat-status-label"
                        aria-checked={field.value}
                      />
                    </div>
                  )}
                />
              </div>
            </div>
          </form>
        </ScrollArea>

        <Separator />

        {/* Footer */}
        <DialogFooter showCloseButton className="px-6 py-4">
          <Button
            type="submit"
            form="obat-form"
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting
              ? isEdit
                ? "Menyimpan…"
                : "Menambahkan…"
              : isEdit
                ? "Simpan Perubahan"
                : "Tambah Obat"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
