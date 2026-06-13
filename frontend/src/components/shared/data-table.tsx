"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  Search,
  PackageOpen,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const SKELETON_ROWS = 5;

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  isLoading?: boolean;
  searchKey?: string;
  searchPlaceholder?: string;
  pagination?: boolean;
  pageSize?: number;
  onRowClick?: (row: TData) => void;
  toolbar?: React.ReactNode;
  className?: string;
  getRowClassName?: (row: TData) => string;
}

export function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  searchKey,
  searchPlaceholder = "Cari...",
  pagination = true,
  pageSize = 10,
  onRowClick,
  toolbar,
  className,
  getRowClassName,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize },
    },
  });

  const rows = table.getRowModel().rows;
  const totalFiltered = table.getFilteredRowModel().rows.length;
  const pageStart = table.getState().pagination.pageIndex * table.getState().pagination.pageSize;
  const showingCount = Math.min(rows.length, totalFiltered - pageStart);

  const searchValue =
    searchKey ? (table.getColumn(searchKey)?.getFilterValue() as string) ?? "" : "";

  function handleSearch(value: string) {
    if (searchKey) {
      table.getColumn(searchKey)?.setFilterValue(value);
    }
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Toolbar row */}
      {(searchKey || toolbar) && (
        <div className="flex items-center justify-between gap-3">
          {searchKey ? (
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                aria-label={searchPlaceholder}
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          ) : (
            <div />
          )}
          {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                    aria-sort={
                      header.column.getCanSort()
                        ? header.column.getIsSorted() === "asc"
                          ? "ascending"
                          : header.column.getIsSorted() === "desc"
                            ? "descending"
                            : "none"
                        : undefined
                    }
                  >
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
            {isLoading ? (
              Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length}>
                  <EmptyTableState />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  onKeyDown={onRowClick ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onRowClick(row.original);
                    }
                  } : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  role={onRowClick ? "button" : undefined}
                  className={cn(onRowClick && "cursor-pointer", getRowClassName?.(row.original))}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer: count + pagination */}
      {!isLoading && (
        <div className="flex items-center justify-between gap-4 text-base text-muted-foreground">
          <span>
            Menampilkan{" "}
            <span className="font-medium text-foreground">{showingCount}</span>{" "}
            dari{" "}
            <span className="font-medium text-foreground">{totalFiltered}</span>{" "}
            data
          </span>

          {pagination && (
            <Pagination table={table} />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sort icon ────────────────────────────────────────────────────────────────

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc") return <ChevronUp className="h-3.5 w-3.5 text-foreground" />;
  if (sorted === "desc") return <ChevronDown className="h-3.5 w-3.5 text-foreground" />;
  return <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" />;
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyTableState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
      <PackageOpen className="h-10 w-10 opacity-40" aria-hidden="true" />
      <p className="text-base">Tidak ada data</p>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination<TData>({
  table,
}: {
  table: ReturnType<typeof useReactTable<TData>>;
}) {
  const { pageIndex } = table.getState().pagination;
  const pageCount = table.getPageCount();

  return (
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

      <span className="px-2 text-sm tabular-nums">
        {pageIndex + 1} / {Math.max(1, pageCount)}
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
  );
}
