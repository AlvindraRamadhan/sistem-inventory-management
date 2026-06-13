"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Package,
  Search,
  Pencil,
  Check,
  X,
  Play,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";
import { useSafetyStock } from "@/hooks/queries/use-analytics";
import { useKategoriList } from "@/hooks/queries/use-kategori";
import type { SafetyStockItem } from "@/services/analytics.service";

// ─── Local helpers (extracted from removed mock module) ────────────────────────

type AlertStatus = "AMAN" | "PERHATIAN" | "KRITIS";

function getAlertStatus(stok: number, threshold: number): AlertStatus {
  if (stok <= threshold) return "KRITIS";
  if (stok <= threshold * 2) return "PERHATIAN";
  return "AMAN";
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_META: Record<
  AlertStatus,
  {
    label: string;
    badgeCls: string;
    rowCls: string;
    cardBg: string;
    cardBorder: string;
    cardText: string;
    cardIconCls: string;
    icon: React.ElementType;
  }
> = {
  AMAN: {
    label: "Aman",
    badgeCls:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    rowCls: "",
    cardBg: "bg-emerald-50 dark:bg-emerald-950/20",
    cardBorder: "border-emerald-200 dark:border-emerald-800",
    cardText: "text-emerald-700 dark:text-emerald-400",
    cardIconCls:
      "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  PERHATIAN: {
    label: "Perhatian",
    badgeCls:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    rowCls: "bg-amber-50/40 dark:bg-amber-950/20",
    cardBg: "bg-amber-50 dark:bg-amber-950/20",
    cardBorder: "border-amber-200 dark:border-amber-800",
    cardText: "text-amber-700 dark:text-amber-400",
    cardIconCls:
      "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    icon: AlertTriangle,
  },
  KRITIS: {
    label: "Kritis",
    badgeCls: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    rowCls: "bg-rose-50/50 dark:bg-rose-950/20",
    cardBg: "bg-rose-50 dark:bg-rose-950/20",
    cardBorder: "border-rose-200 dark:border-rose-800",
    cardText: "text-rose-700 dark:text-rose-400",
    cardIconCls:
      "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
    icon: ShieldAlert,
  },
};

// ─── InlineEditCell ────────────────────────────────────────────────────────────

function InlineEditCell({
  value,
  onSave,
  min = 1,
  suffix,
}: {
  value: number;
  onSave: (v: number) => void;
  min?: number;
  suffix?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  const handleStartEdit = () => {
    setDraft(String(value));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const handleCommitSave = () => {
    const n = parseInt(draft, 10);
    if (!isNaN(n) && n >= min) onSave(n);
    setEditing(false);
  };

  const handleCancelEdit = () => {
    setDraft(String(value));
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type="number"
          min={min}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCommitSave();
            if (e.key === "Escape") handleCancelEdit();
          }}
          onBlur={handleCommitSave}
          className="w-20 h-7 rounded border border-input bg-background px-2 text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {suffix && (
          <span className="text-xs text-muted-foreground shrink-0">{suffix}</span>
        )}
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            handleCommitSave();
          }}
          className="text-emerald-600 hover:text-emerald-700 p-0.5 transition-colors"
          aria-label="Simpan"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            handleCancelEdit();
          }}
          className="text-rose-500 hover:text-rose-600 p-0.5 transition-colors"
          aria-label="Batal"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleStartEdit}
      className="group flex items-center gap-1.5 tabular-nums text-sm font-medium text-foreground hover:text-primary transition-colors"
      aria-label={`Edit nilai: ${value}`}
    >
      <span>{value.toLocaleString("id-ID")}</span>
      {suffix && (
        <span className="text-xs text-muted-foreground">{suffix}</span>
      )}
      <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity shrink-0" />
    </button>
  );
}

// ─── StockBar ──────────────────────────────────────────────────────────────────

function StockBar({ stok, threshold }: { stok: number; threshold: number }) {
  const status = getAlertStatus(stok, threshold);
  const maxScale = Math.max(threshold * 4, 1);
  const pct = Math.min((stok / maxScale) * 100, 100);

  const barCls =
    status === "KRITIS"
      ? "bg-rose-500"
      : status === "PERHATIAN"
      ? "bg-amber-400"
      : "bg-emerald-500";

  return (
    <div className="flex flex-col gap-1.5 items-end">
      <span className="tabular-nums text-sm font-semibold text-foreground leading-none">
        {stok.toLocaleString("id-ID")}
      </span>
      <div className="h-1.5 w-20 rounded-full bg-muted/80 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", barCls)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── SummaryCard ───────────────────────────────────────────────────────────────

const STATUS_DESC: Record<AlertStatus, string> = {
  KRITIS: "Stok ≤ threshold — perlu reorder segera",
  PERHATIAN: "Threshold < stok ≤ threshold × 2",
  AMAN: "Stok > threshold × 2 — kondisi optimal",
};

function SummaryCard({
  status,
  count,
  total,
  onClick,
  active,
}: {
  status: AlertStatus;
  count: number;
  total: number;
  onClick: () => void;
  active: boolean;
}) {
  const m = STATUS_META[status];
  const Icon = m.icon;
  const pct = total > 0 ? ((count / total) * 100).toFixed(0) : "0";

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
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            m.cardIconCls
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <Badge className={cn("border-0 text-xs", m.badgeCls)}>{m.label}</Badge>
      </div>
      <p className="text-3xl font-bold text-foreground tabular-nums">
        {count}
        <span className="text-sm font-normal text-muted-foreground ml-1">item</span>
      </p>
      <p className="text-xs text-muted-foreground mt-1">{pct}% dari total item</p>
      <p className="text-xs text-muted-foreground mt-1.5 leading-snug">
        {STATUS_DESC[status]}
      </p>
    </button>
  );
}

// ─── EditDialog ────────────────────────────────────────────────────────────────

function EditDialog({
  item,
  open,
  onClose,
  onSave,
}: {
  item: SafetyStockItem | null;
  open: boolean;
  onClose: () => void;
  onSave: (obatId: string, threshold: number, leadTime: number) => void;
}) {
  const [threshold, setThreshold] = useState("");
  const [leadTime, setLeadTime] = useState("");

  useEffect(() => {
    if (item) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setThreshold(String(item.thresholdMin));
      setLeadTime(String(item.leadTime));
    }
  }, [item]);

  const previewStatus = useMemo(() => {
    if (!item) return null;
    const t = parseInt(threshold, 10);
    if (isNaN(t) || t < 1) return null;
    return getAlertStatus(item.stokSaat, t);
  }, [item, threshold]);

  const handleSave = () => {
    if (!item) return;
    const t = parseInt(threshold, 10);
    const l = parseInt(leadTime, 10);
    if (isNaN(t) || t < 1 || isNaN(l) || l < 1) return;
    onSave(item.obatId, t, l);
    onClose();
  };

  if (!item) return null;

  const thresholdNum = parseInt(threshold, 10);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" />
            Edit Safety Stock
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Nama Obat (read-only) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Nama Obat
            </label>
            <div className="rounded-md border border-input bg-muted/40 px-3 py-2 text-sm font-medium text-foreground">
              {item.namaObat}
            </div>
            <p className="text-xs text-muted-foreground">
              {item.kategoriNama} · {item.satuanNama}
            </p>
          </div>

          <Separator />

          {/* Threshold Min */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Threshold Minimum
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <span className="text-sm text-muted-foreground shrink-0">
                {item.satuanNama.toLowerCase()}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Alert Kritis jika stok ≤ nilai ini · Alert Perhatian jika stok ≤{" "}
              {!isNaN(thresholdNum) && thresholdNum > 0
                ? `${(thresholdNum * 2).toLocaleString("id-ID")}`
                : "threshold × 2"}
            </p>
          </div>

          {/* Lead Time */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Lead Time
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={365}
                value={leadTime}
                onChange={(e) => setLeadTime(e.target.value)}
                className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <span className="text-sm text-muted-foreground shrink-0">hari</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Estimasi waktu pengiriman dari supplier
            </p>
          </div>

          {/* Preview status */}
          {previewStatus && (() => {
            const m = STATUS_META[previewStatus];
            const Icon = m.icon;
            const t = parseInt(threshold, 10);
            const statusDesc =
              previewStatus === "KRITIS"
                ? `Stok saat ini (${item.stokSaat}) ≤ threshold (${t})`
                : previewStatus === "PERHATIAN"
                ? `Stok saat ini (${item.stokSaat}) berada antara ${t} – ${t * 2}`
                : `Stok saat ini (${item.stokSaat}) > threshold × 2 (${t * 2})`;

            return (
              <div
                className={cn(
                  "rounded-lg border px-3 py-2.5 flex items-start gap-2",
                  m.cardBorder,
                  m.cardBg
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", m.cardText)} />
                <div>
                  <p className={cn("text-xs font-semibold", m.cardText)}>
                    Preview: <strong>{m.label}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{statusDesc}</p>
                </div>
              </div>
            );
          })()}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={handleSave}>Simpan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── SimulasiDialog ────────────────────────────────────────────────────────────

type ItemWithStatus = SafetyStockItem & { status: AlertStatus };

function SimulasiDialog({
  items,
  open,
  onClose,
}: {
  items: SafetyStockItem[];
  open: boolean;
  onClose: () => void;
}) {
  const alertItems = useMemo<ItemWithStatus[]>(() => {
    return items
      .map((item) => ({
        ...item,
        status: getAlertStatus(item.stokSaat, item.thresholdMin),
      }))
      .filter((item) => item.status !== "AMAN")
      .sort((a, b) => {
        const order: Record<AlertStatus, number> = { KRITIS: 0, PERHATIAN: 1, AMAN: 2 };
        return order[a.status] - order[b.status];
      });
  }, [items]);

  const kritisCount = alertItems.filter((i) => i.status === "KRITIS").length;
  const perhatianCount = alertItems.filter((i) => i.status === "PERHATIAN").length;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-4 w-4 text-primary" />
            Simulasi Alert — Threshold Saat Ini
          </DialogTitle>
        </DialogHeader>

        {alertItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              Semua item dalam kondisi Aman
            </p>
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              Tidak ada item yang akan memicu alert dengan konfigurasi threshold saat ini.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary banners */}
            <div className="flex gap-3">
              {kritisCount > 0 && (
                <div
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2.5",
                    STATUS_META.KRITIS.cardBorder,
                    STATUS_META.KRITIS.cardBg
                  )}
                >
                  <p className={cn("text-sm font-bold tabular-nums", STATUS_META.KRITIS.cardText)}>
                    {kritisCount} item Kritis
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Perlu reorder segera
                  </p>
                </div>
              )}
              {perhatianCount > 0 && (
                <div
                  className={cn(
                    "flex-1 rounded-lg border px-3 py-2.5",
                    STATUS_META.PERHATIAN.cardBorder,
                    STATUS_META.PERHATIAN.cardBg
                  )}
                >
                  <p className={cn("text-sm font-bold tabular-nums", STATUS_META.PERHATIAN.cardText)}>
                    {perhatianCount} item Perhatian
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Stok mulai menipis
                  </p>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="rounded-lg border border-border overflow-hidden max-h-[52vh] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-border bg-muted/60">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Nama Obat
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-28">
                      Stok Saat Ini
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-28">
                      Threshold
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-28">
                      Gap
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-28">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {alertItems.map((item) => {
                    const m = STATUS_META[item.status];
                    const Icon = m.icon;
                    const gap = item.stokSaat - item.thresholdMin;
                    return (
                      <tr
                        key={item.obatId}
                        className={cn(
                          "border-b border-border/60 hover:bg-muted/30 transition-colors",
                          m.rowCls
                        )}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground leading-snug">
                            {item.namaObat}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.kategoriNama} · {item.satuanNama}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-sm font-semibold text-foreground">
                          {item.stokSaat.toLocaleString("id-ID")}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-sm text-muted-foreground">
                          {item.thresholdMin.toLocaleString("id-ID")}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-sm font-medium">
                          {gap < 0 ? (
                            <span className="text-rose-600 dark:text-rose-400">
                              −{Math.abs(gap).toLocaleString("id-ID")}
                            </span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400">
                              +{gap.toLocaleString("id-ID")}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={cn("border-0 text-xs gap-1", m.badgeCls)}>
                            <Icon className="h-3 w-3 shrink-0" />
                            {m.label}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

type Overrides = Map<string, { thresholdMin?: number; leadTime?: number }>;

export default function SafetyStockPage() {
  const { data: rawItems = [], isLoading } = useSafetyStock();
  const { data: kategoriData = [] } = useKategoriList();

  const [overrides, setOverrides] = useState<Overrides>(new Map());
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<AlertStatus | "semua">("semua");
  const [filterKategori, setFilterKategori] = useState("semua");
  const [simulasiOpen, setSimulasiOpen] = useState(false);
  const [editItem, setEditItem] = useState<SafetyStockItem | null>(null);

  const items: SafetyStockItem[] = useMemo(
    () =>
      rawItems.map((item) => {
        const ov = overrides.get(item.obatId);
        return {
          ...item,
          thresholdMin: ov?.thresholdMin ?? item.thresholdMin,
          leadTime: ov?.leadTime ?? item.leadTime,
        };
      }),
    [rawItems, overrides]
  );

  const itemsWithStatus = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        status: getAlertStatus(item.stokSaat, item.thresholdMin),
      })),
    [items]
  );

  const filteredItems = useMemo(
    () =>
      itemsWithStatus.filter((item) => {
        const matchSearch =
          !search || item.namaObat.toLowerCase().includes(search.toLowerCase());
        const matchStatus =
          filterStatus === "semua" || item.status === filterStatus;
        const matchKat =
          filterKategori === "semua" || item.kategoriNama === filterKategori;
        return matchSearch && matchStatus && matchKat;
      }),
    [itemsWithStatus, search, filterStatus, filterKategori]
  );

  const summary = useMemo(
    () => ({
      KRITIS:    itemsWithStatus.filter((i) => i.status === "KRITIS").length,
      PERHATIAN: itemsWithStatus.filter((i) => i.status === "PERHATIAN").length,
      AMAN:      itemsWithStatus.filter((i) => i.status === "AMAN").length,
    }),
    [itemsWithStatus]
  );

  const handleUpdateThreshold = useCallback((obatId: string, threshold: number) => {
    setOverrides((prev) => {
      const next = new Map(prev);
      next.set(obatId, { ...next.get(obatId), thresholdMin: threshold });
      return next;
    });
    toast.success("Threshold diperbarui");
  }, []);

  const handleUpdateLeadTime = useCallback((obatId: string, leadTime: number) => {
    setOverrides((prev) => {
      const next = new Map(prev);
      next.set(obatId, { ...next.get(obatId), leadTime });
      return next;
    });
    toast.success("Lead time diperbarui");
  }, []);

  const handleSaveDialog = useCallback(
    (obatId: string, threshold: number, leadTime: number) => {
      setOverrides((prev) => {
        const next = new Map(prev);
        next.set(obatId, { thresholdMin: threshold, leadTime });
        return next;
      });
      toast.success("Safety stock berhasil diperbarui");
    },
    []
  );

  const alertCount = summary.KRITIS + summary.PERHATIAN;
  const hasFilter = search || filterStatus !== "semua" || filterKategori !== "semua";
  const kategoriOptions = useMemo(() => kategoriData.map((k) => k.nama), [kategoriData]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Safety Stock Management"
        description="Atur threshold minimum dan lead time per item obat untuk monitoring stok otomatis"
        breadcrumb={[
          { label: "Analitik" },
          { label: "Safety Stock" },
        ]}
        actions={
          <Button
            onClick={() => setSimulasiOpen(true)}
            className="gap-2"
            variant={alertCount > 0 ? "default" : "outline"}
          >
            <Play className="h-4 w-4" />
            Simulasi Alert
            {alertCount > 0 && (
              <span className="ml-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white/25 px-1.5 text-[11px] font-bold tabular-nums">
                {alertCount}
              </span>
            )}
          </Button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(["KRITIS", "PERHATIAN", "AMAN"] as AlertStatus[]).map((s) => (
          <SummaryCard
            key={s}
            status={s}
            count={summary[s]}
            total={items.length}
            onClick={() => setFilterStatus((prev) => (prev === s ? "semua" : s))}
            active={filterStatus === s}
          />
        ))}
      </div>

      {/* Filter toolbar */}
      <Card className="px-5 py-4">
        <div className="flex flex-wrap items-end gap-4">
          {/* Search */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Cari Obat
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Nama obat..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* Status filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Status Alert
            </label>
            <Select
              value={filterStatus}
              onValueChange={(v) => setFilterStatus(v as AlertStatus | "semua")}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Status</SelectItem>
                <SelectItem value="KRITIS">Kritis</SelectItem>
                <SelectItem value="PERHATIAN">Perhatian</SelectItem>
                <SelectItem value="AMAN">Aman</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Kategori filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Kategori
            </label>
            <Select value={filterKategori} onValueChange={setFilterKategori}>
              <SelectTrigger className="w-[190px]">
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

          {hasFilter && (
            <Button
              variant="ghost"
              size="sm"
              className="self-end h-9 text-xs gap-1.5 text-muted-foreground"
              onClick={() => {
                setSearch("");
                setFilterStatus("semua");
                setFilterKategori("semua");
              }}
            >
              <X className="h-3.5 w-3.5" />
              Reset
            </Button>
          )}
        </div>
      </Card>

      {/* Main table */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Semua Item Obat
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {filteredItems.length} item tampil
              {filterStatus !== "semua" && ` · ${STATUS_META[filterStatus].label}`}
              {filterKategori !== "semua" && ` · ${filterKategori}`}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            <Pencil className="h-3 w-3" />
            <span>Klik nilai untuk edit langsung</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Nama Obat
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-36">
                  Stok Saat Ini
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-44">
                  Threshold Min
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-36">
                  Lead Time
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-32">
                  Status Alert
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-16">
                  Edit
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <p className="text-sm text-muted-foreground">Memuat data...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="h-8 w-8 text-muted-foreground/30" />
                      <p className="text-sm font-medium text-muted-foreground">
                        Tidak ada item ditemukan
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        Coba ubah filter atau kata kunci pencarian
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const m = STATUS_META[item.status];
                  const Icon = m.icon;
                  const baseItem = item;

                  return (
                    <tr
                      key={item.obatId}
                      className={cn(
                        "border-b border-border/60 transition-colors hover:bg-muted/30",
                        m.rowCls
                      )}
                    >
                      {/* Nama Obat */}
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground leading-snug">
                          {item.namaObat}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.kategoriNama} · {item.kodeObat}
                        </p>
                      </td>

                      {/* Stok Saat Ini */}
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <StockBar
                            stok={item.stokSaat}
                            threshold={item.thresholdMin}
                          />
                        </div>
                      </td>

                      {/* Threshold Min — inline edit */}
                      <td className="px-4 py-3">
                        <InlineEditCell
                          value={item.thresholdMin}
                          onSave={(v) => handleUpdateThreshold(item.obatId, v)}
                          min={1}
                          suffix={item.satuanNama.toLowerCase()}
                        />
                      </td>

                      {/* Lead Time — inline edit */}
                      <td className="px-4 py-3">
                        <InlineEditCell
                          value={item.leadTime}
                          onSave={(v) => handleUpdateLeadTime(item.obatId, v)}
                          min={1}
                          suffix="hari"
                        />
                      </td>

                      {/* Status Alert */}
                      <td className="px-4 py-3 text-center">
                        <Badge className={cn("border-0 text-xs gap-1", m.badgeCls)}>
                          <Icon className="h-3 w-3 shrink-0" />
                          {m.label}
                        </Badge>
                      </td>

                      {/* Edit button */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setEditItem(baseItem)}
                          aria-label={`Edit safety stock ${item.namaObat}`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <Settings2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Dialog */}
      <EditDialog
        item={editItem}
        open={editItem !== null}
        onClose={() => setEditItem(null)}
        onSave={handleSaveDialog}
      />

      {/* Simulasi Alert Dialog */}
      <SimulasiDialog
        items={items}
        open={simulasiOpen}
        onClose={() => setSimulasiOpen(false)}
      />
    </div>
  );
}
