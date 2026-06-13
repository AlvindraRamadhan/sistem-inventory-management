"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { differenceInDays } from "date-fns"
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  FileText,
  Loader2,
  MapPin,
  Plus,
  Stethoscope,
  Tag,
  Wrench,
  XCircle,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAlkesDetail, useAlkesKalibrasi } from "@/hooks/queries/use-alkes"
import type { Alkes, AlkesStatus, RiwayatKalibrasi } from "@/services/alkes.service"
import { cn } from "@/lib/utils"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysUntil(iso: string): number {
  return differenceInDays(new Date(iso), new Date())
}

function formatDate(iso: string | null): string {
  if (!iso) return "—"
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
    aktif:       "Aktif",
    perbaikan:   "Dalam Perbaikan",
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

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{value}</span>
    </div>
  )
}

// ─── PemakaianSheet (local-only, not yet wired to backend) ────────────────────

type KondisiPemakaian = "baik" | "masalah_ringan" | "perlu_servis"

interface PemakaianFormState {
  tanggal: string
  durasi: string
  durasiUnit: "menit" | "jam"
  kondisi: KondisiPemakaian
  catatanMasalah: string
  laporkanAdmin: boolean
  catatan: string
}

interface LocalPemakaian {
  id: string
  tanggal: string
  durasi: number
  catatan?: string
}

function PemakaianSheet({
  alkes,
  open,
  onOpenChange,
  onSaved,
}: {
  alkes: Alkes
  open: boolean
  onOpenChange: (v: boolean) => void
  onSaved: (entry: LocalPemakaian) => void
}) {
  const today = new Date().toISOString().split("T")[0]
  const [form, setForm] = useState<PemakaianFormState>({
    tanggal: today,
    durasi: "",
    durasiUnit: "menit",
    kondisi: "baik",
    catatanMasalah: "",
    laporkanAdmin: false,
    catatan: "",
  })
  const [isLoading, setIsLoading] = useState(false)

  const isValid =
    form.tanggal &&
    form.durasi &&
    Number(form.durasi) > 0 &&
    (form.kondisi !== "perlu_servis" || form.catatanMasalah.trim().length >= 5)

  async function handleSubmit() {
    if (!isValid) return
    setIsLoading(true)
    await new Promise<void>((r) => setTimeout(r, 400))
    const durasiMenit =
      form.durasiUnit === "jam" ? Number(form.durasi) * 60 : Number(form.durasi)
    onSaved({
      id: `PKG-NEW-${Date.now()}`,
      tanggal: form.tanggal,
      durasi: durasiMenit,
      catatan: form.catatan || form.catatanMasalah || undefined,
    })
    setIsLoading(false)
    setForm({ tanggal: today, durasi: "", durasiUnit: "menit", kondisi: "baik", catatanMasalah: "", laporkanAdmin: false, catatan: "" })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onOpenChange(false) }}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            Catat Pemakaian
          </SheetTitle>
          <SheetDescription>
            {alkes.nama} · <span className="font-mono text-xs">{alkes.noSeri ?? alkes.kode}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="tanggal-pemakaian" className="text-sm font-medium">
              Tanggal <span className="text-destructive">*</span>
            </label>
            <Input
              id="tanggal-pemakaian"
              type="date"
              max={today}
              value={form.tanggal}
              onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Durasi Pemakaian <span className="text-destructive">*</span>
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                placeholder="Contoh: 30"
                value={form.durasi}
                onChange={(e) => setForm((f) => ({ ...f, durasi: e.target.value }))}
                className="flex-1"
              />
              <Select
                value={form.durasiUnit}
                onValueChange={(v) => setForm((f) => ({ ...f, durasiUnit: v as "menit" | "jam" }))}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="menit">Menit</SelectItem>
                  <SelectItem value="jam">Jam</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Kondisi Alat <span className="text-destructive">*</span>
            </label>
            <RadioGroup
              value={form.kondisi}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, kondisi: v as KondisiPemakaian, catatanMasalah: "", laporkanAdmin: false }))
              }
              className="space-y-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="baik" id="kondisi-baik" />
                <label htmlFor="kondisi-baik" className="font-normal text-emerald-700 dark:text-emerald-400 cursor-pointer">Baik</label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="masalah_ringan" id="kondisi-masalah" />
                <label htmlFor="kondisi-masalah" className="font-normal text-amber-600 dark:text-amber-400 cursor-pointer">Ada Masalah Ringan</label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="perlu_servis" id="kondisi-servis" />
                <label htmlFor="kondisi-servis" className="font-normal text-destructive cursor-pointer">Perlu Servis</label>
              </div>
            </RadioGroup>

            {(form.kondisi === "masalah_ringan" || form.kondisi === "perlu_servis") && (
              <div className="space-y-3 mt-2 pl-1">
                <div className="space-y-1.5">
                  <label className="text-sm">
                    Deskripsi Masalah{" "}
                    {form.kondisi === "perlu_servis" && <span className="text-destructive">*</span>}
                  </label>
                  <Textarea
                    placeholder="Jelaskan masalah yang ditemukan..."
                    rows={3}
                    value={form.catatanMasalah}
                    onChange={(e) => setForm((f) => ({ ...f, catatanMasalah: e.target.value }))}
                  />
                </div>
                {form.kondisi === "perlu_servis" && (
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="laporkan-admin"
                      checked={form.laporkanAdmin}
                      onCheckedChange={(v) => setForm((f) => ({ ...f, laporkanAdmin: Boolean(v) }))}
                    />
                    <label htmlFor="laporkan-admin" className="text-sm font-normal leading-snug cursor-pointer">
                      Laporkan ke Admin untuk tindak lanjut servis
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Catatan <span className="text-xs text-muted-foreground font-normal">(opsional)</span>
            </label>
            <Textarea
              placeholder="Catatan tambahan tentang pemakaian ini..."
              rows={2}
              value={form.catatan}
              onChange={(e) => setForm((f) => ({ ...f, catatan: e.target.value }))}
            />
          </div>
        </div>

        <SheetFooter className="mt-8 flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading} className="flex-1">
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isLoading} className="flex-1">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Simpan Pemakaian
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AlkesDetailApotekerPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [pemakaianOpen, setPemakaianOpen] = useState(false)
  const [localPemakaian, setLocalPemakaian] = useState<LocalPemakaian[]>([])

  const { data: alkes, isLoading } = useAlkesDetail(params.id)
  const { data: riwayatKal = [] } = useAlkesKalibrasi(params.id)

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
        <Button variant="outline" className="mt-4" onClick={() => router.push("/apoteker/alkes")}>
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
  const kalibrasiIndicator =
    hariMenuju === null ? "bg-muted"
    : hariMenuju < 0 ? "bg-destructive"
    : hariMenuju < 30 ? "bg-amber-500"
    : "bg-emerald-500"
  const kalibrasiLabelStr =
    hariMenuju === null ? "Belum dijadwalkan"
    : hariMenuju < 0 ? `Terlambat ${Math.abs(hariMenuju)} hari`
    : hariMenuju < 30 ? `H-${hariMenuju}`
    : `${hariMenuju} hari lagi`

  const kondisiLabel: Record<string, string> = { baik: "Baik", perlu_servis: "Perlu Servis", rusak: "Rusak" }
  const kondisiStyle: Record<string, string> = {
    baik: "bg-emerald-100 text-emerald-700",
    perlu_servis: "bg-amber-100 text-amber-700",
    rusak: "bg-rose-100 text-rose-700",
  }

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1 text-sm text-muted-foreground">
          <li>
            <button onClick={() => router.push("/apoteker/alkes")} className="hover:text-foreground transition-colors">
              Alat Kesehatan
            </button>
          </li>
          <li className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 opacity-50" />
            <span className="text-foreground font-medium">{alkes.nama}</span>
          </li>
        </ol>
      </nav>

      <div className="flex items-center justify-between">
        <div />
        <Button onClick={() => setPemakaianOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Catat Pemakaian
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Kolom kiri (2/5) ── */}
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
                  <h2 className="text-base font-semibold text-foreground leading-snug">{alkes.nama}</h2>
                  <p className="text-sm text-muted-foreground">{alkes.merk}</p>
                </div>
                <StatusBadge status={alkes.status} />
              </div>
              <Separator className="my-2" />
              <InfoRow label="Kode" value={<span className="font-mono text-xs">{alkes.kode}</span>} />
              <InfoRow label="No. Seri" value={<span className="font-mono text-xs">{alkes.noSeri ?? "—"}</span>} />
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
                  <Badge className={cn("border-0 text-xs", kondisiStyle[alkes.kondisi])}>
                    {kondisiLabel[alkes.kondisi]}
                  </Badge>
                }
              />
              <InfoRow
                label="Jml. Pemakaian"
                value={<span className="font-semibold tabular-nums">{alkes.jumlahPemakaian.toLocaleString("id-ID")} kali</span>}
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
                  <span className={cn("text-sm font-semibold", kalibrasiColor)}>{kalibrasiLabelStr}</span>
                </div>
                <Progress value={pct} className="h-2.5 bg-muted" indicatorClassName={kalibrasiIndicator} />
                <p className="text-xs text-muted-foreground">Interval: setiap {alkes.intervalKalibrasi} hari</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Terakhir</span>
                  </div>
                  <span className="text-sm font-medium">{formatDate(alkes.tglKalibrasiTerakhir)}</span>
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
                    {formatDate(alkes.tglKalibrasiBerikutnya)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Kolom kanan (3/5) ── */}
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
                    <Tag className="h-3.5 w-3.5" />
                    Riwayat Pemakaian Saya
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="kalibrasi" className="m-0">
                <ScrollArea className="h-[480px]">
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
                              <p className="text-sm font-medium text-foreground">{formatDate(r.tanggal)}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{r.teknisi}</p>
                            </div>
                            <HasilBadge hasil={r.hasil} />
                          </div>
                          {r.catatan && (
                            <p className="text-xs text-muted-foreground leading-relaxed mb-2">{r.catatan}</p>
                          )}
                          {r.sertifikatNama && (
                            <span className="flex items-center gap-1.5 text-xs text-primary">
                              <FileText className="h-3.5 w-3.5" />
                              {r.sertifikatNama}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="pemakaian" className="m-0">
                <ScrollArea className="h-[480px]">
                  {localPemakaian.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-center p-6">
                      <Tag className="h-8 w-8 text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground">Belum ada riwayat pemakaian</p>
                      <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => setPemakaianOpen(true)}>
                        <Plus className="h-3.5 w-3.5" />
                        Catat Pemakaian Pertama
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/40">
                            {["Tanggal", "Durasi", "Catatan"].map((h) => (
                              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {localPemakaian.map((p) => (
                            <tr key={p.id} className="border-b border-border/60 hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(p.tanggal)}</td>
                              <td className="px-4 py-3 text-sm tabular-nums">{p.durasi} mnt</td>
                              <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">{p.catatan ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>

      <PemakaianSheet
        alkes={alkes}
        open={pemakaianOpen}
        onOpenChange={setPemakaianOpen}
        onSaved={(entry) => setLocalPemakaian((prev) => [entry, ...prev])}
      />
    </div>
  )
}
