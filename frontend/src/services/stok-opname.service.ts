import { mockDelay, paginate, type PaginatedResponse } from "@/lib/api-client";
import { mockBatches } from "@/services/batch.service";

export type OpnameStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface OpnameListItem {
  id: string;
  noOpname: string;
  status: OpnameStatus;
  totalItems: number;
  selisihPlus: number;
  selisihMinus: number;
  tanggalOpname: string;
  catatan?: string;
  catatanPenolakan?: string;
  createdAt: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface OpnameDetailItem {
  batchId: string;
  obatId?: string;
  namaObat: string;
  kategoriNama?: string;
  batchNumber: string;
  expiredDate: string;
  lokasiNama?: string;
  stokSistem: number;
  stokFisik: number;
  hargaBeli: number;
}

export interface OpnameDetail extends OpnameListItem {
  items: OpnameDetailItem[];
}

export interface StokOpnameParams {
  page?: number;
  limit?: number;
  status?: string;
}

export interface UpdateOpnameItemDto {
  batchId: string;
  stokFisik: number;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

let mockOpnameList: OpnameListItem[] = [
  {
    id: "opn-001",
    noOpname: "OPN-2024-001",
    status: "APPROVED",
    totalItems: 6,
    selisihPlus: 2,
    selisihMinus: 1,
    tanggalOpname: "2024-05-01",
    catatan: "Opname bulanan Mei 2024",
    createdAt: "2024-05-01T08:00:00.000Z",
    createdBy: "Apoteker Utama",
    approvedBy: "Admin Apotek",
    approvedAt: "2024-05-02T10:00:00.000Z",
  },
  {
    id: "opn-002",
    noOpname: "OPN-2024-002",
    status: "PENDING",
    totalItems: 8,
    selisihPlus: 0,
    selisihMinus: 3,
    tanggalOpname: "2024-06-01",
    catatan: "Opname bulanan Juni 2024",
    createdAt: "2024-06-01T08:00:00.000Z",
    createdBy: "Apoteker Utama",
  },
  {
    id: "opn-003",
    noOpname: "OPN-2024-003",
    status: "REJECTED",
    totalItems: 4,
    selisihPlus: 1,
    selisihMinus: 2,
    tanggalOpname: "2024-04-01",
    catatan: "Opname bulanan April 2024",
    catatanPenolakan: "Data tidak lengkap, harap isi ulang.",
    createdAt: "2024-04-01T08:00:00.000Z",
    createdBy: "Apoteker Utama",
    approvedBy: "Admin Apotek",
    approvedAt: "2024-04-02T09:00:00.000Z",
  },
];

let mockOpnameDetails: Record<string, OpnameDetailItem[]> = {
  "opn-001": [
    { batchId: "bat-001", obatId: "obat-001", namaObat: "Paracetamol 500mg", batchNumber: "B2024-001", expiredDate: "2026-01-10", lokasiNama: "Rak A1", stokSistem: 5, stokFisik: 7, hargaBeli: 1500 },
    { batchId: "bat-002", obatId: "obat-002", namaObat: "Amoxicillin 500mg", batchNumber: "B2024-002", expiredDate: "2024-07-15", lokasiNama: "Rak A1", stokSistem: 60, stokFisik: 58, hargaBeli: 3000 },
    { batchId: "bat-005", obatId: "obat-004", namaObat: "Metformin 500mg", batchNumber: "B2024-005", expiredDate: "2026-04-01", lokasiNama: "Rak A2", stokSistem: 200, stokFisik: 200, hargaBeli: 2500 },
  ],
  "opn-002": mockBatches.slice(0, 5).map((b) => ({
    batchId: b.id,
    obatId: b.obatId,
    namaObat: b.namaObat ?? "",
    batchNumber: b.batchNumber,
    expiredDate: b.expiredDate,
    lokasiNama: b.lokasiNama,
    stokSistem: b.qty,
    stokFisik: b.qty,
    hargaBeli: b.hargaBeli,
  })),
  "opn-003": [
    { batchId: "bat-006", obatId: "obat-005", namaObat: "Omeprazole 20mg", batchNumber: "B2024-006", expiredDate: "2025-03-15", lokasiNama: "Rak B1", stokSistem: 18, stokFisik: 17, hargaBeli: 4000 },
    { batchId: "bat-007", obatId: "obat-008", namaObat: "Vitamin C 500mg", batchNumber: "B2024-007", expiredDate: "2027-01-01", lokasiNama: "Rak B2", stokSistem: 450, stokFisik: 452, hargaBeli: 800 },
  ],
};

let nextOpnId = 4;

// ─── Service ──────────────────────────────────────────────────────────────────

export const stokOpnameService = {
  getAll: async (params?: StokOpnameParams): Promise<PaginatedResponse<OpnameListItem>> => {
    await mockDelay();
    let items = [...mockOpnameList];
    if (params?.status) items = items.filter((o) => o.status === params.status);
    return paginate(items, params?.page, params?.limit);
  },

  getById: async (id: string): Promise<OpnameDetail> => {
    await mockDelay();
    const item = mockOpnameList.find((o) => o.id === id);
    if (!item) throw new Error("Stok opname tidak ditemukan.");
    return { ...item, items: mockOpnameDetails[id] ?? [] };
  },

  create: async (payload?: { catatan?: string }): Promise<OpnameDetail> => {
    await mockDelay();
    const id = `opn-${String(nextOpnId++).padStart(3, "0")}`;
    const now = new Date().toISOString();
    const noOpname = `OPN-${new Date().getFullYear()}-${String(mockOpnameList.length + 1).padStart(3, "0")}`;
    const items: OpnameDetailItem[] = mockBatches
      .filter((b) => b.status === "AKTIF")
      .map((b) => ({
        batchId: b.id,
        obatId: b.obatId,
        namaObat: b.namaObat ?? "",
        batchNumber: b.batchNumber,
        expiredDate: b.expiredDate,
        lokasiNama: b.lokasiNama,
        stokSistem: b.qty,
        stokFisik: b.qty,
        hargaBeli: b.hargaBeli,
      }));
    const newOpname: OpnameListItem = {
      id,
      noOpname,
      status: "PENDING",
      totalItems: items.length,
      selisihPlus: 0,
      selisihMinus: 0,
      tanggalOpname: now.slice(0, 10),
      catatan: payload?.catatan,
      createdAt: now,
      createdBy: "Pengguna",
    };
    mockOpnameList.unshift(newOpname);
    mockOpnameDetails[id] = items;
    return { ...newOpname, items };
  },

  delete: async (id: string) => {
    await mockDelay();
    mockOpnameList = mockOpnameList.filter((o) => o.id !== id);
    delete mockOpnameDetails[id];
    return { message: "Stok opname berhasil dihapus." };
  },

  updateItem: async (id: string, payload: UpdateOpnameItemDto) => {
    await mockDelay();
    const items = mockOpnameDetails[id];
    if (items) {
      const idx = items.findIndex((i) => i.batchId === payload.batchId);
      if (idx !== -1) items[idx] = { ...items[idx], stokFisik: payload.stokFisik };
    }
    return { message: "Item diperbarui." };
  },

  submit: async (id: string) => {
    await mockDelay();
    const idx = mockOpnameList.findIndex((o) => o.id === id);
    if (idx !== -1) mockOpnameList[idx] = { ...mockOpnameList[idx], status: "PENDING" };
    return mockOpnameList[idx];
  },

  finalize: async (id: string) => {
    await mockDelay();
    const idx = mockOpnameList.findIndex((o) => o.id === id);
    if (idx !== -1) {
      mockOpnameList[idx] = {
        ...mockOpnameList[idx],
        status: "APPROVED",
        approvedBy: "Admin Apotek",
        approvedAt: new Date().toISOString(),
      };
    }
    return mockOpnameList[idx];
  },

  reject: async (id: string, catatanPenolakan: string) => {
    await mockDelay();
    const idx = mockOpnameList.findIndex((o) => o.id === id);
    if (idx !== -1) {
      mockOpnameList[idx] = {
        ...mockOpnameList[idx],
        status: "REJECTED",
        catatanPenolakan,
        approvedBy: "Admin Apotek",
        approvedAt: new Date().toISOString(),
      };
    }
    return mockOpnameList[idx];
  },
};
