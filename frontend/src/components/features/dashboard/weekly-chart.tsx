"use client";

import { useMemo } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Separator } from "@/components/ui/separator";
import { useWeeklyMovement } from "@/hooks/queries/use-analytics";

// ─── Custom tooltip ────────────────────────────────────────────────────────────

interface ChartPayloadEntry {
  name: string;
  value: number;
  color: string;
}

const CustomChartTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ChartPayloadEntry[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md">
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium text-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── WeeklyChart (exported) ────────────────────────────────────────────────────

export const WeeklyChart = () => {
  const { data, isLoading } = useWeeklyMovement();

  const chartData = useMemo(() => {
    if (!data) return [];
    const masukMap = new Map(data.stokMasuk.map((r) => [r.week, r.total]));
    const keluarMap = new Map(data.stokKeluar.map((r) => [r.week, r.total]));
    const allWeeks = [
      ...new Set([...masukMap.keys(), ...keluarMap.keys()]),
    ].sort();
    return allWeeks.map((week) => ({
      day: week,
      masuk: masukMap.get(week) ?? 0,
      keluar: keluarMap.get(week) ?? 0,
    }));
  }, [data]);

  const totalMasuk = data?.stokMasuk.reduce((s, r) => s + r.total, 0) ?? 0;
  const totalKeluar = data?.stokKeluar.reduce((s, r) => s + r.total, 0) ?? 0;

  return (
  <div className="px-5 py-4">
    <div className="mb-4 flex gap-4">
      <div className="flex items-center gap-1.5">
        <TrendingUp className="h-5 w-5" style={{ color: "#2d9d8f" }} />
        <span className="text-sm text-muted-foreground">Total masuk:</span>
        <span className="text-base font-semibold" style={{ color: "#2d9d8f" }}>
          {isLoading ? "—" : totalMasuk.toLocaleString("id-ID")}
        </span>
      </div>
      <Separator orientation="vertical" className="h-5" />
      <div className="flex items-center gap-1.5">
        <TrendingDown className="h-5 w-5" style={{ color: "#f4b942" }} />
        <span className="text-sm text-muted-foreground">Total keluar:</span>
        <span className="text-base font-semibold" style={{ color: "#f4b942" }}>
          {isLoading ? "—" : totalKeluar.toLocaleString("id-ID")}
        </span>
      </div>
    </div>

    {isLoading ? (
      <div className="flex h-[220px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    ) : (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart
        data={chartData}
        margin={{ top: 8, right: 16, left: -16, bottom: 0 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--color-border)"
          vertical={false}
        />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomChartTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
        />
        <Line
          type="monotone"
          dataKey="masuk"
          name="Stok Masuk"
          stroke="#2d9d8f"
          strokeWidth={2.5}
          dot={{ r: 4, fill: "#2d9d8f", strokeWidth: 0 }}
          activeDot={{ r: 6, fill: "#2d9d8f", stroke: "white", strokeWidth: 2 }}
        />
        <Line
          type="monotone"
          dataKey="keluar"
          name="Stok Keluar"
          stroke="#f4b942"
          strokeWidth={2.5}
          dot={{ r: 4, fill: "#f4b942", strokeWidth: 0 }}
          activeDot={{ r: 6, fill: "#f4b942", stroke: "white", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
    )}
  </div>
  );
};
