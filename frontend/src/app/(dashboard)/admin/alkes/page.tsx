"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { differenceInDays, format } from "date-fns"
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  LayoutGrid,
  List,
  MapPin,
  Plus,
  Search,
  Stethoscope,
  Wrench,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { PageHeader } from "@/components/shared/page-header"
import { StatsCard } from "@/components/shared/stats-card"
import { useAlkesList, useAlkesStats } from "@/hooks/queries/use-alkes"
import type { Alkes, AlkesStatus } from "@/services/alkes.service"
import { cn } from "@/lib/utils"

// ─── Constants ────────────────────────────────────────────────────────────────

const LOKASI_ALKES = [
  "Ruang Pemeriksaan A",
  "Ruang Pemeriksaan B",
  "Ruang Tindakan",
  "Gudang Alkes",
]

const ALKES_STATUS_FILTERS = [
  { value: "semua",       label: "Semua",          dotColor: "bg-muted-foreground" },
  { value: "aktif",       label: "Aktif",           dotColor: "bg-emerald-500" },
  { value: "perbaikan",   label: "Dalam Perbaikan", dotColor: "bg-amber-500" },
  { value: "tidak_aktif", label: "Tidak Aktif",     dotColor: "bg-slate-400" },
]

const KALIBRASI_FILTERS = [
  { value: "kalibrasi_overdue",  label: "Terlewat",     dotColor: "bg-destructive" },
  { value: "kalibrasi_mendekat", label: "< 30 Hari",    dotColor: "bg-amber-500" },
  { value: "kalibrasi_normal",   label: "Tepat Waktu",  dotColor: "bg-emerald-500" },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysUntil(iso: string): number {
  return differenceInDays(new Date(iso), new Date())
}

function getKalibrasiStatus(daysUntil: number): "overdue" | "mendekat" | "normal" {
  if (daysUntil < 0) return "overdue"
  if (daysUntil < 30) return "mendekat"
  return "normal"
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
    perbaikan: "Perbaikan",
    tidak_aktif: "Tidak Aktif",
  }
  return (
    <Badge className={cn("border-0 text-xs font-medium", styles[status])}>
      {labels[status]}
    </Badge>
  )
}

// ─── Sidebar FilterItem ───────────────────────────────────────────────────────

function FilterItem({
  item,
  active,
  onClick,
}: {
  item: { value: string; label: string; dotColor: string }
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
        active
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <span className={cn("h-2 w-2 rounded-full shrink-0", item.dotColor)} />
      <span className="flex-1 text-left">{item.label}</span>
    </button>
  )
}

// ─── AlkesCard ────────────────────────────────────────────────────────────────

function AlkesCard({ alkes }: { alkes: Alkes }) {
  const router = useRouter()
  const hariMenuju = alkes.tglKalibrasiBerikutnya ? getDaysUntil(alkes.tglKalibrasiBerikutnya) : null
  const kStatus = hariMenuju !== null ? getKalibrasiStatus(hariMenuju) : "normal"
  const pct = getProgressPct(alkes)

  const indicatorColor = {
    overdue:  "bg-destructive",
    mendekat: "bg-amber-500",
    normal:   "bg-emerald-500",
  }[kStatus]

  const kalibrasiLabel = () => {
    if (hariMenuju === null) return "Belum dijadwalkan"
    if (hariMenuju < 0) return `Terlambat ${Math.abs(hariMenuju)} hari`
    if (hariMenuju < 30) return `H-${hariMenuju}`
    return format(new Date(alkes.tglKalibrasiBerikutnya!), "dd MMM yyyy")
  }

  const kalibrasiColor = {
    overdue:  "text-destructive",
    mendekat: "text-amber-500",
    normal:   "text-emerald-600 dark:text-emerald-400",
  }[kStatus]

  return (
    <Card
      className="hover:shadow-md transition-all cursor-pointer group"
      onClick={() => router.push(`/admin/alkes/${alkes.id}`)}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Stethoscope className="h-5 w-5 text-primary" />
          </div>
          <StatusBadge status={alkes.status} />
        </div>

        <h3 className="font-semibold text-sm leading-snug mb-0.5">{alkes.nama}</h3>
        <p className="text-xs text-muted-foreground mb-1">{alkes.merk}</p>
        <p className="text-[11px] text-muted-foreground/60 font-mono">{alkes.noSeri ?? "—"}</p>

        <Separator className="my-3" />

        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Kalibrasi berikutnya</span>
            <span className={cn("text-xs font-medium", kalibrasiColor)}>
              {kalibrasiLabel()}
            </span>
          </div>
          <Progress value={pct} className="h-1.5 bg-muted" indicatorClassName={indicatorColor} />
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <span className="text-xs text-muted-foreground flex items-center gap-1 truncate mr-2">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{alkes.lokasi ?? "—"}</span>
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs shrink-0"
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/admin/alkes/${alkes.id}`)
            }}
          >
            <Wrench className="h-3 w-3 mr-1" />
            Detail
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── AlkesTable ───────────────────────────────────────────────────────────────

function AlkesTable({ data }: { data: Alkes[] }) {
  const router = useRouter()

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {["Kode", "Nama Alkes", "Merk / No. Seri", "Lokasi", "Status", "Kalibrasi Berikutnya", "Aksi"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((alkes) => {
              const hariMenuju = alkes.tglKalibrasiBerikutnya ? getDaysUntil(alkes.tglKalibrasiBerikutnya) : null
              const kStatus = hariMenuju !== null ? getKalibrasiStatus(hariMenuju) : "normal"
              const kalibrasiColor = {
                overdue:  "text-destructive font-medium",
                mendekat: "text-amber-500 font-medium",
                normal:   "text-muted-foreground",
              }[kStatus]
              const label =
                hariMenuju === null
                  ? "Belum dijadwalkan"
                  : hariMenuju < 0
                  ? `Terlambat ${Math.abs(hariMenuju)} hari`
                  : hariMenuju < 30
                  ? `H-${hariMenuju}`
                  : format(new Date(alkes.tglKalibrasiBerikutnya!), "dd MMM yyyy")

              return (
                <tr
                  key={alkes.id}
                  className="border-b border-border/60 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => router.push(`/admin/alkes/${alkes.id}`)}
                >
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                    {alkes.kode}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground leading-snug">{alkes.nama}</p>
                    <p className="text-xs text-muted-foreground">
                      {alkes.kondisi === "baik" ? "Kondisi Baik" : alkes.kondisi === "perlu_servis" ? "Perlu Servis" : "Rusak"}
                    </p>
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
                  <td className={cn("px-4 py-3 text-sm whitespace-nowrap", kalibrasiColor)}>
                    {label}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/admin/alkes/${alkes.id}`)
                      }}
                    >
                      Detail
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

export default function AdminAlkesPage() {
  const [filter, setFilter] = useState("semua")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [search, setSearch] = useState("")
  const [lokasiFilter, setLokasiFilter] = useState("semua")

  const { data: statsData } = useAlkesStats()
  const { data: listData, isLoading } = useAlkesList({ limit: 200 })

  const allAlkes = listData?.data ?? []

  const filtered = useMemo(() => {
    return allAlkes.filter((a) => {
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        a.nama.toLowerCase().includes(q) ||
        (a.noSeri ?? "").toLowerCase().includes(q) ||
        a.merk.toLowerCase().includes(q)

      if (!matchSearch) return false

      const daysUntil = a.tglKalibrasiBerikutnya ? getDaysUntil(a.tglKalibrasiBerikutnya) : null

      if (filter === "semua") {
        // no status filter
      } else if (filter === "aktif") {
        if (a.status !== "aktif") return false
      } else if (filter === "perbaikan") {
        if (a.status !== "perbaikan") return false
      } else if (filter === "tidak_aktif") {
        if (a.status !== "tidak_aktif") return false
      } else if (filter === "kalibrasi_overdue") {
        if (daysUntil === null || daysUntil >= 0) return false
      } else if (filter === "kalibrasi_mendekat") {
        if (daysUntil === null || daysUntil < 0 || daysUntil >= 30) return false
      } else if (filter === "kalibrasi_normal") {
        if (daysUntil === null || daysUntil < 30) return false
      }

      if (lokasiFilter !== "semua" && a.lokasi !== lokasiFilter) return false

      return true
    })
  }, [allAlkes, filter, search, lokasiFilter])

  const alkesAlert = useMemo(
    () => allAlkes.filter((a) => {
      if (!a.tglKalibrasiBerikutnya) return false
      return getDaysUntil(a.tglKalibrasiBerikutnya) < 30
    }),
    [allAlkes]
  )

  const overdueCount = useMemo(
    () => alkesAlert.filter((a) => getDaysUntil(a.tglKalibrasiBerikutnya!) < 0).length,
    [alkesAlert]
  )
  const mendekatCount = alkesAlert.length - overdueCount

  const stats = {
    total: statsData?.total ?? 0,
    aktif: statsData?.aktif ?? 0,
    perluKalibrasi: statsData?.perluKalibrasi ?? 0,
    perbaikan: statsData?.perbaikan ?? 0,
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Alat Kesehatan"
        description="Kelola alat kesehatan, kalibrasi, dan pemeliharaan"
        actions={
          <Button className="bg-primary text-primary-foreground">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Alkes
          </Button>
        }
      />

      {alkesAlert.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                {alkesAlert.length} alat kesehatan memerlukan perhatian
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {overdueCount > 0 && `${overdueCount} kalibrasi terlewat`}
                {overdueCount > 0 && mendekatCount > 0 && " · "}
                {mendekatCount > 0 && `${mendekatCount} mendekati jadwal < 30 hari`}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 text-xs shrink-0"
            onClick={() => setFilter("kalibrasi_overdue")}
          >
            Lihat Detail
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard title="Total Alkes"     value={stats.total}          icon={Stethoscope} />
        <StatsCard title="Aktif"           value={stats.aktif}          icon={CheckCircle2} variant="success" />
        <StatsCard title="Perlu Kalibrasi" value={stats.perluKalibrasi} icon={Wrench}       variant="warning" />
        <StatsCard title="Dalam Perbaikan" value={stats.perbaikan}      icon={AlertCircle}  variant="danger" />
      </div>

      <div className="flex gap-6">
        {/* Sidebar filter */}
        <aside className="w-[220px] flex-shrink-0">
          <div className="bg-card border border-border rounded-xl p-4 sticky top-6 space-y-5">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Status Alkes
              </p>
              <nav className="space-y-0.5">
                {ALKES_STATUS_FILTERS.map((item) => (
                  <FilterItem
                    key={item.value}
                    item={item}
                    active={filter === item.value}
                    onClick={() => setFilter(item.value)}
                  />
                ))}
              </nav>
            </div>

            <Separator />

            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Kalibrasi
              </p>
              <nav className="space-y-0.5">
                {KALIBRASI_FILTERS.map((item) => (
                  <FilterItem
                    key={item.value}
                    item={item}
                    active={filter === item.value}
                    onClick={() => setFilter(item.value)}
                  />
                ))}
              </nav>
            </div>

            <Separator />

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

        {/* Konten */}
        <main className="flex-1 min-w-0 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau nomor seri..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex border border-border rounded-lg overflow-hidden">
              <button
                aria-label="Grid view"
                className={cn(
                  "px-3 py-2 transition-colors",
                  viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
                )}
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                aria-label="List view"
                className={cn(
                  "px-3 py-2 transition-colors",
                  viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
                )}
                onClick={() => setViewMode("list")}
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
            <div className="flex flex-col items-center justify-center h-48 text-center rounded-xl border border-dashed border-border">
              <Stethoscope className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm font-medium text-muted-foreground">Tidak ada alat kesehatan</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Coba ubah filter atau kata kunci pencarian</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((alkes) => (
                <AlkesCard key={alkes.id} alkes={alkes} />
              ))}
            </div>
          ) : (
            <AlkesTable data={filtered} />
          )}
        </main>
      </div>
    </div>
  )
}
