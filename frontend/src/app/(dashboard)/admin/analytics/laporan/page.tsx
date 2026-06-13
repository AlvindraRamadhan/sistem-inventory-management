"use client"

import { useState } from "react"
import {
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  FileBarChart,
  FileDown,
  FileSpreadsheet,
  RotateCcw,
  Search,
  TrendingUp,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
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
import { cn } from "@/lib/utils"

// ─── Mock laporan data ─────────────────────────────────────────────────────────

type JenisTrx = "masuk" | "keluar" | "defekta" | "opname" | "mutasi"

interface LaporanRow {
  id: string
  tanggal: string
  jenis: JenisTrx
  namaObat: string
  kategori: string
  qty: number
  satuan: string
  lokasi: string
  operator: string
}

const MOCK_LAPORAN: LaporanRow[] = [
  { id: "TRX-001", tanggal: "2026-05-28", jenis: "masuk",   namaObat: "Amoxicillin 500mg",      kategori: "Antibiotik",   qty: 200, satuan: "Kapsul", lokasi: "Gudang Utama",  operator: "Apt. Ahmad" },
  { id: "TRX-002", tanggal: "2026-05-28", jenis: "keluar",  namaObat: "Paracetamol 500mg",       kategori: "Analgesik",    qty: 50,  satuan: "Tablet", lokasi: "Gudang Utama",  operator: "Apt. Sari"  },
  { id: "TRX-003", tanggal: "2026-05-27", jenis: "masuk",   namaObat: "Ciprofloxacin 500mg",     kategori: "Antibiotik",   qty: 150, satuan: "Tablet", lokasi: "Gudang Utama",  operator: "Apt. Ahmad" },
  { id: "TRX-004", tanggal: "2026-05-27", jenis: "defekta", namaObat: "Omeprazole 20mg",         kategori: "Obat Lambung", qty: 12,  satuan: "Kapsul", lokasi: "Gudang Utama",  operator: "Apt. Rina"  },
  { id: "TRX-005", tanggal: "2026-05-26", jenis: "keluar",  namaObat: "Amlodipine 5mg",          kategori: "Antihipertensi", qty: 80, satuan: "Tablet", lokasi: "Apotek",       operator: "Apt. Sari"  },
  { id: "TRX-006", tanggal: "2026-05-26", jenis: "masuk",   namaObat: "Betadine 30ml",           kategori: "Antiseptik",   qty: 48,  satuan: "Botol",  lokasi: "Gudang Utama",  operator: "Apt. Ahmad" },
  { id: "TRX-007", tanggal: "2026-05-25", jenis: "opname",  namaObat: "Metformin 500mg",         kategori: "Antidiabetes", qty: 300, satuan: "Tablet", lokasi: "Gudang Utama",  operator: "Admin"      },
  { id: "TRX-008", tanggal: "2026-05-25", jenis: "mutasi",  namaObat: "Cetirizine 10mg",         kategori: "Antihistamin", qty: 60,  satuan: "Tablet", lokasi: "Gudang Utama → Apotek", operator: "Apt. Rina" },
  { id: "TRX-009", tanggal: "2026-05-24", jenis: "keluar",  namaObat: "Vitamin C 500mg",         kategori: "Vitamin",      qty: 120, satuan: "Tablet", lokasi: "Apotek",        operator: "Apt. Sari"  },
  { id: "TRX-010", tanggal: "2026-05-24", jenis: "masuk",   namaObat: "Ceftriaxone 1g Injeksi",  kategori: "Antibiotik",   qty: 30,  satuan: "Vial",   lokasi: "Gudang Utama",  operator: "Apt. Ahmad" },
  { id: "TRX-011", tanggal: "2026-05-23", jenis: "keluar",  namaObat: "Ondansetron 4mg",         kategori: "Obat Lambung", qty: 40,  satuan: "Tablet", lokasi: "Apotek",        operator: "Apt. Rina"  },
  { id: "TRX-012", tanggal: "2026-05-23", jenis: "masuk",   namaObat: "Loratadine 10mg",         kategori: "Antihistamin", qty: 100, satuan: "Tablet", lokasi: "Gudang Utama",  operator: "Apt. Ahmad" },
  { id: "TRX-013", tanggal: "2026-05-22", jenis: "defekta", namaObat: "Ranitidine 150mg",        kategori: "Obat Lambung", qty: 8,   satuan: "Tablet", lokasi: "Gudang Utama",  operator: "Apt. Sari"  },
  { id: "TRX-014", tanggal: "2026-05-22", jenis: "keluar",  namaObat: "Simvastatin 20mg",        kategori: "Obat Jantung", qty: 90,  satuan: "Tablet", lokasi: "Apotek",        operator: "Apt. Rina"  },
  { id: "TRX-015", tanggal: "2026-05-21", jenis: "masuk",   namaObat: "Salbutamol Inhaler",      kategori: "Lain-lain",    qty: 24,  satuan: "Botol",  lokasi: "Gudang Utama",  operator: "Apt. Ahmad" },
  { id: "TRX-016", tanggal: "2026-05-21", jenis: "mutasi",  namaObat: "Glibenclamide 5mg",       kategori: "Antidiabetes", qty: 45,  satuan: "Tablet", lokasi: "Gudang Utama → Apotek", operator: "Apt. Sari" },
  { id: "TRX-017", tanggal: "2026-05-20", jenis: "keluar",  namaObat: "Dexamethasone 0.5mg",     kategori: "Analgesik",    qty: 75,  satuan: "Tablet", lokasi: "Apotek",        operator: "Apt. Rina"  },
  { id: "TRX-018", tanggal: "2026-05-20", jenis: "masuk",   namaObat: "Lisinopril 10mg",         kategori: "Antihipertensi", qty: 120, satuan: "Tablet", lokasi: "Gudang Utama", operator: "Apt. Ahmad" },
  { id: "TRX-019", tanggal: "2026-05-19", jenis: "opname",  namaObat: "Furosemide 40mg",         kategori: "Obat Jantung", qty: 80,  satuan: "Tablet", lokasi: "Gudang Utama",  operator: "Admin"      },
  { id: "TRX-020", tanggal: "2026-05-19", jenis: "keluar",  namaObat: "Vitamin B Complex",       kategori: "Vitamin",      qty: 100, satuan: "Tablet", lokasi: "Apotek",        operator: "Apt. Sari"  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"]
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number)
  return `${d} ${months[m - 1]} ${y}`
}

const JENIS_CONFIG: Record<JenisTrx, { label: string; color: string }> = {
  masuk:   { label: "Stok Masuk",   color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  keluar:  { label: "Stok Keluar",  color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  defekta: { label: "Defekta",      color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" },
  opname:  { label: "Stok Opname",  color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" },
  mutasi:  { label: "Mutasi",       color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
}

const TRANSACTION_TYPES: { id: JenisTrx; label: string }[] = [
  { id: "masuk",   label: "Stok Masuk"  },
  { id: "keluar",  label: "Stok Keluar" },
  { id: "defekta", label: "Defekta"     },
  { id: "opname",  label: "Stok Opname" },
  { id: "mutasi",  label: "Mutasi Lokasi" },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LaporanPage() {
  const today = "2026-05-31"
  const defaultFrom = "2026-05-01"

  const [hasResult, setHasResult] = useState(false)
  const [dateFrom, setDateFrom] = useState(defaultFrom)
  const [dateTo, setDateTo] = useState(today)
  const [selectedTypes, setSelectedTypes] = useState<Set<JenisTrx>>(
    new Set(["masuk", "keluar", "defekta", "opname", "mutasi"])
  )
  const [kategori, setKategori] = useState("semua")
  const [lokasi, setLokasi] = useState("semua")

  function handleTypeToggle(id: JenisTrx) {
    setSelectedTypes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function handleReset() {
    setDateFrom(defaultFrom)
    setDateTo(today)
    setSelectedTypes(new Set(["masuk", "keluar", "defekta", "opname", "mutasi"]))
    setKategori("semua")
    setLokasi("semua")
    setHasResult(false)
  }

  function handleTampilkan() {
    setHasResult(true)
  }

  // Filter mock data
  const filteredData = MOCK_LAPORAN.filter((row) => {
    if (!selectedTypes.has(row.jenis)) return false
    if (kategori !== "semua" && row.kategori !== kategori) return false
    if (lokasi !== "semua") {
      if (!row.lokasi.includes(lokasi)) return false
    }
    const tanggal = new Date(row.tanggal)
    if (dateFrom && tanggal < new Date(dateFrom)) return false
    if (dateTo && tanggal > new Date(dateTo)) return false
    return true
  })

  const totalMasuk = filteredData.filter((r) => r.jenis === "masuk").reduce((s, r) => s + r.qty, 0)
  const totalKeluar = filteredData.filter((r) => r.jenis === "keluar").reduce((s, r) => s + r.qty, 0)
  const totalDefekta = filteredData.filter((r) => r.jenis === "defekta").reduce((s, r) => s + r.qty, 0)
  const netStok = totalMasuk - totalKeluar - totalDefekta

  async function handleExportExcel() {
    const XLSX = await import("xlsx")
    const rows = filteredData.map((r) => ({
      "ID Transaksi": r.id,
      "Tanggal": r.tanggal,
      "Jenis": JENIS_CONFIG[r.jenis].label,
      "Nama Obat": r.namaObat,
      "Kategori": r.kategori,
      "Qty": r.qty,
      "Satuan": r.satuan,
      "Lokasi": r.lokasi,
      "Operator": r.operator,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    ws["!cols"] = [
      { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 26 },
      { wch: 16 }, { wch: 8 },  { wch: 10 }, { wch: 22 }, { wch: 14 },
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Inventory")
    XLSX.writeFile(wb, `Laporan_Inventory_${dateFrom}_sd_${dateTo}.xlsx`)
    toast.success("File Excel berhasil diunduh")
  }

  function handleExportPDF() {
    toast.info("Export PDF sedang diproses...", {
      description: "File akan diunduh dalam beberapa saat.",
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Laporan Inventory"
        description="Generate laporan dengan filter fleksibel"
        actions={
          hasResult ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportPDF}>
                <FileDown className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" onClick={handleExportExcel}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </div>
          ) : null
        }
      />

      <div className="flex gap-6">
        {/* ── Filter panel kiri ── */}
        <aside className="w-[260px] flex-shrink-0">
          <div className="bg-card border border-border rounded-xl p-5 sticky top-6 space-y-5">
            <h3 className="font-semibold text-sm text-foreground">Filter Laporan</h3>

            {/* Periode */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Periode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Dari</p>
                  <Input
                    type="date"
                    className="h-8 text-xs"
                    value={dateFrom}
                    max={dateTo}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground mb-1">Sampai</p>
                  <Input
                    type="date"
                    className="h-8 text-xs"
                    value={dateTo}
                    min={dateFrom}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Jenis Transaksi */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Jenis Transaksi
              </label>
              <div className="space-y-2">
                {TRANSACTION_TYPES.map(({ id, label }) => (
                  <div key={id} className="flex items-center gap-2">
                    <Checkbox
                      id={`jenis-${id}`}
                      checked={selectedTypes.has(id)}
                      onCheckedChange={() => handleTypeToggle(id)}
                    />
                    <label
                      htmlFor={`jenis-${id}`}
                      className="text-sm cursor-pointer text-foreground select-none"
                    >
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Kategori obat */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Kategori Obat
              </label>
              <Select value={kategori} onValueChange={setKategori}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Kategori</SelectItem>
                  <SelectItem value="Antibiotik">Antibiotik</SelectItem>
                  <SelectItem value="Analgesik">Analgesik</SelectItem>
                  <SelectItem value="Antihipertensi">Antihipertensi</SelectItem>
                  <SelectItem value="Antidiabetes">Antidiabetes</SelectItem>
                  <SelectItem value="Antihistamin">Antihistamin</SelectItem>
                  <SelectItem value="Antiseptik">Antiseptik</SelectItem>
                  <SelectItem value="Obat Lambung">Obat Lambung</SelectItem>
                  <SelectItem value="Obat Jantung">Obat Jantung</SelectItem>
                  <SelectItem value="Vitamin">Vitamin & Suplemen</SelectItem>
                  <SelectItem value="Lain-lain">Lain-lain</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Lokasi */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Lokasi
              </label>
              <Select value={lokasi} onValueChange={setLokasi}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Semua Lokasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Lokasi</SelectItem>
                  <SelectItem value="Gudang Utama">Gudang Utama</SelectItem>
                  <SelectItem value="Apotek">Apotek</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Tombol */}
            <div className="space-y-2">
              <Button className="w-full h-9" onClick={handleTampilkan}>
                <Search className="h-3.5 w-3.5 mr-2" />
                Tampilkan Laporan
              </Button>
              <Button
                variant="ghost"
                className="w-full h-9 text-muted-foreground hover:text-foreground"
                onClick={handleReset}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-2" />
                Reset Filter
              </Button>
            </div>
          </div>
        </aside>

        {/* ── Hasil kanan ── */}
        <main className="flex-1 min-w-0">
          {!hasResult ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-[420px] text-center rounded-xl border border-dashed border-border">
              <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
                <FileBarChart className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Pilih filter untuk memulai</h3>
              <p className="text-sm text-muted-foreground max-w-[280px]">
                Atur periode dan kriteria filter di panel kiri, lalu klik
                &ldquo;Tampilkan Laporan&rdquo; untuk melihat hasilnya.
              </p>
              <Button className="mt-5" onClick={handleTampilkan}>
                <Search className="h-4 w-4 mr-2" />
                Tampilkan Semua Data
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Ringkasan */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatsCard
                  title="Total Masuk"
                  value={totalMasuk.toLocaleString("id-ID")}
                  subtitle="unit"
                  icon={ArrowDownCircle}
                  variant="success"
                />
                <StatsCard
                  title="Total Keluar"
                  value={totalKeluar.toLocaleString("id-ID")}
                  subtitle="unit"
                  icon={ArrowUpCircle}
                />
                <StatsCard
                  title="Defekta"
                  value={totalDefekta.toLocaleString("id-ID")}
                  subtitle="unit"
                  icon={AlertTriangle}
                  variant="warning"
                />
                <StatsCard
                  title="Net Stok"
                  value={`${netStok >= 0 ? "+" : ""}${netStok.toLocaleString("id-ID")}`}
                  subtitle="unit"
                  icon={TrendingUp}
                  variant={netStok >= 0 ? "success" : "danger"}
                />
              </div>

              {/* Tabel hasil */}
              <Card>
                <CardHeader className="pb-3 px-5 pt-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Detail Transaksi</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Menampilkan {filteredData.length} transaksi
                      {filteredData.length !== MOCK_LAPORAN.length && (
                        <span className="ml-1 text-primary">
                          (difilter dari {MOCK_LAPORAN.length})
                        </span>
                      )}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {filteredData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <FileBarChart className="h-8 w-8 text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Tidak ada transaksi yang sesuai filter
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-t border-border bg-muted/40">
                            {["Tanggal", "Jenis", "Nama Obat", "Kategori", "Qty", "Lokasi", "Operator"].map((h) => (
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
                          {filteredData.map((row) => (
                            <tr
                              key={row.id}
                              className="border-b border-border/60 hover:bg-muted/30 transition-colors"
                            >
                              <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                {formatDate(row.tanggal)}
                              </td>
                              <td className="px-4 py-3">
                                <Badge
                                  className={cn(
                                    "border-0 text-xs font-medium whitespace-nowrap",
                                    JENIS_CONFIG[row.jenis].color
                                  )}
                                >
                                  {JENIS_CONFIG[row.jenis].label}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <p className="font-medium text-foreground leading-snug whitespace-nowrap">
                                  {row.namaObat}
                                </p>
                              </td>
                              <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                {row.kategori}
                              </td>
                              <td className="px-4 py-3 tabular-nums font-semibold whitespace-nowrap">
                                <span
                                  className={cn(
                                    row.jenis === "keluar" || row.jenis === "defekta"
                                      ? "text-rose-600 dark:text-rose-400"
                                      : row.jenis === "masuk"
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : "text-foreground"
                                  )}
                                >
                                  {row.jenis === "keluar" || row.jenis === "defekta" ? "-" : row.jenis === "masuk" ? "+" : ""}
                                  {row.qty.toLocaleString("id-ID")} {row.satuan}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-xs text-muted-foreground">
                                {row.lokasi}
                              </td>
                              <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                                {row.operator}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-border bg-muted/60">
                            <td
                              colSpan={4}
                              className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                            >
                              Total ({filteredData.length} transaksi)
                            </td>
                            <td className="px-4 py-3 tabular-nums text-sm font-bold text-foreground">
                              {filteredData.reduce((s, r) => s + r.qty, 0).toLocaleString("id-ID")} unit
                            </td>
                            <td colSpan={2} />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
