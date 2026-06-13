import { mockDelay, paginate, type PaginatedResponse } from "@/lib/api-client";

export interface POItemDto {
  obatId: string;
  qty: number;
  hargaBeli: number;
}

export interface CreatePODto {
  supplierId: string;
  tanggalKirim?: string;
  terminPembayaran: string;
  ppnIncluded: boolean;
  catatan?: string;
  items: POItemDto[];
}

export interface UpdatePOStatusDto {
  status: string;
  catatan?: string;
}

export interface POParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  supplierId?: string;
}

export interface POItem {
  id: string;
  noPO: string;
  supplierId: string;
  supplierNama: string;
  status: "DRAFT" | "DIKIRIM" | "DITERIMA" | "DIBATALKAN";
  tanggalPO: string;
  tanggalKirim?: string;
  terminPembayaran: string;
  ppnIncluded: boolean;
  totalNilai: number;
  catatan?: string;
  createdAt: string;
  createdBy: string;
  items: { obatId: string; namaObat: string; qty: number; hargaBeli: number }[];
}

// ─── Mock data ────────────────────────────────────────────────────────────────

let mockPOs: POItem[] = [
  {
    id: "po-001",
    noPO: "PO-2024-001",
    supplierId: "sup-001",
    supplierNama: "PT. Kimia Farma",
    status: "DITERIMA",
    tanggalPO: "2024-01-10",
    tanggalKirim: "2024-01-20",
    terminPembayaran: "Net 30",
    ppnIncluded: true,
    totalNilai: 5400000,
    catatan: "Order rutin bulanan",
    createdAt: "2024-01-10T08:00:00.000Z",
    createdBy: "Admin Apotek",
    items: [
      { obatId: "obat-001", namaObat: "Paracetamol 500mg", qty: 500, hargaBeli: 1500 },
      { obatId: "obat-002", namaObat: "Amoxicillin 500mg", qty: 120, hargaBeli: 3000 },
      { obatId: "obat-009", namaObat: "Captopril 25mg", qty: 60, hargaBeli: 3500 },
    ],
  },
  {
    id: "po-002",
    noPO: "PO-2024-002",
    supplierId: "sup-002",
    supplierNama: "PT. Kalbe Farma",
    status: "DIKIRIM",
    tanggalPO: "2024-06-01",
    tanggalKirim: "2024-06-10",
    terminPembayaran: "Net 45",
    ppnIncluded: false,
    totalNilai: 3750000,
    createdAt: "2024-06-01T09:00:00.000Z",
    createdBy: "Admin Apotek",
    items: [
      { obatId: "obat-004", namaObat: "Metformin 500mg", qty: 300, hargaBeli: 2500 },
      { obatId: "obat-006", namaObat: "Cetirizine 10mg", qty: 200, hargaBeli: 1800 },
    ],
  },
  {
    id: "po-003",
    noPO: "PO-2024-003",
    supplierId: "sup-001",
    supplierNama: "PT. Kimia Farma",
    status: "DRAFT",
    tanggalPO: "2024-06-05",
    terminPembayaran: "Net 30",
    ppnIncluded: true,
    totalNilai: 6000000,
    catatan: "Order mendesak stok kritis",
    createdAt: "2024-06-05T11:00:00.000Z",
    createdBy: "Admin Apotek",
    items: [
      { obatId: "obat-001", namaObat: "Paracetamol 500mg", qty: 1000, hargaBeli: 1500 },
      { obatId: "obat-007", namaObat: "Amlodipine 5mg", qty: 200, hargaBeli: 5000 },
    ],
  },
];

let nextPOId = 4;

// ─── Service ──────────────────────────────────────────────────────────────────

export const purchaseOrderService = {
  getAll: async (params?: POParams): Promise<PaginatedResponse<POItem>> => {
    await mockDelay();
    let items = [...mockPOs];
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter((p) => p.noPO.toLowerCase().includes(q) || p.supplierNama.toLowerCase().includes(q));
    }
    if (params?.status) items = items.filter((p) => p.status === params.status);
    if (params?.supplierId) items = items.filter((p) => p.supplierId === params.supplierId);
    return paginate(items, params?.page, params?.limit);
  },

  getById: async (id: string) => {
    await mockDelay();
    const item = mockPOs.find((p) => p.id === id);
    if (!item) throw new Error("Purchase order tidak ditemukan.");
    return { ...item };
  },

  getStats: async () => {
    await mockDelay();
    return {
      total: mockPOs.length,
      draft: mockPOs.filter((p) => p.status === "DRAFT").length,
      dikirim: mockPOs.filter((p) => p.status === "DIKIRIM").length,
      diterima: mockPOs.filter((p) => p.status === "DITERIMA").length,
    };
  },

  create: async (payload: CreatePODto) => {
    await mockDelay();
    const id = `po-${String(nextPOId++).padStart(3, "0")}`;
    const now = new Date().toISOString();
    const item: POItem = {
      id,
      noPO: `PO-${new Date().getFullYear()}-${String(mockPOs.length + 1).padStart(3, "0")}`,
      supplierId: payload.supplierId,
      supplierNama: `Supplier #${payload.supplierId}`,
      status: "DRAFT",
      tanggalPO: now.slice(0, 10),
      tanggalKirim: payload.tanggalKirim,
      terminPembayaran: payload.terminPembayaran,
      ppnIncluded: payload.ppnIncluded,
      totalNilai: payload.items.reduce((acc, i) => acc + i.qty * i.hargaBeli, 0),
      catatan: payload.catatan,
      createdAt: now,
      createdBy: "Pengguna",
      items: payload.items.map((i) => ({ ...i, namaObat: `Obat #${i.obatId}` })),
    };
    mockPOs.unshift(item);
    return { ...item };
  },

  delete: async (id: string) => {
    await mockDelay();
    mockPOs = mockPOs.filter((p) => p.id !== id);
    return { message: "Purchase order berhasil dihapus." };
  },

  updateStatus: async (id: string, payload: UpdatePOStatusDto) => {
    await mockDelay();
    const idx = mockPOs.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Purchase order tidak ditemukan.");
    mockPOs[idx] = { ...mockPOs[idx], status: payload.status as POItem["status"] };
    return { ...mockPOs[idx] };
  },
};
