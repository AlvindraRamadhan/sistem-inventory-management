"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Check,
  Loader2,
  MoreHorizontal,
  Package,
  PenLine,
  Plus,
  PowerOff,
  RefreshCw,
  Tag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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
import { PageHeader } from "@/components/shared/page-header";
import { useKategoriList, useCreateKategori, useUpdateKategori, useDeleteKategori } from "@/hooks/queries/use-kategori";
import { useSatuanList, useCreateSatuan, useUpdateSatuan, useDeleteSatuan } from "@/hooks/queries/use-satuan";
import type { Kategori } from "@/services/kategori.service";
import type { Satuan } from "@/services/satuan.service";
import { cn } from "@/lib/utils";

// ─── UI-only constants (inlined from removed mock module) ─────────────────────

interface BadgeColorPreset {
  value: string;
  label: string;
  bg: string;
  text: string;
  dot: string;
}

const BADGE_COLORS: BadgeColorPreset[] = [
  { value: "blue",    label: "Biru",   bg: "bg-blue-100 dark:bg-blue-900/30",      text: "text-blue-700 dark:text-blue-400",     dot: "bg-blue-500"   },
  { value: "orange",  label: "Oranye", bg: "bg-orange-100 dark:bg-orange-900/30",  text: "text-orange-700 dark:text-orange-400", dot: "bg-orange-500" },
  { value: "rose",    label: "Merah",  bg: "bg-rose-100 dark:bg-rose-900/30",      text: "text-rose-700 dark:text-rose-400",     dot: "bg-rose-500"   },
  { value: "emerald", label: "Hijau",  bg: "bg-emerald-100 dark:bg-emerald-900/30",text: "text-emerald-700 dark:text-emerald-400",dot:"bg-emerald-500" },
  { value: "violet",  label: "Ungu",   bg: "bg-violet-100 dark:bg-violet-900/30",  text: "text-violet-700 dark:text-violet-400", dot: "bg-violet-500" },
  { value: "teal",    label: "Toska",  bg: "bg-teal-100 dark:bg-teal-900/30",      text: "text-teal-700 dark:text-teal-400",     dot: "bg-teal-500"   },
  { value: "amber",   label: "Kuning", bg: "bg-amber-100 dark:bg-amber-900/30",    text: "text-amber-700 dark:text-amber-400",   dot: "bg-amber-500"  },
  { value: "pink",    label: "Pink",   bg: "bg-pink-100 dark:bg-pink-900/30",      text: "text-pink-700 dark:text-pink-400",     dot: "bg-pink-500"   },
  { value: "cyan",    label: "Sian",   bg: "bg-cyan-100 dark:bg-cyan-900/30",      text: "text-cyan-700 dark:text-cyan-400",     dot: "bg-cyan-500"   },
  { value: "slate",   label: "Abu",    bg: "bg-slate-100 dark:bg-slate-800",       text: "text-slate-600 dark:text-slate-300",   dot: "bg-slate-500"  },
];

function getBadgeColor(warna: string): BadgeColorPreset {
  return BADGE_COLORS.find((c) => c.value === warna) ?? BADGE_COLORS[0];
}

function generateKategoriKode(nama: string): string {
  const raw = nama.replace(/[^A-Za-z]/g, "").toUpperCase();
  return raw.slice(0, 3) || "KAT";
}

function generateSatuanSingkatan(nama: string): string {
  const raw = nama.replace(/[^A-Za-z]/g, "").toUpperCase();
  if (raw.length <= 3) return raw;
  const consonants = raw.replace(/[AEIOU]/g, "");
  return (consonants.slice(0, 3) || raw.slice(0, 3)).toUpperCase();
}

function deriveKategoriColor(kode: string): string {
  const palette = ["blue","orange","rose","emerald","violet","teal","amber","pink","cyan","slate"];
  let hash = 0;
  for (const ch of kode) hash = (hash * 31 + ch.charCodeAt(0)) % palette.length;
  return palette[Math.abs(hash) % palette.length];
}

// ─── Extended types used in UI ────────────────────────────────────────────────

type KategoriItem = Kategori & { warna: string };
type SatuanItem = Satuan;

//  Schemas 

const kategoriSchema = z.object({
  kode: z
    .string()
    .min(2, "Minimal 2 karakter")
    .max(5, "Maksimal 5 karakter")
    .regex(/^[A-Z]+$/, "Hanya huruf kapital"),
  nama: z.string().min(2, "Nama minimal 2 karakter"),
  warna: z.string().min(1, "Pilih warna"),
  deskripsi: z.string().optional(),
});
type KategoriFormValues = z.infer<typeof kategoriSchema>;

const satuanSchema = z.object({
  singkatan: z
    .string()
    .min(1, "Minimal 1 karakter")
    .max(5, "Maksimal 5 karakter"),
  nama: z.string().min(2, "Nama minimal 2 karakter"),
});
type SatuanFormValues = z.infer<typeof satuanSchema>;

//  Color Picker 

function ColorPicker({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {BADGE_COLORS.map((color) => (
          <button
            key={color.value}
            type="button"
            onClick={() => onChange(color.value)}
            title={color.label}
            className={cn(
              "relative flex h-7 w-7 items-center justify-center rounded-full transition-all",
              color.dot,
              value === color.value
                ? "ring-2 ring-offset-2 ring-foreground/50 scale-110"
                : "hover:scale-105 opacity-70 hover:opacity-100"
            )}
          >
            {value === color.value && (
              <Check className="h-3.5 w-3.5 text-white drop-shadow" />
            )}
          </button>
        ))}
      </div>
      {value && (
        <div className="flex items-center gap-1.5">
          <Badge
            className={cn(
              "border-0 text-xs",
              getBadgeColor(value).bg,
              getBadgeColor(value).text
            )}
          >
            Pratinjau Label
          </Badge>
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

//  Kategori Card 

function KategoriCard({
  item,
  onEdit,
  onDelete,
}: {
  item: KategoriItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const color = getBadgeColor(item.warna);

  return (
    <div
      className="group relative flex items-start gap-3 rounded-lg border border-border px-4 py-3.5 transition-all hover:border-border/80 hover:shadow-sm"
    >
      {/* Left accent bar */}
      <span
        className={cn("absolute left-0 top-3 h-8 w-[3px] rounded-r transition-all", color.dot)}
      />

      {/* Content */}
      <div className="min-w-0 flex-1 pl-1">
        <div className="flex items-center gap-2 mb-1">
          <Badge
            className={cn("border-0 text-xs font-medium", color.bg, color.text)}
          >
            {item.nama}
          </Badge>
          <code className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
            {item.kode}
          </code>
        </div>
        {item.deskripsi && (
          <p className="text-xs text-muted-foreground leading-snug line-clamp-1">
            {item.deskripsi}
          </p>
        )}
        <div className="mt-2 flex items-center gap-3">
          <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Aktif
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-muted-foreground">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={onEdit}>
              <PenLine className="h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <PowerOff className="h-4 w-4" /> Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

//  Satuan Card

function SatuanCard({
  item,
  onEdit,
  onDelete,
}: {
  item: SatuanItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 transition-all hover:shadow-sm">
      {/* Monogram */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary text-sm">
        {item.singkatan.slice(0, 2)}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground">{item.nama}</p>
          <code className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
            {item.singkatan}
          </code>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400">Aktif</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-muted-foreground">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={onEdit}>
              <PenLine className="h-4 w-4" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <PowerOff className="h-4 w-4" /> Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

//  Field wrapper 

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">
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

// ─── Kategori Sheet Form ──────────────────────────────────────────────────────

function KategoriSheetForm({
  editingItem,
  onSave,
  onClose,
}: {
  editingItem?: KategoriItem;
  onSave: (values: KategoriFormValues, id?: string) => Promise<void>;
  onClose: () => void;
}) {
  const isEdit = !!editingItem;

  const form = useForm<KategoriFormValues>({
    resolver: zodResolver(kategoriSchema) as Resolver<KategoriFormValues>,
    defaultValues: { kode: "", nama: "", warna: "blue", deskripsi: "" },
  });

  const { register, handleSubmit, setValue, watch, reset, setError, formState: { errors, isSubmitting } } = form;

  // eslint-disable-next-line react-hooks/incompatible-library
  const namaValue = watch("nama");
   
  const warnaValue = watch("warna");

  // Auto-generate kode from nama (only in add mode, only when kode hasn't been manually changed)
  const [kodeManual, setKodeManual] = useState(false);
  useEffect(() => {
    if (!isEdit && !kodeManual && namaValue) {
      setValue("kode", generateKategoriKode(namaValue), { shouldValidate: false });
    }
  }, [namaValue, isEdit, kodeManual, setValue]);

  useEffect(() => {
    setKodeManual(false);
    reset(
      editingItem
        ? { kode: editingItem.kode, nama: editingItem.nama, warna: editingItem.warna, deskripsi: editingItem.deskripsi ?? "" }
        : { kode: "", nama: "", warna: "blue", deskripsi: "" }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingItem]);

  async function onSubmit(values: KategoriFormValues) {
    try {
      await onSave(values, editingItem?.id);
      onClose();
    } catch {
      // hook already shows error toast
    }
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-primary" />
          {isEdit ? "Edit Kategori" : "Tambah Kategori"}
        </SheetTitle>
        <SheetDescription>
          {isEdit ? `Perbarui data ${editingItem?.nama}` : "Tambahkan kategori baru ke sistem"}
        </SheetDescription>
      </SheetHeader>

      <Separator />

      <form id="kategori-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 px-4 py-4 flex-1 overflow-y-auto">
        <Field label="Nama Kategori" required error={errors.nama?.message}>
          <Input {...register("nama")} placeholder="contoh: Antibiotik" aria-invalid={!!errors.nama} />
        </Field>

        <Field label="Kode" required error={errors.kode?.message} hint="2–5 huruf kapital, auto dari nama">
          <div className="flex gap-2">
            <Input
              {...register("kode", {
                onChange: () => setKodeManual(true),
              })}
              placeholder="ANT"
              className="font-mono uppercase"
              style={{ textTransform: "uppercase" }}
              aria-invalid={!!errors.kode}
            />
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => {
                setValue("kode", generateKategoriKode(namaValue), { shouldValidate: true });
                setKodeManual(false);
              }}
              title="Generate dari nama"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Field>

        <Field label="Warna Badge" required error={errors.warna?.message}>
          <ColorPicker
            value={warnaValue}
            onChange={(v) => setValue("warna", v, { shouldValidate: true })}
            error={errors.warna?.message}
          />
        </Field>

        <Field label="Keterangan" error={errors.deskripsi?.message}>
          <Textarea
            {...register("deskripsi")}
            placeholder="Deskripsi singkat kategori ini"
            rows={3}
            className="resize-none"
          />
        </Field>
      </form>

      <Separator />

      <SheetFooter>
        <Button variant="outline" type="button" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" form="kategori-form" disabled={isSubmitting} className="min-w-[120px]">
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? "Menyimpan…" : isEdit ? "Simpan Perubahan" : "Tambah Kategori"}
        </Button>
      </SheetFooter>
    </>
  );
}

//  Satuan Sheet Form 

function SatuanSheetForm({
  editingItem,
  onSave,
  onClose,
}: {
  editingItem?: SatuanItem;
  onSave: (values: SatuanFormValues, id?: string) => Promise<void>;
  onClose: () => void;
}) {
  const isEdit = !!editingItem;

  const form = useForm<SatuanFormValues>({
    resolver: zodResolver(satuanSchema) as Resolver<SatuanFormValues>,
    defaultValues: { singkatan: "", nama: "" },
  });

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = form;

  // eslint-disable-next-line react-hooks/incompatible-library
  const namaValue = watch("nama");
  const [singkatanManual, setSingkatanManual] = useState(false);

  useEffect(() => {
    if (!isEdit && !singkatanManual && namaValue) {
      setValue("singkatan", generateSatuanSingkatan(namaValue), { shouldValidate: false });
    }
  }, [namaValue, isEdit, singkatanManual, setValue]);

  useEffect(() => {
    setSingkatanManual(false);
    reset(
      editingItem
        ? { singkatan: editingItem.singkatan, nama: editingItem.nama }
        : { singkatan: "", nama: "" }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingItem]);

  async function onSubmit(values: SatuanFormValues) {
    try {
      await onSave(values, editingItem?.id);
      onClose();
    } catch {
      // hook already shows error toast
    }
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-primary" />
          {isEdit ? "Edit Satuan" : "Tambah Satuan"}
        </SheetTitle>
        <SheetDescription>
          {isEdit ? `Perbarui data ${editingItem?.nama}` : "Tambahkan satuan obat baru"}
        </SheetDescription>
      </SheetHeader>

      <Separator />

      <form id="satuan-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 px-4 py-4 flex-1 overflow-y-auto">
        <Field label="Nama Satuan" required error={errors.nama?.message}>
          <Input {...register("nama")} placeholder="contoh: Tablet" aria-invalid={!!errors.nama} />
        </Field>

        <Field label="Singkatan" required error={errors.singkatan?.message} hint="1–5 karakter, auto dari nama">
          <div className="flex gap-2">
            <Input
              {...register("singkatan", { onChange: () => setSingkatanManual(true) })}
              placeholder="Tab"
              className="font-mono"
              aria-invalid={!!errors.singkatan}
            />
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => {
                setValue("singkatan", generateSatuanSingkatan(namaValue), { shouldValidate: true });
                setSingkatanManual(false);
              }}
              title="Generate dari nama"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </Field>

      </form>

      <Separator />

      <SheetFooter>
        <Button variant="outline" type="button" onClick={onClose}>
          Batal
        </Button>
        <Button type="submit" form="satuan-form" disabled={isSubmitting} className="min-w-[120px]">
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? "Menyimpan…" : isEdit ? "Simpan Perubahan" : "Tambah Satuan"}
        </Button>
      </SheetFooter>
    </>
  );
}

//  Section header 

function SectionHeader({
  icon: Icon,
  title,
  count,
  onAdd,
}: {
  icon: React.ElementType;
  title: string;
  count: number;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border px-5 py-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-3.5 w-3.5 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">{count} item</p>
        </div>
      </div>
      <Button size="action" onClick={onAdd}>
        <Plus className="h-4 w-4" />
        Tambah
      </Button>
    </div>
  );
}

//  Page 

export default function KategoriPage() {
  const { data: rawKategori = [], isLoading: loadingKategori } = useKategoriList();
  const { data: rawSatuan = [], isLoading: loadingSatuan } = useSatuanList();

  const createKategori = useCreateKategori();
  const updateKategori = useUpdateKategori();
  const deleteKategori = useDeleteKategori();
  const createSatuan = useCreateSatuan();
  const updateSatuan = useUpdateSatuan();
  const deleteSatuan = useDeleteSatuan();

  const kategoriList = useMemo<KategoriItem[]>(
    () => rawKategori.map((k) => ({ ...k, warna: deriveKategoriColor(k.kode) })),
    [rawKategori]
  );

  const [kategoriSheet, setKategoriSheet] = useState<{
    open: boolean;
    editingItem?: KategoriItem;
  }>({ open: false });

  const [satuanSheet, setSatuanSheet] = useState<{
    open: boolean;
    editingItem?: SatuanItem;
  }>({ open: false });

  async function saveKategori(values: KategoriFormValues, id?: string) {
    const dto = { kode: values.kode, nama: values.nama, deskripsi: values.deskripsi || undefined };
    if (id) {
      await updateKategori.mutateAsync({ id, data: dto });
    } else {
      await createKategori.mutateAsync(dto);
    }
  }

  async function saveSatuan(values: SatuanFormValues, id?: string) {
    const dto = { nama: values.nama, singkatan: values.singkatan };
    if (id) {
      await updateSatuan.mutateAsync({ id, data: dto });
    } else {
      await createSatuan.mutateAsync(dto);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Kategori & Satuan"
        description="Kelola pengelompokan obat dan satuan pengukuran yang digunakan di seluruh sistem"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* ── Kategori Obat ─────────────────────────────────────────────────── */}
        <Card className="flex flex-col gap-0 p-0 overflow-hidden">
          <SectionHeader
            icon={Tag}
            title="Kategori Obat"
            count={kategoriList.length}
            onAdd={() => setKategoriSheet({ open: true, editingItem: undefined })}
          />

          <div className="flex flex-col gap-2 px-3 py-3">
            {loadingKategori ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : kategoriList.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Belum ada kategori
              </p>
            ) : (
              kategoriList.map((item) => (
                <KategoriCard
                  key={item.id}
                  item={item}
                  onEdit={() => setKategoriSheet({ open: true, editingItem: item })}
                  onDelete={() => deleteKategori.mutate(item.id)}
                />
              ))
            )}
          </div>

          <div className="border-t border-border px-5 py-2.5 mt-auto">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                <span className="font-medium text-foreground">{kategoriList.length}</span>{" "}
                total
              </span>
            </div>
          </div>
        </Card>

        {/* ── Satuan Obat ───────────────────────────────────────────────────── */}
        <Card className="flex flex-col gap-0 p-0 overflow-hidden">
          <SectionHeader
            icon={Package}
            title="Satuan Obat"
            count={rawSatuan.length}
            onAdd={() => setSatuanSheet({ open: true, editingItem: undefined })}
          />

          <div className="flex flex-col gap-2 px-3 py-3">
            {loadingSatuan ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : rawSatuan.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Belum ada satuan
              </p>
            ) : (
              rawSatuan.map((item) => (
                <SatuanCard
                  key={item.id}
                  item={item}
                  onEdit={() => setSatuanSheet({ open: true, editingItem: item })}
                  onDelete={() => deleteSatuan.mutate(item.id)}
                />
              ))
            )}
          </div>

          <div className="border-t border-border px-5 py-2.5 mt-auto">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                <span className="font-medium text-foreground">{rawSatuan.length}</span>{" "}
                total
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Kategori Sheet ─────────────────────────────────────────────────── */}
      <Sheet
        open={kategoriSheet.open}
        onOpenChange={(open) => setKategoriSheet((s) => ({ ...s, open }))}
      >
        <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:max-w-[400px]">
          <KategoriSheetForm
            editingItem={kategoriSheet.editingItem}
            onSave={saveKategori}
            onClose={() => setKategoriSheet({ open: false })}
          />
        </SheetContent>
      </Sheet>

      {/* ── Satuan Sheet ───────────────────────────────────────────────────── */}
      <Sheet
        open={satuanSheet.open}
        onOpenChange={(open) => setSatuanSheet((s) => ({ ...s, open }))}
      >
        <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:max-w-[400px]">
          <SatuanSheetForm
            editingItem={satuanSheet.editingItem}
            onSave={saveSatuan}
            onClose={() => setSatuanSheet({ open: false })}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
