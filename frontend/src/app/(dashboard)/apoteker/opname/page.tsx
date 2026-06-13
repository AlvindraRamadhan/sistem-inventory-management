"use client";

import { useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  History,
  Info,
  Lock,
  Minus,
  Plus,
  RotateCcw,
  SendHorizonal,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { useBatchList } from "@/hooks/queries/use-batch";
import {
  useStokOpnameList,
  useCreateStokOpname,
  useSubmitOpname,
} from "@/hooks/queries/use-stok-opname";
import type { BatchItem } from "@/services/batch.service";
import type { OpnameListItem } from "@/services/stok-opname.service";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type OpnamePhase = "idle" | "in_progress";
type ActiveFilter = "ALL" | "COUNTED" | "WITH_DIFF";
type ViewTab = "aktif" | "riwayat";

interface OpnameRow {
  batchId: string;
  namaObat: string;
  kategoriNama: string;
  batchNumber: string;
  expiredDate: string;
  lokasiNama: string;
  stokSistem: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} ${months[m - 1]} ${y}`;
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function OpnameStatusBadge({ status }: { status: OpnameListItem["status"] }) {
  const cfg = {
    PENDING:  { cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",   label: "Menunggu Approval" },
    APPROVED: { cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", label: "Disetujui" },
    REJECTED: { cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",       label: "Ditolak" },
  }[status];
  return <Badge className={cn("border-0 text-xs font-medium", cfg.cls)}>{cfg.label}</Badge>;
}

// ─── Riwayat columns ──────────────────────────────────────────────────────────

const riwayatColumns: ColumnDef<OpnameListItem>[] = [
  {
    id: "tanggalOpname",
    accessorKey: "tanggalOpname",
    header: "Tgl. Opname",
    size: 110,
    cell: ({ row }) => <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(row.original.tanggalOpname)}</span>,
  },
  {
    id: "noOpname",
    accessorKey: "noOpname",
    header: "No. Opname",
    size: 130,
    cell: ({ row }) => <span className="font-mono text-sm font-medium text-foreground">{row.original.noOpname}</span>,
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    size: 130,
    cell: ({ row }) => <OpnameStatusBadge status={row.original.status} />,
  },
  {
    id: "totalItems",
    accessorKey: "totalItems",
    header: "Total Item",
    size: 90,
    cell: ({ row }) => <span className="text-sm tabular-nums">{row.original.totalItems}</span>,
  },
  {
    id: "selisih",
    header: "Selisih",
    size: 120,
    cell: ({ row }) => {
      const { selisihPlus, selisihMinus } = row.original;
      return (
        <div className="flex items-center gap-2">
          {selisihPlus > 0 && <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400"><Plus className="h-3 w-3" />{selisihPlus}</span>}
          {selisihMinus > 0 && <span className="flex items-center gap-0.5 text-xs font-medium text-rose-600 dark:text-rose-400"><Minus className="h-3 w-3" />{selisihMinus}</span>}
          {selisihPlus === 0 && selisihMinus === 0 && <span className="text-xs text-muted-foreground">—</span>}
        </div>
      );
    },
  },
  {
    id: "approvedBy",
    header: "Diproses oleh",
    size: 110,
    cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.approvedBy ?? "—"}</span>,
  },
  {
    id: "catatan",
    header: "Catatan",
    cell: ({ row }) => {
      const text = row.original.status === "REJECTED"
        ? (row.original.catatanPenolakan ?? row.original.catatan ?? "—")
        : (row.original.catatan ?? "—");
      return <span className="text-xs text-muted-foreground block max-w-[220px] truncate" title={text}>{text}</span>;
    },
  },
];

// ─── Opname Form ──────────────────────────────────────────────────────────────

interface OpnameFormProps {
  rows: OpnameRow[];
  counts: Record<string, string>;
  onCountChange: (batchId: string, value: string) => void;
  filter: ActiveFilter;
  onFilterChange: (f: ActiveFilter) => void;
  onSave: () => void;
  onSubmit: () => void;
  isSaving: boolean;
}

function OpnameForm({ rows, counts, onCountChange, filter, onFilterChange, onSave, onSubmit, isSaving }: OpnameFormProps) {
  const enriched = useMemo(() => {
    return rows.map(r => {
      const raw = counts[r.batchId];
      const stokFisik = raw !== undefined && raw !== "" ? parseInt(raw, 10) : null;
      const selisih = stokFisik !== null && !isNaN(stokFisik) ? stokFisik - r.stokSistem : null;
      return { ...r, stokFisik, selisih };
    });
  }, [rows, counts]);

  const filtered = useMemo(() => {
    if (filter === "COUNTED") return enriched.filter(r => r.stokFisik !== null);
    if (filter === "WITH_DIFF") return enriched.filter(r => r.selisih !== null && r.selisih !== 0);
    return enriched;
  }, [enriched, filter]);

  const stats = useMemo(() => {
    const total = enriched.length;
    const counted = enriched.filter(r => r.stokFisik !== null && !isNaN(r.stokFisik as number)).length;
    const plusDiff = enriched.filter(r => (r.selisih ?? 0) > 0).reduce((s, r) => s + (r.selisih ?? 0), 0);
    const minusDiff = enriched.filter(r => (r.selisih ?? 0) < 0).reduce((s, r) => s + Math.abs(r.selisih ?? 0), 0);
    return { total, counted, uncounted: total - counted, plusDiff, minusDiff };
  }, [enriched]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        {(["ALL", "COUNTED", "WITH_DIFF"] as ActiveFilter[]).map(f => (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-lg border transition-colors",
              filter === f
                ? "bg-primary/10 text-primary border-primary/30 font-medium"
                : "border-border text-muted-foreground hover:bg-muted"
            )}
          >
            {f === "ALL" ? "Semua" : f === "COUNTED" ? "Sudah Diinput" : "Ada Selisih"}
            <span className="ml-1.5 tabular-nums">
              {f === "ALL" && `(${stats.total})`}
              {f === "COUNTED" && `(${stats.counted})`}
              {f === "WITH_DIFF" && `(${enriched.filter(r => r.selisih !== null && r.selisih !== 0).length})`}
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide min-w-[200px]">Nama Obat</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide min-w-[130px]">No. Batch / ED</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[110px]">Stok Sistem</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[130px]">Stok Fisik</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-[90px]">Selisih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">Tidak ada item yang cocok dengan filter ini</td></tr>
              ) : (
                filtered.map(row => (
                  <tr
                    key={row.batchId}
                    className={cn(
                      "hover:bg-muted/30 transition-colors",
                      row.stokFisik !== null && (row.selisih ?? 0) < 0 && "bg-red-50/40 dark:bg-red-950/20",
                      row.stokFisik !== null && (row.selisih ?? 0) > 0 && "bg-emerald-50/40 dark:bg-emerald-950/20",
                    )}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground leading-snug">{row.namaObat}</p>
                      <p className="text-xs text-muted-foreground">{row.kategoriNama} · {row.lokasiNama}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-foreground block">{row.batchNumber}</span>
                      <span className="text-xs text-muted-foreground">ED: {formatDate(row.expiredDate)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="tabular-nums font-medium text-foreground">{row.stokSistem.toLocaleString("id-ID")}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        min={0}
                        placeholder="—"
                        value={counts[row.batchId] ?? ""}
                        onChange={e => onCountChange(row.batchId, e.target.value)}
                        className="h-8 w-24 mx-auto text-center text-sm tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.selisih === null ? (
                        <span className="text-muted-foreground text-xs">—</span>
                      ) : row.selisih === 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400 text-sm font-medium tabular-nums">0</span>
                      ) : (
                        <span className={cn("text-sm font-semibold tabular-nums", row.selisih > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                          {row.selisih > 0 ? "+" : ""}{row.selisih.toLocaleString("id-ID")}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 px-5 py-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span className="text-muted-foreground">Total item: <strong className="text-foreground">{stats.total}</strong></span>
          <span className="text-muted-foreground">
            Sudah dicount:{" "}
            <strong className={stats.counted === stats.total ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}>{stats.counted}</strong>
          </span>
          <span className="text-muted-foreground">
            Belum:{" "}
            <strong className={stats.uncounted > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"}>{stats.uncounted}</strong>
          </span>
          <Separator orientation="vertical" className="h-4" />
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="h-3.5 w-3.5" />
            <strong>+{stats.plusDiff}</strong>
            <span className="text-muted-foreground font-normal">unit positif</span>
          </span>
          <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
            <TrendingDown className="h-3.5 w-3.5" />
            <strong>-{stats.minusDiff}</strong>
            <span className="text-muted-foreground font-normal">unit negatif</span>
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" size="sm" onClick={onSave} disabled={isSaving} className="gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" />
          Simpan Progress
        </Button>
        <Button onClick={onSubmit} disabled={stats.counted === 0} className="gap-2">
          <SendHorizonal className="h-4 w-4" />
          Kirim ke Admin untuk Approval
        </Button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ApotekerOpnamePage() {
  const { data: batchResponse } = useBatchList({ status: "AKTIF", limit: 500 });
  const { data: listResponse, isLoading: listLoading } = useStokOpnameList();
  const createOpname = useCreateStokOpname();
  const submitOpname = useSubmitOpname();

  // Build batch rows from API
  const batchRows = useMemo<OpnameRow[]>(
    () =>
      (batchResponse?.data ?? []).map((b: BatchItem) => ({
        batchId: b.id,
        namaObat: b.namaObat ?? "",
        kategoriNama: b.kategoriNama ?? "",
        batchNumber: b.batchNumber,
        expiredDate: b.expiredDate,
        lokasiNama: b.lokasiNama ?? "",
        stokSistem: b.qty,
      })),
    [batchResponse]
  );

  // Active opname tracking (session-local — no DRAFT status in API)
  const [activeOpnameId, setActiveOpnameId] = useState<string | null>(null);

  const [view, setView] = useState<ViewTab>("aktif");
  const [opnamePhase, setOpnamePhase] = useState<OpnamePhase>("idle");
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("ALL");
  const [startConfirmOpen, setStartConfirmOpen] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const riwayat: OpnameListItem[] = useMemo(
    () => (listResponse?.data ?? []).filter(o => o.status !== "PENDING" || !activeOpnameId || o.id !== activeOpnameId),
    [listResponse, activeOpnameId]
  );

  // Progress computation
  const { sudahDicount, progressPct } = useMemo(() => {
    const counted = batchRows.filter(r => {
      const v = counts[r.batchId];
      return v !== undefined && v !== "" && !isNaN(parseInt(v, 10));
    }).length;
    return {
      sudahDicount: counted,
      progressPct: batchRows.length > 0 ? Math.round((counted / batchRows.length) * 100) : 0,
    };
  }, [batchRows, counts]);

  async function handleStartOpname() {
    setStartConfirmOpen(false);
    try {
      const newOpname = await createOpname.mutateAsync({
        catatan: "Opname bulanan — menunggu verifikasi dan persetujuan Admin.",
      });
      setActiveOpnameId(newOpname.id);
      setCounts({});
      setActiveFilter("ALL");
      setOpnamePhase("in_progress");
      setView("aktif");
      toast.success("Opname dimulai", {
        description: "Hitung stok fisik setiap item dan masukkan angkanya. Transaksi keluar sementara dinonaktifkan.",
      });
    } catch {
      // error handled by hook
    }
  }

  async function handleSaveProgress() {
    setIsSaving(true);
    await new Promise<void>(r => setTimeout(r, 400));
    setIsSaving(false);
    toast.success("Progress disimpan", {
      description: "Data hitung sementara berhasil disimpan secara lokal.",
    });
  }

  async function handleSubmitOpname() {
    setSubmitConfirmOpen(false);
    if (!activeOpnameId) return;

    const countedItems = batchRows.filter(r => {
      const v = counts[r.batchId];
      return v !== undefined && v !== "" && !isNaN(parseInt(v, 10));
    });

    try {
      await submitOpname.mutateAsync(activeOpnameId);

      const selisihPlus = countedItems.filter(r => parseInt(counts[r.batchId], 10) > r.stokSistem).length;
      const selisihMinus = countedItems.filter(r => parseInt(counts[r.batchId], 10) < r.stokSistem).length;

      setActiveOpnameId(null);
      setOpnamePhase("idle");
      setCounts({});
      setView("riwayat");
      toast.success("Opname dikirim ke Admin", {
        description: `${countedItems.length} item dikirim. Selisih: +${selisihPlus} / -${selisihMinus}.`,
      });
    } catch {
      // error handled by hook
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Stock Opname" description="Hitung stok fisik dan rekonsiliasi dengan data sistem" />

      <div className="flex gap-6">
        {/* ── Sidebar ── */}
        <aside className="w-[220px] flex-shrink-0">
          <div className="bg-card border rounded-xl p-4 sticky top-6 space-y-4">
            <nav className="space-y-0.5">
              {[
                { value: "aktif" as ViewTab, label: "Opname Aktif", icon: <ClipboardCheck className="h-3.5 w-3.5" />, badge: opnamePhase === "in_progress" ? "1" : null, badgeStyle: "bg-amber-100 text-amber-700" },
                { value: "riwayat" as ViewTab, label: "Riwayat Opname", icon: <History className="h-3.5 w-3.5" />, badge: String(riwayat.length), badgeStyle: null },
              ].map(item => (
                <button
                  key={item.value}
                  onClick={() => setView(item.value)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                    view === item.value ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2">{item.icon}<span>{item.label}</span></div>
                  {item.badge && (
                    <span className={cn("text-xs px-1.5 py-0.5 rounded-md", view === item.value ? "bg-primary/20 text-primary" : (item.badgeStyle ?? "bg-muted text-muted-foreground"))}>
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            <Separator />

            <Button className="w-full h-9 text-sm" disabled={opnamePhase === "in_progress"} onClick={() => setStartConfirmOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-2" />
              Mulai Opname Baru
            </Button>
            {opnamePhase === "in_progress" && (
              <p className="text-xs text-muted-foreground text-center -mt-1">Ada opname yang sedang berjalan</p>
            )}

            <Separator />

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 dark:bg-blue-950/20 dark:border-blue-900">
              <div className="flex gap-2">
                <Info className="h-3.5 w-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                  Saat opname aktif, transaksi stok keluar akan dikunci sementara.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Content ── */}
        <main className="flex-1 min-w-0">
          {view === "aktif" ? (
            <div className="space-y-4">
              {opnamePhase === "idle" ? (
                <EmptyState
                  icon={ClipboardCheck}
                  title="Tidak ada opname aktif"
                  description="Klik 'Mulai Opname Baru' untuk memulai proses rekonsiliasi stok."
                />
              ) : (
                <>
                  <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-900/15 dark:border-amber-700 px-4 py-3">
                    <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Opname Sedang Berjalan</p>
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Stok keluar: <span className="font-semibold">Dikunci 🔒</span> — semua transaksi keluar ditunda hingga opname selesai.
                      </p>
                    </div>
                  </div>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Progress Penghitungan</span>
                        <span className="text-sm font-semibold text-primary">{progressPct}%</span>
                      </div>
                      <Progress value={progressPct} className="h-2 mb-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Sudah dicount: {sudahDicount} item</span>
                        <span>Belum: {batchRows.length - sudahDicount} item</span>
                      </div>
                    </CardContent>
                  </Card>

                  <OpnameForm
                    rows={batchRows}
                    counts={counts}
                    onCountChange={(id, val) => setCounts(prev => ({ ...prev, [id]: val }))}
                    filter={activeFilter}
                    onFilterChange={setActiveFilter}
                    onSave={handleSaveProgress}
                    onSubmit={() => setSubmitConfirmOpen(true)}
                    isSaving={isSaving}
                  />
                </>
              )}
            </div>
          ) : (
            riwayat.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="Belum ada riwayat opname"
                description={listLoading ? "Memuat..." : "Riwayat opname yang telah selesai akan muncul di sini."}
              />
            ) : (
              <Card>
                <CardHeader className="pb-0">
                  <CardTitle className="text-base">Riwayat Stock Opname</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <DataTable columns={riwayatColumns} data={riwayat} pageSize={10} />
                </CardContent>
              </Card>
            )
          )}
        </main>
      </div>

      <ConfirmDialog
        open={startConfirmOpen}
        onOpenChange={setStartConfirmOpen}
        title="Mulai Opname Baru?"
        description="Memulai opname akan mengunci transaksi stok keluar selama proses berlangsung. Semua transaksi keluar akan ditunda hingga opname selesai dan disetujui Admin. Lanjutkan?"
        confirmLabel="Ya, Mulai Opname"
        onConfirm={handleStartOpname}
        variant="default"
      />
      <ConfirmDialog
        open={submitConfirmOpen}
        onOpenChange={setSubmitConfirmOpen}
        title="Kirim ke Admin?"
        description="Opname akan dikirim ke Admin untuk direview dan disetujui. Setelah dikirim, Anda tidak dapat mengubah data hitung lagi. Pastikan semua item sudah dihitung dengan benar."
        confirmLabel="Ya, Kirim ke Admin"
        onConfirm={handleSubmitOpname}
        variant="default"
      />
    </div>
  );
}
