import { mockDelay, paginate, type PaginatedResponse } from "@/lib/api-client";

export interface SupplierItem {
  id: string;
  kode: string;
  nama: string;
  alamat?: string;
  telepon?: string;
  email?: string;
  npwp?: string;
  contactPerson?: string;
  kategori?: string;
  statusKualifikasi?: string;
  syaratPembayaran?: string | null;
  jenisPembayaran?: string;
  expiredKontrak?: string;
  produk?: { harga: number; namaItem: string }[];
  dokumenKualifikasiUrl?: string | null;
  coaTemplateUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface CreateSupplierDto {
  nama: string;
  alamat?: string;
  telepon?: string;
  email?: string;
  npwp?: string;
  contactPerson?: string;
  kategori?: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

let mockSuppliers: SupplierItem[] = [
  {
    id: "sup-001",
    kode: "SUP-001",
    nama: "PT. Kimia Farma",
    alamat: "Jl. Veteran No.9, Jakarta Pusat",
    telepon: "021-3847854",
    email: "order@kimiafarma.co.id",
    npwp: "01.234.567.8-901.000",
    contactPerson: "Bapak Hendra",
    kategori: "Distributor Farmasi",
    statusKualifikasi: "A",
    syaratPembayaran: "Net 30",
    jenisPembayaran: "Transfer",
    expiredKontrak: "2025-12-31",
    isActive: true,
    createdAt: "2024-01-01T08:00:00.000Z",
    updatedAt: "2024-06-01T08:00:00.000Z",
  },
  {
    id: "sup-002",
    kode: "SUP-002",
    nama: "PT. Kalbe Farma",
    alamat: "Jl. Let. Jend. Suprapto Kav.4, Jakarta Pusat",
    telepon: "021-4287726",
    email: "supply@kalbe.co.id",
    npwp: "02.345.678.9-012.000",
    contactPerson: "Ibu Dewi",
    kategori: "Distributor Farmasi",
    statusKualifikasi: "A",
    syaratPembayaran: "Net 45",
    jenisPembayaran: "Transfer",
    expiredKontrak: "2025-06-30",
    isActive: true,
    createdAt: "2024-01-05T08:00:00.000Z",
    updatedAt: "2024-06-01T08:00:00.000Z",
  },
  {
    id: "sup-003",
    kode: "SUP-003",
    nama: "UD. Alat Kesehatan Makmur",
    alamat: "Jl. Raya Bogor KM.28, Depok",
    telepon: "021-8791234",
    email: "info@alkesmakmur.com",
    npwp: "03.456.789.0-123.000",
    contactPerson: "Pak Agus",
    kategori: "Distributor Alkes",
    statusKualifikasi: "B",
    syaratPembayaran: "Net 14",
    jenisPembayaran: "Transfer",
    expiredKontrak: "2024-12-31",
    isActive: true,
    createdAt: "2024-02-01T08:00:00.000Z",
    updatedAt: "2024-06-01T08:00:00.000Z",
  },
  {
    id: "sup-004",
    kode: "SUP-004",
    nama: "PT. Dexa Medica",
    alamat: "Jl. Jendral Sudirman No.7, Palembang",
    telepon: "0711-354563",
    email: "distribution@dexa.co.id",
    npwp: "04.567.890.1-234.000",
    contactPerson: "Ibu Ratna",
    kategori: "Distributor Farmasi",
    statusKualifikasi: "A",
    syaratPembayaran: "Net 30",
    jenisPembayaran: "Giro",
    expiredKontrak: "2026-03-31",
    isActive: false,
    createdAt: "2024-02-15T08:00:00.000Z",
    updatedAt: "2024-05-01T08:00:00.000Z",
  },
];

let nextSupId = 5;

// ─── Service ──────────────────────────────────────────────────────────────────

export const supplierService = {
  getAll: async (params?: SupplierParams): Promise<PaginatedResponse<SupplierItem>> => {
    await mockDelay();
    let items = [...mockSuppliers];
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter((s) => s.nama.toLowerCase().includes(q) || s.kode.toLowerCase().includes(q));
    }
    if (params?.isActive !== undefined) items = items.filter((s) => s.isActive === params.isActive);
    return paginate(items, params?.page, params?.limit);
  },

  getById: async (id: string): Promise<SupplierItem> => {
    await mockDelay();
    const item = mockSuppliers.find((s) => s.id === id);
    if (!item) throw new Error("Supplier tidak ditemukan.");
    return { ...item };
  },

  getStats: async () => {
    await mockDelay();
    return {
      total: mockSuppliers.length,
      aktif: mockSuppliers.filter((s) => s.isActive).length,
      nonAktif: mockSuppliers.filter((s) => !s.isActive).length,
    };
  },

  create: async (payload: CreateSupplierDto): Promise<SupplierItem> => {
    await mockDelay();
    const id = `sup-${String(nextSupId++).padStart(3, "0")}`;
    const now = new Date().toISOString();
    const item: SupplierItem = {
      id,
      kode: `SUP-${String(mockSuppliers.length + 1).padStart(3, "0")}`,
      nama: payload.nama,
      alamat: payload.alamat,
      telepon: payload.telepon,
      email: payload.email,
      npwp: payload.npwp,
      contactPerson: payload.contactPerson,
      kategori: payload.kategori,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    mockSuppliers.push(item);
    return { ...item };
  },

  update: async (id: string, payload: Partial<CreateSupplierDto>): Promise<SupplierItem> => {
    await mockDelay();
    const idx = mockSuppliers.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error("Supplier tidak ditemukan.");
    mockSuppliers[idx] = { ...mockSuppliers[idx], ...payload, updatedAt: new Date().toISOString() };
    return { ...mockSuppliers[idx] };
  },

  delete: async (id: string) => {
    await mockDelay();
    mockSuppliers = mockSuppliers.filter((s) => s.id !== id);
    return { message: "Supplier berhasil dihapus." };
  },

  toggleActive: async (id: string): Promise<SupplierItem> => {
    await mockDelay();
    const idx = mockSuppliers.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error("Supplier tidak ditemukan.");
    mockSuppliers[idx] = { ...mockSuppliers[idx], isActive: !mockSuppliers[idx].isActive, updatedAt: new Date().toISOString() };
    return { ...mockSuppliers[idx] };
  },
};
