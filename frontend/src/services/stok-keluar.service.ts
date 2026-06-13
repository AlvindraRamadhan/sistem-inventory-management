import { mockDelay, paginate, type PaginatedResponse } from "@/lib/api-client";

export interface StokKeluarItem {
  id: string;
  obatId: string;
  namaObat: string;
  batchNumber: string;
  expiredDate: string;
  qty: number;
  lokasiId: string;
  lokasiNama?: string;
  alasan: string;
  referenceId?: string;
  referenceType: "RESEP" | "MANUAL";
  createdAt: string;
  createdBy: string;
}

export interface StokKeluarStats {
  todayCount: number;
  todayQty: number;
  todayNilai: number;
}

export interface StokKeluarItemDto {
  obatId: string;
  qty: number;
  batchId?: string;
  lokasiId?: string;
}

export interface StokKeluarDto {
  tanggalKeluar: string;
  tujuan?: string;
  referenceId?: string;
  referenceType?: "RESEP" | "MANUAL";
  catatan?: string;
  items: StokKeluarItemDto[];
}

export interface StokKeluarParams {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

let mockStokKeluar: StokKeluarItem[] = [
  {
    id: "sk-001",
    obatId: "obat-001",
    namaObat: "Paracetamol 500mg",
    batchNumber: "B2024-001",
    expiredDate: "2026-01-10",
    qty: 50,
    lokasiId: "lok-001",
    lokasiNama: "Rak A1",
    alasan: "Pengeluaran untuk pasien rawat jalan",
    referenceId: "RES-2024-001",
    referenceType: "RESEP",
    createdAt: "2024-06-01T08:30:00.000Z",
    createdBy: "Apoteker Utama",
  },
  {
    id: "sk-002",
    obatId: "obat-002",
    namaObat: "Amoxicillin 500mg",
    batchNumber: "B2024-002",
    expiredDate: "2026-02-01",
    qty: 21,
    lokasiId: "lok-001",
    lokasiNama: "Rak A1",
    alasan: "Pengeluaran untuk pasien rawat inap",
    referenceId: "RES-2024-002",
    referenceType: "RESEP",
    createdAt: "2024-06-01T09:00:00.000Z",
    createdBy: "Apoteker Utama",
  },
  {
    id: "sk-003",
    obatId: "obat-006",
    namaObat: "Cetirizine 10mg",
    batchNumber: "B2024-006",
    expiredDate: "2026-06-01",
    qty: 15,
    lokasiId: "lok-003",
    lokasiNama: "Rak B1",
    alasan: "Dispensing resep dokter",
    referenceType: "RESEP",
    createdAt: "2024-06-01T10:00:00.000Z",
    createdBy: "Apoteker Utama",
  },
  {
    id: "sk-004",
    obatId: "obat-004",
    namaObat: "Metformin 500mg",
    batchNumber: "B2024-005",
    expiredDate: "2026-04-01",
    qty: 30,
    lokasiId: "lok-002",
    lokasiNama: "Rak A2",
    alasan: "Penggunaan poli diabetes",
    referenceType: "MANUAL",
    createdAt: "2024-05-31T14:00:00.000Z",
    createdBy: "Apoteker Utama",
  },
  {
    id: "sk-005",
    obatId: "obat-009",
    namaObat: "Captopril 25mg",
    batchNumber: "B2024-008",
    expiredDate: "2026-05-01",
    qty: 10,
    lokasiId: "lok-001",
    lokasiNama: "Rak A1",
    alasan: "Dispensing resep poli jantung",
    referenceId: "RES-2024-003",
    referenceType: "RESEP",
    createdAt: "2024-05-30T11:00:00.000Z",
    createdBy: "Apoteker Utama",
  },
  {
    id: "sk-006",
    obatId: "obat-008",
    namaObat: "Vitamin C 500mg",
    batchNumber: "B2024-007",
    expiredDate: "2027-01-01",
    qty: 50,
    lokasiId: "lok-004",
    lokasiNama: "Rak B2",
    alasan: "Distribusi suplemen pasien",
    referenceType: "MANUAL",
    createdAt: "2024-05-29T09:00:00.000Z",
    createdBy: "Apoteker Utama",
  },
];

let nextSkId = 7;

// ─── Service ──────────────────────────────────────────────────────────────────

export const stokKeluarService = {
  getAll: async (params?: StokKeluarParams): Promise<PaginatedResponse<StokKeluarItem>> => {
    await mockDelay();
    let items = [...mockStokKeluar];
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter((s) => s.namaObat.toLowerCase().includes(q) || s.batchNumber.toLowerCase().includes(q));
    }
    if (params?.startDate) items = items.filter((s) => s.createdAt >= params.startDate!);
    if (params?.endDate) items = items.filter((s) => s.createdAt <= params.endDate! + "T23:59:59");
    return paginate(items, params?.page, params?.limit);
  },

  getById: async (id: string): Promise<StokKeluarItem> => {
    await mockDelay();
    const item = mockStokKeluar.find((s) => s.id === id);
    if (!item) throw new Error("Data stok keluar tidak ditemukan.");
    return { ...item };
  },

  getStats: async (): Promise<StokKeluarStats> => {
    await mockDelay();
    const today = new Date().toISOString().slice(0, 10);
    const todayItems = mockStokKeluar.filter((s) => s.createdAt.startsWith(today));
    return {
      todayCount: todayItems.length,
      todayQty: todayItems.reduce((acc, s) => acc + s.qty, 0),
      todayNilai: todayItems.reduce((acc, s) => acc + s.qty * 2500, 0),
    };
  },

  getPareto: async () => {
    await mockDelay();
    return {
      items: [
        { obatId: "obat-001", namaObat: "Paracetamol 500mg", totalQty: 950, nilaiTotal: 1900000, persentase: 38, kumulatif: 38, abc: "A" },
        { obatId: "obat-002", namaObat: "Amoxicillin 500mg", totalQty: 630, nilaiTotal: 2835000, persentase: 25, kumulatif: 63, abc: "A" },
        { obatId: "obat-006", namaObat: "Cetirizine 10mg", totalQty: 380, nilaiTotal: 950000, persentase: 15, kumulatif: 78, abc: "B" },
        { obatId: "obat-004", namaObat: "Metformin 500mg", totalQty: 250, nilaiTotal: 875000, persentase: 10, kumulatif: 88, abc: "B" },
        { obatId: "obat-008", namaObat: "Vitamin C 500mg", totalQty: 180, nilaiTotal: 216000, persentase: 7, kumulatif: 95, abc: "C" },
        { obatId: "obat-009", namaObat: "Captopril 25mg", totalQty: 120, nilaiTotal: 600000, persentase: 5, kumulatif: 100, abc: "C" },
      ],
    };
  },

  create: async (payload: StokKeluarDto): Promise<StokKeluarItem[]> => {
    await mockDelay();
    const now = new Date().toISOString();
    const created = payload.items.map((it, i) => {
      const id = `sk-${String(nextSkId++ + i).padStart(3, "0")}`;
      const item: StokKeluarItem = {
        id,
        obatId: it.obatId,
        namaObat: `Obat #${it.obatId}`,
        batchNumber: it.batchId ?? "-",
        expiredDate: "-",
        qty: it.qty,
        lokasiId: it.lokasiId ?? "",
        alasan: payload.catatan ?? "Pengeluaran stok",
        referenceId: payload.referenceId,
        referenceType: payload.referenceType ?? "MANUAL",
        createdAt: now,
        createdBy: "Pengguna",
      };
      mockStokKeluar.unshift(item);
      return item;
    });
    return created;
  },
};
