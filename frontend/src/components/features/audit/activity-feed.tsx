"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FilePen,
  Loader2,
  LogIn,
  LogOut,
  Package,
  PackageMinus,
  PackagePlus,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useActivityLogList } from "@/hooks/queries/use-activity-log";
import type { ActivityLogItem } from "@/services/activity-log.service";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ActivityFeedProps {
  limit?: number;
  showViewAll?: boolean;
  className?: string;
}

// ─── Icon + color config per aksi ─────────────────────────────────────────────

const AKSI_FEED_META: Record<
  string,
  { icon: React.ElementType; bg: string; color: string; verb: string }
> = {
  LOGIN:     { icon: LogIn,         bg: "bg-blue-100 dark:bg-blue-900/30",       color: "text-blue-600 dark:text-blue-400",       verb: "login ke sistem"         },
  LOGOUT:    { icon: LogOut,        bg: "bg-slate-100 dark:bg-slate-800",        color: "text-slate-500 dark:text-slate-400",     verb: "logout dari sistem"      },
  CREATE:    { icon: Package,       bg: "bg-emerald-100 dark:bg-emerald-900/30", color: "text-emerald-600 dark:text-emerald-400", verb: "membuat"                 },
  UPDATE:    { icon: RefreshCw,     bg: "bg-amber-100 dark:bg-amber-900/30",     color: "text-amber-600 dark:text-amber-400",     verb: "memperbarui"             },
  DELETE:    { icon: Trash2,        bg: "bg-rose-100 dark:bg-rose-900/30",       color: "text-rose-600 dark:text-rose-400",       verb: "menghapus"               },
  APPROVE:   { icon: CheckCircle2,  bg: "bg-teal-100 dark:bg-teal-900/30",       color: "text-teal-600 dark:text-teal-400",       verb: "menyetujui"              },
  REJECT:    { icon: XCircle,       bg: "bg-rose-100 dark:bg-rose-900/30",       color: "text-rose-600 dark:text-rose-400",       verb: "menolak"                 },
  STOCK_IN:  { icon: PackagePlus,   bg: "bg-emerald-100 dark:bg-emerald-900/30", color: "text-emerald-600 dark:text-emerald-400", verb: "menginput stok masuk"    },
  STOCK_OUT: { icon: PackageMinus,  bg: "bg-orange-100 dark:bg-orange-900/30",   color: "text-orange-600 dark:text-orange-400",   verb: "mengeluarkan stok"       },
  OPNAME:    { icon: ClipboardList, bg: "bg-violet-100 dark:bg-violet-900/30",   color: "text-violet-600 dark:text-violet-400",   verb: "melakukan opname"        },
  MUTASI:    { icon: ArrowRight,    bg: "bg-cyan-100 dark:bg-cyan-900/30",       color: "text-cyan-600 dark:text-cyan-400",       verb: "memutasi stok"           },
  EXPORT:    { icon: FilePen,       bg: "bg-indigo-100 dark:bg-indigo-900/30",   color: "text-indigo-600 dark:text-indigo-400",   verb: "mengekspor laporan"      },
};

const AKSI_FEED_DEFAULT = {
  icon: Package,
  bg: "bg-muted",
  color: "text-muted-foreground",
  verb: "melakukan aksi",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return "Baru saja";
  if (diff < 3600)  return `${Math.floor(diff / 60)} mnt lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} hari lalu`;
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" })
    .format(new Date(iso));
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

const AVATAR_COLORS = [
  "bg-primary text-primary-foreground",
  "bg-emerald-600 text-white",
  "bg-amber-600 text-white",
  "bg-violet-600 text-white",
  "bg-blue-600 text-white",
];

function avatarColor(userId: string): string {
  const hash = userId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function extractSubject(desc: string, aksi: string): string {
  if (aksi === "LOGIN" || aksi === "LOGOUT") return "";
  const cleaned = desc.replace(/^(Menyetujui|Menolak|Membuat|Menambah|Memperbarui|Melaporkan|Mengajukan|Update|Input kalibrasi selesai:|Stok masuk dari|Stok masuk:|Stok keluar:|Mutasi lokasi:|Stok opname selesai:|Ekspor)\s+/i, "");
  return cleaned.length > 55 ? cleaned.slice(0, 55) + "…" : cleaned;
}

// ─── ActivityRow ───────────────────────────────────────────────────────────────

function ActivityRow({ item, isLast }: { item: ActivityLogItem; isLast: boolean }) {
  const aksi = item.action.toUpperCase();
  const meta = AKSI_FEED_META[aksi] ?? AKSI_FEED_DEFAULT;
  const Icon = meta.icon;
  const name = item.userName ?? "(sistem)";
  const initials = getInitials(name);
  const subject = extractSubject(item.message, aksi);

  return (
    <div className={cn("flex items-start gap-3", !isLast && "pb-3 border-b border-border/50")}>
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
          avatarColor(item.userId ?? item.id)
        )}
        aria-label={name}
      >
        {initials}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground leading-snug">
          <span className="font-semibold">{name}</span>{" "}
          <span className="text-muted-foreground">{meta.verb}</span>
          {subject && (
            <>
              {" "}
              <span className="text-foreground">{subject}</span>
            </>
          )}
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
              meta.bg, meta.color
            )}
          >
            <Icon className="h-2.5 w-2.5" />
            {aksi}
          </span>
          <span className="text-xs text-muted-foreground/70">
            {relativeTime(item.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── ActivityFeed (exported) ───────────────────────────────────────────────────

export function ActivityFeed({
  limit = 8,
  showViewAll = true,
  className,
}: ActivityFeedProps) {
  const { data, isLoading } = useActivityLogList({ limit });

  const entries = data?.data ?? [];

  return (
    <div className={cn("flex flex-col", className)}>
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Memuat aktivitas...</span>
        </div>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          Belum ada aktivitas tercatat
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((item, i) => (
            <ActivityRow
              key={item.id}
              item={item}
              isLast={i === entries.length - 1}
            />
          ))}
        </div>
      )}

      {showViewAll && (
        <div className="mt-3 pt-3 border-t border-border">
          <Button variant="ghost" size="sm" asChild className="w-full text-xs text-primary gap-1">
            <Link href="/admin/audit-log">
              Lihat semua aktivitas di Audit Log
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
