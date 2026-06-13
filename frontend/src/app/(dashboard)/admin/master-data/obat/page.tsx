"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  AlertCircle,
  Check,
  ClipboardCopy,
  Loader2,
  MoreHorizontal,
  Package,
  PackageCheck,
  PackageX,
  PenLine,
  PlusCircle,
  PowerOff,
  Search,
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
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/shared/stats-card";
import { ObatFormDialog } from "@/components/features/master-data/obat/obat-form-dialog";
import type { ObatFormValues } from "@/lib/validations/obat";
import { KATEGORI_OBAT } from "@/lib/constants/obat-reference";
import { cn } from "@/lib/utils";
import type { Obat } from "@/types/inventory";
import {
  useObatList,
  useObatStats,
  useCreateObat,
  useUpdateObat,
  useToggleObatActive,
} from "@/hooks/queries/use-obat";
import type { ObatItem, CreateObatDto } from "@/services/obat.service";

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

//  Copy-to-clipboard cell

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
        aria-label="Salin ID"
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

//  Status badge

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge
      className={cn(
        "border-0 text-xs font-medium",
        isActive
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
      )}
    >
      {isActive ? "Aktif" : "Tidak Aktif"}
    </Badge>
  );
}

//  Column definitions

function buildColumns(
  onEdit: (obat: ObatItem) => void,
  onToggleStatus: (obat: ObatItem) => void
): ColumnDef<ObatItem>[] {
  return [
    {
      id: "kode",
      accessorKey: "kode",
      header: "ID Obat",
      size: 120,
      cell: ({ row }) => <CopyableKode kode={row.original.kode} />,
    },
    {
      id: "nama",
      accessorKey: "nama",
      header: "Nama Obat",
      cell: ({ row }) => (
        <div className="min-w-[160px]">
          <p className="text-sm font-medium text-foreground leading-snug">
            {row.original.nama}
          </p>
        </div>
      ),
    },
    {
      id: "kategori",
      accessorKey: "kategori",
      header: "Kategori",
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-[10px] font-normal whitespace-nowrap">
          {row.original.kategori?.nama ?? "-"}
        </Badge>
      ),
    },
    {
      id: "satuan",
      accessorKey: "satuan",
      header: "Satuan",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.satuan?.nama ?? "-"}</span>
      ),
    },
    {
      id: "hargaBeli",
      accessorKey: "hargaBeli",
      header: "Harga Beli",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-foreground">
          {formatRupiah(parseFloat(row.original.hargaBeli) || 0)}
        </span>
      ),
    },
    {
      id: "stok",
      header: "Stok Min",
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-muted-foreground">
          {row.original.stokMinimal.toLocaleString("id-ID")}
        </span>
      ),
    },
    {
      id: "lokasiDefaultNama",
      header: "Lokasi Default",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.lokasiDefaultId ?? "-"}
        </span>
      ),
    },
    {
      id: "isActive",
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => <StatusBadge isActive={row.original.isActive} />,
    },
    {
      id: "aksi",
      header: "Aksi",
      size: 48,
      cell: ({ row }) => {
        const obat = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Aksi">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onEdit(obat)}>
                <PenLine className="h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onToggleStatus(obat)}
                variant={obat.isActive ? "destructive" : undefined}
              >
                {obat.isActive ? (
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

//  Page

export default function ObatPage() {
  const [search, setSearch] = useState("");
  const [filterKategori, setFilterKategori] = useState("semua");
  const [filterStatus, setFilterStatus] = useState("semua");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingObat, setEditingObat] = useState<Obat | undefined>(undefined);

  const deferredSearch = useDeferredValue(search);

  const { data: obatResponse, isLoading, isError } = useObatList({
    search: deferredSearch || undefined,
    kategoriId: filterKategori !== "semua" ? filterKategori : undefined,
    isActive:
      filterStatus === "aktif"
        ? true
        : filterStatus === "tidak-aktif"
          ? false
          : undefined,
    limit: 100,
  });

  const { data: statsData } = useObatStats();
  const { mutateAsync: createObat } = useCreateObat();
  const { mutateAsync: updateObat } = useUpdateObat();
  const { mutate: toggleActive } = useToggleObatActive();

  const obatList = obatResponse?.data ?? [];

  //  Handlers
  function handleEdit(item: ObatItem) {
    const obat: Obat = {
      id: item.id,
      kode: item.kode,
      nama: item.nama,
      kategoriId: item.kategoriId,
      kategoriNama: item.kategori.nama,
      satuanId: item.satuanId,
      satuanNama: item.satuan.nama,
      hargaBeli: parseFloat(item.hargaBeli) || 0,
      lokasiDefaultId: item.lokasiDefaultId ?? undefined,
      stokMinimal: item.stokMinimal,
      isActive: item.isActive,
      stokSaat: item.stokSaat,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
    setEditingObat(obat);
    setDialogOpen(true);
  }

  function handleAdd() {
    setEditingObat(undefined);
    setDialogOpen(true);
  }

  function handleToggleStatus(item: ObatItem) {
    toggleActive({ id: item.id, isActive: !item.isActive });
  }

  async function handleSave(values: ObatFormValues, editingId?: string) {
    const dto: CreateObatDto = {
      nama: values.nama,
      kategoriId: values.kategoriId,
      satuanId: values.satuanId,
      hargaBeli: values.hargaBeli,
      stokMinimal: values.stokMinimal,
      lokasiDefaultId: values.lokasiDefaultId,
    };
    if (editingId) {
      await updateObat({ id: editingId, payload: dto });
    } else {
      await createObat(dto);
    }
  }

  const columns = useMemo(
    () => buildColumns(handleEdit, handleToggleStatus),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className="flex flex-col gap-6">
      {/*  Header  */}
      <PageHeader
        title="Katalog Obat"
        description="Kelola data master obat, threshold stok, dan lokasi penyimpanan"
        actions={
          <Button onClick={handleAdd} size="action">
            <PlusCircle className="h-4 w-4" />
            Tambah Obat
          </Button>
        }
      />

      {/*  Stats row  */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard
          title="Total Obat"
          value={statsData?.total ?? obatList.length}
          icon={Package}
          variant="default"
          subtitle={`${KATEGORI_OBAT.length} kategori`}
        />
        <StatsCard
          title="Stok Aman"
          value={statsData?.aman ?? 0}
          icon={PackageCheck}
          variant="success"
          subtitle="Di atas batas minimal"
        />
        <StatsCard
          title="Stok Kritis"
          value={statsData?.kritis ?? 0}
          icon={PackageX}
          variant={(statsData?.kritis ?? 0) > 0 ? "warning" : "default"}
          subtitle="Perlu segera diisi"
        />
      </div>

      {/*  Filter bar  */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Cari nama atau ID obat"
            placeholder="Cari nama atau ID obat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        <Select value={filterKategori} onValueChange={setFilterKategori}>
          <SelectTrigger aria-label="Filter kategori" className="w-[180px]">
            <SelectValue placeholder="Semua Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Kategori</SelectItem>
            {KATEGORI_OBAT.map((k) => (
              <SelectItem key={k.id} value={k.id}>
                {k.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger aria-label="Filter status" className="w-[150px]">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Status</SelectItem>
            <SelectItem value="aktif">Aktif</SelectItem>
            <SelectItem value="tidak-aktif">Tidak Aktif</SelectItem>
          </SelectContent>
        </Select>

        {(search || filterKategori !== "semua" || filterStatus !== "semua") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setFilterKategori("semua");
              setFilterStatus("semua");
            }}
            className="text-muted-foreground"
          >
            Reset filter
          </Button>
        )}
      </div>

      {/*  Table  */}
      {isError ? (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Gagal memuat data obat. Periksa koneksi dan coba lagi.
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Memuat data...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={obatList}
          pageSize={10}
          searchPlaceholder="Cari..."
        />
      )}

      {/*  Form Dialog  */}
      <ObatFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingObat={editingObat}
        existingObat={obatList as unknown as Obat[]}
        onSave={handleSave}
      />
    </div>
  );
}
