import type { StokStatus, OpnameStatus } from "@/lib/constants/status";

//  Master Data 

export interface Kategori {
  id: string;
  kode: string;
  nama: string;
  deskripsi?: string;
}

export interface Satuan {
  id: string;
  nama: string;        // e.g. "Tablet", "Kapsul", "Botol"
  singkatan: string;   // e.g. "Tab", "Kap", "Bot"
}

//  Lokasi Gudang (Gudang → Ruang → Rak → Laci) 

export type TipeLokasi = "GUDANG" | "RUANG" | "RAK" | "LACI";

export type KondisiPenyimpanan = "SUHU_RUANG" | "DINGIN" | "TERKONTROL";

export interface LokasiGudang {
  id: string;
  kode: string;
  nama: string;
  tipe: TipeLokasi;
  parentId?: string | null;
  path: string;        // e.g. "Gudang Utama / Ruang A / Rak-01 / Laci-3"
  children?: LokasiGudang[];
  kapasitas?: number | null;
  terpakai?: number | null;
  kondisi?: KondisiPenyimpanan;
  keterangan?: string | null;
}

//  Obat (medicine master) 

export interface Obat {
  id: string;
  kode: string;
  nama: string;
  namaGenerik?: string;
  kategoriId: string;
  kategoriNama?: string;
  satuanId: string;
  satuanNama?: string;
  supplierId?: string;
  supplierNama?: string;
  lokasiDefaultId?: string;
  lokasiDefaultNama?: string;
  stokMinimal: number;
  stokMaksimal?: number;
  hargaBeli: number;
  hargaJual?: number;
  stokSaat?: number;    // denormalized current stock for list views
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

//  Batch 

export interface Batch {
  id: string;
  obatId: string;
  namaObat?: string;
  kategoriNama?: string;
  batchNumber: string;
  tglProduksi?: string;
  expiredDate: string;
  qty: number;
  lokasiId: string;
  lokasiNama?: string;
  hargaBeli: number;
  status: StokStatus;
  createdAt: string;
}

//  Stok Masuk 

export interface StokMasuk {
  id: string;
  obatId: string;
  namaObat?: string;
  batchNumber: string;
  expiredDate: string;
  qty: number;
  lokasiId: string;
  lokasiNama?: string;
  hargaBeli: number;
  alasan: string;
  referenceId?: string;
  referenceType?: "GR" | "MANUAL" | "OPNAME";
  createdAt: string;
  createdBy: string;
}

//  Stok Keluar 

export interface BatchKeluar {
  batchId: string;
  batchNumber: string;
  expiredDate: string;
  qty: number;
}

export interface StokKeluar {
  id: string;
  obatId: string;
  namaObat?: string;
  batches: BatchKeluar[];
  totalQty: number;
  alasan: string;
  referenceId?: string;
  referenceType?: "RESEP" | "MANUAL" | "OPNAME";
  createdAt: string;
  createdBy: string;
}

//  Stok Opname 

export interface OpnameItem {
  id: string;
  opnameId: string;
  obatId: string;
  namaObat: string;
  batchId: string;
  batchNumber: string;
  expiredDate: string;
  lokasiId: string;
  lokasiNama?: string;
  qtySystem: number;
  qtyFisik: number;
  selisih: number;     // qtyFisik - qtySystem
}

export interface StokOpname {
  id: string;
  noOpname: string;
  status: OpnameStatus;
  items: OpnameItem[];
  tanggalOpname: string;
  catatan?: string;
  createdAt: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
}

//  Mutasi Lokasi 

export interface MutasiLokasi {
  id: string;
  noMutasi: string;
  obatId: string;
  namaObat?: string;
  batchId: string;
  batchNumber: string;
  expiredDate: string;
  dariLokasiId: string;
  dariLokasiNama?: string;
  keLokasiId: string;
  keLokasiNama?: string;
  qty: number;
  catatan?: string;
  createdAt: string;
  createdBy: string;
}
