"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Eye,
  FileText,
  MoreHorizontal,
  PenLine,
  PlusCircle,
  Search,
  Send,
  ShoppingCart,
  Trash2,
  CheckCircle2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import {
  usePOList,
  usePOStats,
  useDeletePO,
} from "@/hooks/queries/use-purchase-order";
import { useSupplierList } from "@/hooks/queries/use-supplier";
import {
  PO_STATUS_LABEL,
  PO_STATUS_COLOR,
} from "@/lib/constants/status";
import { TERMIN_LABEL } from "@/types/procurement";
import type { PurchaseOrder } from "@/types/procurement";
import type { PaginatedResponse } from "@/lib/api-client";

//  Helpers

function formatRupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(dateStr: string): string {
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  return `${d} ${months[m - 1]} ${y}`;
}

//  Status badge

function POStatusBadge({ status }: { status: PurchaseOrder["status"] }) {
  const color = PO_STATUS_COLOR[status];
  return (
    <Badge variant={color} className="text-xs font-medium whitespace-nowrap">
      {PO_STATUS_LABEL[status]}
    </Badge>
  );
}

// ─── Column definitions ───────────────────────────────────────────────────────

function buildColumns(
  onView: (po: PurchaseOrder) => void,
  onEdit: (po: PurchaseOrder) => void,
  onDelete: (po: PurchaseOrder) => void
): ColumnDef<PurchaseOrder>[] {
  return [
    {
      id: "noPO",
      accessorKey: "noPO",
      header: "No. PO",
      size: 140,
      cell: ({ row }) => (
        <span className="font-mono text-xs font-medium text-foreground whitespace-nowrap">
          {row.original.noPO}
        </span>
      ),
    },
    {
      id: "supplierName",
      accessorKey: "supplierName",
      header: "Supplier",
      cell: ({ row }) => (
        <div className="min-w-[160px]">
          <p className="text-sm font-medium text-foreground leading-snug">
            {row.original.supplierName}
          </p>
        </div>
      ),
    },
    {
      id: "tanggalPO",
      accessorKey: "tanggalPO",
      header: "Tanggal PO",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatDate(row.original.tanggalPO)}
        </span>
      ),
    },
    {
      id: "items",
      header: "Total Item",
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-center block">
          {row.original.items?.length ?? 0}
        </span>
      ),
    },
    {
      id: "totalNilai",
      accessorKey: "totalNilai",
      header: "Total Nilai",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm tabular-nums font-medium text-foreground whitespace-nowrap">
          {formatRupiah(row.original.totalNilai)}
        </span>
      ),
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <POStatusBadge status={row.original.status} />,
    },
    {
      id: "terminPembayaran",
      accessorKey: "terminPembayaran",
      header: "Termin",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {TERMIN_LABEL[row.original.terminPembayaran]}
        </span>
      ),
    },
    {
      id: "aksi",
      header: "Aksi",
      size: 48,
      cell: ({ row }) => {
        const po = row.original;
        const isDraft = po.status === "DRAFT";
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Aksi">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onView(po)}>
                <Eye className="h-4 w-4" />
                Detail
              </DropdownMenuItem>
              {isDraft && (
                <>
                  <DropdownMenuItem onClick={() => onEdit(po)}>
                    <PenLine className="h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onDelete(po)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Hapus
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}

//  Page

export default function PurchaseOrderPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("semua");
  const [filterSupplier, setFilterSupplier] = useState("semua");
  const [deleteTarget, setDeleteTarget] = useState<PurchaseOrder | null>(null);

  const { data: poRaw, isLoading } = usePOList({ limit: 200 });
  const { data: statsRaw } = usePOStats();
  const { data: supplierRaw } = useSupplierList({ isActive: true, limit: 100 });
  const deleteMutation = useDeletePO();

  const poList = useMemo(
    () => ((poRaw as PaginatedResponse<PurchaseOrder> | undefined)?.data ?? []),
    [poRaw]
  );

  const activeSuppliers = useMemo(
    () => supplierRaw?.data ?? [],
    [supplierRaw]
  );

  //  Stats
  const stats = useMemo(() => {
    const s = statsRaw as { total?: number; draft?: number; terkirim?: number; diterima?: number } | undefined;
    if (s?.total !== undefined) {
      return { total: s.total ?? 0, draft: s.draft ?? 0, terkirim: s.terkirim ?? 0, diterima: s.diterima ?? 0 };
    }
    // Fallback: compute from loaded list
    return {
      total: poList.length,
      draft: poList.filter((p) => p.status === "DRAFT").length,
      terkirim: poList.filter((p) => p.status === "SENT").length,
      diterima: poList.filter((p) => ["RECEIVED", "INVOICED", "PAID"].includes(p.status)).length,
    };
  }, [statsRaw, poList]);

  //  Filtered data (client-side)
  const filtered = useMemo(() => {
    return poList.filter((po) => {
      const matchSearch =
        !search ||
        po.noPO.toLowerCase().includes(search.toLowerCase()) ||
        po.supplierName.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        filterStatus === "semua" || po.status === filterStatus;
      const matchSupplier =
        filterSupplier === "semua" || po.supplierId === filterSupplier;
      return matchSearch && matchStatus && matchSupplier;
    });
  }, [poList, search, filterStatus, filterSupplier]);

  //  Handlers
  function handleView(po: PurchaseOrder) {
    router.push(`/admin/procurement/purchase-order/${po.id}`);
  }

  function handleEdit(po: PurchaseOrder) {
    router.push(`/admin/procurement/purchase-order/${po.id}/edit`);
  }

  function handleDeleteClick(po: PurchaseOrder) {
    setDeleteTarget(po);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  }

  const columns = useMemo(
    () => buildColumns(handleView, handleEdit, handleDeleteClick),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const hasFilter = search || filterStatus !== "semua" || filterSupplier !== "semua";

  return (
    <div className="flex flex-col gap-6">
      {/*  Header  */}
      <PageHeader
        title="Purchase Order"
        description="Kelola dokumen pemesanan obat dan perbekalan kesehatan kepada supplier"
        breadcrumb={[
          { label: "Procurement" },
          { label: "Purchase Order" },
        ]}
        actions={
          <Button onClick={() => router.push("/admin/procurement/purchase-order/buat")} size="action">
            <PlusCircle className="h-4 w-4" />
            Buat PO Baru
          </Button>
        }
      />

      {/*  Stats  */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatsCard
          title="Total PO"
          value={stats.total}
          icon={ShoppingCart}
          variant="default"
          subtitle="Semua status"
        />
        <StatsCard
          title="Draft"
          value={stats.draft}
          icon={FileText}
          variant="warning"
          subtitle="Belum dikirim"
        />
        <StatsCard
          title="Terkirim"
          value={stats.terkirim}
          icon={Send}
          variant="default"
          subtitle="Menunggu barang"
        />
        <StatsCard
          title="Diterima"
          value={stats.diterima}
          icon={CheckCircle2}
          variant="success"
          subtitle="Received / Invoiced / Paid"
        />
      </div>

      {/*  Filter bar  */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Cari nomor PO atau supplier"
            placeholder="Cari nomor PO atau supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Status</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="SENT">Terkirim</SelectItem>
            <SelectItem value="PARTIAL_RECEIVED">Diterima Sebagian</SelectItem>
            <SelectItem value="RECEIVED">Diterima</SelectItem>
            <SelectItem value="INVOICED">Diinvoice</SelectItem>
            <SelectItem value="PAID">Lunas</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterSupplier} onValueChange={setFilterSupplier}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Semua Supplier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Supplier</SelectItem>
            {activeSuppliers.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setFilterStatus("semua");
              setFilterSupplier("semua");
            }}
            className="text-muted-foreground"
          >
            Reset filter
          </Button>
        )}
      </div>

      {/*  Table  */}
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          pageSize={10}
          onRowClick={handleView}
        />
      )}

      {/*  Delete confirm  */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}
        title={`Hapus ${deleteTarget?.noPO}?`}
        description="Purchase Order yang dihapus tidak dapat dipulihkan. Pastikan PO ini memang tidak diperlukan."
        confirmLabel="Hapus"
        cancelLabel="Batal"
        variant="destructive"
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
