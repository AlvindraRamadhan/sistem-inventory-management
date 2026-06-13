"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FileX2,
  PackageMinus,
  PackagePlus,
  ReceiptText,
  RefreshCw,
  Stethoscope,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatsCard } from "@/components/shared/stats-card";
import { useAuthStore } from "@/store/auth-store";
import { useDashboardStats, useSafetyStock } from "@/hooks/queries/use-analytics";
import { useGRList } from "@/hooks/queries/use-good-receipt";
import { useStokOpnameList } from "@/hooks/queries/use-stok-opname";
import { useDefektaList } from "@/hooks/queries/use-defekta";
import type { SafetyStockItem } from "@/services/analytics.service";
import { ROUTES } from "@/lib/constants/routes";
import { cn } from "@/lib/utils";

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

//  Task Inbox 

type TaskStatus = "urgent" | "warning" | "info" | "done";

interface InboxTask {
  icon: React.ElementType;
  label: string;
  description: string;
  count: number;
  href: string;
  status: TaskStatus;
}

const taskStatusStyles: Record<TaskStatus, {
  iconBg: string;
  iconColor: string;
  countBg: string;
  countText: string;
  border: string;
  rowHover: string;
}> = {
  urgent: {
    iconBg: "bg-red-100 dark:bg-red-900/30",
    iconColor: "text-red-600 dark:text-red-400",
    countBg: "bg-red-500",
    countText: "text-white",
    border: "border-l-red-500",
    rowHover: "hover:bg-red-50 dark:hover:bg-red-900/10",
  },
  warning: {
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
    countBg: "bg-amber-500",
    countText: "text-white",
    border: "border-l-amber-500",
    rowHover: "hover:bg-amber-50 dark:hover:bg-amber-900/10",
  },
  info: {
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    countBg: "bg-blue-500",
    countText: "text-white",
    border: "border-l-blue-500",
    rowHover: "hover:bg-blue-50 dark:hover:bg-blue-900/10",
  },
  done: {
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
    countBg: "bg-muted",
    countText: "text-muted-foreground",
    border: "border-l-border",
    rowHover: "hover:bg-muted/50",
  },
};

function TaskInboxRow({ task }: { task: InboxTask }) {
  const hasTasks = task.count > 0;
  const style = hasTasks ? taskStatusStyles[task.status] : taskStatusStyles.done;
  const Icon = task.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-r-lg border-l-[3px] px-4 py-3.5 transition-colors",
        style.border,
        style.rowHover,
        !hasTasks && "opacity-60"
      )}
    >
      {/* Icon */}
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", style.iconBg)}>
        <Icon className={cn("h-5 w-5", style.iconColor)} />
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={cn("text-sm font-semibold leading-snug", hasTasks ? "text-foreground" : "text-muted-foreground")}>
            {task.label}
          </p>
          {hasTasks && (
            <span
              className={cn(
                "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold",
                style.countBg,
                style.countText
              )}
            >
              {task.count}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-snug">{task.description}</p>
      </div>

      {/* Action */}
      {hasTasks ? (
        <Button size="sm" variant="outline" asChild className="shrink-0">
          <Link href={task.href} className="flex items-center gap-1.5">
            Buka
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      ) : (
        <div className="flex h-8 shrink-0 items-center gap-1.5 px-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span className="text-xs text-muted-foreground">Selesai</span>
        </div>
      )}
    </div>
  );
}

//  Quick action card 

interface QuickActionProps {
  icon: React.ElementType;
  label: string;
  description: string;
  href: string;
  badge?: number;
  accent?: "primary" | "blue" | "amber" | "red" | "violet";
}

const accentStyles: Record<string, { idle: string; hover: string; text: string }> = {
  primary: {
    idle: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    hover: "group-hover:bg-emerald-500 group-hover:text-white",
    text: "group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
  },
  blue: {
    idle: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    hover: "group-hover:bg-blue-500 group-hover:text-white",
    text: "group-hover:text-blue-600",
  },
  amber: {
    idle: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    hover: "group-hover:bg-amber-500 group-hover:text-white",
    text: "group-hover:text-amber-600",
  },
  red: {
    idle: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    hover: "group-hover:bg-red-500 group-hover:text-white",
    text: "group-hover:text-red-600",
  },
  violet: {
    idle: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
    hover: "group-hover:bg-violet-500 group-hover:text-white",
    text: "group-hover:text-violet-600",
  },
};

function QuickActionCard({ icon: Icon, label, description, href, badge, accent = "primary" }: QuickActionProps) {
  const ac = accentStyles[accent];
  return (
    <Link
      href={href}
      className="group relative flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/20 hover:shadow-sm"
    >
      {/* Badge */}
      {badge !== undefined && badge > 0 && (
        <span className="absolute right-3 top-3 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
          {badge}
        </span>
      )}

      {/* Icon */}
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
          ac.idle,
          ac.hover
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      {/* Text */}
      <div className="flex flex-col gap-0.5">
        <p className="text-sm font-semibold text-foreground leading-snug">{label}</p>
        <p className="text-xs text-muted-foreground leading-snug">{description}</p>
      </div>
    </Link>
  );
}

//  Stok Menipis list

function StokMenipisList({ items }: { items: SafetyStockItem[] }) {
  const top5 = items.slice(0, 5);

  return (
    <div className="divide-y divide-border">
      {top5.map((item, i) => {
        const pct = item.thresholdMin > 0
          ? Math.round((item.stokSaat / item.thresholdMin) * 100)
          : 100;
        const isKritis = pct < 25;
        const isRendah = pct < 50;

        return (
          <div key={item.obatId} className="flex items-center gap-4 py-3">
            {/* Rank */}
            <span className="w-5 shrink-0 text-center text-xs font-medium text-muted-foreground">
              {i + 1}
            </span>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground leading-snug truncate">
                    {item.namaObat}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.kategoriNama} · {item.kodeObat}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p
                    className={cn(
                      "text-sm font-bold leading-snug",
                      isKritis
                        ? "text-red-600 dark:text-red-400"
                        : isRendah
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-foreground"
                    )}
                  >
                    {item.stokSaat}
                    <span className="text-xs font-normal text-muted-foreground ml-0.5">{item.satuanNama}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground">min {item.thresholdMin}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    isKritis ? "bg-red-500" : isRendah ? "bg-amber-500" : "bg-primary"
                  )}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{pct}% dari minimum</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

//  Page

export default function ApotekerDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const firstName = (user?.name ?? "Apoteker").split(" ").slice(0, 2).join(" ");

  const { data: stats } = useDashboardStats();
  const { data: safetyStockData, isLoading: loadingSafety } = useSafetyStock();
  const { data: grData } = useGRList({ status: "MENUNGGU_INPUT", limit: 1 });
  const { data: opnameDitolakData } = useStokOpnameList({ status: "REJECTED", limit: 1 });
  const { data: defektaDitolakData } = useDefektaList({ status: "ditolak", limit: 1 });
  const { data: defektaPendingData } = useDefektaList({ status: "menunggu", limit: 1 });

  const kritisItems = safetyStockData?.filter((i) => i.isKritis) ?? [];

  const grMenungguInput = grData?.meta?.total ?? 0;
  const opnameDitolak = opnameDitolakData?.meta?.total ?? 0;
  const defektaDitolak = defektaDitolakData?.meta?.total ?? 0;

  const totalPendingTasks = grMenungguInput + opnameDitolak + defektaDitolak;

  const tasks: InboxTask[] = [
    {
      icon: ReceiptText,
      label: "Good Receipt Perlu Diolah",
      description: "PO diterima dari Admin, menunggu verifikasi dan input penerimaan",
      count: grMenungguInput,
      href: ROUTES.APOTEKER.GOOD_RECEIPT,
      status: "info",
    },
    {
      icon: Stethoscope,
      label: "Resep E-Prescribing Pending",
      description: "Resep dari dokter belum diproses, pasien menunggu",
      count: 0,
      href: ROUTES.APOTEKER.E_PRESCRIBING,
      status: "urgent",
    },
    {
      icon: XCircle,
      label: "Stok Opname Ditolak - Perlu Revisi",
      description: "Admin menolak opname, periksa catatan penolakan dan perbaiki",
      count: opnameDitolak,
      href: ROUTES.APOTEKER.OPNAME,
      status: "warning",
    },
    {
      icon: FileX2,
      label: "Defekta Ditolak - Perlu Revisi",
      description: "Admin menolak laporan defekta, lengkapi data yang diminta",
      count: defektaDitolak,
      href: ROUTES.APOTEKER.DEFEKTA,
      status: "warning",
    },
  ];

  const quickActions: QuickActionProps[] = [
    {
      icon: PackagePlus,
      label: "Stok Masuk",
      description: "Input penerimaan barang baru",
      href: ROUTES.APOTEKER.STOK_MASUK,
      accent: "primary",
    },
    {
      icon: PackageMinus,
      label: "Stok Keluar",
      description: "Pengeluaran ke poli atau pasien",
      href: ROUTES.APOTEKER.STOK_KELUAR,
      accent: "blue",
    },
    {
      icon: ClipboardList,
      label: "Stok Opname",
      description: "Hitung & rekonsiliasi stok fisik",
      href: ROUTES.APOTEKER.OPNAME,
      accent: "violet",
    },
    {
      icon: AlertTriangle,
      label: "Lapor Defekta",
      description: "Barang rusak, ED, atau tidak layar pakai",
      href: ROUTES.APOTEKER.DEFEKTA,
      accent: "amber",
    },
    {
      icon: RefreshCw,
      label: "Mutasi Lokasi",
      description: "Pindah stok antar gudang / poli",
      href: ROUTES.APOTEKER.MUTASI_LOKASI,
      accent: "primary",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/*  Greeting  */}
      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{getGreeting()},</p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {firstName} 
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">{getFormattedDate()}</p>
      </div>

      {/*  Task Inbox  */}
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <ClipboardList className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Kotak Tugas</h2>
              <p className="text-xs text-muted-foreground">Aksi yang perlu segera diselesaikan</p>
            </div>
          </div>
          {totalPendingTasks > 0 ? (
            <div className="flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 dark:bg-red-900/30">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              <span className="text-xs font-semibold text-red-700 dark:text-red-400">
                {totalPendingTasks} tugas menunggu
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 dark:bg-emerald-900/30">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Semua beres!
              </span>
            </div>
          )}
        </div>

        {/* Task rows */}
        <div className="flex flex-col gap-1 px-2 py-3">
          {tasks.map((task, i) => (
            <TaskInboxRow key={i} task={task} />
          ))}
        </div>
      </Card>

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          title="GR Menunggu Input"
          value={grMenungguInput}
          subtitle="Penerimaan barang"
          icon={PackagePlus}
          variant="success"
        />
        <StatsCard
          title="Near Expired"
          value={stats?.nearExpired ?? 0}
          subtitle="< 30 hari"
          icon={PackageMinus}
          variant="default"
        />
        <StatsCard
          title="Defekta Pending"
          value={defektaPendingData?.meta?.total ?? 0}
          subtitle="Belum diproses"
          icon={FileX2}
          variant="warning"
        />
        <StatsCard
          title="Stok Kritis"
          value={stats?.stokKritis ?? 0}
          subtitle="Perlu segera"
          icon={AlertTriangle}
          variant="danger"
        />
      </div>

      {/* ── Quick Actions ──────────────────────────────────────────────────── */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Aksi Cepat</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {quickActions.map((action) => (
            <QuickActionCard key={action.href} {...action} />
          ))}
        </div>
      </div>

      {/* ── Stok Menipis ──────────────────────────────────────────────────── */}
      <Card>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Daftar Stok Menipis</h2>
              <p className="text-xs text-muted-foreground">
                {loadingSafety ? "Memuat..." : `${kritisItems.length} item di bawah batas minimum`}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={ROUTES.APOTEKER.STOK_MASUK} className="flex items-center gap-1.5">
              <PackagePlus className="h-3.5 w-3.5" />
              Input Stok Masuk
            </Link>
          </Button>
        </div>

        <div className="px-5 py-2">
          <StokMenipisList items={kritisItems} />
        </div>

        <Separator />
        <div className="px-5 py-3">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Kritis (&lt; 25%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Rendah (25–50%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Normal (&gt; 50%)
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
