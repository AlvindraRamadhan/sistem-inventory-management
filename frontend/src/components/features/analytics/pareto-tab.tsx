"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  Cell,
  ComposedChart,
  CartesianGrid,
  Legend,
  Line,
  PieChart,
  Pie,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, Download, FlaskConical, Layers, Package, TrendingUp } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";
import { ChartSkeleton } from "@/components/shared/skeletons";
import { cn } from "@/lib/utils";
import type {
  ParetoAnalysisItem,
  ParetoAbcSummary,
} from "@/services/analytics.service";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const formatRupiah = (v: number): string => {
  if (v >= 1_000_000) return `Rp ${(v / 1_000_000).toFixed(1).replace(".", ",")}jt`;
  if (v >= 1_000) return `Rp ${(v / 1_000).toFixed(0)}rb`;
  return `Rp ${v.toLocaleString("id-ID")}`;
};

const formatRupiahFull = (v: number): string =>
  `Rp ${v.toLocaleString("id-ID")}`;

const truncate = (s: string, n: number): string =>
  s.length > n ? s.slice(0, n) + "…" : s;

// ─── Constants ─────────────────────────────────────────────────────────────────

const ABC_COLORS = {
  A: {
    bg: "bg-rose-100 dark:bg-rose-900/30",
    text: "text-rose-700 dark:text-rose-400",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    bar: "#f43f5e",
    row: "bg-rose-50/50 dark:bg-rose-950/20",
  },
  B: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    bar: "#f59e0b",
    row: "bg-amber-50/50 dark:bg-amber-950/20",
  },
  C: {
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-600 dark:text-slate-400",
    badge: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    bar: "#94a3b8",
    row: "",
  },
};

const PIE_COLORS = ["#f43f5e", "#f59e0b", "#94a3b8"];

const PERIODE_OPTIONS = [
  { value: "1", label: "1 Bulan" },
  { value: "3", label: "3 Bulan" },
  { value: "6", label: "6 Bulan" },
  { value: "12", label: "12 Bulan" },
];

// ─── Export (dynamic xlsx) ─────────────────────────────────────────────────────

export const handleExportExcel = async (items: ParetoAnalysisItem[], periodeLabel: string) => {
  const XLSX = await import("xlsx");
  const rows = items.map((item, i) => ({
    "Rank": i + 1,
    "Nama Obat": item.namaObat,
    "Kategori": item.kategoriNama,
    "Total Qty": item.totalQty,
    "Total Nilai (Rp)": item.nilaiTotal,
    "% Kontribusi": parseFloat((item.persentase ?? 0).toFixed(2)),
    "% Kumulatif": parseFloat((item.kumulatif ?? 0).toFixed(2)),
    "Kelas ABC": item.abc,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 6 }, { wch: 28 }, { wch: 20 }, { wch: 12 },
    { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 10 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Analisis Pareto ABC");
  XLSX.writeFile(wb, `Pareto_ABC_${periodeLabel.replace(" ", "_")}.xlsx`);
};

// ─── Sub-components ────────────────────────────────────────────────────────────

const ParetoTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: ParetoAnalysisItem & { kumulatifPct: number } }[];
}) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-card shadow-lg px-4 py-3 text-sm min-w-[220px]">
      <p className="font-semibold text-foreground mb-2 leading-tight">{d.namaObat}</p>
      <div className="space-y-1 text-xs text-muted-foreground">
        <div className="flex justify-between gap-4">
          <span>Nilai Pemakaian</span>
          <span className="font-medium text-foreground">{formatRupiahFull(d.nilaiTotal)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Total Qty</span>
          <span className="font-medium text-foreground">{d.totalQty.toLocaleString("id-ID")}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>% Kontribusi</span>
          <span className="font-medium text-foreground">{d.persentase?.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>% Kumulatif</span>
          <span className="font-medium text-foreground">{d.kumulatifPct?.toFixed(1)}%</span>
        </div>
        <Separator className="my-1" />
        <div className="flex justify-between gap-4">
          <span>Kategori</span>
          <Badge className={cn("border-0 text-xs", ABC_COLORS[d.abc as "A" | "B" | "C"]?.badge)}>
            Kelas {d.abc}
          </Badge>
        </div>
      </div>
    </div>
  );
};

const ABCSummaryCard = ({
  cat,
  count,
  nilai,
  totalNilai,
  totalItems,
  onClick,
  active,
}: {
  cat: "A" | "B" | "C";
  count: number;
  nilai: number;
  totalNilai: number;
  totalItems: number;
  onClick: () => void;
  active: boolean;
}) => {
  const c = ABC_COLORS[cat];
  const pctItems = ((count / totalItems) * 100).toFixed(0);
  const pctNilai = ((nilai / totalNilai) * 100).toFixed(0);
  const desc =
    cat === "A"
      ? "Prioritas utama — kontrol ketat"
      : cat === "B"
        ? "Prioritas sedang — kontrol rutin"
        : "Prioritas rendah — kontrol periodik";

  return (
    <button
      onClick={onClick}
      className={cn(
        "text-left w-full rounded-xl border p-4 transition-all duration-150",
        active
          ? "border-primary ring-2 ring-primary/20 bg-primary/5"
          : "border-border bg-card hover:bg-muted/40"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold", c.bg, c.text)}>
          {cat}
        </div>
        <Badge className={cn("border-0 text-xs", c.badge)}>Kelas {cat}</Badge>
      </div>
      <p className="text-2xl font-bold text-foreground tabular-nums">
        {count} <span className="text-sm font-normal text-muted-foreground">item</span>
      </p>
      <p className="text-sm font-semibold text-foreground mt-1">{formatRupiah(nilai)}</p>
      <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
        <span>{pctItems}% item</span>
        <span>·</span>
        <span>{pctNilai}% nilai</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1.5 leading-snug">{desc}</p>
    </button>
  );
};

// ─── ParetoTabContent (exported) ───────────────────────────────────────────────

export interface ParetoTabContentProps {
  items?: ParetoAnalysisItem[];
  totalNilai?: number;
  abcSummary?: ParetoAbcSummary;
  loading?: boolean;
  kategoriOptions?: string[];
  externalPeriode?: string;
  externalKategori?: string;
  hideFilterBar?: boolean;
}

export const ParetoTabContent = ({
  items = [],
  totalNilai = 0,
  abcSummary,
  loading = false,
  kategoriOptions = [],
  externalPeriode,
  externalKategori,
  hideFilterBar,
}: ParetoTabContentProps = {}) => {
  const [internalPeriode, setInternalPeriode] = useState("6");
  const [filterKat, setFilterKat] = useState("semua");
  const [filterABC, setFilterABC] = useState<"semua" | "A" | "B" | "C">("semua");

  const periode = externalPeriode ?? internalPeriode;
  const filterKatActive = externalKategori ?? filterKat;

  const periodeLabel = PERIODE_OPTIONS.find((p) => p.value === periode)?.label ?? "6 Bulan";

  const summary: ParetoAbcSummary = abcSummary ?? {
    A: { count: 0, nilai: 0 },
    B: { count: 0, nilai: 0 },
    C: { count: 0, nilai: 0 },
  };

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const matchKat = filterKatActive === "semua" || item.kategoriNama === filterKatActive;
        const matchABC = filterABC === "semua" || item.abc === filterABC;
        return matchKat && matchABC;
      }),
    [items, filterKatActive, filterABC]
  );

  const chartData = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        namaObatShort: truncate(item.namaObat, 14),
        kumulatifPct: item.kumulatif ?? 0,
      })),
    [items]
  );

  const pieData = useMemo(
    () => [
      { name: "Kelas A", value: summary.A.nilai, count: summary.A.count },
      { name: "Kelas B", value: summary.B.nilai, count: summary.B.count },
      { name: "Kelas C", value: summary.C.nilai, count: summary.C.count },
    ],
    [summary]
  );

  const filteredTotalNilai = filteredItems.reduce((s, i) => s + i.nilaiTotal, 0);
  const filteredTotalQty = filteredItems.reduce((s, i) => s + i.totalQty, 0);

  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="animate-pulse h-36 rounded-xl border bg-muted" />
          ))}
        </div>
        <ChartSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Filter bar — hidden when sidebar controls are used */}
      {!hideFilterBar && (
        <Card className="px-5 py-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Periode
              </label>
              <Select value={periode} onValueChange={setInternalPeriode}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODE_OPTIONS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Kategori
              </label>
              <Select value={filterKatActive} onValueChange={setFilterKat}>
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
                Kelas ABC
              </label>
              <Select
                value={filterABC}
                onValueChange={(v) => setFilterABC(v as "semua" | "A" | "B" | "C")}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Semua Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Kelas</SelectItem>
                  <SelectItem value="A">Kelas A</SelectItem>
                  <SelectItem value="B">Kelas B</SelectItem>
                  <SelectItem value="C">Kelas C</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportExcel(filteredItems, periodeLabel)}
              className="self-end gap-2"
            >
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </Card>
      )}

      {/* ABC summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(["A", "B", "C"] as const).map((cat) => (
          <ABCSummaryCard
            key={cat}
            cat={cat}
            count={summary[cat].count}
            nilai={summary[cat].nilai}
            totalNilai={totalNilai}
            totalItems={items.length}
            onClick={() => setFilterABC((prev) => (prev === cat ? "semua" : cat))}
            active={filterABC === cat}
          />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card className="lg:col-span-7 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Pareto Chart — Nilai Pemakaian
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Bar: nilai per item · Garis: % kumulatif
              </p>
            </div>
            <Badge className="border-0 text-xs bg-muted text-muted-foreground">
              {periodeLabel}
            </Badge>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart
              data={chartData}
              margin={{ top: 8, right: 48, bottom: 60, left: 16 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="namaObatShort"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                angle={-45}
                textAnchor="end"
                interval={0}
                height={70}
              />
              <YAxis
                yAxisId="nilai"
                orientation="left"
                tickFormatter={(v) => formatRupiah(v)}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                width={72}
              />
              <YAxis
                yAxisId="pct"
                orientation="right"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                width={40}
              />
              <Tooltip content={<ParetoTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                formatter={(value) =>
                  value === "nilaiTotal" ? "Nilai Pemakaian" : "% Kumulatif"
                }
              />
              <Bar
                yAxisId="nilai"
                dataKey="nilaiTotal"
                radius={[3, 3, 0, 0]}
                maxBarSize={32}
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.obatId}
                    fill={
                      entry.abc === "A"
                        ? ABC_COLORS.A.bar
                        : entry.abc === "B"
                          ? ABC_COLORS.B.bar
                          : ABC_COLORS.C.bar
                    }
                  />
                ))}
              </Bar>
              <Line
                yAxisId="pct"
                type="monotone"
                dataKey="kumulatifPct"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <ReferenceLine
                yAxisId="pct"
                y={80}
                stroke="#ef4444"
                strokeDasharray="6 3"
                label={{
                  value: "80%",
                  position: "right",
                  fontSize: 11,
                  fill: "#ef4444",
                  offset: 4,
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>

        <Card className="lg:col-span-5 p-5">
          <div className="mb-4">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Distribusi Nilai ABC
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Total: {formatRupiah(totalNilai)}
            </p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={88}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [formatRupiahFull(Number(value ?? 0)), "Nilai"]}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-2">
            {(["A", "B", "C"] as const).map((cat, idx) => {
              const pct = totalNilai > 0 ? ((summary[cat].nilai / totalNilai) * 100).toFixed(1) : "0.0";
              return (
                <div key={cat} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: PIE_COLORS[idx] }}
                    />
                    <span className="text-foreground font-medium">Kelas {cat}</span>
                    <span className="text-muted-foreground">({summary[cat].count} item)</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-foreground">{pct}%</span>
                    <span className="text-muted-foreground ml-1.5">
                      {formatRupiah(summary[cat].nilai)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <Separator className="my-3" />
          <div className="rounded-md bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800 px-3 py-2.5">
            <p className="text-xs font-medium text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              Temuan Pareto
            </p>
            <p className="text-xs text-rose-600 dark:text-rose-500 mt-0.5">
              {summary.A.count} item (
              {items.length > 0 ? ((summary.A.count / items.length) * 100).toFixed(0) : 0}% dari total)
              menyumbang{" "}
              {totalNilai > 0 ? ((summary.A.nilai / totalNilai) * 100).toFixed(0) : 0}% nilai pemakaian —
              fokusan kontrol di sini.
            </p>
          </div>
        </Card>
      </div>

      {/* Detail table */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Tabel Detail ABC
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {filteredItems.length} item tampil
              {filterABC !== "semua" && ` · Kelas ${filterABC}`}
              {filterKat !== "semua" && ` · ${filterKat}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Total nilai:{" "}
              <strong className="text-foreground">{formatRupiah(filteredTotalNilai)}</strong>
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {[
                  { label: "Rank", cls: "text-left w-12" },
                  { label: "Nama Obat", cls: "text-left" },
                  { label: "Kategori", cls: "text-left" },
                  { label: "Total Qty", cls: "text-right" },
                  { label: "Nilai Pemakaian", cls: "text-right" },
                  { label: "%", cls: "text-right w-20" },
                  { label: "Kumulatif", cls: "text-right w-24" },
                  { label: "ABC", cls: "text-center w-20" },
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
              {filteredItems.map((item) => {
                const abc = item.abc as "A" | "B" | "C";
                const rank = items.findIndex((p) => p.obatId === item.obatId) + 1;
                return (
                  <tr
                    key={item.obatId}
                    className={cn(
                      "border-b border-border/60 transition-colors hover:bg-muted/30",
                      ABC_COLORS[abc].row
                    )}
                  >
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{rank}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground leading-snug">{item.namaObat}</p>
                      <p className="text-xs text-muted-foreground">{item.satuanNama}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">{item.kategoriNama}</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-sm">
                      {item.totalQty.toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-sm font-semibold text-foreground">
                      {formatRupiahFull(item.nilaiTotal)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-xs text-muted-foreground">
                      {(item.persentase ?? 0).toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-xs">
                      <span
                        className={cn(
                          "font-medium",
                          (item.kumulatif ?? 0) <= 80
                            ? "text-rose-600 dark:text-rose-400"
                            : (item.kumulatif ?? 0) <= 95
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-muted-foreground"
                        )}
                      >
                        {(item.kumulatif ?? 0).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={cn("border-0 text-xs font-bold", ABC_COLORS[abc].badge)}>
                        {abc}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/60">
                <td
                  colSpan={3}
                  className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                >
                  Total ({filteredItems.length} item)
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-sm font-bold text-foreground">
                  {filteredTotalQty.toLocaleString("id-ID")}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-sm font-bold text-foreground">
                  {formatRupiahFull(filteredTotalNilai)}
                </td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
};
