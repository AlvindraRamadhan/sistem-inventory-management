"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { differenceInDays, format } from "date-fns"
import {
  CheckCircle2,
  Info,
  LayoutGrid,
  List,
  Loader2,
  MapPin,
  Plus,
  Search,
  Stethoscope,
  Wrench,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { useAlkesList, useAlkesStats } from "@/hooks/queries/use-alkes"
import type { Alkes, AlkesStatus } from "@/services/alkes.service"
import { cn } from "@/lib/utils"

const LOKASI_ALKES = [
  "Ruang Pemeriksaan A",
  "Ruang Pemeriksaan B",
  "Ruang Tindakan",
  "Gudang Alkes",
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysUntil(iso: string | null): number {
  if (!iso) return Infinity
  return differenceInDays(new Date(iso), new Date())
}

function getProgressPct(alkes: Alkes): number {
  if (!alkes.tglKalibrasiBerikutnya) return 0
  const daysUntil = getDaysUntil(alkes.tglKalibrasiBerikutnya)
  const elapsed = alkes.intervalKalibrasi - Math.max(0, daysUntil)
  return Math.max(0, Math.min(100, Math.round((elapsed / alkes.intervalKalibrasi) * 100)))
}

function kalibrasiLabel(hariMenuju: number, iso: string): string {
  if (hariMenuju < 0) return `Terlambat ${Math.abs(hariMenuju)} hari`
  if (hariMenuju < 30) return `H-${hariMenuju}`
  return format(new Date(iso), "dd MMM yyyy")
}

function kalibrasiColor(hariMenuju: number): string {
  if (hariMenuju < 0) return "text-destructive"
  if (hariMenuju < 30) return "text-amber-500"
  return "text-emerald-600 dark:text-emerald-400"
}

function indicatorColor(hariMenuju: number): string {
  if (hariMenuju < 0) return "bg-destructive"
  if (hariMenuju < 30) return "bg-amber-500"
  return "bg-emerald-500"
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────

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

// ─── PemakaianSheet ───────────────────────────────────────────────────────────

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

const DEFAULT_FORM: PemakaianFormState = {
  tanggal: new Date().toISOString().split("T")[0],
  durasi: "",
  durasiUnit: "menit",
  kondisi: "baik",
  catatanMasalah: "",
  laporkanAdmin: false,
  catatan: "",
}

function PemakaianSheet({
  alkes,
  open,
  onOpenChange,
}: {
  alkes: Alkes | null
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const [form, setForm] = useState<PemakaianFormState>(DEFAULT_FORM)
  const [isLoading, setIsLoading] = useState(false)

  const isValid =
    form.tanggal &&
    form.durasi &&
    Number(form.durasi) > 0 &&
    (form.kondisi !== "perlu_servis" || form.catatanMasalah.trim().length >= 5)

  async function handleSubmit() {
    if (!isValid) return
    setIsLoading(true)
    await new Promise<void>((r) => setTimeout(r, 600))
    setIsLoading(false)
    setForm(DEFAULT_FORM)
    onOpenChange(false)
  }

  function handleClose() {
    setForm(DEFAULT_FORM)
    onOpenChange(false)
  }

  if (!alkes) return null

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) handleClose() }}>
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
          {/* Tanggal */}
          <div className="space-y-1.5">
            <label htmlFor="tanggal-pemakaian">
              Tanggal <span className="text-destructive">*</span>
            </label>
            <Input
              id="tanggal-pemakaian"
              type="date"
              max={new Date().toISOString().split("T")[0]}
              value={form.tanggal}
              onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))}
            />
          </div>

          {/* Durasi */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium leading-none">
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

          {/* Kondisi */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">
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
                <label htmlFor="kondisi-baik" className="font-normal text-emerald-700 dark:text-emerald-400 cursor-pointer">
                  Baik
                </label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="masalah_ringan" id="kondisi-masalah" />
                <label htmlFor="kondisi-masalah" className="font-normal text-amber-600 dark:text-amber-400 cursor-pointer">
                  Ada Masalah Ringan
                </label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="perlu_servis" id="kondisi-servis" />
                <label htmlFor="kondisi-servis" className="font-normal text-destructive cursor-pointer">
                  Perlu Servis
                </label>
              </div>
            </RadioGroup>

            {/* Conditional: masalah detail */}
            {(form.kondisi === "masalah_ringan" || form.kondisi === "perlu_servis") && (
              <div className="space-y-3 mt-2 pl-1">
                <div className="space-y-1.5">
                  <label htmlFor="catatan-masalah" className="text-sm">
                    Deskripsi Masalah{" "}
                    {form.kondisi === "perlu_servis" && <span className="text-destructive">*</span>}
                  </label>
                  <Textarea
                    id="catatan-masalah"
                    placeholder="Jelaskan masalah yang ditemukan saat pemakaian..."
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

          {/* Catatan opsional */}
          <div className="space-y-1.5">
            <label htmlFor="catatan-pemakaian">
              Catatan{" "}
              <span className="text-xs text-muted-foreground font-normal">(opsional)</span>
            </label>
            <Textarea
              id="catatan-pemakaian"
              placeholder="Catatan tambahan tentang pemakaian ini..."
              rows={2}
              value={form.catatan}
              onChange={(e) => setForm((f) => ({ ...f, catatan: e.target.value }))}
            />
          </div>
        </div>

        <SheetFooter className="mt-8 flex gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading} className="flex-1">
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

// ─── AlkesCardApoteker ────────────────────────────────────────────────────────

function AlkesCardApoteker({
  alkes,
  onCatatPemakaian,
}: {
  alkes: Alkes
  onCatatPemakaian: (alkes: Alkes) => void
}) {
  const router = useRouter()
  const hariMenuju = getDaysUntil(alkes.tglKalibrasiBerikutnya)
  const hariMenujuDisplay = alkes.tglKalibrasiBerikutnya ? hariMenuju : null
  const pct = getProgressPct(alkes)

  return (
    <Card
      className="hover:shadow-md transition-all cursor-pointer group"
      onClick={() => router.push(`/apoteker/alkes/${alkes.id}`)}
    >
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Stethoscope className="h-5 w-5 text-primary" />
          </div>
          <StatusBadge status={alkes.status} />
        </div>

        {/* Info */}
        <h3 className="font-semibold text-sm leading-snug mb-0.5">{alkes.nama}</h3>
        <p className="text-xs text-muted-foreground">{alkes.merk}</p>
        <p className="text-[11px] text-muted-foreground/60 font-mono mt-0.5">{alkes.noSeri ?? "—"}</p>

        <Separator className="my-3" />

        {/* Kalibrasi progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Kalibrasi berikutnya</span>
            <span className={cn("text-xs font-semibold", hariMenujuDisplay !== null ? kalibrasiColor(hariMenujuDisplay) : "text-muted-foreground")}>
              {alkes.tglKalibrasiBerikutnya ? kalibrasiLabel(hariMenuju, alkes.tglKalibrasiBerikutnya) : "Belum dijadwalkan"}
            </span>
          </div>
          <Progress
            value={pct}
            className="h-1.5 bg-muted"
            indicatorClassName={hariMenujuDisplay !== null ? indicatorColor(hariMenujuDisplay) : "bg-muted-foreground"}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <span className="text-xs text-muted-foreground flex items-center gap-1 truncate mr-2">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{alkes.lokasi ?? "—"}</span>
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs shrink-0"
            onClick={(e) => {
              e.stopPropagation()
              onCatatPemakaian(alkes)
            }}
          >
            <Plus className="h-3 w-3 mr-1" />
            Pemakaian
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── AlkesTableApoteker ───────────────────────────────────────────────────────

function AlkesTableApoteker({
  data,
  onCatatPemakaian,
}: {
  data: Alkes[]
  onCatatPemakaian: (alkes: Alkes) => void
}) {
  const router = useRouter()

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {["Nama Alkes", "Merk / No. Seri", "Lokasi", "Status", "Kalibrasi Berikutnya", "Aksi"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((alkes) => {
              const hariMenuju = getDaysUntil(alkes.tglKalibrasiBerikutnya)
              const label = alkes.tglKalibrasiBerikutnya ? kalibrasiLabel(hariMenuju, alkes.tglKalibrasiBerikutnya) : "Belum dijadwalkan"
              const color = alkes.tglKalibrasiBerikutnya ? kalibrasiColor(hariMenuju) : "text-muted-foreground"
              return (
                <tr
                  key={alkes.id}
                  className="border-b border-border/60 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => router.push(`/apoteker/alkes/${alkes.id}`)}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground leading-snug">{alkes.nama}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-foreground">{alkes.merk}</p>
                    <p className="text-xs font-mono text-muted-foreground/70">{alkes.noSeri ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                    {alkes.lokasi ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={alkes.status} />
                  </td>
                  <td className={cn("px-4 py-3 text-sm whitespace-nowrap font-medium", color)}>
                    {label}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        onCatatPemakaian(alkes)
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Pemakaian
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type FilterStatus = "semua" | "aktif" | "perbaikan" | "tidak_aktif"

export default function AlkesApotekerPage() {
  const [filter, setFilter]         = useState<FilterStatus>("semua")
  const [search, setSearch]         = useState("")
  const [lokasiFilter, setLokasiFilter] = useState("semua")
  const [viewMode, setViewMode]     = useState<"grid" | "list">("grid")
  const [pemakaianTarget, setPemakaianTarget] = useState<Alkes | null>(null)

  const { data: statsData } = useAlkesStats()
  const { data: listData, isLoading } = useAlkesList({ limit: 200 })
  const allAlkes = listData?.data ?? []

  const stats = {
    total:    statsData?.total ?? 0,
    aktif:    statsData?.aktif ?? 0,
    perluKal: statsData?.perluKalibrasi ?? 0,
    perbaikan: statsData?.perbaikan ?? 0,
  }

  const tidakAktifCount = useMemo(
    () => allAlkes.filter((a) => a.status === "tidak_aktif").length,
    [allAlkes]
  )

  const STATUS_FILTERS: { value: FilterStatus; label: string; dot: string; count: number }[] = [
    { value: "semua",       label: "Semua",          dot: "bg-muted-foreground", count: stats.total       },
    { value: "aktif",       label: "Aktif",           dot: "bg-emerald-500",      count: stats.aktif       },
    { value: "perbaikan",   label: "Dalam Servis",    dot: "bg-amber-500",        count: stats.perbaikan   },
    { value: "tidak_aktif", label: "Tidak Aktif",     dot: "bg-slate-400",        count: tidakAktifCount   },
  ]

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return allAlkes.filter((a) => {
      const matchSearch = !q || a.nama.toLowerCase().includes(q) || (a.noSeri ?? "").toLowerCase().includes(q) || a.merk.toLowerCase().includes(q)
      const matchStatus = filter === "semua" || a.status === filter
      const matchLokasi = lokasiFilter === "semua" || a.lokasi === lokasiFilter
      return matchSearch && matchStatus && matchLokasi
    })
  }, [allAlkes, filter, search, lokasiFilter])

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alat Kesehatan</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Lihat status alkes dan catat pemakaian
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg border">
          <Info className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Hanya Baca & Catat Pemakaian</span>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-3 dark:bg-blue-950/30 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Untuk penambahan, pengeditan, atau penghapusan alat kesehatan,
          silakan hubungi Admin Farmasi.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Alkes</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Aktif</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.aktif}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Perlu Kalibrasi</p>
          <p className="text-2xl font-bold text-amber-500">{stats.perluKal}</p>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Dalam Servis</p>
          <p className="text-2xl font-bold text-destructive">{stats.perbaikan}</p>
        </div>
      </div>

      {/* 2-column layout */}
      <div className="flex gap-6">
        {/* Sidebar filter */}
        <aside className="w-[220px] flex-shrink-0">
          <div className="bg-card border rounded-xl p-4 sticky top-6 space-y-5">
            {/* Status */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Status
              </p>
              <nav className="space-y-0.5" aria-label="Filter status alkes">
                {STATUS_FILTERS.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setFilter(item.value)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                      filter === item.value
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full flex-shrink-0", item.dot)} />
                      <span>{item.label}</span>
                    </div>
                    <span
                      className={cn(
                        "text-xs px-1.5 py-0.5 rounded-md",
                        filter === item.value
                          ? "bg-primary/20 text-primary font-medium"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {item.count}
                    </span>
                  </button>
                ))}
              </nav>
            </div>

            <Separator />

            {/* Lokasi */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Lokasi
              </p>
              <Select value={lokasiFilter} onValueChange={setLokasiFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Semua Lokasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Lokasi</SelectItem>
                  {LOKASI_ALKES.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 space-y-4">
          {/* Toolbar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Cari nama alkes atau nomor seri..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex border border-border rounded-lg overflow-hidden">
              <button
                aria-label="Grid view"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "px-3 py-2 transition-colors",
                  viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                aria-label="List view"
                onClick={() => setViewMode("list")}
                className={cn(
                  "px-3 py-2 transition-colors",
                  viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Memuat data alkes...
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 rounded-xl border border-dashed border-border text-center">
              <Stethoscope className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm font-medium text-muted-foreground">Tidak ada alat kesehatan</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Coba ubah filter atau kata kunci pencarian</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((alkes) => (
                <AlkesCardApoteker
                  key={alkes.id}
                  alkes={alkes}
                  onCatatPemakaian={setPemakaianTarget}
                />
              ))}
            </div>
          ) : (
            <AlkesTableApoteker data={filtered} onCatatPemakaian={setPemakaianTarget} />
          )}
        </main>
      </div>

      {/* Pemakaian Sheet */}
      <PemakaianSheet
        alkes={pemakaianTarget}
        open={pemakaianTarget !== null}
        onOpenChange={(v) => { if (!v) setPemakaianTarget(null) }}
      />
    </div>
  )
}
