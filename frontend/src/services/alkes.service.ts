import { mockDelay, paginate, type PaginatedResponse } from "@/lib/api-client";

export type AlkesStatus = "aktif" | "perbaikan" | "tidak_aktif";
export type AlkesKondisi = "baik" | "perlu_servis" | "rusak";
export type KalibrasiHasil = "lulus" | "tidak_lulus";

export interface Alkes {
  id: string;
  kode: string;
  nama: string;
  merk: string;
  noSeri: string | null;
  tglBeli: string | null;
  status: AlkesStatus;
  kondisi: AlkesKondisi;
  lokasi: string | null;
  intervalKalibrasi: number;
  tglKalibrasiTerakhir: string | null;
  tglKalibrasiBerikutnya: string | null;
  jumlahPemakaian: number;
  createdAt: string;
  updatedAt: string;
}

export interface RiwayatKalibrasi {
  id: string;
  alkesId: string;
  tanggal: string;
  teknisi: string;
  hasil: KalibrasiHasil;
  catatan: string | null;
  sertifikatNama: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AlkesStats {
  total: number;
  aktif: number;
  perbaikan: number;
  perluKalibrasi: number;
}

export interface AlkesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: AlkesStatus;
  lokasi?: string;
  kalibrasi?: "overdue" | "mendekat" | "normal";
}

export interface CreateAlkesDto {
  nama: string;
  merk: string;
  noSeri?: string;
  tglBeli?: string;
  status?: AlkesStatus;
  kondisi?: AlkesKondisi;
  lokasi?: string;
  intervalKalibrasi?: number;
  tglKalibrasiTerakhir?: string;
  tglKalibrasiBerikutnya?: string;
}

export interface UpdateAlkesDto extends Partial<CreateAlkesDto> {}

export interface CreateKalibrasiDto {
  tanggal: string;
  teknisi: string;
  hasil: KalibrasiHasil;
  catatan?: string;
  sertifikatNama?: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

let mockAlkes: Alkes[] = [
  {
    id: "alk-001",
    kode: "ALK-001",
    nama: "Tensimeter Digital",
    merk: "Omron",
    noSeri: "OM-2024-001",
    tglBeli: "2023-01-15",
    status: "aktif",
    kondisi: "baik",
    lokasi: "Poli Umum",
    intervalKalibrasi: 12,
    tglKalibrasiTerakhir: "2024-01-15",
    tglKalibrasiBerikutnya: "2025-01-15",
    jumlahPemakaian: 245,
    createdAt: "2023-01-15T08:00:00.000Z",
    updatedAt: "2024-06-01T08:00:00.000Z",
  },
  {
    id: "alk-002",
    kode: "ALK-002",
    nama: "Timbangan Badan Digital",
    merk: "Seca",
    noSeri: "SEC-2023-042",
    tglBeli: "2023-03-10",
    status: "aktif",
    kondisi: "baik",
    lokasi: "Poli Gizi",
    intervalKalibrasi: 6,
    tglKalibrasiTerakhir: "2023-12-10",
    tglKalibrasiBerikutnya: "2024-06-10",
    jumlahPemakaian: 512,
    createdAt: "2023-03-10T08:00:00.000Z",
    updatedAt: "2024-06-01T08:00:00.000Z",
  },
  {
    id: "alk-003",
    kode: "ALK-003",
    nama: "Termometer Infrared",
    merk: "Beurer",
    noSeri: "BEU-2023-111",
    tglBeli: "2023-06-01",
    status: "perbaikan",
    kondisi: "perlu_servis",
    lokasi: "IGD",
    intervalKalibrasi: 12,
    tglKalibrasiTerakhir: "2023-06-01",
    tglKalibrasiBerikutnya: "2024-06-01",
    jumlahPemakaian: 890,
    createdAt: "2023-06-01T08:00:00.000Z",
    updatedAt: "2024-05-20T08:00:00.000Z",
  },
  {
    id: "alk-004",
    kode: "ALK-004",
    nama: "Pulse Oximeter",
    merk: "Contec",
    noSeri: "CON-2024-007",
    tglBeli: "2024-01-05",
    status: "aktif",
    kondisi: "baik",
    lokasi: "Poli Dalam",
    intervalKalibrasi: 12,
    tglKalibrasiTerakhir: "2024-01-05",
    tglKalibrasiBerikutnya: "2025-01-05",
    jumlahPemakaian: 134,
    createdAt: "2024-01-05T08:00:00.000Z",
    updatedAt: "2024-06-01T08:00:00.000Z",
  },
  {
    id: "alk-005",
    kode: "ALK-005",
    nama: "Glucometer",
    merk: "Accu-Chek",
    noSeri: "ACC-2022-055",
    tglBeli: "2022-08-20",
    status: "tidak_aktif",
    kondisi: "rusak",
    lokasi: "Gudang",
    intervalKalibrasi: 6,
    tglKalibrasiTerakhir: "2023-02-20",
    tglKalibrasiBerikutnya: "2023-08-20",
    jumlahPemakaian: 1023,
    createdAt: "2022-08-20T08:00:00.000Z",
    updatedAt: "2024-04-10T08:00:00.000Z",
  },
];

let mockKalibrasi: RiwayatKalibrasi[] = [
  {
    id: "kal-001",
    alkesId: "alk-001",
    tanggal: "2024-01-15",
    teknisi: "Budi Teknisi",
    hasil: "lulus",
    catatan: "Kalibrasi rutin tahunan",
    sertifikatNama: "sertifikat-alk001-2024.pdf",
    createdAt: "2024-01-15T10:00:00.000Z",
    updatedAt: "2024-01-15T10:00:00.000Z",
  },
  {
    id: "kal-002",
    alkesId: "alk-001",
    tanggal: "2023-01-15",
    teknisi: "Budi Teknisi",
    hasil: "lulus",
    catatan: "Kalibrasi rutin tahunan",
    sertifikatNama: "sertifikat-alk001-2023.pdf",
    createdAt: "2023-01-15T10:00:00.000Z",
    updatedAt: "2023-01-15T10:00:00.000Z",
  },
  {
    id: "kal-003",
    alkesId: "alk-002",
    tanggal: "2023-12-10",
    teknisi: "Siti Kalibrasi",
    hasil: "lulus",
    catatan: null,
    sertifikatNama: null,
    createdAt: "2023-12-10T10:00:00.000Z",
    updatedAt: "2023-12-10T10:00:00.000Z",
  },
];

let nextAlkesId = 6;
let nextKalibrasiId = 4;

// ─── Service ──────────────────────────────────────────────────────────────────

export const alkesService = {
  getAll: async (params?: AlkesParams): Promise<PaginatedResponse<Alkes>> => {
    await mockDelay();
    let items = [...mockAlkes];
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter((a) => a.nama.toLowerCase().includes(q) || a.kode.toLowerCase().includes(q));
    }
    if (params?.status) items = items.filter((a) => a.status === params.status);
    if (params?.lokasi) items = items.filter((a) => a.lokasi?.toLowerCase().includes(params.lokasi!.toLowerCase()));
    return paginate(items, params?.page, params?.limit);
  },

  getStats: async (): Promise<AlkesStats> => {
    await mockDelay();
    const total = mockAlkes.length;
    const aktif = mockAlkes.filter((a) => a.status === "aktif").length;
    const perbaikan = mockAlkes.filter((a) => a.status === "perbaikan").length;
    const now = new Date();
    const perluKalibrasi = mockAlkes.filter((a) => {
      if (!a.tglKalibrasiBerikutnya) return true;
      const diff = (new Date(a.tglKalibrasiBerikutnya).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 30;
    }).length;
    return { total, aktif, perbaikan, perluKalibrasi };
  },

  getById: async (id: string): Promise<Alkes> => {
    await mockDelay();
    const item = mockAlkes.find((a) => a.id === id);
    if (!item) throw new Error("Alkes tidak ditemukan.");
    return { ...item };
  },

  getKalibrasi: async (id: string): Promise<RiwayatKalibrasi[]> => {
    await mockDelay();
    return mockKalibrasi.filter((k) => k.alkesId === id).map((k) => ({ ...k }));
  },

  create: async (dto: CreateAlkesDto): Promise<Alkes> => {
    await mockDelay();
    const id = `alk-${String(nextAlkesId++).padStart(3, "0")}`;
    const now = new Date().toISOString();
    const item: Alkes = {
      id,
      kode: `ALK-${String(mockAlkes.length + 1).padStart(3, "0")}`,
      nama: dto.nama,
      merk: dto.merk,
      noSeri: dto.noSeri ?? null,
      tglBeli: dto.tglBeli ?? null,
      status: dto.status ?? "aktif",
      kondisi: dto.kondisi ?? "baik",
      lokasi: dto.lokasi ?? null,
      intervalKalibrasi: dto.intervalKalibrasi ?? 12,
      tglKalibrasiTerakhir: dto.tglKalibrasiTerakhir ?? null,
      tglKalibrasiBerikutnya: dto.tglKalibrasiBerikutnya ?? null,
      jumlahPemakaian: 0,
      createdAt: now,
      updatedAt: now,
    };
    mockAlkes.push(item);
    return { ...item };
  },

  addKalibrasi: async (id: string, dto: CreateKalibrasiDto): Promise<RiwayatKalibrasi> => {
    await mockDelay();
    const alkesIdx = mockAlkes.findIndex((a) => a.id === id);
    if (alkesIdx === -1) throw new Error("Alkes tidak ditemukan.");
    const now = new Date().toISOString();
    const kalId = `kal-${String(nextKalibrasiId++).padStart(3, "0")}`;
    const entry: RiwayatKalibrasi = {
      id: kalId,
      alkesId: id,
      tanggal: dto.tanggal,
      teknisi: dto.teknisi,
      hasil: dto.hasil,
      catatan: dto.catatan ?? null,
      sertifikatNama: dto.sertifikatNama ?? null,
      createdAt: now,
      updatedAt: now,
    };
    mockKalibrasi.push(entry);
    mockAlkes[alkesIdx] = {
      ...mockAlkes[alkesIdx],
      tglKalibrasiTerakhir: dto.tanggal,
      updatedAt: now,
    };
    return { ...entry };
  },

  update: async (id: string, dto: UpdateAlkesDto): Promise<Alkes> => {
    await mockDelay();
    const idx = mockAlkes.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error("Alkes tidak ditemukan.");
    mockAlkes[idx] = { ...mockAlkes[idx], ...dto, updatedAt: new Date().toISOString() };
    return { ...mockAlkes[idx] };
  },

  remove: async (id: string): Promise<void> => {
    await mockDelay();
    mockAlkes = mockAlkes.filter((a) => a.id !== id);
  },
};
