import { mockDelay, paginate, type PaginatedResponse } from "@/lib/api-client";

export type StokMasukSumber = "GR" | "PEMBELIAN_REGULAR" | "DONASI" | "HIBAH" | "KOREKSI";

export interface StokMasukItem {
  id: string;
  obatId: string;
  namaObat: string;
  kategoriNama?: string;
  satuanNama?: string;
  batchNumber: string;
  tglProduksi?: string;
  expiredDate: string;
  qty: number;
  lokasiId: string;
  lokasiNama?: string;
  supplierId?: string;
  supplierNama?: string;
  sumber: StokMasukSumber;
  referenceId?: string;
  keterangan?: string;
  createdAt: string;
  createdBy: string;
}

export interface StokMasukStats {
  total: number;
  fromGR: number;
  manual: number;
}

export interface StokMasukItemDto {
  obatId: string;
  qty: number;
  hargaBeli?: number;
  expiredDate: string;
  tglProduksi?: string;
  batchNumber: string;
  lokasiId: string;
}

export interface StokMasukDto {
  supplierId?: string;
  tanggalMasuk: string;
  sumber: StokMasukSumber;
  catatan?: string;
  items: StokMasukItemDto[];
}

export interface StokMasukParams {
  page?: number;
  limit?: number;
  search?: string;
  sumber?: string;
  startDate?: string;
  endDate?: string;
}

export const SUMBER_LABEL: Record<StokMasukSumber, string> = {
  GR: "Dari GR",
  PEMBELIAN_REGULAR: "Pembelian Regular",
  DONASI: "Donasi",
  HIBAH: "Hibah",
  KOREKSI: "Koreksi",
};

export const SUMBER_MANUAL_OPTIONS = [
  { value: "PEMBELIAN_REGULAR" as const, label: "Pembelian Regular" },
  { value: "DONASI" as const, label: "Donasi" },
  { value: "HIBAH" as const, label: "Hibah" },
  { value: "KOREKSI" as const, label: "Koreksi" },
] as const;

// ─── Mock data ────────────────────────────────────────────────────────────────

let mockStokMasuk: StokMasukItem[] = [
  {
    id: "sm-001",
    obatId: "obat-002",
    namaObat: "Amoxicillin 500mg",
    kategoriNama: "Antibiotik",
    satuanNama: "Kapsul",
    batchNumber: "B2024-002",
    tglProduksi: "2024-02-01",
    expiredDate: "2026-02-01",
    qty: 120,
    lokasiId: "lok-001",
    lokasiNama: "Rak A1",
    supplierId: "sup-001",
    supplierNama: "PT. Kimia Farma",
    sumber: "GR",
    referenceId: "gr-001",
    keterangan: "Penerimaan GR-2024-001",
    createdAt: "2024-02-15T09:00:00.000Z",
    createdBy: "Apoteker Utama",
  },
  {
    id: "sm-002",
    obatId: "obat-004",
    namaObat: "Metformin 500mg",
    kategoriNama: "Antidiabetik",
    satuanNama: "Tablet",
    batchNumber: "B2024-005",
    tglProduksi: "2024-04-01",
    expiredDate: "2026-04-01",
    qty: 200,
    lokasiId: "lok-002",
    lokasiNama: "Rak A2",
    supplierId: "sup-002",
    supplierNama: "PT. Kalbe Farma",
    sumber: "PEMBELIAN_REGULAR",
    keterangan: "Pembelian reguler bulan April",
    createdAt: "2024-04-10T10:00:00.000Z",
    createdBy: "Apoteker Utama",
  },
  {
    id: "sm-003",
    obatId: "obat-008",
    namaObat: "Vitamin C 500mg",
    kategoriNama: "Suplemen",
    satuanNama: "Tablet",
    batchNumber: "B2024-007",
    tglProduksi: "2024-01-01",
    expiredDate: "2027-01-01",
    qty: 500,
    lokasiId: "lok-004",
    lokasiNama: "Rak B2",
    sumber: "DONASI",
    keterangan: "Donasi dari Pemerintah Daerah",
    createdAt: "2024-05-01T08:00:00.000Z",
    createdBy: "Admin Apotek",
  },
  {
    id: "sm-004",
    obatId: "obat-001",
    namaObat: "Paracetamol 500mg",
    kategoriNama: "Analgesik",
    satuanNama: "Tablet",
    batchNumber: "B2024-001",
    tglProduksi: "2024-01-10",
    expiredDate: "2026-01-10",
    qty: 500,
    lokasiId: "lok-001",
    lokasiNama: "Rak A1",
    supplierId: "sup-001",
    supplierNama: "PT. Kimia Farma",
    sumber: "GR",
    referenceId: "gr-002",
    keterangan: "Penerimaan GR-2024-002",
    createdAt: "2024-01-20T09:00:00.000Z",
    createdBy: "Apoteker Utama",
  },
  {
    id: "sm-005",
    obatId: "obat-009",
    namaObat: "Captopril 25mg",
    kategoriNama: "Antihipertensi",
    satuanNama: "Tablet",
    batchNumber: "B2024-008",
    tglProduksi: "2024-05-01",
    expiredDate: "2026-05-01",
    qty: 60,
    lokasiId: "lok-001",
    lokasiNama: "Rak A1",
    sumber: "KOREKSI",
    keterangan: "Koreksi stok opname bulan Mei",
    createdAt: "2024-05-31T14:00:00.000Z",
    createdBy: "Admin Apotek",
  },
];

let nextSmId = 6;

// ─── Service ──────────────────────────────────────────────────────────────────

export const stokMasukService = {
  getAll: async (params?: StokMasukParams): Promise<PaginatedResponse<StokMasukItem>> => {
    await mockDelay();
    let items = [...mockStokMasuk];
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter((s) => s.namaObat.toLowerCase().includes(q) || s.batchNumber.toLowerCase().includes(q));
    }
    if (params?.sumber) items = items.filter((s) => s.sumber === params.sumber);
    if (params?.startDate) items = items.filter((s) => s.createdAt >= params.startDate!);
    if (params?.endDate) items = items.filter((s) => s.createdAt <= params.endDate! + "T23:59:59");
    return paginate(items, params?.page, params?.limit);
  },

  getById: async (id: string): Promise<StokMasukItem> => {
    await mockDelay();
    const item = mockStokMasuk.find((s) => s.id === id);
    if (!item) throw new Error("Data stok masuk tidak ditemukan.");
    return { ...item };
  },

  getStats: async (): Promise<StokMasukStats> => {
    await mockDelay();
    return {
      total: mockStokMasuk.length,
      fromGR: mockStokMasuk.filter((s) => s.sumber === "GR").length,
      manual: mockStokMasuk.filter((s) => s.sumber !== "GR").length,
    };
  },

  create: async (payload: StokMasukDto): Promise<StokMasukItem> => {
    await mockDelay();
    const firstItem = payload.items[0];
    const id = `sm-${String(nextSmId++).padStart(3, "0")}`;
    const now = new Date().toISOString();
    const item: StokMasukItem = {
      id,
      obatId: firstItem.obatId,
      namaObat: `Obat #${firstItem.obatId}`,
      batchNumber: firstItem.batchNumber,
      tglProduksi: firstItem.tglProduksi,
      expiredDate: firstItem.expiredDate,
      qty: firstItem.qty,
      lokasiId: firstItem.lokasiId,
      sumber: payload.sumber,
      keterangan: payload.catatan,
      createdAt: now,
      createdBy: "Pengguna",
    };
    mockStokMasuk.unshift(item);
    return { ...item };
  },
};
