"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  CalendarIcon,
  CheckCircle2,
  ChevronsUpDown,
  Clock,
  Eye,
  FilePen,
  Info,
  Pill,
  RotateCcw,
  Search,
  UserRound,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────────

type ResepStatus = "menunggu" | "diproses" | "selesai" | "ditolak";

type FilterStatus =
  | "semua"
  | "pending_fulfillment"
  | "diproses"
  | "selesai"
  | "stok_tidak_cukup";

interface ResepItem {
  obatId: string;
  namaObat: string;
  qty: number;
  satuan: string;
  stokTersedia: number;
  kategori: string;
  substitusiNamaObat?: string;
}

interface Resep {
  id: string;
  noResep: string;
  dokter: { id: string; nama: string; poli: string };
  pasien: { nama: string; usia: number };
  timestamp: string;
  status: ResepStatus;
  items: ResepItem[];
  catatanTolak?: string;
  diprosesPada?: string;
  selesaiPada?: string;
}

// ─── Mock data ─────────────────────────────────────────────────────────────────

const t = Date.now();
const mins = (n: number) => new Date(t - n * 60_000).toISOString();
const hrs  = (n: number) => new Date(t - n * 3_600_000).toISOString();

const MOCK_DOKTER = [
  { id: "DOK-001", nama: "Dr. Budi Santoso",  poli: "Poli Umum"    },
  { id: "DOK-002", nama: "Dr. Sari Dewi",      poli: "Poli Anak"    },
  { id: "DOK-003", nama: "Dr. Hendra Wijaya",  poli: "Poli Jantung" },
];

const INITIAL_RESEP: Resep[] = [
  // ── Menunggu ─────────────────────────────────────────────────────────────────
  {
    id: "RES-2025-001",
    noResep: "RES/2025/001",
    dokter: MOCK_DOKTER[0],
    pasien: { nama: "Suharto", usia: 52 },
    timestamp: mins(14),
    status: "menunggu",
    items: [
      { obatId: "OBT-001", namaObat: "Amoxicillin 500mg", qty: 10, satuan: "Kapsul", stokTersedia: 350, kategori: "Antibiotik" },
      { obatId: "OBT-005", namaObat: "Vitamin C 1000mg",  qty: 10, satuan: "Tablet", stokTersedia: 5,   kategori: "Vitamin & Suplemen" },
    ],
  },
  {
    id: "RES-2025-002",
    noResep: "RES/2025/002",
    dokter: MOCK_DOKTER[1],
    pasien: { nama: "Margaretha Susanti", usia: 45 },
    timestamp: mins(28),
    status: "menunggu",
    items: [
      { obatId: "OBT-002", namaObat: "Paracetamol 500mg", qty: 12, satuan: "Tablet", stokTersedia: 220, kategori: "Analgesik"         },
      { obatId: "OBT-007", namaObat: "Cetirizine 10mg",   qty: 7,  satuan: "Tablet", stokTersedia: 95,  kategori: "Antihistamin"       },
      { obatId: "OBT-004", namaObat: "Vitamin B Complex", qty: 14, satuan: "Tablet", stokTersedia: 2,   kategori: "Vitamin & Suplemen" },
    ],
  },
  {
    id: "RES-2025-003",
    noResep: "RES/2025/003",
    dokter: MOCK_DOKTER[2],
    pasien: { nama: "Rudi Hartono", usia: 60 },
    timestamp: mins(45),
    status: "menunggu",
    items: [
      { obatId: "OBT-011", namaObat: "Amlodipine 5mg",  qty: 30, satuan: "Tablet", stokTersedia: 180, kategori: "Antihipertensi" },
      { obatId: "OBT-006", namaObat: "Omeprazole 20mg", qty: 14, satuan: "Kapsul", stokTersedia: 55,  kategori: "Obat Lambung"   },
    ],
  },
  {
    id: "RES-2025-004",
    noResep: "RES/2025/004",
    dokter: MOCK_DOKTER[0],
    pasien: { nama: "Dewi Rahayu", usia: 38 },
    timestamp: hrs(1),
    status: "menunggu",
    items: [
      { obatId: "OBT-004M", namaObat: "Metformin 500mg", qty: 30, satuan: "Tablet", stokTersedia: 200, kategori: "Antidiabetes"   },
      { obatId: "OBT-011L", namaObat: "Lisinopril 10mg", qty: 30, satuan: "Tablet", stokTersedia: 90,  kategori: "Antihipertensi" },
    ],
  },
  {
    id: "RES-2025-005",
    noResep: "RES/2025/005",
    dokter: MOCK_DOKTER[1],
    pasien: { nama: "Agus Setiawan", usia: 29 },
    timestamp: hrs(2),
    status: "menunggu",
    items: [
      { obatId: "OBT-003", namaObat: "Ciprofloxacin 500mg", qty: 10, satuan: "Tablet", stokTersedia: 30, kategori: "Antibiotik" },
      { obatId: "OBT-009", namaObat: "Dexamethasone 0.5mg", qty: 20, satuan: "Tablet", stokTersedia: 0,  kategori: "Analgesik"  },
    ],
  },
  // ── Diproses ─────────────────────────────────────────────────────────────────
  {
    id: "RES-2025-006",
    noResep: "RES/2025/006",
    dokter: MOCK_DOKTER[2],
    pasien: { nama: "Bambang Sudarsono", usia: 55 },
    timestamp: hrs(3),
    status: "diproses",
    diprosesPada: hrs(2.5),
    items: [
      { obatId: "OBT-002B", namaObat: "Paracetamol 500mg", qty: 10, satuan: "Tablet", stokTersedia: 210, kategori: "Analgesik" },
    ],
  },
  // ── Selesai ──────────────────────────────────────────────────────────────────
  {
    id: "RES-2025-007",
    noResep: "RES/2025/007",
    dokter: MOCK_DOKTER[0],
    pasien: { nama: "Sri Mulyani", usia: 48 },
    timestamp: hrs(5),
    status: "selesai",
    diprosesPada: hrs(4.5),
    selesaiPada: hrs(4),
    items: [
      { obatId: "OBT-001B", namaObat: "Amoxicillin 500mg", qty: 15, satuan: "Kapsul", stokTersedia: 335, kategori: "Antibiotik" },
    ],
  },
  // ── Ditolak ──────────────────────────────────────────────────────────────────
  {
    id: "RES-2025-008",
    noResep: "RES/2025/008",
    dokter: MOCK_DOKTER[1],
    pasien: { nama: "Fitri Cahya", usia: 22 },
    timestamp: hrs(6),
    status: "ditolak",
    catatanTolak: "Obat tidak tersedia dan tidak ada substitusi yang sesuai",
    items: [
      { obatId: "OBT-008C", namaObat: "Ceftriaxone 1g Injeksi", qty: 3, satuan: "Vial", stokTersedia: 0, kategori: "Antibiotik" },
    ],
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return "Baru saja";
  if (diff < 3600)  return `${Math.floor(diff / 60)} menit lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
  return `${Math.floor(diff / 86400)} hari lalu`;
}

function hasInsufficientStock(resep: Resep): boolean {
  return resep.items.some((item) => item.stokTersedia < item.qty);
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ResepStatus }) {
  const meta: Record<ResepStatus, { label: string; cls: string }> = {
    menunggu: { label: "MENUNGGU", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"     },
    diproses: { label: "DIPROSES", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"         },
    selesai:  { label: "SELESAI",  cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
    ditolak:  { label: "DITOLAK",  cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"         },
  };
  const m = meta[status];
  return (
    <Badge className={cn("border-0 text-xs font-semibold tracking-wide", m.cls)}>
      {m.label}
    </Badge>
  );
}

// ─── EmptyResep ────────────────────────────────────────────────────────────────

function EmptyResep({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <FilePen className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  );
}

// ─── ResepCardReadOnly ─────────────────────────────────────────────────────────

function ResepCardReadOnly({ resep }: { resep: Resep }) {
  return (
    <Card
      className={cn(
        "transition-shadow hover:shadow-sm",
        resep.status === "ditolak"  && "border-l-[3px] border-l-destructive",
        resep.status === "selesai"  && "border-l-[3px] border-l-emerald-500",
        resep.status === "diproses" && "border-l-[3px] border-l-amber-500",
        resep.status === "menunggu" && "border-l-[3px] border-l-blue-500",
      )}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={resep.status} />
              <span className="font-mono text-xs text-muted-foreground">
                #{resep.noResep}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <UserRound className="h-3 w-3" />
                {resep.dokter.nama}
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {resep.dokter.poli}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {relativeTime(resep.timestamp)}
              </span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground shrink-0 text-right">
            <span>Pasien: </span>
            <span className="font-medium text-foreground">{resep.pasien.nama}</span>
            <span>, {resep.pasien.usia} th</span>
          </div>
        </div>

        {/* Item list */}
        <div className="bg-muted/40 rounded-lg divide-y divide-border overflow-hidden">
          {resep.items.map((item) => {
            const ok = item.stokTersedia >= item.qty;
            return (
              <div key={item.obatId} className="flex items-center justify-between px-3 py-2.5">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <Pill className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="text-sm font-medium">{item.namaObat}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      × {item.qty} {item.satuan}
                    </span>
                    {item.substitusiNamaObat && (
                      <p className="text-[11px] text-violet-600 dark:text-violet-400 mt-0.5">
                        → Substitusi: {item.substitusiNamaObat}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {ok ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-xs text-emerald-600 font-medium">Tersedia</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                      <span className="text-xs text-destructive font-medium">
                        Stok kurang ({item.stokTersedia} tersisa)
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Rejection note */}
        {resep.catatanTolak && (
          <div className="flex items-start gap-2 rounded-md bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800 px-3 py-2">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-600 dark:text-rose-400">{resep.catatanTolak}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function EPrescribingPage() {
  const [filterStatus, setFilterStatus]       = useState<FilterStatus>("semua");
  const [search, setSearch]                   = useState("");
  const [filterDokter, setFilterDokter]       = useState("semua");
  const [filterTanggal, setFilterTanggal]     = useState("");
  const [dokterPopupOpen, setDokterPopupOpen] = useState(false);

  // Sidebar counts (always from full dataset)
  const menungguCount   = INITIAL_RESEP.filter((r) => r.status === "menunggu").length;
  const diprosesCount   = INITIAL_RESEP.filter((r) => r.status === "diproses").length;
  const selesaiCount    = INITIAL_RESEP.filter((r) => r.status === "selesai" || r.status === "ditolak").length;
  const stokKurangCount = INITIAL_RESEP.filter((r) => r.status === "menunggu" && hasInsufficientStock(r)).length;

  const STATUS_FILTERS: { value: FilterStatus; label: string; dot: string; count: number }[] = [
    { value: "semua",              label: "Semua",            dot: "bg-muted-foreground", count: INITIAL_RESEP.length },
    { value: "pending_fulfillment",label: "Menunggu",         dot: "bg-blue-500",         count: menungguCount        },
    { value: "diproses",           label: "Diproses",         dot: "bg-amber-500",        count: diprosesCount        },
    { value: "selesai",            label: "Selesai",          dot: "bg-emerald-500",      count: selesaiCount         },
    { value: "stok_tidak_cukup",   label: "Stok Tidak Cukup",dot: "bg-destructive",      count: stokKurangCount      },
  ];

  const filteredResep = useMemo(() => {
    const q = search.toLowerCase();
    return INITIAL_RESEP.filter((r) => {
      let matchStatus = true;
      if      (filterStatus === "pending_fulfillment") matchStatus = r.status === "menunggu";
      else if (filterStatus === "diproses")            matchStatus = r.status === "diproses";
      else if (filterStatus === "selesai")             matchStatus = r.status === "selesai" || r.status === "ditolak";
      else if (filterStatus === "stok_tidak_cukup")    matchStatus = r.status === "menunggu" && hasInsufficientStock(r);

      const matchSearch  = !search || r.noResep.toLowerCase().includes(q) || r.pasien.nama.toLowerCase().includes(q) || r.dokter.nama.toLowerCase().includes(q);
      const matchDokter  = filterDokter === "semua" || r.dokter.id === filterDokter;
      const matchTanggal = !filterTanggal || r.timestamp.startsWith(filterTanggal);

      return matchStatus && matchSearch && matchDokter && matchTanggal;
    });
  }, [filterStatus, search, filterDokter, filterTanggal]);

  const hasSecondaryFilter = Boolean(search || filterDokter !== "semua" || filterTanggal);

  const handleReset = () => {
    setSearch("");
    setFilterDokter("semua");
    setFilterTanggal("");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">E-Prescribing</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Data resep digital dari dokter — hanya untuk referensi
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg border">
          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Hanya Baca</span>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-3 dark:bg-blue-950/30 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Halaman ini menampilkan data resep digital yang dikirimkan oleh dokter.
          Penyiapan obat dilakukan secara otomatis oleh sistem saat dokter mengirimkan resep.
          Apoteker tidak perlu melakukan konfirmasi manual.
        </p>
      </div>

      {/* 2-column layout */}
      <div className="flex gap-6">
        {/* ── Sidebar kiri ── */}
        <aside className="w-[220px] flex-shrink-0">
          <div className="bg-card border rounded-xl p-4 sticky top-6 space-y-5">

            {/* Status filter */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Status Resep
              </p>
              <nav className="space-y-0.5" aria-label="Filter status resep">
                {STATUS_FILTERS.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setFilterStatus(item.value)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                      filterStatus === item.value
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full flex-shrink-0", item.dot)} />
                      <span>{item.label}</span>
                    </div>
                    <span
                      className={cn(
                        "text-xs px-1.5 py-0.5 rounded-md",
                        filterStatus === item.value
                          ? "bg-primary/20 text-primary font-medium"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {item.count}
                    </span>
                  </button>
                ))}
              </nav>
            </div>

            <Separator />

            {/* Filter Dokter */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Filter Dokter
              </p>
              <Popover open={dokterPopupOpen} onOpenChange={setDokterPopupOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-8 text-xs justify-between font-normal"
                  >
                    <span className={cn(filterDokter === "semua" ? "text-muted-foreground" : "text-foreground")}>
                      {filterDokter === "semua"
                        ? "Semua Dokter"
                        : MOCK_DOKTER.find((d) => d.id === filterDokter)?.nama ?? "Pilih Dokter"}
                    </span>
                    <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[220px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Cari dokter..." />
                    <CommandList>
                      <CommandEmpty>Dokter tidak ditemukan</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="semua"
                          onSelect={() => { setFilterDokter("semua"); setDokterPopupOpen(false); }}
                        >
                          Semua Dokter
                        </CommandItem>
                        {MOCK_DOKTER.map((d) => (
                          <CommandItem
                            key={d.id}
                            value={`${d.nama} ${d.poli}`}
                            onSelect={() => { setFilterDokter(d.id); setDokterPopupOpen(false); }}
                          >
                            <div>
                              <p className="text-sm font-medium">{d.nama}</p>
                              <p className="text-xs text-muted-foreground">{d.poli}</p>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <Separator />

            {/* Filter Tanggal */}
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Tanggal
              </p>
              <div className="relative">
                <CalendarIcon className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  type="date"
                  value={filterTanggal}
                  onChange={(e) => setFilterTanggal(e.target.value)}
                  className="pl-7 h-8 text-xs"
                  aria-label="Filter tanggal"
                />
              </div>
            </div>

            {hasSecondaryFilter && (
              <>
                <Separator />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="w-full text-muted-foreground gap-1.5 h-8 text-xs"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset Filter
                </Button>
              </>
            )}
          </div>
        </aside>

        {/* ── Konten kanan ── */}
        <main className="flex-1 min-w-0 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              aria-label="Cari nomor resep, nama pasien, atau dokter"
              placeholder="Cari nomor resep atau nama pasien..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Hapus pencarian"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Resep cards — read-only */}
          {filteredResep.length === 0 ? (
            <EmptyResep message="Tidak ada resep yang sesuai filter" />
          ) : (
            filteredResep.map((resep) => (
              <ResepCardReadOnly key={resep.id} resep={resep} />
            ))
          )}
        </main>
      </div>
    </div>
  );
}
