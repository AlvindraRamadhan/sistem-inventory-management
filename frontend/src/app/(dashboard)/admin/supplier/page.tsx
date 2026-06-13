"use client";

import { useCallback, useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Building2,
  Check,
  ClipboardCopy,
  MoreHorizontal,
  PenLine,
  PlusCircle,
  PowerOff,
  Search,
  Truck,
  TruckIcon,
  Zap,
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
import { SupplierFormDialog } from "@/components/features/supplier";
import {
  useSupplierList,
  useCreateSupplier,
  useUpdateSupplier,
  useToggleSupplierActive,
  useSupplierStats,
} from "@/hooks/queries/use-supplier";
import { cn } from "@/lib/utils";
import type { SupplierFormValues } from "@/lib/validations/supplier";
import type { Supplier } from "@/types/supplier";
import type { SupplierItem, CreateSupplierDto } from "@/services/supplier.service";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  return `${d} ${months[m - 1]} ${y}`;
}

function mapToSupplier(item: SupplierItem): Supplier {
  return {
    id: item.id,
    kode: item.kode,
    nama: item.nama,
    kontakPerson: item.contactPerson ?? "",
    telepon: item.telepon ?? "",
    email: item.email ?? "",
    kota: item.alamat ?? "",
    status: item.isActive ? "AKTIF" : "TIDAK_AKTIF",
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

function mapToDto(values: SupplierFormValues): CreateSupplierDto {
  return {
    nama: values.nama,
    contactPerson: values.kontakPerson,
    telepon: values.telepon,
    email: values.email,
    alamat: values.kota,
  };
}

// ─── Kode cell with copy ──────────────────────────────────────────────────────

function CopyableKode({ kode }: { kode: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(kode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-xs text-foreground">{kode}</span>
      <button
        onClick={handleCopy}
        className="text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Salin kode"
      >
        {copied ? (
          <Check className="h-3 w-3 text-emerald-500" />
        ) : (
          <ClipboardCopy className="h-3 w-3" />
        )}
      </button>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Supplier["status"] }) {
  return (
    <Badge
      className={cn(
        "border-0 text-xs font-medium",
        status === "AKTIF"
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
      )}
    >
      {status === "AKTIF" ? "Aktif" : "Tidak Aktif"}
    </Badge>
  );
}

// ─── Column definitions ───────────────────────────────────────────────────────

function buildColumns(
  onEdit: (s: Supplier) => void,
  onToggle: (s: Supplier) => void
): ColumnDef<Supplier>[] {
  return [
    {
      id: "kode",
      accessorKey: "kode",
      header: "Kode",
      size: 110,
      cell: ({ row }) => <CopyableKode kode={row.original.kode} />,
    },
    {
      id: "nama",
      accessorKey: "nama",
      header: "Nama Supplier",
      cell: ({ row }) => (
        <div className="min-w-[160px]">
          <p className="text-sm font-medium text-foreground leading-snug">
            {row.original.nama}
          </p>
          <p className="text-xs text-muted-foreground">{row.original.kota}</p>
        </div>
      ),
    },
    {
      id: "kontakPerson",
      accessorKey: "kontakPerson",
      header: "Kontak Person",
      cell: ({ row }) => (
        <span className="text-sm text-foreground">{row.original.kontakPerson}</span>
      ),
    },
    {
      id: "telepon",
      accessorKey: "telepon",
      header: "Telepon",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-foreground">
          {row.original.telepon}
        </span>
      ),
    },
    {
      id: "email",
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground truncate max-w-[180px] block">
          {row.original.email}
        </span>
      ),
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      header: "Tgl. Bergabung",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "aksi",
      header: "Aksi",
      size: 48,
      cell: ({ row }) => {
        const s = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Aksi">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onEdit(s)}>
                <PenLine className="h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onToggle(s)}
                variant={s.status === "AKTIF" ? "destructive" : undefined}
              >
                {s.status === "AKTIF" ? (
                  <>
                    <PowerOff className="h-4 w-4" />
                    Nonaktifkan
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    Aktifkan
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SupplierPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("semua");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | undefined>(undefined);
  const [toggleTarget, setToggleTarget] = useState<Supplier | null>(null);

  const filterIsActive =
    filterStatus === "aktif" ? true :
    filterStatus === "tidak-aktif" ? false :
    undefined;

  const { data: supplierData, isLoading: isLoadingList } = useSupplierList({
    search: search || undefined,
    isActive: filterIsActive,
  });

  const { data: statsData, isLoading: isLoadingStats } = useSupplierStats();

  const supplierList = useMemo(
    () => (supplierData?.data ?? []).map(mapToSupplier),
    [supplierData]
  );

  const stats = useMemo(() => {
    const s = statsData as { total?: number; aktif?: number; tidakAktif?: number } | undefined;
    return {
      total: s?.total ?? 0,
      aktif: s?.aktif ?? 0,
      tidakAktif: s?.tidakAktif ?? 0,
    };
  }, [statsData]);

  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier(editingSupplier?.id ?? "");
  const toggleMutation = useToggleSupplierActive();

  const handleEdit = useCallback((s: Supplier) => {
    setEditingSupplier(s);
    setDialogOpen(true);
  }, []);

  const handleToggleClick = useCallback((s: Supplier) => {
    setToggleTarget(s);
  }, []);

  function handleAdd() {
    setEditingSupplier(undefined);
    setDialogOpen(true);
  }

  async function handleConfirmToggle() {
    if (!toggleTarget) return;
    await toggleMutation.mutateAsync(toggleTarget.id);
    setToggleTarget(null);
  }

  async function handleSave(values: SupplierFormValues, editingId?: string) {
    const dto = mapToDto(values);
    if (editingId) {
      await updateMutation.mutateAsync(dto);
    } else {
      await createMutation.mutateAsync(dto);
    }
  }

  const columns = useMemo(
    () => buildColumns(handleEdit, handleToggleClick),
    [handleEdit, handleToggleClick]
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <PageHeader
        title="Manajemen Supplier"
        description="Kelola data supplier pengadaan obat dan perbekalan kesehatan"
        actions={
          <Button onClick={handleAdd} size="action">
            <PlusCircle className="h-4 w-4" />
            Tambah Supplier
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="Total Supplier"
          value={stats.total}
          icon={Truck}
          variant="default"
          subtitle="Terdaftar di sistem"
          isLoading={isLoadingStats}
        />
        <StatsCard
          title="Aktif"
          value={stats.aktif}
          icon={TruckIcon}
          variant="success"
          subtitle="Dapat digunakan di pengadaan"
          isLoading={isLoadingStats}
        />
        <StatsCard
          title="Tidak Aktif"
          value={stats.tidakAktif}
          icon={Building2}
          variant={stats.tidakAktif > 0 ? "warning" : "default"}
          subtitle="Dinonaktifkan sementara"
          isLoading={isLoadingStats}
        />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Cari nama, kode, kota, atau kontak supplier"
            placeholder="Cari nama, kode, kota, atau kontak..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Status</SelectItem>
            <SelectItem value="aktif">Aktif</SelectItem>
            <SelectItem value="tidak-aktif">Tidak Aktif</SelectItem>
          </SelectContent>
        </Select>

        {(search || filterStatus !== "semua") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setFilterStatus("semua");
            }}
            className="text-muted-foreground"
          >
            Reset filter
          </Button>
        )}
      </div>

      {/* Table */}
      {isLoadingList ? (
        <TableSkeleton rows={8} columns={8} />
      ) : (
        <DataTable
          columns={columns}
          data={supplierList}
          pageSize={10}
        />
      )}

      {/* Form dialog */}
      <SupplierFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingSupplier={editingSupplier}
        existingSuppliers={supplierList}
        onSave={handleSave}
      />

      {/* Toggle confirm dialog */}
      <ConfirmDialog
        open={!!toggleTarget}
        onOpenChange={(v) => { if (!v) setToggleTarget(null); }}
        title={
          toggleTarget?.status === "AKTIF"
            ? `Nonaktifkan ${toggleTarget?.nama}?`
            : `Aktifkan ${toggleTarget?.nama}?`
        }
        description={
          toggleTarget?.status === "AKTIF"
            ? "Supplier yang tidak aktif tidak akan muncul di pilihan supplier pada form pengadaan."
            : "Supplier akan kembali aktif dan dapat dipilih pada form pengadaan."
        }
        confirmLabel={
          toggleTarget?.status === "AKTIF" ? "Nonaktifkan" : "Aktifkan"
        }
        cancelLabel="Batal"
        variant={toggleTarget?.status === "AKTIF" ? "destructive" : "default"}
        onConfirm={handleConfirmToggle}
        isLoading={toggleMutation.isPending}
      />
    </div>
  );
}
