"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { differenceInDays, format } from "date-fns"
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  FileText,
  History,
  Loader2,
  MapPin,
  ShoppingBag,
  Stethoscope,
  Tag,
  Upload,
  Wrench,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useAlkesDetail, useAlkesKalibrasi, useAddKalibrasi } from "@/hooks/queries/use-alkes"
import type { Alkes, AlkesStatus, RiwayatKalibrasi } from "@/services/alkes.service"
import { cn } from "@/lib/utils"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysUntil(iso: string): number {
  return differenceInDays(new Date(iso), new Date())
}

function formatDate(iso: string): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"]
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number)
  return `${d} ${months[m - 1]} ${y}`
}

function getProgressPct(alkes: Alkes): number {
  if (!alkes.tglKalibrasiBerikutnya) return 0
  const daysUntil = getDaysUntil(alkes.tglKalibrasiBerikutnya)
  const elapsed = alkes.intervalKalibrasi - Math.max(0, daysUntil)
  return Math.max(0, Math.min(100, Math.round((elapsed / alkes.intervalKalibrasi) * 100)))
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AlkesStatus }) {
  const styles: Record<AlkesStatus, string> = {
    aktif:       "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    perbaikan:   "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    tidak_aktif: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  }
  const labels: Record<AlkesStatus, string> = {
    aktif: "Aktif",
    perbaikan: "Dalam Perbaikan",
    tidak_aktif: "Tidak Aktif",
  }
  return (
    <Badge className={cn("border-0 text-xs font-medium", styles[status])}>
      {labels[status]}
    </Badge>
  )
}

function HasilBadge({ hasil }: { hasil: RiwayatKalibrasi["hasil"] }) {
  if (hasil === "lulus") {
    return (
      <Badge className="border-0 text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Lulus
      </Badge>
    )
  }
  return (
    <Badge className="border-0 text-xs bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
      <XCircle className="h-3 w-3 mr-1" />
      Tidak Lulus
    </Badge>
  )
}

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{value}</span>
    </div>
  )
}

// ─── Kalibrasi Dialog ─────────────────────────────────────────────────────────

interface KalibrasiFormData {
  tanggal: string
  teknisi: string
  hasil: "lulus" | "tidak_lulus"
  catatan: string
  sertifikatNama: string
}

function KalibrasiDialog({
  open,
  onOpenChange,
  alkes,
  onSubmit,
  isSubmitting,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  alkes: Alkes
  onSubmit: (data: KalibrasiFormData) => void
  isSubmitting: boolean
}) {
  const today = new Date().toISOString().split("T")[0]
  const [form, setForm] = useState<KalibrasiFormData>({
    tanggal: today,
    teknisi: "",
    hasil: "lulus",
    catatan: "",
    sertifikatNama: "",
  })

  const isValid = form.tanggal && form.teknisi.trim().length >= 3

  function handleSubmit() {
    if (!isValid) return
    onSubmit(form)
  }

  function handleClose(v: boolean) {
    if (!v) setForm({ tanggal: today, teknisi: "", hasil: "lulus", catatan: "", sertifikatNama: "" })
    onOpenChange(v)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            Input Hasil Kalibrasi
          </DialogTitle>
          <DialogDescription>
            {alkes.nama} · {alkes.noSeri ?? alkes.kode}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Tanggal Kalibrasi <span className="text-destructive">*</span>
            </label>
            <Input
              type="date"
              max={today}
              value={form.tanggal}
              onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Nama Teknisi / Institusi <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="Contoh: PT Kalibrasi Medika Indonesia"
              value={form.teknisi}
              onChange={(e) => setForm((f) => ({ ...f, teknisi: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Hasil Kalibrasi <span className="text-destructive">*</span>
            </label>
            <RadioGroup
              value={form.hasil}
              onValueChange={(v) => setForm((f) => ({ ...f, hasil: v as "lulus" | "tidak_lulus" }))}
              className="flex gap-6"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="lulus" id="hasil-lulus" />
                <label htmlFor="hasil-lulus" className="text-sm font-medium text-emerald-700 dark:text-emerald-400 cursor-pointer">
                  Lulus
                </label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="tidak_lulus" id="hasil-tidak-lulus" />
                <label htmlFor="hasil-tidak-lulus" className="text-sm font-medium text-destructive cursor-pointer">
                  Tidak Lulus
                </label>
              </div>
            </RadioGroup>

            {form.hasil === "tidak_lulus" && (
              <div className="flex items-start gap-2 rounded-md bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800 px-3 py-2.5">
                <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-700 dark:text-rose-400">
                  Status alkes akan otomatis diubah ke <strong>Dalam Perbaikan</strong> setelah disimpan.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Catatan <span className="text-xs text-muted-foreground font-normal">(opsional)</span>
            </label>
            <Textarea
              placeholder="Catatan hasil kalibrasi, temuan, atau rekomendasi..."
              rows={3}
              value={form.catatan}
              onChange={(e) => setForm((f) => ({ ...f, catatan: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              Sertifikat Kalibrasi <span className="text-xs text-muted-foreground font-normal">(opsional)</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-9 px-3 border border-border rounded-md flex items-center text-sm text-muted-foreground bg-muted/30">
                {form.sertifikatNama || "Belum ada file dipilih"}
              </div>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    sertifikatNama: `sertifikat_${alkes.kode.toLowerCase()}_${f.tanggal}.pdf`,
                  }))
                }
              >
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                Upload
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Format: PDF, JPG, PNG · Maks 5 MB</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)} disabled={isSubmitting}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Simpan Hasil Kalibrasi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AlkesDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [kalibrasiOpen, setKalibrasiOpen] = useState(false)

  const { data: alkes, isLoading } = useAlkesDetail(params.id)
  const { data: riwayatKal = [] } = useAlkesKalibrasi(params.id)
  const addKalibrasi = useAddKalibrasi()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-72">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Memuat data alkes...
        </div>
      </div>
    )
  }

  if (!alkes) {
    return (
      <div className="flex flex-col items-center justify-center h-72 text-center">
        <Stethoscope className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="font-semibold text-foreground">Alkes tidak ditemukan</p>
        <p className="text-sm text-muted-foreground mt-1">ID {params.id} tidak ada dalam sistem</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/admin/alkes")}>
          Kembali ke Daftar
        </Button>
      </div>
    )
  }

  const hariMenuju = alkes.tglKalibrasiBerikutnya ? getDaysUntil(alkes.tglKalibrasiBerikutnya) : null
  const pct = getProgressPct(alkes)

  const kalibrasiColor =
    hariMenuju === null ? "text-muted-foreground"
    : hariMenuju < 0 ? "text-destructive"
    : hariMenuju < 30 ? "text-amber-500"
    : "text-emerald-600 dark:text-emerald-400"

  const indicatorColor =
    hariMenuju === null ? "bg-muted"
    : hariMenuju < 0 ? "bg-destructive"
    : hariMenuju < 30 ? "bg-amber-500"
    : "bg-emerald-500"

  const kalibrasiLabel =
    hariMenuju === null ? "Belum dijadwalkan"
    : hariMenuju < 0 ? `Terlambat ${Math.abs(hariMenuju)} hari`
    : hariMenuju < 30 ? `H-${hariMenuju}`
    : `${hariMenuju} hari lagi`

  function handleKalibrasiSubmit(data: KalibrasiFormData) {
    addKalibrasi.mutate(
      {
        id: params.id,
        dto: {
          tanggal: data.tanggal,
          teknisi: data.teknisi,
          hasil: data.hasil,
          catatan: data.catatan || undefined,
          sertifikatNama: data.sertifikatNama || undefined,
        },
      },
      {
        onSuccess: () => {
          if (data.hasil === "tidak_lulus") {
            toast.error("Kalibrasi tidak lulus — status diubah ke Dalam Perbaikan", {
              description: `${alkes?.nama} memerlukan servis sebelum digunakan kembali.`,
            })
          } else {
            toast.success("Hasil kalibrasi berhasil disimpan.")
          }
          setKalibrasiOpen(false)
        },
      }
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1 text-sm text-muted-foreground">
          <li>
            <button
              onClick={() => router.push("/admin/alkes")}
              className="hover:text-foreground transition-colors"
            >
              Alat Kesehatan
            </button>
          </li>
          <li className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 opacity-50" />
            <span className="text-foreground font-medium">{alkes.nama}</span>
          </li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Kolom kiri (2/5) ─── */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <Card>
            <CardHeader className="border-b py-3 px-5">
              <CardTitle className="text-sm flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-primary" />
                Informasi Alkes
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-2">
              <div className="flex items-start justify-between pt-2 pb-1">
                <div>
                  <h2 className="text-base font-semibold text-foreground leading-snug">
                    {alkes.nama}
                  </h2>
                  <p className="text-sm text-muted-foreground">{alkes.merk}</p>
                </div>
                <StatusBadge status={alkes.status} />
              </div>
              <Separator className="my-2" />
              <InfoRow label="Kode" value={<span className="font-mono text-xs">{alkes.kode}</span>} />
              <InfoRow
                label="No. Seri"
                value={<span className="font-mono text-xs">{alkes.noSeri ?? "—"}</span>}
              />
              {alkes.tglBeli && <InfoRow label="Tgl. Beli" value={formatDate(alkes.tglBeli)} />}
              <InfoRow
                label="Lokasi"
                value={
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    {alkes.lokasi ?? "—"}
                  </span>
                }
              />
              <InfoRow
                label="Kondisi"
                value={
                  <Badge
                    className={cn(
                      "border-0 text-xs",
                      alkes.kondisi === "baik"
                        ? "bg-emerald-100 text-emerald-700"
                        : alkes.kondisi === "perlu_servis"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-rose-100 text-rose-700"
                    )}
                  >
                    {alkes.kondisi === "baik"
                      ? "Baik"
                      : alkes.kondisi === "perlu_servis"
                      ? "Perlu Servis"
                      : "Rusak"}
                  </Badge>
                }
              />
              <InfoRow
                label="Jml. Pemakaian"
                value={
                  <span className="font-semibold tabular-nums">
                    {alkes.jumlahPemakaian.toLocaleString("id-ID")} kali
                  </span>
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b py-3 px-5">
              <CardTitle className="text-sm flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" />
                Status Kalibrasi
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Progress siklus kalibrasi</span>
                  <span className={cn("text-sm font-semibold", kalibrasiColor)}>
                    {kalibrasiLabel}
                  </span>
                </div>
                <Progress value={pct} className="h-2.5 bg-muted" indicatorClassName={indicatorColor} />
                <p className="text-xs text-muted-foreground">
                  Interval: setiap {alkes.intervalKalibrasi} hari
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Terakhir</span>
                  </div>
                  <span className="text-sm font-medium">
                    {alkes.tglKalibrasiTerakhir ? formatDate(alkes.tglKalibrasiTerakhir) : "Belum pernah"}
                  </span>
                </div>
                <div
                  className={cn(
                    "flex items-center justify-between rounded-md px-3 py-2",
                    hariMenuju === null ? "bg-muted/50"
                    : hariMenuju < 0 ? "bg-rose-50 dark:bg-rose-900/20"
                    : hariMenuju < 30 ? "bg-amber-50 dark:bg-amber-900/20"
                    : "bg-emerald-50 dark:bg-emerald-900/20"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Berikutnya</span>
                  </div>
                  <span className={cn("text-sm font-medium", kalibrasiColor)}>
                    {alkes.tglKalibrasiBerikutnya ? formatDate(alkes.tglKalibrasiBerikutnya) : "—"}
                  </span>
                </div>
              </div>

              <Button className="w-full" onClick={() => setKalibrasiOpen(true)}>
                <Wrench className="h-4 w-4 mr-2" />
                Input Hasil Kalibrasi
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ── Kolom kanan (3/5) ─── */}
        <div className="lg:col-span-3">
          <Card className="h-full">
            <Tabs defaultValue="kalibrasi">
              <div className="border-b border-border px-4 pt-3">
                <TabsList className="h-9">
                  <TabsTrigger value="kalibrasi" className="text-xs gap-1.5">
                    <Wrench className="h-3.5 w-3.5" />
                    Riwayat Kalibrasi
                  </TabsTrigger>
                  <TabsTrigger value="pemakaian" className="text-xs gap-1.5">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    Riwayat Pemakaian
                  </TabsTrigger>
                  <TabsTrigger value="log" className="text-xs gap-1.5">
                    <History className="h-3.5 w-3.5" />
                    Log Aktivitas
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="kalibrasi" className="m-0">
                <ScrollArea className="h-[520px]">
                  {riwayatKal.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center p-6">
                      <Wrench className="h-8 w-8 text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground">Belum ada riwayat kalibrasi</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {riwayatKal.map((r) => (
                        <div key={r.id} className="px-5 py-4">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {formatDate(r.tanggal)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">{r.teknisi}</p>
                            </div>
                            <HasilBadge hasil={r.hasil} />
                          </div>
                          {r.catatan && (
                            <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                              {r.catatan}
                            </p>
                          )}
                          {r.sertifikatNama && (
                            <button className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                              <FileText className="h-3.5 w-3.5" />
                              {r.sertifikatNama}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="pemakaian" className="m-0">
                <ScrollArea className="h-[520px]">
                  <div className="flex flex-col items-center justify-center h-40 text-center p-6">
                    <Tag className="h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">Belum ada riwayat pemakaian</p>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="log" className="m-0">
                <ScrollArea className="h-[520px]">
                  <div className="flex flex-col items-center justify-center h-40 text-center p-6">
                    <History className="h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">Log aktivitas belum tersedia</p>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>

      <KalibrasiDialog
        open={kalibrasiOpen}
        onOpenChange={setKalibrasiOpen}
        alkes={alkes}
        onSubmit={handleKalibrasiSubmit}
        isSubmitting={addKalibrasi.isPending}
      />
    </div>
  )
}
