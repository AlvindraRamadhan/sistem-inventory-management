import { mockDelay, paginate, type PaginatedResponse } from "@/lib/api-client";

export type UserRole = "admin" | "apoteker";

export interface ActivityLogItem {
  id: string;
  userId: string | null;
  userName: string | null;
  userRole: UserRole | null;
  moduleName: string;
  action: string;
  refId: string | null;
  refNo: string | null;
  message: string;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface ActivityLogParams {
  page?: number;
  limit?: number;
  moduleName?: string;
  action?: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockActivityLogs: ActivityLogItem[] = [
  {
    id: "log-001",
    userId: "usr-001",
    userName: "Admin Apotek",
    userRole: "admin",
    moduleName: "Obat",
    action: "CREATE",
    refId: "obat-001",
    refNo: "OBT-001",
    message: "Menambahkan obat baru: Paracetamol 500mg",
    metadata: { nama: "Paracetamol 500mg", kategori: "Analgesik" },
    ipAddress: "192.168.1.100",
    createdAt: "2024-06-06T08:30:00.000Z",
  },
  {
    id: "log-002",
    userId: "usr-002",
    userName: "Apoteker Utama",
    userRole: "apoteker",
    moduleName: "Stok Keluar",
    action: "CREATE",
    refId: "sk-001",
    refNo: "SK-2024-001",
    message: "Pengeluaran stok Paracetamol 500mg sebanyak 50 tablet",
    metadata: { obat: "Paracetamol 500mg", qty: 50, referenceType: "RESEP" },
    ipAddress: "192.168.1.101",
    createdAt: "2024-06-06T09:00:00.000Z",
  },
  {
    id: "log-003",
    userId: "usr-001",
    userName: "Admin Apotek",
    userRole: "admin",
    moduleName: "Good Receipt",
    action: "APPROVE",
    refId: "gr-001",
    refNo: "GR-2024-001",
    message: "Menyetujui good receipt GR-2024-001",
    metadata: { supplier: "PT. Kimia Farma", totalItem: 3 },
    ipAddress: "192.168.1.100",
    createdAt: "2024-06-05T14:00:00.000Z",
  },
  {
    id: "log-004",
    userId: "usr-002",
    userName: "Apoteker Utama",
    userRole: "apoteker",
    moduleName: "Defekta",
    action: "CREATE",
    refId: "def-002",
    refNo: "DEF-2024-002",
    message: "Melaporkan defekta: Omeprazole 20mg 5 kapsul kemasan rusak",
    metadata: { obat: "Omeprazole 20mg", qty: 5, alasan: "rusak" },
    ipAddress: "192.168.1.101",
    createdAt: "2024-06-05T11:30:00.000Z",
  },
  {
    id: "log-005",
    userId: "usr-001",
    userName: "Admin Apotek",
    userRole: "admin",
    moduleName: "Purchase Order",
    action: "CREATE",
    refId: "po-003",
    refNo: "PO-2024-003",
    message: "Membuat purchase order PO-2024-003 ke PT. Kimia Farma",
    metadata: { supplier: "PT. Kimia Farma", totalNilai: 6000000 },
    ipAddress: "192.168.1.100",
    createdAt: "2024-06-05T10:00:00.000Z",
  },
  {
    id: "log-006",
    userId: "usr-002",
    userName: "Apoteker Utama",
    userRole: "apoteker",
    moduleName: "Stok Masuk",
    action: "CREATE",
    refId: "sm-003",
    refNo: "SM-2024-003",
    message: "Penerimaan donasi: Vitamin C 500mg 500 tablet",
    metadata: { obat: "Vitamin C 500mg", qty: 500, sumber: "DONASI" },
    ipAddress: "192.168.1.101",
    createdAt: "2024-06-04T09:00:00.000Z",
  },
  {
    id: "log-007",
    userId: "usr-001",
    userName: "Admin Apotek",
    userRole: "admin",
    moduleName: "Supplier",
    action: "UPDATE",
    refId: "sup-002",
    refNo: "SUP-002",
    message: "Memperbarui data supplier PT. Kalbe Farma",
    metadata: { field: "kontrak", expiredKontrak: "2025-06-30" },
    ipAddress: "192.168.1.100",
    createdAt: "2024-06-03T15:00:00.000Z",
  },
  {
    id: "log-008",
    userId: "usr-002",
    userName: "Apoteker Utama",
    userRole: "apoteker",
    moduleName: "Stok Opname",
    action: "CREATE",
    refId: "opn-002",
    refNo: "OPN-2024-002",
    message: "Membuat stok opname OPN-2024-002",
    metadata: { totalItems: 8 },
    ipAddress: "192.168.1.101",
    createdAt: "2024-06-01T08:00:00.000Z",
  },
  {
    id: "log-009",
    userId: "usr-001",
    userName: "Admin Apotek",
    userRole: "admin",
    moduleName: "Alkes",
    action: "UPDATE",
    refId: "alk-003",
    refNo: "ALK-003",
    message: "Mengubah status Termometer Infrared menjadi perbaikan",
    metadata: { status: "perbaikan", kondisi: "perlu_servis" },
    ipAddress: "192.168.1.100",
    createdAt: "2024-05-31T11:00:00.000Z",
  },
  {
    id: "log-010",
    userId: "usr-001",
    userName: "Admin Apotek",
    userRole: "admin",
    moduleName: "Defekta",
    action: "APPROVE",
    refId: "def-001",
    refNo: "DEF-2024-001",
    message: "Menyetujui laporan defekta: Ibuprofen 400mg 20 tablet expired",
    metadata: { obat: "Ibuprofen 400mg", qty: 20, jadwalPemusnahan: "2024-06-01" },
    ipAddress: "192.168.1.100",
    createdAt: "2024-05-30T10:00:00.000Z",
  },
];

// ─── Service ──────────────────────────────────────────────────────────────────

export const activityLogService = {
  getAll: async (params?: ActivityLogParams): Promise<PaginatedResponse<ActivityLogItem>> => {
    await mockDelay();
    let items = [...mockActivityLogs];
    if (params?.moduleName) items = items.filter((l) => l.moduleName === params.moduleName);
    if (params?.action) items = items.filter((l) => l.action === params.action);
    return paginate(items, params?.page, params?.limit);
  },
};
