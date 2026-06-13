"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ClipboardList,
  Loader2,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/page-header";
import { useReceivablePOs, useCreateGR } from "@/hooks/queries/use-good-receipt";
import type { PurchaseOrder } from "@/types/procurement";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ─── Inner form ───────────────────────────────────────────────────────────────

function BuatPreGRForm() {
  const router = useRouter();
  const params = useSearchParams();
  const preSelectedPoId = params.get("poId") ?? "";

  const [selectedPoId, setSelectedPoId] = useState(preSelectedPoId);
  const [tanggalPerkiraan, setTanggalPerkiraan] = useState("");
  const [catatanAdmin, setCatatanAdmin] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: receivableRaw, isLoading: isLoadingPOs } = useReceivablePOs();
  const createGR = useCreateGR();

  // API may return a plain array or a paginated wrapper
  const sentPOs = useMemo<PurchaseOrder[]>(() => {
    if (!receivableRaw) return [];
    if (Array.isArray(receivableRaw)) return receivableRaw as PurchaseOrder[];
    // PaginatedResponse shape
    const r = receivableRaw as { data?: PurchaseOrder[] };
    return r.data ?? [];
  }, [receivableRaw]);

  const selectedPO = useMemo(
    () => sentPOs.find((po) => po.id === selectedPoId),
    [sentPOs, selectedPoId]
  );

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!selectedPoId) e.poId = "PO wajib dipilih";
    if (!tanggalPerkiraan) e.tanggal = "Tanggal perkiraan datang wajib diisi";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    await createGR.mutateAsync({
      purchaseOrderId: selectedPoId,
      tanggalPerkiraanDatang: tanggalPerkiraan,
      tanggalTerima: tanggalPerkiraan,
      catatanAdmin: catatanAdmin.trim() || undefined,
    });
    router.push("/admin/procurement/good-receipt");
  }

  const isValid = !!selectedPoId && !!tanggalPerkiraan;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Buat Pre-GR"
        description="Buat dokumen penerimaan barang untuk dikirimkan ke Apoteker"
        breadcrumb={[
          { label: "Procurement" },
          { label: "Good Receipt", href: "/admin/procurement/good-receipt" },
          { label: "Buat Pre-GR" },
        ]}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push("/admin/procurement/good-receipt")}>
            <ArrowLeft />Batal
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-5 items-start">
        {/* ── Form (left / 3 col) ── */}
        <div className="md:col-span-3">
          <Card>
            <CardHeader className="border-b"><CardTitle>Informasi Pre-GR</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-5 pt-5">
              {/* PO selection */}
              <Field label="Purchase Order" required error={errors.poId}>
                <Select value={selectedPoId} onValueChange={setSelectedPoId} disabled={isLoadingPOs}>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingPOs ? "Memuat PO…" : "Pilih PO dengan status Terkirim..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {sentPOs.length === 0 ? (
                      <div className="py-4 text-center text-sm text-muted-foreground">
                        Tidak ada PO berstatus Terkirim
                      </div>
                    ) : (
                      sentPOs.map((po) => (
                        <SelectItem key={po.id} value={po.id}>
                          <span className="font-mono">{po.noPO}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            - {po.supplierName.split(" ").slice(0, 3).join(" ")}
                          </span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </Field>

              {/* PO info preview */}
              {selectedPO && (
                <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Item dalam PO ini</p>
                  <p className="mb-2 font-medium text-foreground">{selectedPO.supplierName}</p>
                  <Separator className="mb-2" />
                  <div className="flex flex-col gap-1.5">
                    {(selectedPO.items ?? []).map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-2">
                        <span className="text-foreground">{item.namaObat}</span>
                        <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                          {item.qty.toLocaleString("id-ID")} {item.satuanNama}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tanggal Perkiraan Datang */}
              <Field label="Tanggal Perkiraan Datang" required error={errors.tanggal}>
                <Input
                  type="date"
                  value={tanggalPerkiraan}
                  onChange={(e) => setTanggalPerkiraan(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                />
              </Field>

              {/* Catatan untuk Apoteker */}
              <Field label="Catatan untuk Apoteker">
                <Textarea
                  placeholder="Instruksi khusus, hal yang perlu diperhatikan Apoteker saat menerima barang..."
                  rows={4}
                  value={catatanAdmin}
                  onChange={(e) => setCatatanAdmin(e.target.value)}
                />
              </Field>
            </CardContent>
          </Card>
        </div>

        {/* ── Summary (right / 2 col) ── */}
        <div className="md:col-span-2">
          <div className="sticky top-6">
            <Card>
              <CardHeader className="border-b"><CardTitle>Ringkasan</CardTitle></CardHeader>
              <CardContent className="pt-4">
                {selectedPO ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2 text-sm">
                      <span className="text-muted-foreground shrink-0">PO</span>
                      <span className="font-mono font-medium text-right">{selectedPO.noPO}</span>
                    </div>
                    <div className="flex items-start justify-between gap-2 text-sm">
                      <span className="text-muted-foreground shrink-0">Supplier</span>
                      <span className="font-medium text-right text-foreground max-w-[180px] truncate">{selectedPO.supplierName}</span>
                    </div>
                    <div className="flex items-start justify-between gap-2 text-sm">
                      <span className="text-muted-foreground shrink-0">Total Item</span>
                      <span className="font-medium">{(selectedPO.items ?? []).length} jenis</span>
                    </div>
                    <div className="flex items-start justify-between gap-2 text-sm">
                      <span className="text-muted-foreground shrink-0">Nilai PO</span>
                      <span className="font-medium tabular-nums">{formatRupiah(selectedPO.totalNilai)}</span>
                    </div>
                    {tanggalPerkiraan && (
                      <div className="flex items-start justify-between gap-2 text-sm">
                        <span className="text-muted-foreground shrink-0">Tgl. Tiba</span>
                        <span className="font-medium">{tanggalPerkiraan}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Pilih PO untuk melihat ringkasan.</p>
                )}

                <Separator className="my-4" />

                <Button className="w-full" onClick={handleSubmit} disabled={!isValid || createGR.isPending}>
                  {createGR.isPending ? <Loader2 className="animate-spin" /> : <ClipboardList />}
                  Kirim Data ke Apoteker
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page (wraps with Suspense for useSearchParams) ───────────────────────────

export default function BuatPreGRPage() {
  return (
    <Suspense>
      <BuatPreGRForm />
    </Suspense>
  );
}
