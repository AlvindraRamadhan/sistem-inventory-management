"use client";

import { useState, useMemo, useCallback } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Download,
  Eye,
  FileText,
  GitCommitHorizontal,
  Globe,
  Layers,
  LayoutList,
  Loader2,
  Lock,
  Search,
  Tag,
  User,
  X,
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
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";
import { useActivityLogList } from "@/hooks/queries/use-activity-log";
import type { ActivityLogItem } from "@/services/activity-log.service";

// ─── Local types ───────────────────────────────────────────────────────────────

type AuditAksi =
  | "LOGIN" | "LOGOUT" | "CREATE" | "UPDATE" | "DELETE"
  | "APPROVE" | "REJECT" | "STOCK_IN" | "STOCK_OUT"
  | "OPNAME" | "MUTASI" | "EXPORT";

const AKSI_KRITIS: string[] = ["DELETE", "APPROVE", "REJECT", "EXPORT"];

interface DisplayEntry {
  id: string;
  timestamp: string;
  userId: string | null;
  userName: string;
  userRole: string | null;
  aksi: string;
  modul: string;
  deskripsi: string;
  ipAddress: string | null;
  resourceId?: string | null;
  resourceType?: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}

function toDisplay(item: ActivityLogItem): DisplayEntry {
  const meta = item.metadata ?? {};
  return {
    id: item.id,
    timestamp: item.createdAt,
    userId: item.userId,
    userName: item.userName ?? "(sistem)",
    userRole: item.userRole,
    aksi: item.action.toUpperCase(),
    modul: item.moduleName,
    deskripsi: item.message,
    ipAddress: item.ipAddress,
    resourceId: item.refId,
    resourceType: item.refNo ?? null,
    before: (meta.before as Record<string, unknown> | undefined) ?? null,
    after: (meta.after as Record<string, unknown> | undefined) ?? null,
  };
}

// ─── Formatting helpers ────────────────────────────────────────────────────────

function formatTs(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }),
  };
}

function formatTsFull(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });
}

function formatDateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });
}

function relativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return "Baru saja";
  if (diff < 3600)  return `${Math.floor(diff / 60)} mnt lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} hari lalu`;
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" })
    .format(new Date(iso));
}

// ─── Aksi metadata ─────────────────────────────────────────────────────────────

const AKSI_META: Record<AuditAksi, { label: string; cls: string; dot: string }> = {
  LOGIN:     { label: "Login",      cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",         dot: "bg-blue-500"    },
  LOGOUT:    { label: "Logout",     cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",        dot: "bg-slate-400"   },
  CREATE:    { label: "Create",     cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", dot: "bg-emerald-500" },
  UPDATE:    { label: "Update",     cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",     dot: "bg-amber-500"   },
  DELETE:    { label: "Delete",     cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",         dot: "bg-rose-500"    },
  APPROVE:   { label: "Approve",    cls: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",         dot: "bg-teal-500"    },
  REJECT:    { label: "Reject",     cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",         dot: "bg-rose-500"    },
  STOCK_IN:  { label: "Stok Masuk", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", dot: "bg-emerald-500" },
  STOCK_OUT: { label: "Stok Keluar",cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",dot: "bg-orange-500"  },
  OPNAME:    { label: "Opname",     cls: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400", dot: "bg-violet-500"  },
  MUTASI:    { label: "Mutasi",     cls: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",         dot: "bg-cyan-500"    },
  EXPORT:    { label: "Export",     cls: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400", dot: "bg-indigo-500"  },
};

const AKSI_META_DEFAULT = {
  label: "Aksi",
  cls: "bg-muted text-muted-foreground",
  dot: "bg-muted-foreground",
};

const ROLE_META: Record<string, { label: string; cls: string }> = {
  admin:    { label: "Admin",    cls: "bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400"       },
  apoteker: { label: "Apoteker", cls: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"       },
  dokter:   { label: "Dokter",   cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" },
};

const MODUL_META: Record<string, string> = {
  "Auth":          "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  "Master Data":   "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "Procurement":   "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  "Inventory":     "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "Defekta":       "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  "E-Prescribing": "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  "Alkes":         "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
};

const MODUL_META_DEFAULT = "bg-muted text-muted-foreground";

function getAksiMeta(aksi: string) {
  return AKSI_META[aksi as AuditAksi] ?? AKSI_META_DEFAULT;
}

function getModulCls(modul: string) {
  return MODUL_META[modul] ?? MODUL_META_DEFAULT;
}

// ─── Diff Viewer ───────────────────────────────────────────────────────────────

type DiffStatus = "added" | "removed" | "increased" | "decreased" | "changed" | "same";

interface DiffRow {
  key: string;
  beforeVal: unknown;
  afterVal: unknown;
  status: DiffStatus;
}

function classifyChange(
  key: string,
  beforeVal: unknown,
  afterVal: unknown
): DiffStatus {
  if (beforeVal === undefined) return "added";
  if (afterVal === undefined)  return "removed";
  if (beforeVal === afterVal)  return "same";
  if (
    typeof beforeVal === "number" &&
    typeof afterVal === "number"
  ) {
    return afterVal > beforeVal ? "increased" : "decreased";
  }
  return "changed";
}

function buildDiff(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null
): DiffRow[] {
  const allKeys = new Set([
    ...Object.keys(before ?? {}),
    ...Object.keys(after ?? {}),
  ]);
  return [...allKeys].map((key) => {
    const bv = before?.[key];
    const av = after?.[key];
    return { key, beforeVal: bv, afterVal: av, status: classifyChange(key, bv, av) };
  });
}

function formatVal(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "string")   return `"${v}"`;
  if (typeof v === "object")   return JSON.stringify(v);
  return String(v);
}

const DIFF_STYLE: Record<DiffStatus, { row: string; before: string; after: string; badge: string }> = {
  added:     { row: "bg-emerald-50/60 dark:bg-emerald-900/10",  before: "text-muted-foreground line-through opacity-50", after: "text-emerald-700 dark:text-emerald-400 font-semibold", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  removed:   { row: "bg-rose-50/60 dark:bg-rose-900/10",        before: "text-rose-600 dark:text-rose-400",              after: "text-muted-foreground line-through opacity-50",         badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"     },
  increased: { row: "bg-emerald-50/40 dark:bg-emerald-900/10",  before: "text-muted-foreground",                         after: "text-emerald-700 dark:text-emerald-400 font-semibold", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  decreased: { row: "bg-rose-50/40 dark:bg-rose-900/10",        before: "text-muted-foreground",                         after: "text-rose-600 dark:text-rose-400 font-semibold",       badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"     },
  changed:   { row: "bg-amber-50/40 dark:bg-amber-900/10",      before: "text-muted-foreground line-through opacity-70", after: "text-amber-700 dark:text-amber-400 font-semibold",     badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  same:      { row: "",                                          before: "text-muted-foreground",                         after: "text-muted-foreground",                                badge: ""                                                                      },
};

const DIFF_BADGE_LABEL: Record<DiffStatus, string> = {
  added: "+", removed: "−", increased: "↑", decreased: "↓", changed: "~", same: "",
};

function DiffViewer({
  before,
  after,
}: {
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}) {
  const hasPayload = before !== null || after !== null;

  if (!hasPayload) {
    return (
      <p className="text-xs text-muted-foreground italic px-1">
        — tidak ada perubahan data —
      </p>
    );
  }

  if (before === null && after !== null) {
    return (
      <div className="rounded-md border border-emerald-200 dark:border-emerald-800 overflow-hidden">
        <div className="bg-emerald-50/80 dark:bg-emerald-900/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          Data dibuat
        </div>
        <div className="divide-y divide-border/50">
          {Object.entries(after).map(([k, v]) => (
            <div key={k} className="flex items-center gap-3 px-3 py-1.5 font-mono text-xs">
              <span className="text-blue-600 dark:text-blue-400 w-32 shrink-0 font-medium">{k}:</span>
              <span className="text-emerald-700 dark:text-emerald-400 break-all">{formatVal(v)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const rows = buildDiff(before, after);
  const hasChanges = rows.some((r) => r.status !== "same");

  return (
    <div className="space-y-2">
      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {(["added", "removed", "increased", "decreased", "changed"] as DiffStatus[]).map((s) => {
          const count = rows.filter((r) => r.status === s).length;
          if (count === 0) return null;
          return (
            <span
              key={s}
              className={cn(
                "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold",
                DIFF_STYLE[s].badge
              )}
            >
              {DIFF_BADGE_LABEL[s]} {s} ({count})
            </span>
          );
        })}
        {!hasChanges && (
          <span className="text-xs text-muted-foreground italic">Tidak ada perubahan</span>
        )}
      </div>

      {/* Diff table */}
      <div className="rounded-md border border-border overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-[120px_1fr_1fr] bg-muted/60 border-b border-border text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          <div className="px-3 py-2">Field</div>
          <div className="px-3 py-2 border-l border-border">Sebelum</div>
          <div className="px-3 py-2 border-l border-border">Sesudah</div>
        </div>

        <div className="divide-y divide-border/50 max-h-56 overflow-y-auto">
          {rows.map(({ key, beforeVal, afterVal, status }) => {
            const s = DIFF_STYLE[status];
            return (
              <div
                key={key}
                className={cn(
                  "grid grid-cols-[120px_1fr_1fr] items-start font-mono text-xs",
                  s.row
                )}
              >
                <div className="px-3 py-1.5 flex items-center gap-1.5">
                  <span className="text-blue-600 dark:text-blue-400 font-medium break-all">{key}</span>
                  {status !== "same" && (
                    <span
                      className={cn(
                        "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded text-[9px] font-bold",
                        s.badge
                      )}
                    >
                      {DIFF_BADGE_LABEL[status]}
                    </span>
                  )}
                </div>
                <div className={cn("px-3 py-1.5 border-l border-border/40 break-all", s.before)}>
                  {formatVal(beforeVal)}
                </div>
                <div className={cn("px-3 py-1.5 border-l border-border/40 break-all", s.after)}>
                  {formatVal(afterVal)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── DetailSheet ──────────────────────────────────────────────────────────────

function DetailSheet({
  entry,
  open,
  onClose,
}: {
  entry: DisplayEntry | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!entry) return null;

  const aksiMeta = getAksiMeta(entry.aksi);
  const roleMeta = ROLE_META[entry.userRole ?? "admin"] ?? ROLE_META.admin;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="sm:max-w-lg flex flex-col gap-0 p-0">
        <SheetHeader className="border-b border-border px-5 py-4 gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn("border-0 text-xs", aksiMeta.cls)}>{aksiMeta.label}</Badge>
            <Badge className={cn("border-0 text-xs", getModulCls(entry.modul))}>{entry.modul}</Badge>
            {entry.resourceType && (
              <span className="text-xs text-muted-foreground">
                {entry.resourceType}
                {entry.resourceId && (
                  <span className="ml-1 font-mono text-foreground">{entry.resourceId}</span>
                )}
              </span>
            )}
          </div>
          <SheetTitle className="text-sm font-medium text-foreground leading-snug">
            {entry.deskripsi}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Info grid */}
          <div className="px-5 py-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Informasi Aksi
            </p>
            <div className="grid grid-cols-1 gap-2.5">
              {[
                {
                  icon: Calendar,
                  label: "Waktu",
                  value: formatTsFull(entry.timestamp),
                  mono: false,
                },
                {
                  icon: User,
                  label: "Pengguna",
                  value: entry.userName,
                  mono: false,
                },
                {
                  icon: Tag,
                  label: "Role",
                  badge: roleMeta,
                },
                {
                  icon: Globe,
                  label: "IP Address",
                  value: entry.ipAddress ?? "—",
                  mono: true,
                },
                ...(entry.resourceId || entry.resourceType
                  ? [{
                      icon: Layers,
                      label: "Resource",
                      value: entry.resourceType ?? entry.modul,
                      chip: entry.resourceId,
                    }]
                  : []),
              ].map(({ icon: Icon, label, value, mono, badge, chip }, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-muted shrink-0">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    {badge ? (
                      <Badge className={cn("border-0 text-xs mt-0.5", badge.cls)}>
                        {badge.label}
                      </Badge>
                    ) : (
                      <p className={cn("text-sm font-medium text-foreground", mono && "font-mono")}>
                        {value}
                        {chip && (
                          <span className="ml-2 font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                            {chip}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Diff viewer */}
          <Separator />
          <div className="px-5 py-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
              <FileText className="h-3.5 w-3.5" />
              Data Perubahan (Diff)
            </p>
            <DiffViewer before={entry.before} after={entry.after} />
          </div>

          {/* Log ID */}
          <div className="px-5 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground font-mono">Log ID: {entry.id}</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Timeline view ─────────────────────────────────────────────────────────────

function TimelineView({
  entries,
  onSelect,
}: {
  entries: DisplayEntry[];
  onSelect: (e: DisplayEntry) => void;
}) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-14">
        <Search className="h-8 w-8 text-muted-foreground/30" />
        <p className="text-sm font-medium text-muted-foreground">
          Tidak ada entri log ditemukan
        </p>
      </div>
    );
  }

  // Group by date
  const grouped = entries.reduce<Record<string, DisplayEntry[]>>((acc, e) => {
    const day = e.timestamp.slice(0, 10);
    (acc[day] = acc[day] ?? []).push(e);
    return acc;
  }, {});

  const days = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-8">
      {days.map((day) => {
        const dayEntries = grouped[day];
        return (
          <div key={day}>
            {/* Date header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2">
                {formatDateLabel(day + "T00:00:00.000Z")}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Events */}
            <div className="relative ml-4">
              {/* Vertical connector */}
              <div className="absolute left-3.5 top-0 bottom-0 w-px bg-border" />

              <div className="space-y-3">
                {dayEntries.map((entry) => {
                  const aksi = getAksiMeta(entry.aksi);
                  const { time } = formatTs(entry.timestamp);
                  const isKritis = AKSI_KRITIS.includes(entry.aksi);

                  return (
                    <div key={entry.id} className="relative flex gap-4 pl-10">
                      {/* Node dot */}
                      <div
                        className={cn(
                          "absolute left-0 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-background",
                          aksi.dot
                        )}
                      >
                        <span className="text-[9px] font-bold text-white leading-none">
                          {aksi.label.slice(0, 2).toUpperCase()}
                        </span>
                      </div>

                      {/* Card */}
                      <div
                        className={cn(
                          "flex-1 rounded-lg border bg-card px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer",
                          isKritis && "border-l-2 border-l-rose-400"
                        )}
                        onClick={() => onSelect(entry)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === "Enter") onSelect(entry); }}
                        aria-label={`Lihat detail ${entry.deskripsi}`}
                      >
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={cn("border-0 text-[10px]", aksi.cls)}>
                              {aksi.label}
                            </Badge>
                            <Badge className={cn("border-0 text-[10px]", getModulCls(entry.modul))}>
                              {entry.modul}
                            </Badge>
                            {isKritis && (
                              <Badge className="border-0 text-[10px] bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                                Kritis
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground tabular-nums font-mono shrink-0">
                            {time}
                          </span>
                        </div>

                        <p className="mt-1.5 text-sm text-foreground leading-snug line-clamp-2">
                          {entry.deskripsi}
                        </p>

                        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span className="font-medium">{entry.userName}</span>
                          <span>·</span>
                          <span className="font-mono">{entry.ipAddress ?? "—"}</span>
                          {entry.resourceId && (
                            <>
                              <span>·</span>
                              <span className="font-mono">{entry.resourceId}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Export helper (dynamic xlsx — not loaded until user clicks export) ───────

async function exportToExcel(
  entries: DisplayEntry[],
  dateFrom: string,
  dateTo: string
) {
  const XLSX = await import("xlsx");

  const rows = entries.map((e, i) => ({
    "No": i + 1,
    "Timestamp": new Date(e.timestamp).toLocaleString("id-ID"),
    "Nama User": e.userName,
    "Role": e.userRole ?? "",
    "Aksi": getAksiMeta(e.aksi).label,
    "Modul": e.modul,
    "Deskripsi": e.deskripsi,
    "Resource": e.resourceType ?? "",
    "Resource ID": e.resourceId ?? "",
    "IP Address": e.ipAddress ?? "",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 5 }, { wch: 22 }, { wch: 18 }, { wch: 10 },
    { wch: 12 }, { wch: 14 }, { wch: 60 }, { wch: 16 }, { wch: 18 }, { wch: 16 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Audit Log");

  const suffix =
    dateFrom && dateTo
      ? `${dateFrom}_${dateTo}`
      : dateFrom
        ? `dari_${dateFrom}`
        : dateTo
          ? `sampai_${dateTo}`
          : new Date().toISOString().slice(0, 10);

  XLSX.writeFile(wb, `Audit_Log_${suffix}.xlsx`);
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AuditLogPage() {
  const [dateFrom,         setDateFrom]         = useState("");
  const [dateTo,           setDateTo]           = useState("");
  const [filterUser,       setFilterUser]       = useState("semua");
  const [filterAksi,       setFilterAksi]       = useState("semua");
  const [filterModul,      setFilterModul]      = useState("semua");
  const [filterIp,         setFilterIp]         = useState("semua");
  const [filterAksiKritis, setFilterAksiKritis] = useState(false);
  const [search,           setSearch]           = useState("");
  const [viewMode,         setViewMode]         = useState<"table" | "timeline">("table");
  const [detailEntry,      setDetailEntry]      = useState<DisplayEntry | null>(null);

  const { data, isLoading } = useActivityLogList({ limit: 500 });

  const allEntries = useMemo<DisplayEntry[]>(
    () => (data?.data ?? []).map(toDisplay),
    [data]
  );

  // Derived filter option lists
  const auditUsers = useMemo(() => {
    const seen = new Map<string, string>();
    allEntries.forEach((e) => { if (e.userId) seen.set(e.userId, e.userName); });
    return [...seen.entries()].map(([id, name]) => ({ id, name }));
  }, [allEntries]);

  const auditAksiList = useMemo(() => {
    return [...new Set(allEntries.map((e) => e.aksi))].sort();
  }, [allEntries]);

  const auditModulList = useMemo(() => {
    return [...new Set(allEntries.map((e) => e.modul))].sort();
  }, [allEntries]);

  const auditIpList = useMemo(() => {
    return [...new Set(allEntries.flatMap((e) => e.ipAddress ? [e.ipAddress] : []))].sort();
  }, [allEntries]);

  const filteredEntries = useMemo(() => {
    return allEntries.filter((e) => {
      const entryDate = e.timestamp.slice(0, 10);
      const matchFrom   = !dateFrom  || entryDate >= dateFrom;
      const matchTo     = !dateTo    || entryDate <= dateTo;
      const matchUser   = filterUser  === "semua" || e.userId   === filterUser;
      const matchAksi   = filterAksi  === "semua" || e.aksi     === filterAksi;
      const matchModul  = filterModul === "semua" || e.modul    === filterModul;
      const matchIp     = filterIp    === "semua" || e.ipAddress === filterIp;
      const matchKritis = !filterAksiKritis || AKSI_KRITIS.includes(e.aksi);
      const matchSearch = !search || e.deskripsi.toLowerCase().includes(search.toLowerCase())
        || e.userName.toLowerCase().includes(search.toLowerCase());
      return matchFrom && matchTo && matchUser && matchAksi && matchModul && matchIp && matchKritis && matchSearch;
    });
  }, [allEntries, dateFrom, dateTo, filterUser, filterAksi, filterModul, filterIp, filterAksiKritis, search]);

  const hasFilter = dateFrom || dateTo || filterUser !== "semua"
    || filterAksi !== "semua" || filterModul !== "semua" || filterIp !== "semua"
    || filterAksiKritis || search;

  const handleReset = useCallback(() => {
    setDateFrom(""); setDateTo("");
    setFilterUser("semua"); setFilterAksi("semua");
    setFilterModul("semua"); setFilterIp("semua");
    setFilterAksiKritis(false); setSearch("");
  }, []);

  const handleExport = useCallback(() => {
    exportToExcel(filteredEntries, dateFrom, dateTo);
  }, [filteredEntries, dateFrom, dateTo]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Audit Log"
        description="Riwayat seluruh aksi pengguna — immutable, tidak dapat diubah atau dihapus"
        breadcrumb={[{ label: "Audit Log" }]}
        actions={
          <div className="flex items-center gap-2">
            <Badge className="border border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-400 gap-1.5 px-2.5 py-1 text-xs">
              <Lock className="h-3 w-3" />
              Read-Only
            </Badge>
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
          </div>
        }
      />

      {/* ── Filter toolbar ─────────────────────────────────────────────────── */}
      <Card className="px-5 py-4">
        <div className="flex flex-wrap items-end gap-4">
          {/* Date from */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Dari</label>
            <input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => setDateFrom(e.target.value)}
              className="flex h-9 w-[150px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Date to */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sampai</label>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => setDateTo(e.target.value)}
              className="flex h-9 w-[150px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* User */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">User</label>
            <Select value={filterUser} onValueChange={setFilterUser}>
              <SelectTrigger className="w-[170px]"><SelectValue placeholder="Semua User" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua User</SelectItem>
                {auditUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Aksi */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Aksi</label>
            <Select value={filterAksi} onValueChange={setFilterAksi}>
              <SelectTrigger className="w-[155px]"><SelectValue placeholder="Semua Aksi" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Aksi</SelectItem>
                {auditAksiList.map((a) => (
                  <SelectItem key={a} value={a}>{getAksiMeta(a).label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Modul */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Modul</label>
            <Select value={filterModul} onValueChange={setFilterModul}>
              <SelectTrigger className="w-[155px]"><SelectValue placeholder="Semua Modul" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Modul</SelectItem>
                {auditModulList.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* IP Address */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">IP Address</label>
            <Select value={filterIp} onValueChange={setFilterIp}>
              <SelectTrigger className="w-[155px]"><SelectValue placeholder="Semua IP" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua IP</SelectItem>
                {auditIpList.map((ip) => (
                  <SelectItem key={ip} value={ip}>
                    <span className="font-mono text-xs">{ip}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Aksi Kritis toggle */}
          <div className="flex flex-col gap-1.5 self-end">
            <button
              onClick={() => setFilterAksiKritis((v) => !v)}
              className={cn(
                "flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors",
                filterAksiKritis
                  ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-900/20 dark:text-rose-400"
                  : "border-input bg-background text-foreground hover:bg-muted"
              )}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Aksi Kritis
              {filterAksiKritis && <CheckCircle2 className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Search */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cari</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="User atau deskripsi..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {hasFilter && (
            <Button variant="ghost" size="sm" onClick={handleReset} className="self-end h-9 text-xs gap-1.5 text-muted-foreground">
              <X className="h-3.5 w-3.5" />
              Reset
            </Button>
          )}
        </div>
      </Card>

      {/* ── View toggle + count ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoading ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Memuat data...
            </span>
          ) : (
            <>
              <strong className="text-foreground">{filteredEntries.length}</strong> dari{" "}
              <strong className="text-foreground">{allEntries.length}</strong> entri
              {hasFilter && " (filter aktif)"}
              {filterAksiKritis && (
                <Badge className="ml-2 border-0 text-[10px] bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                  Aksi Kritis saja
                </Badge>
              )}
            </>
          )}
        </p>

        <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
          <Button
            size="sm"
            variant={viewMode === "table" ? "default" : "ghost"}
            className="h-7 gap-1.5 px-3"
            onClick={() => setViewMode("table")}
          >
            <LayoutList className="h-3.5 w-3.5" />
            Tabel
          </Button>
          <Button
            size="sm"
            variant={viewMode === "timeline" ? "default" : "ghost"}
            className="h-7 gap-1.5 px-3"
            onClick={() => setViewMode("timeline")}
          >
            <GitCommitHorizontal className="h-3.5 w-3.5" />
            Timeline
          </Button>
        </div>
      </div>

      {/* ── Table view ──────────────────────────────────────────────────────── */}
      {viewMode === "table" && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              Log Aktivitas
            </p>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              <span>Immutable — tidak ada tombol edit/hapus</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {["Timestamp", "User", "Role", "Aksi", "Modul", "Deskripsi", ""].map((h, i) => (
                    <th
                      key={i}
                      className={cn(
                        "px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide",
                        i === 0 ? "text-left w-40" : i === 6 ? "text-center w-16" : i >= 2 && i <= 4 ? "text-center" : "text-left"
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-14 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 text-muted-foreground/30 animate-spin" />
                        <p className="text-sm font-medium text-muted-foreground">Memuat data audit log...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-14 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 text-muted-foreground/30" />
                        <p className="text-sm font-medium text-muted-foreground">Tidak ada entri log ditemukan</p>
                        <p className="text-xs text-muted-foreground/70">Coba ubah filter atau rentang tanggal</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => {
                    const { date, time } = formatTs(entry.timestamp);
                    const aksiMeta = getAksiMeta(entry.aksi);
                    const roleMeta = ROLE_META[entry.userRole ?? "admin"] ?? ROLE_META.admin;
                    const isKritis = AKSI_KRITIS.includes(entry.aksi);

                    return (
                      <tr
                        key={entry.id}
                        className={cn(
                          "border-b border-border/60 transition-colors hover:bg-muted/30",
                          isKritis && "border-l-2 border-l-rose-400"
                        )}
                      >
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-foreground tabular-nums">{date}</p>
                          <p className="text-xs text-muted-foreground font-mono tabular-nums mt-0.5">{time}</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-0.5">{relativeTime(entry.timestamp)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground text-sm leading-snug">{entry.userName}</p>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">{entry.ipAddress ?? "—"}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={cn("border-0 text-xs", roleMeta.cls)}>{roleMeta.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={cn("border-0 text-xs", aksiMeta.cls)}>{aksiMeta.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={cn("border-0 text-xs", getModulCls(entry.modul))}>{entry.modul}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-foreground leading-snug line-clamp-2">{entry.deskripsi}</p>
                          {entry.resourceId && (
                            <p className="text-xs text-muted-foreground font-mono mt-0.5 flex items-center gap-1">
                              <ChevronRight className="h-3 w-3 shrink-0" />
                              {entry.resourceType ?? entry.modul}: {entry.resourceId}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setDetailEntry(entry)}
                            aria-label={`Lihat detail log ${entry.id}`}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {filteredEntries.length > 0 && (
            <div className="border-t border-border px-5 py-3 bg-muted/20 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Menampilkan <strong className="text-foreground">{filteredEntries.length}</strong> dari{" "}
                <strong className="text-foreground">{allEntries.length}</strong> entri log
              </p>
              <p className="text-xs text-muted-foreground italic">Read-only — tidak dapat diubah</p>
            </div>
          )}
        </Card>
      )}

      {/* ── Timeline view ───────────────────────────────────────────────────── */}
      {viewMode === "timeline" && (
        <TimelineView entries={filteredEntries} onSelect={setDetailEntry} />
      )}

      {/* Detail Sheet */}
      <DetailSheet
        entry={detailEntry}
        open={detailEntry !== null}
        onClose={() => setDetailEntry(null)}
      />
    </div>
  );
}
