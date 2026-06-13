"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useForm,
  useFieldArray,
  useWatch,
  Controller,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronDown,
  Loader2,
  Package,
  PlusCircle,
  Send,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import {
  purchaseOrderSchema,
  type PurchaseOrderFormValues,
} from "@/lib/validations/procurement";
import { useObatList } from "@/hooks/queries/use-obat";
import { useSupplierList } from "@/hooks/queries/use-supplier";
import { useCreatePO } from "@/hooks/queries/use-purchase-order";
import { TERMIN_OPTIONS, TERMIN_LABEL } from "@/types/procurement";
import { cn } from "@/lib/utils";

//  Constants

const PPN_RATE = 0.11;

function formatRupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

//  Field wrapper

function Field({
  label,
  required,
  error,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ─── Obat search combobox ─────────────────────────────────────────────────────

interface ObatOption {
  id: string;
  kode: string;
  nama: string;
  satuan: string;
  hargaBeli: number;
}

function ObatCombobox({
  value,
  onChange,
  usedObatIds,
  obatOptions,
}: {
  value: string;
  onChange: (obatId: string, namaObat: string, satuanNama: string, hargaBeli: number) => void;
  usedObatIds: string[];
  obatOptions: ObatOption[];
}) {
  const [open, setOpen] = useState(false);
  const selectedObat = obatOptions.find((o) => o.id === value);

  function handleSelect(obatId: string) {
    const obat = obatOptions.find((o) => o.id === obatId);
    if (!obat) return;
    onChange(obat.id, obat.nama, obat.satuan, obat.hargaBeli);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs",
            "hover:bg-accent hover:text-accent-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            !selectedObat && "text-muted-foreground"
          )}
        >
          {selectedObat ? (
            <span className="truncate text-left">{selectedObat.nama}</span>
          ) : (
            <span>Pilih obat...</span>
          )}
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Cari nama atau kode obat..." />
          <CommandList>
            <CommandEmpty>Obat tidak ditemukan.</CommandEmpty>
            <CommandGroup>
              {obatOptions.map((obat) => {
                const isUsed = usedObatIds.includes(obat.id) && obat.id !== value;
                return (
                  <CommandItem
                    key={obat.id}
                    value={`${obat.nama} ${obat.kode}`}
                    disabled={isUsed}
                    onSelect={() => !isUsed && handleSelect(obat.id)}
                    data-checked={obat.id === value ? "true" : undefined}
                  >
                    <div className="flex flex-1 flex-col gap-0.5">
                      <span className={cn("text-sm", isUsed && "text-muted-foreground line-through")}>
                        {obat.nama}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {obat.kode} · {obat.satuan} · {formatRupiah(obat.hargaBeli)}
                      </span>
                    </div>
                    {isUsed && (
                      <span className="text-xs text-muted-foreground">Sudah dipilih</span>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

//  Item row

function ItemRow({
  index,
  usedObatIds,
  obatOptions,
  register,
  control,
  setValue,
  watch,
  remove,
  errors,
}: {
  index: number;
  usedObatIds: string[];
  obatOptions: ObatOption[];
  register: ReturnType<typeof useForm<PurchaseOrderFormValues>>["register"];
  control: ReturnType<typeof useForm<PurchaseOrderFormValues>>["control"];
  setValue: ReturnType<typeof useForm<PurchaseOrderFormValues>>["setValue"];
  watch: ReturnType<typeof useForm<PurchaseOrderFormValues>>["watch"];
  remove: (index: number) => void;
  errors: ReturnType<typeof useForm<PurchaseOrderFormValues>>["formState"]["errors"];
}) {
  const itemValues = watch(`items.${index}`);
  const subtotal = (itemValues?.qty ?? 0) * (itemValues?.hargaBeli ?? 0);
  const itemErrors = errors.items?.[index];

  function handleObatChange(
    obatId: string,
    namaObat: string,
    satuanNama: string,
    hargaBeli: number
  ) {
    setValue(`items.${index}.obatId`, obatId, { shouldValidate: true });
    setValue(`items.${index}.namaObat`, namaObat);
    setValue(`items.${index}.satuanNama`, satuanNama);
    setValue(`items.${index}.hargaBeli`, hargaBeli, { shouldValidate: true });
  }

  return (
    <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3">
      <div className="grid flex-1 grid-cols-[1fr_80px_110px_100px] items-start gap-2">
        {/* Obat select */}
        <div className="flex flex-col gap-1">
          <Controller
            control={control}
            name={`items.${index}.obatId`}
            render={({ field }) => (
              <ObatCombobox
                value={field.value ?? ""}
                onChange={handleObatChange}
                usedObatIds={usedObatIds}
                obatOptions={obatOptions}
              />
            )}
          />
          {itemErrors?.obatId && (
            <p className="text-xs text-destructive">{itemErrors.obatId.message}</p>
          )}
        </div>

        {/* Qty */}
        <div className="flex flex-col gap-1">
          <Input
            type="number"
            min={1}
            placeholder="Qty"
            {...register(`items.${index}.qty`, { valueAsNumber: true })}
            className="text-right tabular-nums"
          />
          {itemErrors?.qty && (
            <p className="text-xs text-destructive">{itemErrors.qty.message}</p>
          )}
        </div>

        {/* Harga/unit */}
        <div className="flex flex-col gap-1">
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground select-none">
              Rp
            </span>
            <Input
              type="number"
              min={0}
              placeholder="Harga"
              {...register(`items.${index}.hargaBeli`, { valueAsNumber: true })}
              className="pl-7 tabular-nums"
            />
          </div>
          {itemErrors?.hargaBeli && (
            <p className="text-xs text-destructive">{itemErrors.hargaBeli.message}</p>
          )}
        </div>

        {/* Subtotal */}
        <div className="flex h-9 items-center justify-end">
          <span className="text-sm font-medium tabular-nums text-foreground whitespace-nowrap">
            {formatRupiah(subtotal)}
          </span>
        </div>
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={() => remove(index)}
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        aria-label="Hapus item"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

//  Page

export default function BuatPurchaseOrderPage() {
  const router = useRouter();
  const [sendConfirmOpen, setSendConfirmOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<PurchaseOrderFormValues | null>(null);

  const { data: supplierRaw } = useSupplierList({ isActive: true, limit: 100 });
  const { data: obatRaw } = useObatList({ isActive: true, limit: 500 });
  const createPO = useCreatePO();

  const activeSuppliers = useMemo(() => supplierRaw?.data ?? [], [supplierRaw]);
  const activeObat = useMemo(
    (): ObatOption[] =>
      (obatRaw?.data ?? []).map((o) => ({
        id: o.id,
        kode: o.kode,
        nama: o.nama,
        satuan: o.satuan.nama,
        hargaBeli: parseFloat(o.hargaBeli) || 0,
      })),
    [obatRaw]
  );

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderSchema) as Resolver<PurchaseOrderFormValues>,
    defaultValues: {
      supplierId: "",
      tanggalPO: new Date().toISOString().slice(0, 10),
      terminPembayaran: "30_HARI",
      catatan: "",
      ppnIncluded: false,
      items: [{ obatId: "", namaObat: "", satuanNama: "", qty: 1, hargaBeli: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const watchedItems = useWatch({ control, name: "items" });
  const ppnIncluded = useWatch({ control, name: "ppnIncluded" });
  const watchedSupplierId = useWatch({ control, name: "supplierId" });

  const selectedSupplier = useMemo(
    () => activeSuppliers.find((s) => s.id === watchedSupplierId),
    [activeSuppliers, watchedSupplierId]
  );

  const usedObatIds = useMemo(
    () => watchedItems?.map((it) => it.obatId).filter(Boolean) ?? [],
    [watchedItems]
  );

  const subtotal = useMemo(
    () =>
      (watchedItems ?? []).reduce(
        (acc, it) => acc + (it.qty ?? 0) * (it.hargaBeli ?? 0),
        0
      ),
    [watchedItems]
  );

  const totalPPN = ppnIncluded ? Math.round(subtotal * PPN_RATE) : 0;
  const total = subtotal + totalPPN;

  function handleAddItem() {
    append({ obatId: "", namaObat: "", satuanNama: "", qty: 1, hargaBeli: 0 });
  }

  async function savePO(values: PurchaseOrderFormValues, status: "DRAFT" | "SENT") {
    await createPO.mutateAsync({
      supplierId: values.supplierId,
      tanggalKirim: values.tanggalPO,
      terminPembayaran: values.terminPembayaran ?? "30_HARI",
      ppnIncluded: values.ppnIncluded ?? false,
      catatan: values.catatan ?? undefined,
      items: values.items.map((it) => ({
        obatId: it.obatId,
        qty: it.qty,
        hargaBeli: it.hargaBeli,
      })),
    });
    setSendConfirmOpen(false);
    router.push("/admin/procurement/purchase-order");
  }

  function handleSaveDraft(values: PurchaseOrderFormValues) {
    savePO(values, "DRAFT");
  }

  function handleSendClick(values: PurchaseOrderFormValues) {
    setPendingValues(values);
    setSendConfirmOpen(true);
  }

  function handleConfirmSend() {
    if (pendingValues) savePO(pendingValues, "SENT");
  }

  return (
    <div className="flex flex-col gap-6">
      {/*  Header  */}
      <PageHeader
        title="Buat Purchase Order"
        description="Buat dokumen pemesanan baru kepada supplier"
        breadcrumb={[
          { label: "Procurement" },
          { label: "Purchase Order", href: "/admin/procurement/purchase-order" },
          { label: "Buat Baru" },
        ]}
      />

      {/*  Two-column layout  */}
      <div className="grid grid-cols-1 lg:grid-cols-5 items-start gap-6">

        {/*  Left panel (60%)  */}
        <div className="lg:col-span-3 flex flex-col gap-5">

          {/* Section 1: Info PO */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Informasi Purchase Order</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Tanggal PO */}
                <Field
                  label="Tanggal PO"
                  required
                  error={errors.tanggalPO?.message}
                  className="col-span-2 sm:col-span-1"
                >
                  <Input
                    type="date"
                    {...register("tanggalPO")}
                  />
                </Field>

                {/* Supplier */}
                <Field
                  label="Supplier"
                  required
                  error={errors.supplierId?.message}
                  className="col-span-2"
                >
                  <Controller
                    control={control}
                    name="supplierId"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih supplier aktif..." />
                        </SelectTrigger>
                        <SelectContent>
                          {activeSuppliers.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.nama}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>

                {/* Termin Pembayaran */}
                <Field
                  label="Termin Pembayaran"
                  required
                  error={errors.terminPembayaran?.message}
                  className="col-span-2 sm:col-span-1"
                >
                  <Controller
                    control={control}
                    name="terminPembayaran"
                    render={({ field }) => (
                      <Select value={field.value ?? ""} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih termin..." />
                        </SelectTrigger>
                        <SelectContent>
                          {TERMIN_OPTIONS.map((t) => (
                            <SelectItem key={t} value={t}>
                              {TERMIN_LABEL[t]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>

                {/* Catatan */}
                <Field
                  label="Catatan"
                  className="col-span-2"
                >
                  <Textarea
                    placeholder="Catatan tambahan (opsional)..."
                    rows={2}
                    {...register("catatan")}
                  />
                </Field>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Daftar Item */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Daftar Item</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {/* Column headers */}
              {fields.length > 0 && (
                <div className="mb-2 grid grid-cols-[1fr_80px_110px_100px_32px] gap-2 px-3">
                  <span className="text-xs font-medium text-muted-foreground">Obat</span>
                  <span className="text-xs font-medium text-muted-foreground text-right">Qty</span>
                  <span className="text-xs font-medium text-muted-foreground">Harga / Unit</span>
                  <span className="text-xs font-medium text-muted-foreground text-right">Subtotal</span>
                  <span />
                </div>
              )}

              {/* Item rows */}
              <div className="flex flex-col gap-2">
                {fields.map((field, index) => (
                  <ItemRow
                    key={field.id}
                    index={index}
                    usedObatIds={usedObatIds}
                    obatOptions={activeObat}
                    register={register}
                    control={control}
                    setValue={setValue}
                    watch={watch}
                    remove={remove}
                    errors={errors}
                  />
                ))}
              </div>

              {/* Items error */}
              {errors.items?.root?.message && (
                <p className="mt-2 text-xs text-destructive">
                  {errors.items.root.message}
                </p>
              )}
              {typeof errors.items?.message === "string" && (
                <p className="mt-2 text-xs text-destructive">{errors.items.message}</p>
              )}

              {/* Add item button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="mt-3 w-full border-dashed"
              >
                <PlusCircle className="h-4 w-4" />
                Tambah Item
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ── Right panel (40%, sticky) ────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="sticky top-6 flex flex-col gap-4">
            <Card>
              <CardHeader className="border-b">
                <CardTitle>Ringkasan PO</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {/* Items preview */}
                {watchedItems && watchedItems.filter((it) => it.obatId).length > 0 ? (
                  <div className="mb-4 flex flex-col gap-1.5">
                    {watchedItems
                      .filter((it) => it.obatId)
                      .map((it, i) => {
                        const obat = activeObat.find((o) => o.id === it.obatId);
                        const sub = (it.qty ?? 0) * (it.hargaBeli ?? 0);
                        return (
                          <div key={i} className="flex items-start justify-between gap-2 text-sm">
                            <div className="flex flex-col">
                              <span className="font-medium leading-snug">{obat?.nama ?? "-"}</span>
                              <span className="text-xs text-muted-foreground">
                                {it.qty ?? 0} × {formatRupiah(it.hargaBeli ?? 0)}
                              </span>
                            </div>
                            <span className="shrink-0 tabular-nums text-right">
                              {formatRupiah(sub)}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <div className="mb-4 flex flex-col items-center gap-2 py-4 text-muted-foreground">
                    <Package className="h-8 w-8 opacity-30" />
                    <p className="text-xs">Belum ada item ditambahkan</p>
                  </div>
                )}

                <Separator className="mb-4" />

                {/* Totals */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="tabular-nums font-medium">{formatRupiah(subtotal)}</span>
                  </div>

                  {/* PPN toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm text-muted-foreground">PPN 11%</span>
                      {ppnIncluded && (
                        <span className="text-xs text-muted-foreground tabular-nums">
                          +{formatRupiah(totalPPN)}
                        </span>
                      )}
                    </div>
                    <Controller
                      control={control}
                      name="ppnIncluded"
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          aria-label="Sertakan PPN 11%"
                        />
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Total</span>
                    <span className="text-base font-bold tabular-nums text-foreground">
                      {formatRupiah(total)}
                    </span>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Action buttons */}
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={createPO.isPending}
                    onClick={handleSubmit(handleSaveDraft)}
                  >
                    {createPO.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : null}
                    Simpan Draft
                  </Button>

                  <Button
                    type="button"
                    className="w-full"
                    disabled={createPO.isPending}
                    onClick={handleSubmit(handleSendClick)}
                  >
                    {createPO.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Kirim ke Supplier
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/*  Send confirm dialog  */}
      <ConfirmDialog
        open={sendConfirmOpen}
        onOpenChange={(v) => {
          if (!v) {
            setSendConfirmOpen(false);
            setPendingValues(null);
          }
        }}
        title={`Kirim PO ke ${selectedSupplier?.nama ?? "supplier"}?`}
        description="PO yang sudah dikirim tidak dapat diedit. Pastikan semua item dan harga sudah benar sebelum melanjutkan."
        confirmLabel="Ya, Kirim PO"
        cancelLabel="Periksa Lagi"
        onConfirm={handleConfirmSend}
        isLoading={createPO.isPending}
      />
    </div>
  );
}
