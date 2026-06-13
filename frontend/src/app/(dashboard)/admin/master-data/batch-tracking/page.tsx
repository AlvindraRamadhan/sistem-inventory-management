"use client";

import { useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  PackageCheck,
  PackageOpen,
  PackageX,
  Search,
  TriangleAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { useBatchList } from "@/hooks/queries/use-batch";
import { cn } from "@/lib/utils";
import type { BatchItem } from "@/services/batch.service";

//  Types 

type EdStatus = "AMAN" | "NORMAL" | "MENDEKAT" | "KRITIS" | "KADALUARSA" | "QUARANTINE";
type QuickFilter = "all" | "lt7" | "lt30" | "lt90" | "expired";

//  Constants 

const ED_STATUS_CONFIG: Record<EdStatus, { label: string; className: string }> = {
  AMAN: {
    label: "Aman",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  NORMAL: {
    label: "Normal",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  MENDEKAT: {
    label: "Mendekat",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  KRITIS: {
    label: "Kritis",
    className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  KADALUARSA: {
    label: "Kadaluarsa",
    className: "bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300",
  },
  QUARANTINE: {
    label: "Karantina",
    className: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  },
};

//  Helpers 

function getDaysUntilExpiry(expiredDate: string | null | undefined): number {
  if (!expiredDate || typeof expiredDate !== "string") return Infinity;
  const parts = expiredDate.split("-");
  if (parts.length !== 3) return Infinity;
  const [y, m, d] = parts.map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return Infinity;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ed = new Date(y, m - 1, d);
  return Math.floor((ed.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getEdStatus(batch: BatchItem): EdStatus {
  if (batch.status === "KARANTINA") return "QUARANTINE";
  if (!batch.expiredDate) return "AMAN";
  const days = getDaysUntilExpiry(batch.expiredDate);
  if (days < 0 || batch.status === "EXPIRED") return "KADALUARSA";
  if (days < 7) return "KRITIS";
  if (days < 30) return "MENDEKAT";
  if (days < 90) return "NORMAL";
  return "AMAN";
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr || typeof dateStr !== "string") return "-";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts.map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return dateStr;
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
  return `${d} ${months[m - 1]} ${y}`;
}

//  Sub-components 

function EdStatusBadge({ batch }: { batch: BatchItem }) {
  const status = getEdStatus(batch);
  const { label, className } = ED_STATUS_CONFIG[status];
  return (
    <Badge className={cn("text-xs border-0 font-medium whitespace-nowrap", className)}>
      {label}
    </Badge>
  );
}

function SisaHariCell({ expiredDate }: { expiredDate: string | null | undefined }) {
  const days = getDaysUntilExpiry(expiredDate);
  if (!isFinite(days)) return <span className="text-sm text-muted-foreground">-</span>;
  if (days < 0) {
    return (
      <span className="text-xs font-medium text-red-600 dark:text-red-400 whitespace-nowrap">
        {Math.abs(days)} hr lalu
      </span>
    );
  }
  const colorClass =
    days < 7
      ? "text-red-600 dark:text-red-400"
      : days < 30
      ? "text-amber-600 dark:text-amber-400"
      : days < 90
      ? "text-blue-600 dark:text-blue-400"
      : "text-emerald-600 dark:text-emerald-400";
  return (
    <span className={cn("text-sm font-medium tabular-nums", colorClass)}>
      {days} hari
    </span>
  );
}

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc") return <ChevronUp className="h-3.5 w-3.5 text-foreground" />;
  if (sorted === "desc") return <ChevronDown className="h-3.5 w-3.5 text-foreground" />;
  return <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />;
}

// ─── Column definitions ───────────────────────────────────────────────────────

const columns: ColumnDef<BatchItem>[] = [
  {
    id: "batchNumber",
    accessorKey: "batchNumber",
    header: "No. Batch",
    size: 150,
    enableSorting: true,
    cell: ({ row }) => {
      const isExpired = getDaysUntilExpiry(row.original.expiredDate) < 0;
      return (
        <span
          className={cn(
            "font-mono text-xs text-foreground",
            isExpired && "line-through opacity-50"
          )}
        >
          {row.original.batchNumber}
        </span>
      );
    },
  },
  {
    id: "namaObat",
    accessorKey: "namaObat",
    header: "Nama Obat",
    size: 200,
    enableSorting: true,
    cell: ({ row }) => {
      const isExpired = getDaysUntilExpiry(row.original.expiredDate) < 0;
      return (
        <div className="min-w-[140px]">
          <p
            className={cn(
              "text-sm font-medium leading-snug",
              isExpired && "line-through opacity-50"
            )}
          >
            {row.original.namaObat}
          </p>
          {row.original.kategoriNama && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {row.original.kategoriNama}
            </p>
          )}
        </div>
      );
    },
  },
  {
    id: "tglProduksi",
    accessorKey: "tglProduksi",
    header: "Tgl. Produksi",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {formatDate(row.original.tglProduksi)}
      </span>
    ),
  },
  {
    id: "expiredDate",
    accessorKey: "expiredDate",
    header: "Expired Date",
    enableSorting: true,
    cell: ({ row }) => {
      const days = getDaysUntilExpiry(row.original.expiredDate);
      return (
        <span
          className={cn(
            "text-sm whitespace-nowrap font-medium",
            days < 0 ? "text-red-600 dark:text-red-400" : "text-foreground"
          )}
        >
          {formatDate(row.original.expiredDate)}
        </span>
      );
    },
  },
  {
    id: "sisaHari",
    accessorFn: (row) => getDaysUntilExpiry(row.expiredDate),
    header: "Sisa Hari",
    size: 90,
    enableSorting: false,
    cell: ({ row }) => <SisaHariCell expiredDate={row.original.expiredDate} />,
  },
  {
    id: "qty",
    accessorKey: "qty",
    header: "Sisa Stok",
    size: 90,
    enableSorting: true,
    cell: ({ row }) => (
      <span className="text-sm tabular-nums font-medium block text-right pr-2">
        {(row.original.qty ?? 0).toLocaleString("id-ID")}
      </span>
    ),
  },
  {
    id: "lokasiNama",
    accessorKey: "lokasiNama",
    header: "Lokasi",
    size: 110,
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {row.original.lokasiNama ?? "-"}
      </span>
    ),
  },
  {
    id: "edStatus",
    header: "Status",
    size: 110,
    enableSorting: false,
    cell: ({ row }) => <EdStatusBadge batch={row.original} />,
  },
];

// ─── Quick filter config ──────────────────────────────────────────────────────

interface FilterOption {
  id: QuickFilter;
  label: string;
  dotColor?: string;
  activeClass: string;
  inactiveClass: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  {
    id: "all",
    label: "Semua",
    activeClass: "border-primary bg-primary text-primary-foreground",
    inactiveClass: "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
  },
  {
    id: "lt7",
    label: "ED < 7 hari",
    dotColor: "bg-red-500",
    activeClass: "border-red-500 bg-red-500 text-white",
    inactiveClass: "border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30",
  },
  {
    id: "lt30",
    label: "ED < 30 hari",
    dotColor: "bg-amber-500",
    activeClass: "border-amber-500 bg-amber-500 text-white",
    inactiveClass: "border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/30",
  },
  {
    id: "lt90",
    label: "ED < 90 hari",
    dotColor: "bg-blue-500",
    activeClass: "border-blue-500 bg-blue-500 text-white",
    inactiveClass: "border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400",
  },
  {
    id: "expired",
    label: "Sudah Expired",
    dotColor: "bg-slate-600",
    activeClass: "border-slate-700 bg-slate-700 text-white dark:bg-slate-800",
    inactiveClass: "border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400",
  },
];

//  Page 

export default function BatchTrackingPage() {
  const { data: batchResponse } = useBatchList({ limit: 500 });
  const allBatches = batchResponse?.data ?? [];

  const [sorting, setSorting] = useState<SortingState>([
    { id: "expiredDate", desc: false },
  ]);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [search, setSearch] = useState("");

  //  Summary stats (always over all batches)
  const stats = useMemo(() => {
    const kadaluarsa = allBatches.filter((b) => getEdStatus(b) === "KADALUARSA").length;
    const kritis = allBatches.filter((b) => getEdStatus(b) === "KRITIS").length;
    const mendekat = allBatches.filter((b) => getEdStatus(b) === "MENDEKAT").length;
    const normal = allBatches.filter((b) => {
      const s = getEdStatus(b);
      return s === "NORMAL" || s === "AMAN" || s === "QUARANTINE";
    }).length;
    return { kadaluarsa, kritis, mendekat, normal };
  }, [allBatches]);

  // ── Filter counts for pills ────────────────────────────────────────────────
  const filterCounts = useMemo(() => {
    const lt7 = allBatches.filter((b) => {
      const d = getDaysUntilExpiry(b.expiredDate);
      return d >= 0 && d < 7;
    }).length;
    const lt30 = allBatches.filter((b) => {
      const d = getDaysUntilExpiry(b.expiredDate);
      return d >= 0 && d < 30;
    }).length;
    const lt90 = allBatches.filter((b) => {
      const d = getDaysUntilExpiry(b.expiredDate);
      return d >= 0 && d < 90;
    }).length;
    const expired = allBatches.filter((b) => getDaysUntilExpiry(b.expiredDate) < 0).length;
    return { all: allBatches.length, lt7, lt30, lt90, expired };
  }, [allBatches]);

  // ── Filtered + searched data ───────────────────────────────────────────────
  const filteredData = useMemo(() => {
    let result = allBatches;

    if (quickFilter !== "all") {
      result = result.filter((b) => {
        const days = getDaysUntilExpiry(b.expiredDate);
        switch (quickFilter) {
          case "expired": return days < 0;
          case "lt7":  return days >= 0 && days < 7;
          case "lt30": return days >= 0 && days < 30;
          case "lt90": return days >= 0 && days < 90;
        }
      });
    }

    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.batchNumber.toLowerCase().includes(s) ||
          (b.namaObat?.toLowerCase().includes(s) ?? false) ||
          (b.kategoriNama?.toLowerCase().includes(s) ?? false) ||
          (b.lokasiNama?.toLowerCase().includes(s) ?? false)
      );
    }

    return result;
  }, [allBatches, quickFilter, search]);

  // Table
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  });

  const rows = table.getRowModel().rows;
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageStart = pageIndex * pageSize + 1;
  const pageEnd = Math.min(pageStart + rows.length - 1, filteredData.length);

  return (
    <div className="flex flex-col gap-6">
      {/*  Header  */}
      <PageHeader
        title="Batch & Expired Tracking"
        description="Pantau semua batch obat, status kedaluarsa, dan tindakan yang perlu dilakukan"
        breadcrumb={[
          { label: "Master Data", href: "#" },
          { label: "Batch & Expired" },
        ]}
      />

      {/*  Summary stats  */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Kadaluarsa"
          value={stats.kadaluarsa}
          icon={PackageX}
          variant="danger"
          subtitle="Segera ditarik dari peredaran"
        />
        <StatsCard
          title="Kritis (< 7 Hari)"
          value={stats.kritis}
          icon={TriangleAlert}
          variant={stats.kritis > 0 ? "danger" : "default"}
          subtitle="Harus segera ditindaklanjuti"
        />
        <StatsCard
          title="Mendekat (< 30 Hari)"
          value={stats.mendekat}
          icon={Clock}
          variant={stats.mendekat > 0 ? "warning" : "default"}
          subtitle="Perlu perencanaan pemakaian"
        />
        <StatsCard
          title="Normal / Aman"
          value={stats.normal}
          icon={PackageCheck}
          variant="success"
          subtitle="≥ 30 hari dari ED"
        />
      </div>

      {/*  Filter bar  */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Quick filter pills */}
        <div className="flex flex-wrap items-center gap-2">
          {FILTER_OPTIONS.map((opt) => {
            const count = filterCounts[opt.id];
            const isActive = quickFilter === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setQuickFilter(opt.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                  isActive ? opt.activeClass : opt.inactiveClass
                )}
              >
                {opt.dotColor && (
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full shrink-0",
                      isActive ? "bg-white/80" : opt.dotColor
                    )}
                  />
                )}
                {opt.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] leading-none font-normal tabular-nums",
                    isActive ? "bg-black/10 text-current" : "bg-muted text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full max-w-xs shrink-0">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            aria-label="Cari batch, obat, atau lokasi"
            placeholder="Cari batch, obat, lokasi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/*  Table  */}
      <div className="flex flex-col gap-3">
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id} className="hover:bg-transparent">
                  {hg.headers.map((header) => (
                    <TableHead key={header.id} style={{ width: header.getSize() }}>
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <button
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <SortIcon sorted={header.column.getIsSorted()} />
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {rows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={columns.length}>
                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
                      <PackageOpen className="h-8 w-8 opacity-40" />
                      <p className="text-sm">Tidak ada data batch</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const batch = row.original;
                  const days = getDaysUntilExpiry(batch.expiredDate);
                  const isExpired = days < 0;
                  const isNearExpiry = !isExpired && days < 30;

                  return (
                    <TableRow
                      key={row.id}
                      className={cn(
                        "transition-colors",
                        isExpired &&
                          "bg-red-50/70 hover:bg-red-50 dark:bg-red-950/20 dark:hover:bg-red-950/30",
                        isNearExpiry &&
                          "bg-amber-50/70 hover:bg-amber-50 dark:bg-amber-950/20 dark:hover:bg-amber-950/30"
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>
            Menampilkan{" "}
            <span className="font-medium text-foreground">
              {rows.length === 0 ? 0 : `${pageStart}–${pageEnd}`}
            </span>{" "}
            dari{" "}
            <span className="font-medium text-foreground">{filteredData.length}</span> batch
          </span>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.firstPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Halaman pertama"
            >
              <ChevronsLeft />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft />
            </Button>
            <span className="px-2 tabular-nums text-sm">
              {pageIndex + 1} / {Math.max(1, table.getPageCount())}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Halaman berikutnya"
            >
              <ChevronRight />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => table.lastPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Halaman terakhir"
            >
              <ChevronsRight />
            </Button>
          </div>
        </div>
      </div>

      {/*  Legend  */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
        <p className="text-xs font-medium text-muted-foreground shrink-0">Keterangan baris:</p>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-5 rounded-sm bg-red-100 dark:bg-red-950/40 border border-red-200 dark:border-red-900" />
            <span className="text-xs text-muted-foreground">Sudah kadaluarsa + strikethrough</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-5 rounded-sm bg-amber-100 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900" />
            <span className="text-xs text-muted-foreground">Expired date &lt; 30 hari</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-5 rounded-sm bg-background border border-border" />
            <span className="text-xs text-muted-foreground">Normal / Aman</span>
          </div>
        </div>
      </div>
    </div>
  );
}
