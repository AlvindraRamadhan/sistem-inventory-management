"use client";

import { useStokOpnameList } from "@/hooks/queries/use-stok-opname";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  Clock,
  FileCheck2,
  Package,
  ShoppingCart,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatsCard } from "@/components/shared/stats-card";
import { ActivityFeed } from "@/components/features/audit/activity-feed";
import { ChartSkeleton } from "@/components/shared/skeletons";
import { useAuthStore } from "@/store/auth-store";
import { useDashboardStats, useWeeklyMovement, useParetoAnalysis } from "@/hooks/queries/use-analytics";
import { ROUTES } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";

type AlertType = "critical" | "warning" | "info";

// ─── Lazy-loaded recharts chart (deferred) ────────────────────────────────────

const WeeklyChart = dynamic(
  () =>
    import("@/components/features/dashboard/weekly-chart").then(
      (m) => m.WeeklyChart
    ),
  { loading: () => <ChartSkeleton className="p-0" />, ssr: false }
);

//  Greeting helpers 

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

function getFormattedDate(): string {
  const now = new Date();
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

// Sub-components 

function GreetingBanner({ name }: { name: string }) {
  const firstName = name.split(" ").slice(0, 2).join(" ");
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm text-muted-foreground">{getGreeting()},</p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {firstName} 
        </h1>
      </div>
      <p className="text-sm text-muted-foreground">{getFormattedDate()}</p>
    </div>
  );
}

//  Alert item

interface AlertItemProps {
  type: AlertType;
  title: string;
  description: string;
  href: string;
  count?: number;
}

const alertConfig: Record<AlertType, { dot: string; bg: string; badge: string }> = {
  critical: {
    dot: "bg-red-500",
    bg: "hover:bg-red-50 dark:hover:bg-red-900/10",
    badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  warning: {
    dot: "bg-amber-500",
    bg: "hover:bg-amber-50 dark:hover:bg-amber-900/10",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  info: {
    dot: "bg-blue-500",
    bg: "hover:bg-blue-50 dark:hover:bg-blue-900/10",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
};

function AlertItem({ type, title, description, href, count }: AlertItemProps) {
  const cfg = alertConfig[type];
  return (
    <Link
      href={href}
      className={cn(
        "flex items-start gap-3 rounded-lg px-3 py-3 transition-colors",
        cfg.bg
      )}
    >
      <span className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", cfg.dot)} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-base font-medium text-foreground leading-snug">{title}</p>
          {count !== undefined && (
            <span
              className={cn(
                "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-bold",
                cfg.badge
              )}
            >
              {count}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground leading-snug">{description}</p>
      </div>
      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

// ─── Format helpers ───────────────────────────────────────────────────────────

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

// ─── Top Drugs Card ───────────────────────────────────────────────────────────

const ABC_BADGE: Record<"A" | "B" | "C", string> = {
  A: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  B: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  C: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

function TopDrugsCard() {
  const { data, isLoading } = useParetoAnalysis({ periode: "1" });
  const top5 = data?.items.slice(0, 5) ?? [];

  return (
    <Card className="lg:col-span-3">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Top 5 Obat Terlaris</h2>
          <p className="text-xs text-muted-foreground">Berdasarkan nilai keluar bulan ini</p>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href={ROUTES.ADMIN.ANALYTICS.PARETO} className="flex items-center gap-1 text-xs text-primary">
            Lihat pareto
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </div>

      <div className="px-5 py-3">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-9 animate-pulse rounded bg-muted" />
            ))}
          </div>
        ) : top5.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Belum ada data transaksi bulan ini
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="pb-2 text-left font-medium w-6">#</th>
                <th className="pb-2 text-left font-medium">Nama Obat</th>
                <th className="pb-2 text-left font-medium hidden sm:table-cell">Kategori</th>
                <th className="pb-2 text-right font-medium">Qty</th>
                <th className="pb-2 text-right font-medium">Nilai</th>
                <th className="pb-2 text-right font-medium">ABC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {top5.map((item, idx) => (
                <tr key={item.obatId} className="hover:bg-muted/40 transition-colors">
                  <td className="py-2 text-muted-foreground">{idx + 1}</td>
                  <td className="py-2 font-medium max-w-[140px] truncate" title={item.namaObat}>
                    {item.namaObat}
                  </td>
                  <td className="py-2 text-muted-foreground hidden sm:table-cell">
                    {item.kategoriNama}
                  </td>
                  <td className="py-2 text-right tabular-nums">{item.totalQty.toLocaleString("id-ID")}</td>
                  <td className="py-2 text-right tabular-nums text-xs">{formatRupiah(item.nilaiTotal)}</td>
                  <td className="py-2 text-right">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", ABC_BADGE[item.abc])}>
                      {item.abc}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: stats } = useDashboardStats();
  const { data: weeklyData } = useWeeklyMovement();

  const { data: opnameData } = useStokOpnameList({ status: "PENDING", limit: 1 });
  const pendingOpnameCount = opnameData?.meta.total ?? 0;

  const totalTransaksi =
    (weeklyData?.stokMasuk.reduce((s, r) => s + r.total, 0) ?? 0) +
    (weeklyData?.stokKeluar.reduce((s, r) => s + r.total, 0) ?? 0);

  const stokKritisCount = stats?.stokKritis ?? 0;
  const nearExpiredCount = stats?.nearExpired ?? 0;
  const pendingGRCount = stats?.pendingGR ?? 0;
  const pendingPOCount = stats?.pendingPO ?? 0;

  const alerts: AlertItemProps[] = [
    {
      type: "critical",
      title: "Stok Kritis",
      description: `${stokKritisCount} item perlu restok segera`,
      href: ROUTES.ADMIN.MASTER_DATA.OBAT,
      count: stokKritisCount,
    },
    {
      type: "warning",
      title: "Mendekati Kadaluarsa",
      description: `${nearExpiredCount} item ED < 30 hari`,
      href: ROUTES.ADMIN.MASTER_DATA.OBAT,
      count: nearExpiredCount,
    },
    {
      type: "info",
      title: "GR Perlu Review",
      description: `${pendingGRCount} penerimaan menunggu persetujuan`,
      href: ROUTES.ADMIN.PROCUREMENT.GR,
      count: pendingGRCount,
    },
    {
      type: "info",
      title: "PO Menunggu Konfirmasi",
      description: `${pendingPOCount} PO dalam status pending approval`,
      href: ROUTES.ADMIN.PROCUREMENT.PO,
      count: pendingPOCount,
    },
    ...(pendingOpnameCount > 0
      ? [{
          type: "warning" as const,
          title: "Opname Perlu Disetujui",
          description: `${pendingOpnameCount} opname menunggu validasi dan persetujuan`,
          href: ROUTES.ADMIN.OPNAME,
          count: pendingOpnameCount,
        }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      {/*  Greeting  */}
      <GreetingBanner name={user?.name ?? "Admin"} />

      {/*  KPI Cards  */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          title="Total Item Obat"
          value={stats?.totalObat ?? 0}
          subtitle="item aktif"
          icon={Package}
          variant="default"
        />
        <StatsCard
          title="Stok Kritis"
          value={stokKritisCount}
          subtitle="Perlu restok segera"
          icon={AlertTriangle}
          variant="danger"
        />
        <StatsCard
          title="Mendekati ED"
          value={nearExpiredCount}
          subtitle="< 30 hari"
          icon={Clock}
          variant="warning"
        />
        <StatsCard
          title="PO Pending"
          value={pendingPOCount}
          subtitle="Menunggu persetujuan"
          icon={ClipboardList}
          variant="default"
        />
      </div>

      {/* ── Chart + Alert Panel ────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Chart — 60% (3 of 5 cols) */}
        <Card className="lg:col-span-3">
          <div className="flex flex-col gap-1 border-b border-border px-5 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                Grafik Transaksi 7 Hari Terakhir
              </h2>
              <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1">
                <Zap className="h-3 w-3 text-primary" />
                <span className="text-[11px] font-medium text-primary">
                  {totalTransaksi} total
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Stok masuk vs stok keluar per hari
            </p>
          </div>

          <WeeklyChart />
        </Card>

        {/* Alert Panel — 40% (2 of 5 cols) */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">Perlu Perhatian</h2>
            <Badge variant="secondary" className="text-xs">
              {alerts.reduce((a, al) => a + (al.count ?? 0), 0)} item
            </Badge>
          </div>

          <div className="flex flex-col gap-1 px-2 py-3">
            {alerts.map((alert, i) => (
              <AlertItem key={i} {...alert} />
            ))}
          </div>

          <div className="border-t border-border px-5 py-3">
            <Link
              href={ROUTES.ADMIN.AUDIT_LOG}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Lihat semua aktivitas
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </Card>
      </div>

      {/* ── Bottom tables ──────────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Top 5 Obat — 60% */}
        <TopDrugsCard />

        {/* Aktivitas Terbaru — 40% */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Aktivitas Terbaru
              </h2>
              <p className="text-xs text-muted-foreground">Hari ini</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href={ROUTES.ADMIN.AUDIT_LOG} className="flex items-center gap-1 text-xs text-primary">
                Audit log
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </div>

          <div className="px-5 py-4">
            <ActivityFeed limit={6} showViewAll={false} />
          </div>

          {/* Summary stat row */}
          <div className="border-t border-border px-5 py-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xl font-bold text-foreground">
                  {stats?.stokKritis ?? 0}
                </p>
                <p className="text-xs text-muted-foreground leading-tight">
                  Stok Kritis
                </p>
              </div>
              <Separator orientation="vertical" className="mx-auto h-8 self-center" />
              <div>
                <p className="text-xl font-bold text-foreground">
                  {stats?.nearExpired ?? 0}
                </p>
                <p className="text-xs text-muted-foreground leading-tight">
                  Mendekati ED
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Quick Actions row ──────────────────────────────────────────────── */}
      <Card className="px-5 py-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Aksi Cepat</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={ROUTES.ADMIN.PROCUREMENT.PO} className="flex items-center gap-1.5">
              <ShoppingCart className="h-3.5 w-3.5" />
              Buat Purchase Order
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={ROUTES.ADMIN.PROCUREMENT.GR} className="flex items-center gap-1.5">
              <FileCheck2 className="h-3.5 w-3.5" />
              Review Good Receipt
              {pendingGRCount > 0 && (
                <span className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                  {pendingGRCount}
                </span>
              )}
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={ROUTES.ADMIN.DEFEKTA} className="flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Proses Defekta
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={ROUTES.ADMIN.ANALYTICS.LAPORAN} className="flex items-center gap-1.5">
              <ClipboardList className="h-3.5 w-3.5" />
              Lihat Laporan
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
