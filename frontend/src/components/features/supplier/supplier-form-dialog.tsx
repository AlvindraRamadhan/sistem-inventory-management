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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { supplierBaseSchema, type SupplierFormValues } from "@/lib/validations/supplier";
import type { Supplier } from "@/types/supplier";

function generateSupplierKode(existing: Supplier[]): string {
  const nums = existing
    .map((s) => s.kode)
    .filter((k) => /^SUP-\d{3}$/.test(k))
    .map((k) => parseInt(k.slice(4)))
    .filter((n) => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `SUP-${String(next).padStart(3, "0")}`;
}

// ─── FieldWrapper ─────────────────────────────────────────────────────────────

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

// ─── SupplierFormDialog ───────────────────────────────────────────────────────

interface SupplierFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSupplier?: Supplier;
  existingSuppliers: Supplier[];
  onSave: (values: SupplierFormValues, editingId?: string) => Promise<void>;
}

export function SupplierFormDialog({
  open,
  onOpenChange,
  editingSupplier,
  existingSuppliers,
  onSave,
}: SupplierFormDialogProps) {
  const isEdit = !!editingSupplier;

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierBaseSchema) as Resolver<SupplierFormValues>,
    defaultValues: {
      kode: "",
      nama: "",
      kontakPerson: "",
      telepon: "",
      email: "",
      kota: "",
      status: "AKTIF",
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        editingSupplier
          ? {
              kode: editingSupplier.kode,
              nama: editingSupplier.nama,
              kontakPerson: editingSupplier.kontakPerson,
              telepon: editingSupplier.telepon,
              email: editingSupplier.email,
              kota: editingSupplier.kota,
              status: editingSupplier.status,
            }
          : {
              kode: generateSupplierKode(existingSuppliers),
              nama: "",
              kontakPerson: "",
              telepon: "",
              email: "",
              kota: "",
              status: "AKTIF",
            }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingSupplier]);

  async function onSubmit(values: SupplierFormValues) {
    const isDuplicateKode = existingSuppliers.some(
      (s) =>
        s.kode === values.kode &&
        (!isEdit || s.id !== editingSupplier?.id)
    );
    if (isDuplicateKode) {
      setError("kode", { message: "Kode supplier sudah digunakan" });
      return;
    }

    const isDuplicateEmail = existingSuppliers.some(
      (s) =>
        s.email.toLowerCase() === values.email.toLowerCase() &&
        (!isEdit || s.id !== editingSupplier?.id)
    );
    if (isDuplicateEmail) {
      setError("email", { message: "Email sudah digunakan supplier lain" });
      return;
    }

    try {
      await onSave(values, editingSupplier?.id);
      onOpenChange(false);
    } catch {
      toast.error("Gagal menyimpan data", { description: "Silakan coba lagi." });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>
            {isEdit ? "Edit Supplier" : "Tambah Supplier Baru"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Perbarui data supplier ${editingSupplier?.nama}`
              : "Lengkapi informasi supplier. Kolom bertanda * wajib diisi."}
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <ScrollArea className="max-h-[65vh]">
          <form id="supplier-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-5 px-6 py-5">

              {/* ── Row 1: Kode + Nama ─────────────────────────────────── */}
              <div className="grid grid-cols-2 gap-4">
                <FieldWrapper
                  label="Kode Supplier"
                  htmlFor="sup-kode"
                  required
                  error={errors.kode?.message}
                  hint="Format: SUP-XXX"
                >
                  <Input
                    id="sup-kode"
                    {...register("kode")}
                    placeholder="SUP-011"
                    className="font-mono"
                    aria-invalid={!!errors.kode}
                  />
                </FieldWrapper>

                <FieldWrapper
                  label="Nama Supplier"
                  htmlFor="sup-nama"
                  required
                  error={errors.nama?.message}
                >
                  <Input
                    id="sup-nama"
                    {...register("nama")}
                    placeholder="Contoh: PT. Kimia Farma"
                    aria-invalid={!!errors.nama}
                  />
                </FieldWrapper>
              </div>

              {/* ── Row 2: Kontak Person + Kota ────────────────────────── */}
              <div className="grid grid-cols-2 gap-4">
                <FieldWrapper
                  label="Kontak Person"
                  htmlFor="sup-kontak"
                  required
                  error={errors.kontakPerson?.message}
                >
                  <Input
                    id="sup-kontak"
                    {...register("kontakPerson")}
                    placeholder="Nama penanggung jawab"
                    aria-invalid={!!errors.kontakPerson}
                  />
                </FieldWrapper>

                <FieldWrapper
                  label="Kota"
                  htmlFor="sup-kota"
                  required
                  error={errors.kota?.message}
                >
                  <Input
                    id="sup-kota"
                    {...register("kota")}
                    placeholder="Contoh: Jakarta"
                    aria-invalid={!!errors.kota}
                  />
                </FieldWrapper>
              </div>

              {/* ── Row 3: Telepon + Email ─────────────────────────────── */}
              <div className="grid grid-cols-2 gap-4">
                <FieldWrapper
                  label="Nomor Telepon"
                  htmlFor="sup-telepon"
                  required
                  error={errors.telepon?.message}
                  hint="Contoh: 0812-3456-7890"
                >
                  <Input
                    id="sup-telepon"
                    {...register("telepon")}
                    placeholder="021-xxxx-xxxx"
                    type="tel"
                    inputMode="tel"
                    aria-invalid={!!errors.telepon}
                  />
                </FieldWrapper>

                <FieldWrapper
                  label="Email"
                  htmlFor="sup-email"
                  required
                  error={errors.email?.message}
                >
                  <Input
                    id="sup-email"
                    {...register("email")}
                    placeholder="pengadaan@supplier.com"
                    type="email"
                    inputMode="email"
                    aria-invalid={!!errors.email}
                  />
                </FieldWrapper>
              </div>

              {/* ── Status toggle ─────────────────────────────────────── */}
              <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div>
                  <p id="sup-status-label" className="text-sm font-medium text-foreground">
                    Status Supplier
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supplier aktif dapat dipilih pada form pengadaan
                  </p>
                </div>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "text-xs font-medium",
                          field.value === "AKTIF"
                            ? "text-primary"
                            : "text-muted-foreground"
                        )}
                      >
                        {field.value === "AKTIF" ? "Aktif" : "Tidak Aktif"}
                      </span>
                      <Switch
                        checked={field.value === "AKTIF"}
                        onCheckedChange={(checked) =>
                          field.onChange(checked ? "AKTIF" : "TIDAK_AKTIF")
                        }
                        aria-labelledby="sup-status-label"
                        aria-checked={field.value === "AKTIF"}
                      />
                    </div>
                  )}
                />
              </div>
            </div>
          </form>
        </ScrollArea>

        <Separator />

        <DialogFooter showCloseButton className="px-6 py-4">
          <Button
            type="submit"
            form="supplier-form"
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
                : "Tambah Supplier"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
