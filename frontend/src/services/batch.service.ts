import { mockDelay, paginate, type PaginatedResponse } from "@/lib/api-client";

export interface BatchItem {
  id: string;
  obatId: string;
  namaObat?: string;
  kategoriNama?: string;
  noBatch?: string;
  batchNumber: string;
  tglProduksi?: string;
  expiredDate: string;
  qty: number;
  qtyTersedia: number;
  lokasiId: string;
  lokasiNama?: string;
  hargaBeli: number;
  status: "AKTIF" | "EXPIRED" | "KARANTINA";
  createdAt: string;
}

export interface BatchParams {
  obatId?: string;
  status?: string;
  lokasiId?: string;
  onlyAvailable?: boolean;
  limit?: number;
  page?: number;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

export const mockBatches: BatchItem[] = [
  {
    id: "bat-001",
    obatId: "obat-001",
    namaObat: "Paracetamol 500mg",
    kategoriNama: "Analgesik",
    noBatch: "B2024-001",
    batchNumber: "B2024-001",
    tglProduksi: "2024-01-10",
    expiredDate: "2026-01-10",
    qty: 5,
    qtyTersedia: 5,
    lokasiId: "lok-001",
    lokasiNama: "Rak A1",
    hargaBeli: 1500,
    status: "AKTIF",
    createdAt: "2024-01-15T08:00:00.000Z",
  },
  {
    id: "bat-002",
    obatId: "obat-002",
    namaObat: "Amoxicillin 500mg",
    kategoriNama: "Antibiotik",
    noBatch: "B2024-002",
    batchNumber: "B2024-002",
    tglProduksi: "2024-02-01",
    expiredDate: "2024-07-15",
    qty: 60,
    qtyTersedia: 60,
    lokasiId: "lok-001",
    lokasiNama: "Rak A1",
    hargaBeli: 3000,
    status: "AKTIF",
    createdAt: "2024-02-05T08:00:00.000Z",
  },
  {
    id: "bat-003",
    obatId: "obat-002",
    namaObat: "Amoxicillin 500mg",
    kategoriNama: "Antibiotik",
    noBatch: "B2024-003",
    batchNumber: "B2024-003",
    tglProduksi: "2024-03-01",
    expiredDate: "2026-03-01",
    qty: 60,
    qtyTersedia: 60,
    lokasiId: "lok-001",
    lokasiNama: "Rak A1",
    hargaBeli: 3000,
    status: "AKTIF",
    createdAt: "2024-03-05T08:00:00.000Z",
  },
  {
    id: "bat-004",
    obatId: "obat-003",
    namaObat: "Ibuprofen 400mg",
    kategoriNama: "Analgesik",
    noBatch: "B2023-011",
    batchNumber: "B2023-011",
    tglProduksi: "2023-06-01",
    expiredDate: "2024-03-01",
    qty: 35,
    qtyTersedia: 35,
    lokasiId: "lok-002",
    lokasiNama: "Rak A2",
    hargaBeli: 2000,
    status: "EXPIRED",
    createdAt: "2023-06-10T08:00:00.000Z",
  },
  {
    id: "bat-005",
    obatId: "obat-004",
    namaObat: "Metformin 500mg",
    kategoriNama: "Antidiabetik",
    noBatch: "B2024-005",
    batchNumber: "B2024-005",
    tglProduksi: "2024-04-01",
    expiredDate: "2026-04-01",
    qty: 200,
    qtyTersedia: 200,
    lokasiId: "lok-002",
    lokasiNama: "Rak A2",
    hargaBeli: 2500,
    status: "AKTIF",
    createdAt: "2024-04-05T08:00:00.000Z",
  },
  {
    id: "bat-006",
    obatId: "obat-005",
    namaObat: "Omeprazole 20mg",
    kategoriNama: "Antasida",
    noBatch: "B2024-006",
    batchNumber: "B2024-006",
    tglProduksi: "2024-03-15",
    expiredDate: "2025-03-15",
    qty: 18,
    qtyTersedia: 18,
    lokasiId: "lok-003",
    lokasiNama: "Rak B1",
    hargaBeli: 4000,
    status: "AKTIF",
    createdAt: "2024-03-20T08:00:00.000Z",
  },
  {
    id: "bat-007",
    obatId: "obat-008",
    namaObat: "Vitamin C 500mg",
    kategoriNama: "Suplemen",
    noBatch: "B2024-007",
    batchNumber: "B2024-007",
    tglProduksi: "2024-01-01",
    expiredDate: "2027-01-01",
    qty: 450,
    qtyTersedia: 450,
    lokasiId: "lok-004",
    lokasiNama: "Rak B2",
    hargaBeli: 800,
    status: "AKTIF",
    createdAt: "2024-01-05T08:00:00.000Z",
  },
  {
    id: "bat-008",
    obatId: "obat-009",
    namaObat: "Captopril 25mg",
    kategoriNama: "Antihipertensi",
    noBatch: "B2024-008",
    batchNumber: "B2024-008",
    tglProduksi: "2024-05-01",
    expiredDate: "2026-05-01",
    qty: 60,
    qtyTersedia: 60,
    lokasiId: "lok-001",
    lokasiNama: "Rak A1",
    hargaBeli: 3500,
    status: "AKTIF",
    createdAt: "2024-05-05T08:00:00.000Z",
  },
];

// ─── Service ──────────────────────────────────────────────────────────────────

export const batchService = {
  getAll: async (params?: BatchParams): Promise<PaginatedResponse<BatchItem>> => {
    await mockDelay();
    let items = [...mockBatches];
    if (params?.obatId) items = items.filter((b) => b.obatId === params.obatId);
    if (params?.status) items = items.filter((b) => b.status === params.status);
    if (params?.lokasiId) items = items.filter((b) => b.lokasiId === params.lokasiId);
    if (params?.onlyAvailable) items = items.filter((b) => b.status === "AKTIF" && b.qtyTersedia > 0);
    return paginate(items, params?.page, params?.limit);
  },
};
