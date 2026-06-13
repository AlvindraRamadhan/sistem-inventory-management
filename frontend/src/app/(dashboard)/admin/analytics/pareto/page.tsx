"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import {
  BarChart3,
  Download,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { PageHeader } from "@/components/shared/page-header"
import { ChartSkeleton } from "@/components/shared/skeletons"
import { useParetoAnalysis, useSafetyStock } from "@/hooks/queries/use-analytics"
import { useKategoriList } from "@/hooks/queries/use-kategori"
import type { ParetoAnalysisResponse, SafetyStockItem } from "@/services/analytics.service"
import { cn } from "@/lib/utils"

// ─── Local helpers ────────────────────────────────────────────────────────────

function getAlertStatus(stok: number, threshold: number): "AMAN" | "PERHATIAN" | "KRITIS" {
  if (stok <= threshold) return "KRITIS"
  if (stok <= threshold * 2) return "PERHATIAN"
  return "AMAN"
}

// ─── Lazy-loaded tab content ──────────────────────────────────────────────────

const ParetoTabContent = dynamic(
  () =>
    import("@/components/features/analytics/pareto-tab").then(
      (m) => m.ParetoTabContent
    ),
  { loading: () => <ChartSkeleton />, ssr: false }
)

const FastSlowTabContent = dynamic(
  () =>
    import("@/components/features/analytics/fast-slow-tab").then(
      (m) => m.FastSlowTabContent
    ),
  { loading: () => <ChartSkeleton />, ssr: false }
)

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatRupiah = (v: number): string => {
  if (v >= 1_000_000) return `Rp ${(v / 1_000_000).toFixed(1).replace(".", ",")}jt`
  if (v >= 1_000) return `Rp ${(v / 1_000).toFixed(0)}rb`
  return `Rp ${v.toLocaleString("id-ID")}`
}

// ─── ABC Summary Cards ────────────────────────────────────────────────────────

const ABC_CARD_CONFIG = [
  {
    cat: "A" as const,
    label: "Kategori A",
    desc: "20% item paling bernilai",
    color: "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/10",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    pctLabel: "80%",
  },
  {
    cat: "B" as const,
    label: "Kategori B",
    desc: "30% item nilai menengah",
    color: "border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/10",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    pctLabel: "15%",
  },
  {
    cat: "C" as const,
    label: "Kategori C",
    desc: "50% item nilai rendah",
    color: "border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-900/10",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    pctLabel: "5%",
  },
]

function AbcSummaryCards({ data }: { data: ParetoAnalysisResponse | null | undefined }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {ABC_CARD_CONFIG.map(({ cat, label, desc, color, badge, pctLabel }) => (
        <div key={cat} className={cn("rounded-xl border p-4", color)}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-foreground">{label}</span>
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", badge)}>
              {pctLabel} nilai
            </span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {data?.summary[cat].count ?? "—"}{" "}
            <span className="text-base font-normal text-muted-foreground">item</span>
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {data ? formatRupiah(data.summary[cat].nilai) : "—"} total nilai
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Safety Stock Alert view ──────────────────────────────────────────────────

function SafetyStockView() {
  const { data: safetyData = [], isLoading } = useSafetyStock()
  const kritis = safetyData.filter(
    (i) => getAlertStatus(i.stokSaat, i.thresholdMin) === "KRITIS"
  )
  const perhatian = safetyData.filter(
    (i) => getAlertStatus(i.stokSaat, i.thresholdMin) === "PERHATIAN"
  )
  const alertItems: SafetyStockItem[] = [...kritis, ...perhatian]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-900/10 p-4">
          <p className="text-sm font-semibold text-foreground">Kritis</p>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {kritis.length}{" "}
            <span className="text-base font-normal text-muted-foreground">item</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">Stok di bawah batas minimum</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/10 p-4">
          <p className="text-sm font-semibold text-foreground">Perhatian</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {perhatian.length}{" "}
            <span className="text-base font-normal text-muted-foreground">item</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">Stok mendekati batas minimum</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10 p-4">
          <p className="text-sm font-semibold text-foreground">Aman</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {safetyData.length - kritis.length - perhatian.length}{" "}
            <span className="text-base font-normal text-muted-foreground">item</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">Stok dalam kondisi aman</p>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="px-5 py-3 border-b border-border bg-muted/30">
          <p className="text-sm font-semibold flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-destructive" />
            Item Memerlukan Perhatian
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {["Nama Obat", "Kategori", "Stok Saat Ini", "Minimum", "Status"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Memuat data...
                  </td>
                </tr>
              ) : alertItems.map((item) => {
                const status = getAlertStatus(item.stokSaat, item.thresholdMin)
                return (
                  <tr
                    key={item.obatId}
                    className="border-b border-border/60 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{item.namaObat}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{item.kategoriNama}</td>
                    <td className="px-4 py-3 tabular-nums font-semibold">{item.stokSaat}</td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{item.thresholdMin}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          status === "KRITIS"
                            ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        )}
                      >
                        {status === "KRITIS" ? "Kritis" : "Perhatian"}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const VIEW_ITEMS = [
  { value: "pareto",    label: "Pareto & ABC",       icon: BarChart3    },
  { value: "fast_slow", label: "Fast/Slow Moving",   icon: TrendingUp   },
  { value: "safety",   label: "Safety Stock Alert",  icon: ShieldAlert  },
]

const PERIODE_OPTIONS = [
  { value: "1", label: "1 Bulan Terakhir" },
  { value: "3", label: "3 Bulan Terakhir" },
  { value: "6", label: "6 Bulan Terakhir" },
]

export default function ParetoPage() {
  const [view, setView] = useState("pareto")
  const [periode, setPeriode] = useState("3")
  const [kategori, setKategori] = useState("semua")

  const { data: kategoriData = [] } = useKategoriList()
  const kategoriOptions = kategoriData.map((k) => k.nama)
  const periodeLabel = PERIODE_OPTIONS.find((p) => p.value === periode)?.label ?? "3 Bulan Terakhir"

  const { data: paretoData, isFetching: loading, refetch } = useParetoAnalysis({
    periode,
    kategori: kategori === "semua" ? undefined : kategori,
  })

  async function handleExport() {
    if (view !== "pareto" || !paretoData) return
    const { handleExportExcel } = await import(
      "@/components/features/analytics/pareto-tab"
    )
    await handleExportExcel(paretoData.items, periodeLabel)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Analitik Inventori"
        description="Analisis Pareto/ABC, Fast/Slow Moving, dan Safety Stock untuk optimasi stok"
      />

      <div className="flex gap-6">
        {/* ── Sidebar kiri ── */}
        <aside className="w-[220px] flex-shrink-0">
          <div className="bg-card border border-border rounded-xl p-4 sticky top-6 space-y-5">
            {/* Tampilan */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Tampilan
              </p>
              <nav className="space-y-0.5">
                {VIEW_ITEMS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setView(value)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                      view === value
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{label}</span>
                  </button>
                ))}
              </nav>
            </div>

            <Separator />

            {/* Periode */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Periode Analisis
              </p>
              <RadioGroup
                value={periode}
                onValueChange={setPeriode}
                className="space-y-1"
              >
                {PERIODE_OPTIONS.map((opt) => (
                  <div key={opt.value} className="flex items-center gap-2 px-1">
                    <RadioGroupItem value={opt.value} id={`periode-${opt.value}`} />
                    <label
                      htmlFor={`periode-${opt.value}`}
                      className="text-sm text-muted-foreground cursor-pointer hover:text-foreground select-none"
                    >
                      {opt.label}
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <Separator />

            {/* Kategori obat */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Kategori Obat
              </p>
              <Select value={kategori} onValueChange={setKategori}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Kategori</SelectItem>
                  {kategoriOptions.map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tombol aksi */}
            <div className="space-y-2 pt-1">
              <Button
                className="w-full h-9 text-sm"
                onClick={() => refetch()}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-2" />
                Jalankan Analisis
              </Button>
              <Button
                variant="outline"
                className="w-full h-9 text-sm"
                onClick={handleExport}
                disabled={view !== "pareto"}
                title={view !== "pareto" ? "Hanya tersedia untuk Pareto & ABC" : undefined}
              >
                <Download className="h-3.5 w-3.5 mr-2" />
                Export Excel
              </Button>
            </div>
          </div>
        </aside>

        {/* ── Konten kanan ── */}
        <main className="flex-1 min-w-0 space-y-5">
          {view === "pareto" && (
            <>
              <AbcSummaryCards data={paretoData} />
              <ParetoTabContent
                hideFilterBar
                loading={loading}
                items={paretoData?.items}
                totalNilai={paretoData?.totalNilai}
                abcSummary={paretoData?.summary}
                kategoriOptions={kategoriOptions}
                externalPeriode={periode}
                externalKategori={kategori}
              />
            </>
          )}

          {view === "fast_slow" && <FastSlowTabContent />}

          {view === "safety" && <SafetyStockView />}
        </main>
      </div>
    </div>
  )
}
