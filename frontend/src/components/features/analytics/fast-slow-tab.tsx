"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertCircle,
  Clock,
  Download,
  Minus,
  Package,
  RefreshCw,
  TrendingDown,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useFastSlowItems } from "@/hooks/queries/use-analytics";
import { useKategoriList } from "@/hooks/queries/use-kategori";
import type { FastSlowItem } from "@/services/analytics.service";
import type { MovingCategory } from "@/types/analytics";

// ─── Inline helper (removed from mock module) ─────────────────────────────────

function getRekomendasi(item: FastSlowItem): string {
  switch (item.moving) {
    case "FAST":
      return `Fast moving — pertahankan safety stock ≥ ${Math.ceil(item.avgPerBulan * 1.5).toLocaleString("id-ID")} ${item.satuanNama.toLowerCase()}. Pantau setiap minggu.`;
    case "MEDIUM":
      return `Perputaran normal — order saat stok ≤ ${Math.ceil(item.avgPerBulan).toLocaleString("id-ID")} ${item.satuanNama.toLowerCase()}. Tinjau bulanan.`;
    case "SLOW":
      return `Slow moving — kurangi jumlah order berikutnya. Evaluasi kebutuhan dan cegah penumpukan stok.`;
    case "NON_MOVING":
      return `Tidak ada transaksi ≥ 30 hari — pertimbangkan redistribusi ke gudang lain atau kembalikan ke supplier.`;
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const truncate = (s: string, n: number): string =>
  s.length > n ? s.slice(0, n) + "…" : s;

const formatDateShort = (iso: string): string => {
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} ${months[m - 1]} ${y}`;
};

const daysSince = (iso: string): number =>
  Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);

// ─── Constants ─────────────────────────────────────────────────────────────────

const MOVING_META: Record<
  MovingCategory,
  {
    label: string;
    shortLabel: string;
    icon: React.ElementType;
    badgeCls: string;
    rowCls: string;
    cardBorder: string;
    cardIcon: string;
    barColor: string;
  }
> = {
  FAST: {
    label: "Fast Moving",
    shortLabel: "Fast",
    icon: Zap,
    badgeCls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    rowCls: "bg-emerald-50/40 dark:bg-emerald-950/20",
    cardBorder: "border-emerald-200 dark:border-emerald-800",
    cardIcon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    barColor: "#10b981",
  },
  MEDIUM: {
    label: "Normal",
    shortLabel: "Normal",
    icon: Minus,
    badgeCls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    rowCls: "",
    cardBorder: "border-blue-200 dark:border-blue-800",
    cardIcon: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    barColor: "#3b82f6",
  },
  SLOW: {
    label: "Slow Moving",
    shortLabel: "Slow",
    icon: TrendingDown,
    badgeCls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    rowCls: "bg-amber-50/40 dark:bg-amber-950/20",
    cardBorder: "border-amber-200 dark:border-amber-800",
    cardIcon: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    barColor: "#f59e0b",
  },
  NON_MOVING: {
    label: "Non-Moving",
    shortLabel: "Non-Moving",
    icon: AlertCircle,
    badgeCls: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    rowCls: "bg-rose-50/40 dark:bg-rose-950/20",
    cardBorder: "border-rose-200 dark:border-rose-800",
    cardIcon: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
    barColor: "#f43f5e",
  },
};

// ─── Export (dynamic xlsx) ─────────────────────────────────────────────────────

const handleExportExcel = async (items: FastSlowItem[]) => {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  const categories: MovingCategory[] = ["FAST", "MEDIUM", "SLOW", "NON_MOVING"];
  const sheetNames: Record<MovingCategory, string> = {
    FAST: "Fast Moving",
    MEDIUM: "Normal",
    SLOW: "Slow Moving",
    NON_MOVING: "Non-Moving",
  };

  for (const cat of categories) {
    const subset = items.filter((i) => i.moving === cat);
    if (subset.length === 0) continue;
    const rows = subset.map((item) => ({
      "Nama Obat": item.namaObat,
      "Kategori": item.kategoriNama,
      "Satuan": item.satuanNama,
      "Rata-rata/Bulan": item.avgPerBulan,
      "Total 6 Bulan": item.totalKeluar,
      "Stok Saat Ini": item.stokSaat,
      "Klasifikasi": MOVING_META[item.moving].label,
      "Terakhir Transaksi": formatDateShort(item.lastTransaksi),
      "Rekomendasi": getRekomendasi(item),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [
      { wch: 26 }, { wch: 20 }, { wch: 10 }, { wch: 16 },
      { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 44 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, sheetNames[cat]);
  }

  XLSX.writeFile(wb, "Fast_Slow_Moving.xlsx");
};

// ─── Sub-components ────────────────────────────────────────────────────────────

const FastBarTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: FastSlowItem }[];
}) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-card shadow-lg px-4 py-3 text-xs min-w-[200px]">
      <p className="font-semibold text-foreground mb-2 leading-tight">{d.namaObat}</p>
      <div className="space-y-1 text-muted-foreground">
        <div className="flex justify-between gap-4">
          <span>Rata-rata/Bulan</span>
          <span className="font-medium text-foreground">
            {d.avgPerBulan.toLocaleString("id-ID")} {d.satuanNama.toLowerCase()}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Total 6 Bulan</span>
          <span className="font-medium text-foreground">
            {d.totalKeluar.toLocaleString("id-ID")}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Stok Saat Ini</span>
          <span className="font-medium text-foreground">
            {d.stokSaat.toLocaleString("id-ID")}
          </span>
        </div>
      </div>
    </div>
  );
};

const MovingSummaryCard = ({
  moving,
  count,
  totalItems,
  onClick,
  active,
}: {
  moving: MovingCategory;
  count: number;
  totalItems: number;
  onClick: () => void;
  active: boolean;
}) => {
  const m = MOVING_META[moving];
  const Icon = m.icon;
  const pct = ((count / totalItems) * 100).toFixed(0);
  const desc: Record<MovingCategory, string> = {
    FAST: "Perputaran tinggi — prioritas safety stock",
    MEDIUM: "Perputaran normal — pertahankan level",
    SLOW: "Perputaran lambat — kurangi order",
    NON_MOVING: "Tidak ada transaksi ≥ 30 hari — evaluasi stok",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "text-left w-full rounded-xl border p-4 transition-all duration-150",
        active
          ? "border-primary ring-2 ring-primary/20 bg-primary/5"
          : `${m.cardBorder} bg-card hover:bg-muted/40`
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", m.cardIcon)}>
          <Icon className="h-5 w-5" />
        </div>
        <Badge className={cn("border-0 text-xs", m.badgeCls)}>{m.shortLabel}</Badge>
      </div>
      <p className="text-2xl font-bold text-foreground tabular-nums">
        {count} <span className="text-sm font-normal text-muted-foreground">item</span>
      </p>
      <p className="text-xs text-muted-foreground mt-1">{pct}% dari total item</p>
      <p className="text-xs text-muted-foreground mt-1.5 leading-snug">{desc[moving]}</p>
    </button>
  );
};

// ─── FastSlowTabContent (exported) ────────────────────────────────────────────

export const FastSlowTabContent = () => {
  const { data: rawItems = [], isLoading } = useFastSlowItems();
  const { data: kategoriData = [] } = useKategoriList();

  const [filterMoving, setFilterMoving] = useState<MovingCategory | "semua">("semua");
  const [filterKat, setFilterKat] = useState("semua");
  const [threshold, setThreshold] = useState("20");

  const thresholdNum = parseInt(threshold, 10) || 20;

  const reclassified = useMemo<FastSlowItem[]>(
    () =>
      rawItems.map((item) => {
        if (item.avgPerBulan === 0) return { ...item, moving: "NON_MOVING" as MovingCategory };
        if (item.avgPerBulan >= thresholdNum) return { ...item, moving: "FAST" as MovingCategory };
        if (item.avgPerBulan >= 5) return { ...item, moving: "MEDIUM" as MovingCategory };
        return { ...item, moving: "SLOW" as MovingCategory };
      }),
    [rawItems, thresholdNum]
  );

  const summary = useMemo(
    () => ({
      FAST: { count: reclassified.filter((i) => i.moving === "FAST").length },
      MEDIUM: { count: reclassified.filter((i) => i.moving === "MEDIUM").length },
      SLOW: { count: reclassified.filter((i) => i.moving === "SLOW").length },
      NON_MOVING: { count: reclassified.filter((i) => i.moving === "NON_MOVING").length },
    }),
    [reclassified]
  );

  const filteredItems = useMemo(
    () =>
      reclassified.filter((item) => {
        const matchMoving = filterMoving === "semua" || item.moving === filterMoving;
        const matchKat = filterKat === "semua" || item.kategoriNama === filterKat;
        return matchMoving && matchKat;
      }),
    [reclassified, filterMoving, filterKat]
  );

  const top10Fast = useMemo(
    () =>
      reclassified
        .filter((i) => i.moving === "FAST")
        .sort((a, b) => b.avgPerBulan - a.avgPerBulan)
        .slice(0, 10)
        .map((i) => ({ ...i, namaShort: truncate(i.namaObat, 20) })),
    [reclassified]
  );

  const kategoriOptions = useMemo(() => kategoriData.map((k) => k.nama), [kategoriData]);
  const totalItems = reclassified.length;

  const handleExport = useCallback(
    () => handleExportExcel(reclassified),
    [reclassified]
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Filter bar */}
      <Card className="px-5 py-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Klasifikasi
            </label>
            <Select
              value={filterMoving}
              onValueChange={(v) => setFilterMoving(v as MovingCategory | "semua")}
            >
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Semua" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Klasifikasi</SelectItem>
                <SelectItem value="FAST">Fast Moving</SelectItem>
                <SelectItem value="MEDIUM">Normal</SelectItem>
                <SelectItem value="SLOW">Slow Moving</SelectItem>
                <SelectItem value="NON_MOVING">Non-Moving</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Kategori
            </label>
            <Select value={filterKat} onValueChange={setFilterKat}>
              <SelectTrigger className="w-[180px]">
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
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Threshold Fast (unit/bulan)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="flex h-9 w-24 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring tabular-nums"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setThreshold("20")}
                className="text-xs h-9 px-3"
                aria-label="Reset threshold"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} className="self-end gap-2">
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(["FAST", "MEDIUM", "SLOW", "NON_MOVING"] as MovingCategory[]).map((cat) => (
          <MovingSummaryCard
            key={cat}
            moving={cat}
            count={summary[cat].count}
            totalItems={totalItems}
            onClick={() => setFilterMoving((prev) => (prev === cat ? "semua" : cat))}
            active={filterMoving === cat}
          />
        ))}
      </div>

      {/* Top 10 Fast Moving chart */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-500" />
              Top 10 Fast Moving Items
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Rata-rata pengeluaran per bulan — threshold saat ini: ≥{thresholdNum} unit/bulan
            </p>
          </div>
          <Badge className="border-0 text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            {top10Fast.length} item
          </Badge>
        </div>

        {top10Fast.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-sm text-muted-foreground">
            Tidak ada item Fast Moving dengan threshold saat ini
          </div>
        ) : (
          <ResponsiveContainer
            width="100%"
            height={Math.max(top10Fast.length * 36 + 40, 120)}
          >
            <BarChart
              data={top10Fast}
              layout="vertical"
              margin={{ top: 0, right: 80, bottom: 0, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => `${v}`}
              />
              <YAxis
                type="category"
                dataKey="namaShort"
                width={150}
                tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }}
              />
              <Tooltip content={<FastBarTooltip />} />
              <Bar
                dataKey="avgPerBulan"
                radius={[0, 4, 4, 0]}
                maxBarSize={22}
                fill={MOVING_META.FAST.barColor}
              >
                {top10Fast.map((_, idx) => (
                  <Cell
                    key={idx}
                    fill={MOVING_META.FAST.barColor}
                    fillOpacity={1 - idx * 0.07}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Full table */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Semua Item — Klasifikasi &amp; Rekomendasi
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {filteredItems.length} item tampil
              {filterMoving !== "semua" && ` · ${MOVING_META[filterMoving].label}`}
              {filterKat !== "semua" && ` · ${filterKat}`}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {[
                  { label: "Nama Obat", cls: "text-left" },
                  { label: "Kategori", cls: "text-left" },
                  { label: "Qty/Bulan", cls: "text-right w-28" },
                  { label: "Klasifikasi", cls: "text-center w-32" },
                  { label: "Stok Saat Ini", cls: "text-right w-28" },
                  { label: "Terakhir Transaksi", cls: "text-left w-40" },
                  { label: "Rekomendasi", cls: "text-left" },
                ].map(({ label, cls }) => (
                  <th
                    key={label}
                    className={cn(
                      "px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide",
                      cls
                    )}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <p className="text-sm text-muted-foreground">Memuat data...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Tidak ada item ditemukan
                  </td>
                </tr>
              ) : filteredItems.map((item) => {
                const m = MOVING_META[item.moving];
                const Icon = m.icon;
                const sincedays = daysSince(item.lastTransaksi);
                const isStale = sincedays > 30;
                const rekomendasi = getRekomendasi(item);
                return (
                  <tr
                    key={item.obatId}
                    className={cn(
                      "border-b border-border/60 transition-colors hover:bg-muted/30",
                      m.rowCls
                    )}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground leading-snug">{item.namaObat}</p>
                      <p className="text-xs text-muted-foreground">{item.satuanNama}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">{item.kategoriNama}</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {item.avgPerBulan > 0 ? (
                        <span className="text-sm font-semibold text-foreground">
                          {item.avgPerBulan.toLocaleString("id-ID")}
                        </span>
                      ) : (
                        <span className="text-xs text-rose-500 font-medium">—</span>
                      )}
                      <span className="text-xs text-muted-foreground ml-1">
                        {item.satuanNama.toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={cn("border-0 text-xs gap-1", m.badgeCls)}>
                        <Icon className="h-3 w-3" />
                        {m.shortLabel}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-sm font-medium text-foreground">
                      {item.stokSaat.toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className={cn(
                          "flex items-center gap-1.5 text-xs",
                          isStale
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-muted-foreground"
                        )}
                      >
                        <Clock className="h-3 w-3 shrink-0" />
                        <span>{formatDateShort(item.lastTransaksi)}</span>
                        {isStale && (
                          <span className="text-amber-500">({sincedays}h)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p
                        className={cn(
                          "text-xs leading-snug",
                          item.moving === "FAST"
                            ? "text-emerald-700 dark:text-emerald-400"
                            : item.moving === "NON_MOVING"
                              ? "text-rose-600 dark:text-rose-400"
                              : item.moving === "SLOW"
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-muted-foreground"
                        )}
                      >
                        {rekomendasi}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
