import { mockDelay, paginate, type PaginatedResponse } from "@/lib/api-client";
import type { PurchaseInvoice } from "@/types/procurement";
import type { InvoiceStatus } from "@/lib/constants/status";

export interface CreateInvoiceDto {
  goodReceiptId?: string;
  purchaseOrderId?: string;
  noInvoiceSupplier: string;
  tanggalInvoice: string;
  tanggalJatuhTempo?: string;
  totalNilai: number;
  subtotalNilai?: number;
  nilaiPPN?: number;
  ppnIncluded?: boolean;
  terminPembayaran?: string;
  filePdfName?: string;
  catatan?: string;
}

export interface UpdatePaymentDto {
  status: "PAID";
  tanggalBayar?: string;
  catatan?: string;
}

export interface InvoiceParams {
  page?: number;
  limit?: number;
  statusBayar?: string;
  supplierId?: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

let mockInvoices: PurchaseInvoice[] = [
  {
    id: "inv-001",
    noInvoice: "INV-2024-001",
    noInvoiceSupplier: "KF/INV/2024/0042",
    grId: "gr-001",
    noGR: "GR-2024-001",
    poId: "po-001",
    noPO: "PO-2024-001",
    supplierId: "sup-001",
    supplierName: "PT. Kimia Farma",
    status: "PAID" as InvoiceStatus,
    subtotalNilai: 5400000,
    nilaiPPN: 540000,
    totalNilai: 5940000,
    tanggalInvoice: "2024-01-22",
    tanggalJatuhTempo: "2024-02-22",
    tanggalBayar: "2024-02-15",
    createdAt: "2024-01-22T10:00:00.000Z",
    createdBy: "Admin Apotek",
  },
  {
    id: "inv-002",
    noInvoice: "INV-2024-002",
    noInvoiceSupplier: "KALBE/2024/06/0012",
    grId: "gr-002",
    noGR: "GR-2024-002",
    poId: "po-002",
    noPO: "PO-2024-002",
    supplierId: "sup-002",
    supplierName: "PT. Kalbe Farma",
    status: "UNPAID" as InvoiceStatus,
    subtotalNilai: 3750000,
    totalNilai: 3750000,
    tanggalInvoice: "2024-06-09",
    tanggalJatuhTempo: "2024-07-24",
    createdAt: "2024-06-09T11:00:00.000Z",
    createdBy: "Admin Apotek",
  },
];

let nextInvId = 3;

// ─── Service ──────────────────────────────────────────────────────────────────

export const purchaseInvoiceService = {
  getAll: async (params?: InvoiceParams): Promise<PaginatedResponse<PurchaseInvoice>> => {
    await mockDelay();
    let items = [...mockInvoices];
    if (params?.statusBayar) items = items.filter((i) => i.status === params.statusBayar);
    if (params?.supplierId) items = items.filter((i) => i.supplierId === params.supplierId);
    return paginate(items, params?.page, params?.limit);
  },

  getById: async (id: string): Promise<PurchaseInvoice> => {
    await mockDelay();
    const item = mockInvoices.find((i) => i.id === id);
    if (!item) throw new Error("Invoice tidak ditemukan.");
    return { ...item };
  },

  getStats: async () => {
    await mockDelay();
    const unpaid = mockInvoices.filter((i) => i.status === "UNPAID");
    return {
      total: mockInvoices.length,
      belumDibayar: unpaid.length,
      nilaiTagihan: unpaid.reduce((acc, i) => acc + i.totalNilai, 0),
    };
  },

  getAvailableGRs: async () => {
    await mockDelay();
    return [
      { id: "gr-001", noGR: "GR-2024-001", supplierNama: "PT. Kimia Farma", totalNilai: 5400000 },
      { id: "gr-002", noGR: "GR-2024-002", supplierNama: "PT. Kalbe Farma", totalNilai: 3750000 },
    ];
  },

  create: async (payload: CreateInvoiceDto): Promise<PurchaseInvoice> => {
    await mockDelay();
    const id = `inv-${String(nextInvId++).padStart(3, "0")}`;
    const now = new Date().toISOString();
    const item: PurchaseInvoice = {
      id,
      noInvoice: `INV-${new Date().getFullYear()}-${String(mockInvoices.length + 1).padStart(3, "0")}`,
      noInvoiceSupplier: payload.noInvoiceSupplier,
      grId: payload.goodReceiptId ?? "",
      noGR: "",
      poId: payload.purchaseOrderId ?? "",
      noPO: "",
      supplierId: "sup-001",
      supplierName: "Supplier",
      status: "UNPAID" as InvoiceStatus,
      subtotalNilai: payload.subtotalNilai,
      nilaiPPN: payload.nilaiPPN,
      totalNilai: payload.totalNilai,
      tanggalInvoice: payload.tanggalInvoice,
      tanggalJatuhTempo: payload.tanggalJatuhTempo,
      filePdfName: payload.filePdfName,
      catatan: payload.catatan,
      createdAt: now,
      createdBy: "Pengguna",
    };
    mockInvoices.unshift(item);
    return { ...item };
  },

  delete: async (id: string) => {
    await mockDelay();
    mockInvoices = mockInvoices.filter((i) => i.id !== id);
    return { message: "Invoice berhasil dihapus." };
  },

  updatePayment: async (id: string, payload: UpdatePaymentDto) => {
    await mockDelay();
    const idx = mockInvoices.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error("Invoice tidak ditemukan.");
    mockInvoices[idx] = {
      ...mockInvoices[idx],
      status: payload.status as InvoiceStatus,
      tanggalBayar: payload.tanggalBayar,
    };
    return { ...mockInvoices[idx] };
  },
};
