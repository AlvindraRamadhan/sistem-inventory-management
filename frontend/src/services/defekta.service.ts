import { mockDelay, paginate, type PaginatedResponse } from "@/lib/api-client";

export type AlasanDefekta = "rusak" | "expired" | "salah_simpan" | "lainnya";
export type StatusDefekta = "menunggu" | "disetujui" | "ditolak" | "dimusnahkan";

export const ALASAN_LABEL: Record<AlasanDefekta, string> = {
  rusak: "Rusak Fisik",
  expired: "Kadaluarsa",
  salah_simpan: "Salah Simpan",
  lainnya: "Lainnya",
};

export const STATUS_DEFEKTA_LABEL: Record<StatusDefekta, string> = {
  menunggu: "Menunggu Review",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
  dimusnahkan: "Dimusnahkan",
};

export interface DefektaObat {
  id: string;
  kode: string;
  nama: string;
  kategori: string;
  satuan: string;
  stokSaatIni: number;
}

export interface DefektaUser {
  id: string;
  nama: string;
  role: string;
}

export interface BatchAllocation {
  batchId: string;
  noBatch: string;
  expiredDate: string | null;
  qty: number;
  hargaSatuan: number;
}

export interface DefektaItem {
  id: string;
  obatId: string;
  obat: DefektaObat;
  createdById: string;
  createdBy: DefektaUser | null;
  tanggal: string;
  qty: number;
  noBatch: string | null;
  batchAllocations: BatchAllocation[] | null;
  alasan: AlasanDefekta;
  status: StatusDefekta;
  catatan: string | null;
  fotoUrl: string | null;
  approvedById: string | null;
  approvedBy: DefektaUser | null;
  approvedAt: string | null;
  jadwalPemusnahan: string | null;
  catatanPenolakan: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DefektaStats {
  aktif: number;
  menunggu: number;
  selesaiBulanIni: number;
}

export interface DefektaParams {
  page?: number;
  limit?: number;
  status?: StatusDefekta;
  search?: string;
}

export interface CreateDefektaDto {
  obatId: string;
  qty: number;
  noBatch?: string;
  alasan: AlasanDefekta;
  tanggal: string;
  catatan?: string;
  fotoUrl?: string;
}

export interface ApproveDefektaDto {
  jadwalPemusnahan?: string;
}

export interface RejectDefektaDto {
  catatanPenolakan?: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockApoteker: DefektaUser = { id: "usr-002", nama: "Apoteker Utama", role: "apoteker" };
const mockAdmin: DefektaUser = { id: "usr-001", nama: "Admin Apotek", role: "admin" };

let mockDefekta: DefektaItem[] = [
  {
    id: "def-001",
    obatId: "obat-003",
    obat: { id: "obat-003", kode: "OBT-003", nama: "Ibuprofen 400mg", kategori: "Analgesik", satuan: "Tablet", stokSaatIni: 35 },
    createdById: "usr-002",
    createdBy: mockApoteker,
    tanggal: "2024-05-15",
    qty: 20,
    noBatch: "B2023-011",
    batchAllocations: [{ batchId: "bat-004", noBatch: "B2023-011", expiredDate: "2024-03-01", qty: 20, hargaSatuan: 2000 }],
    alasan: "expired",
    status: "disetujui",
    catatan: "Ditemukan saat pengecekan rutin",
    fotoUrl: null,
    approvedById: "usr-001",
    approvedBy: mockAdmin,
    approvedAt: "2024-05-16T10:00:00.000Z",
    jadwalPemusnahan: "2024-06-01",
    catatanPenolakan: null,
    createdAt: "2024-05-15T09:00:00.000Z",
    updatedAt: "2024-05-16T10:00:00.000Z",
  },
  {
    id: "def-002",
    obatId: "obat-005",
    obat: { id: "obat-005", kode: "OBT-005", nama: "Omeprazole 20mg", kategori: "Antasida", satuan: "Kapsul", stokSaatIni: 18 },
    createdById: "usr-002",
    createdBy: mockApoteker,
    tanggal: "2024-06-01",
    qty: 5,
    noBatch: "B2024-006",
    batchAllocations: null,
    alasan: "rusak",
    status: "menunggu",
    catatan: "Kemasan rusak saat penerimaan barang",
    fotoUrl: null,
    approvedById: null,
    approvedBy: null,
    approvedAt: null,
    jadwalPemusnahan: null,
    catatanPenolakan: null,
    createdAt: "2024-06-01T11:00:00.000Z",
    updatedAt: "2024-06-01T11:00:00.000Z",
  },
  {
    id: "def-003",
    obatId: "obat-007",
    obat: { id: "obat-007", kode: "OBT-007", nama: "Amlodipine 5mg", kategori: "Antihipertensi", satuan: "Tablet", stokSaatIni: 0 },
    createdById: "usr-002",
    createdBy: mockApoteker,
    tanggal: "2024-04-20",
    qty: 10,
    noBatch: null,
    batchAllocations: null,
    alasan: "salah_simpan",
    status: "ditolak",
    catatan: null,
    fotoUrl: null,
    approvedById: "usr-001",
    approvedBy: mockAdmin,
    approvedAt: "2024-04-21T09:00:00.000Z",
    jadwalPemusnahan: null,
    catatanPenolakan: "Data batch tidak lengkap, harap perbaiki.",
    createdAt: "2024-04-20T14:00:00.000Z",
    updatedAt: "2024-04-21T09:00:00.000Z",
  },
  {
    id: "def-004",
    obatId: "obat-001",
    obat: { id: "obat-001", kode: "OBT-001", nama: "Paracetamol 500mg", kategori: "Analgesik", satuan: "Tablet", stokSaatIni: 5 },
    createdById: "usr-002",
    createdBy: mockApoteker,
    tanggal: "2024-03-10",
    qty: 30,
    noBatch: "B2022-010",
    batchAllocations: null,
    alasan: "expired",
    status: "dimusnahkan",
    catatan: "Kadaluarsa sejak Desember 2023",
    fotoUrl: null,
    approvedById: "usr-001",
    approvedBy: mockAdmin,
    approvedAt: "2024-03-11T10:00:00.000Z",
    jadwalPemusnahan: "2024-03-20",
    catatanPenolakan: null,
    createdAt: "2024-03-10T09:00:00.000Z",
    updatedAt: "2024-03-20T15:00:00.000Z",
  },
];

let nextDefId = 5;

// ─── Service ──────────────────────────────────────────────────────────────────

export const defektaService = {
  getAll: async (params?: DefektaParams): Promise<PaginatedResponse<DefektaItem>> => {
    await mockDelay();
    let items = [...mockDefekta];
    if (params?.status) items = items.filter((d) => d.status === params.status);
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter((d) => d.obat.nama.toLowerCase().includes(q));
    }
    return paginate(items, params?.page, params?.limit);
  },

  getById: async (id: string): Promise<DefektaItem> => {
    await mockDelay();
    const item = mockDefekta.find((d) => d.id === id);
    if (!item) throw new Error("Data defekta tidak ditemukan.");
    return { ...item };
  },

  getStats: async (): Promise<DefektaStats> => {
    await mockDelay();
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return {
      aktif: mockDefekta.filter((d) => d.status === "disetujui").length,
      menunggu: mockDefekta.filter((d) => d.status === "menunggu").length,
      selesaiBulanIni: mockDefekta.filter(
        (d) => d.status === "dimusnahkan" && d.updatedAt.startsWith(thisMonth)
      ).length,
    };
  },

  create: async (payload: CreateDefektaDto): Promise<DefektaItem> => {
    await mockDelay();
    const id = `def-${String(nextDefId++).padStart(3, "0")}`;
    const now = new Date().toISOString();
    const item: DefektaItem = {
      id,
      obatId: payload.obatId,
      obat: { id: payload.obatId, kode: "OBT-???", nama: `Obat #${payload.obatId}`, kategori: "-", satuan: "-", stokSaatIni: 0 },
      createdById: "usr-002",
      createdBy: mockApoteker,
      tanggal: payload.tanggal,
      qty: payload.qty,
      noBatch: payload.noBatch ?? null,
      batchAllocations: null,
      alasan: payload.alasan,
      status: "menunggu",
      catatan: payload.catatan ?? null,
      fotoUrl: payload.fotoUrl ?? null,
      approvedById: null,
      approvedBy: null,
      approvedAt: null,
      jadwalPemusnahan: null,
      catatanPenolakan: null,
      createdAt: now,
      updatedAt: now,
    };
    mockDefekta.unshift(item);
    return { ...item };
  },

  approve: async (id: string, dto: ApproveDefektaDto = {}): Promise<DefektaItem> => {
    await mockDelay();
    const idx = mockDefekta.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error("Data defekta tidak ditemukan.");
    mockDefekta[idx] = {
      ...mockDefekta[idx],
      status: "disetujui",
      approvedById: "usr-001",
      approvedBy: mockAdmin,
      approvedAt: new Date().toISOString(),
      jadwalPemusnahan: dto.jadwalPemusnahan ?? null,
      updatedAt: new Date().toISOString(),
    };
    return { ...mockDefekta[idx] };
  },

  reject: async (id: string, dto: RejectDefektaDto = {}): Promise<DefektaItem> => {
    await mockDelay();
    const idx = mockDefekta.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error("Data defekta tidak ditemukan.");
    mockDefekta[idx] = {
      ...mockDefekta[idx],
      status: "ditolak",
      approvedById: "usr-001",
      approvedBy: mockAdmin,
      approvedAt: new Date().toISOString(),
      catatanPenolakan: dto.catatanPenolakan ?? null,
      updatedAt: new Date().toISOString(),
    };
    return { ...mockDefekta[idx] };
  },

  markDestroyed: async (id: string): Promise<DefektaItem> => {
    await mockDelay();
    const idx = mockDefekta.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error("Data defekta tidak ditemukan.");
    mockDefekta[idx] = { ...mockDefekta[idx], status: "dimusnahkan", updatedAt: new Date().toISOString() };
    return { ...mockDefekta[idx] };
  },

  remove: async (id: string): Promise<void> => {
    await mockDelay();
    mockDefekta = mockDefekta.filter((d) => d.id !== id);
  },
};
