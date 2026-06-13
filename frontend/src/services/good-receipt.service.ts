import { mockDelay, paginate, type PaginatedResponse } from "@/lib/api-client";
import type { GoodReceipt, GRItem as GRItemType } from "@/types/procurement";
import type { GRStatus } from "@/lib/constants/status";

export interface GRItemDto {
  poItemId: string;
  qtyDiterima: number;
  batchNumber?: string;
  tanggalProduksi?: string;
  expiredDate?: string;
  lokasiId?: string;
  kondisi: "BAIK" | "RUSAK";
  keteranganKondisi?: string;
}

export interface CreateGRDto {
  purchaseOrderId: string;
  tanggalPerkiraanDatang?: string;
  tanggalTerima: string;
  catatanAdmin?: string;
  catatan?: string;
  items?: GRItemDto[];
}

export interface SaveDraftGRDto {
  items: GRItemDto[];
  catatanApoteker?: string;
  fotoUrls?: string[];
}

export interface ReviewGRDto {
  action: "approve" | "return" | "reject";
  catatan?: string;
}

export interface GRParams {
  page?: number;
  limit?: number;
  status?: string;
  supplierId?: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockGRItems: GRItemType[] = [
  {
    id: "gri-001",
    grId: "gr-001",
    poItemId: "poi-001",
    obatId: "obat-001",
    namaObat: "Paracetamol 500mg",
    satuanNama: "Tablet",
    qtyPO: 500,
    qtyTerima: 500,
    batchNumber: "B2024-001",
    tanggalProduksi: "2024-01-10",
    expiredDate: "2026-01-10",
    hargaBeli: 1500,
    lokasiId: "lok-001",
    lokasiNama: "Rak A1",
    kondisi: "BAIK",
  },
  {
    id: "gri-002",
    grId: "gr-001",
    poItemId: "poi-002",
    obatId: "obat-002",
    namaObat: "Amoxicillin 500mg",
    satuanNama: "Kapsul",
    qtyPO: 120,
    qtyTerima: 120,
    batchNumber: "B2024-002",
    tanggalProduksi: "2024-02-01",
    expiredDate: "2026-02-01",
    hargaBeli: 3000,
    lokasiId: "lok-001",
    lokasiNama: "Rak A1",
    kondisi: "BAIK",
  },
];

let mockGRs: GoodReceipt[] = [
  {
    id: "gr-001",
    noGR: "GR-2024-001",
    poId: "po-001",
    noPO: "PO-2024-001",
    supplierId: "sup-001",
    supplierName: "PT. Kimia Farma",
    status: "SELESAI" as GRStatus,
    items: mockGRItems,
    tanggalTerima: "2024-01-20",
    tanggalPerkiraanDatang: "2024-01-18",
    catatan: "Barang diterima lengkap",
    catatanAdmin: "Semua dokumen lengkap",
    createdAt: "2024-01-20T10:00:00.000Z",
    createdBy: "Apoteker Utama",
  },
  {
    id: "gr-002",
    noGR: "GR-2024-002",
    poId: "po-002",
    noPO: "PO-2024-002",
    supplierId: "sup-002",
    supplierName: "PT. Kalbe Farma",
    status: "MENUNGGU_REVIEW" as GRStatus,
    items: [],
    tanggalTerima: "2024-06-08",
    tanggalPerkiraanDatang: "2024-06-10",
    catatan: "Sedang proses QC",
    createdAt: "2024-06-08T14:00:00.000Z",
    createdBy: "Apoteker Utama",
  },
  {
    id: "gr-003",
    noGR: "GR-2024-003",
    poId: "po-003",
    noPO: "PO-2024-003",
    supplierId: "sup-001",
    supplierName: "PT. Kimia Farma",
    status: "MENUNGGU_INPUT" as GRStatus,
    items: [],
    tanggalTerima: "2024-06-06",
    createdAt: "2024-06-06T09:00:00.000Z",
    createdBy: "Admin Apotek",
  },
];

let nextGRId = 4;

// ─── Service ──────────────────────────────────────────────────────────────────

export const goodReceiptService = {
  getAll: async (params?: GRParams): Promise<PaginatedResponse<GoodReceipt>> => {
    await mockDelay();
    let items = [...mockGRs];
    if (params?.status) items = items.filter((g) => g.status === params.status);
    if (params?.supplierId) items = items.filter((g) => g.supplierId === params.supplierId);
    return paginate(items, params?.page, params?.limit);
  },

  getById: async (id: string): Promise<GoodReceipt> => {
    await mockDelay();
    const item = mockGRs.find((g) => g.id === id);
    if (!item) throw new Error("Good receipt tidak ditemukan.");
    return { ...item };
  },

  getReceivablePOs: async (): Promise<unknown> => {
    await mockDelay();
    return [
      { id: "po-001", noPO: "PO-2024-001", supplierNama: "PT. Kimia Farma", supplierId: "sup-001", supplierName: "PT. Kimia Farma", status: "SENT", items: [], terminPembayaran: "Net 30", ppnIncluded: false, subtotalNilai: 0, totalPPN: 0, totalNilai: 0, tanggalPO: "2024-01-10", createdAt: "2024-01-10T08:00:00.000Z", createdBy: "Admin" },
      { id: "po-002", noPO: "PO-2024-002", supplierNama: "PT. Kalbe Farma", supplierId: "sup-002", supplierName: "PT. Kalbe Farma", status: "SENT", items: [], terminPembayaran: "Net 45", ppnIncluded: false, subtotalNilai: 0, totalPPN: 0, totalNilai: 0, tanggalPO: "2024-06-01", createdAt: "2024-06-01T09:00:00.000Z", createdBy: "Admin" },
    ];
  },

  create: async (payload: CreateGRDto): Promise<GoodReceipt> => {
    await mockDelay();
    const id = `gr-${String(nextGRId++).padStart(3, "0")}`;
    const now = new Date().toISOString();
    const item: GoodReceipt = {
      id,
      noGR: `GR-${new Date().getFullYear()}-${String(mockGRs.length + 1).padStart(3, "0")}`,
      poId: payload.purchaseOrderId,
      noPO: "PO-???",
      supplierId: "sup-001",
      supplierName: "Supplier",
      status: "MENUNGGU_INPUT" as GRStatus,
      items: [],
      tanggalTerima: payload.tanggalTerima,
      tanggalPerkiraanDatang: payload.tanggalPerkiraanDatang,
      catatan: payload.catatan,
      catatanAdmin: payload.catatanAdmin,
      createdAt: now,
      createdBy: "Pengguna",
    };
    mockGRs.unshift(item);
    return { ...item };
  },

  delete: async (id: string) => {
    await mockDelay();
    mockGRs = mockGRs.filter((g) => g.id !== id);
    return { message: "Good receipt berhasil dihapus." };
  },

  saveDraft: async (id: string, payload: SaveDraftGRDto) => {
    await mockDelay();
    const idx = mockGRs.findIndex((g) => g.id === id);
    if (idx !== -1) mockGRs[idx] = { ...mockGRs[idx], status: "MENUNGGU_REVIEW" as GRStatus };
    return { ...mockGRs[idx], draft: payload.items };
  },

  submitQC: async (id: string) => {
    await mockDelay();
    const idx = mockGRs.findIndex((g) => g.id === id);
    if (idx !== -1) mockGRs[idx] = { ...mockGRs[idx], status: "MENUNGGU_REVIEW" as GRStatus };
    return { ...mockGRs[idx] };
  },

  review: async (id: string, payload: ReviewGRDto) => {
    await mockDelay();
    const idx = mockGRs.findIndex((g) => g.id === id);
    if (idx !== -1) {
      const statusMap: Record<string, GRStatus> = {
        approve: "SELESAI",
        return: "MENUNGGU_INPUT",
        reject: "DITOLAK",
      };
      mockGRs[idx] = { ...mockGRs[idx], status: statusMap[payload.action] };
    }
    return { ...mockGRs[idx] };
  },

  returnToSupplier: async (id: string, payload?: { catatan?: string }) => {
    await mockDelay();
    const idx = mockGRs.findIndex((g) => g.id === id);
    if (idx !== -1) {
      mockGRs[idx] = {
        ...mockGRs[idx],
        status: "DITOLAK" as GRStatus,
        catatan: payload?.catatan ?? mockGRs[idx].catatan,
      };
    }
    return { ...mockGRs[idx] };
  },
};
