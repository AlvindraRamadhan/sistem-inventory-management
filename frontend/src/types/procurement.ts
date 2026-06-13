import type { POStatus, GRStatus, InvoiceStatus } from "@/lib/constants/status";

export type { POStatus, GRStatus, InvoiceStatus };

//  Termin Pembayaran 

export const TERMIN_OPTIONS = ["7_HARI", "14_HARI", "30_HARI", "COD"] as const;
export type TerminPembayaran = (typeof TERMIN_OPTIONS)[number];

export const TERMIN_LABEL: Record<TerminPembayaran, string> = {
  "7_HARI": "7 Hari",
  "14_HARI": "14 Hari",
  "30_HARI": "30 Hari",
  "COD": "COD (Bayar Tunai)",
};

//  Purchase Order 

export interface POItem {
  id: string;
  poId: string;
  obatId: string;
  namaObat: string;
  satuanNama: string;
  qty: number;
  hargaBeli: number;
  subtotal: number;
}

export interface PurchaseOrder {
  id: string;
  noPO: string;
  supplierId: string;
  supplierName: string;
  status: POStatus;
  items: POItem[];
  terminPembayaran: TerminPembayaran;
  ppnIncluded: boolean;
  subtotalNilai: number;
  totalPPN: number;
  totalNilai: number;
  tanggalPO: string;
  tanggalKirim?: string;
  catatan?: string;
  createdAt: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
}

//  Good Receipt 

export type GRItemKondisi = "BAIK" | "RUSAK";

export interface GRItem {
  id: string;
  grId: string;
  poItemId: string;
  obatId: string;
  namaObat: string;
  satuanNama: string;
  qtyPO: number;
  qtyTerima: number;
  batchNumber: string;
  tanggalProduksi?: string;
  expiredDate: string;
  hargaBeli: number;
  lokasiId?: string;
  lokasiNama?: string;
  kondisi?: GRItemKondisi;
  keteranganKondisi?: string;
}

export interface RevisiGR {
  revisiKe: number;
  submittedAt: string;
  submittedBy: string;
  alasanPenolakan: string;
  catatanApoteker?: string;
  fotoUrls?: string[];
  snapshot: Array<{
    namaObat: string;
    satuanNama: string;
    qtyPO: number;
    qtyTerima: number;
    batchNumber: string;
    kondisi: GRItemKondisi;
  }>;
}

export interface GoodReceipt {
  id: string;
  noGR: string;
  poId: string;
  noPO: string;
  supplierId: string;
  supplierName: string;
  status: GRStatus;
  items: GRItem[];
  tanggalPerkiraanDatang?: string;
  tanggalTerima: string;
  catatan?: string;
  catatanAdmin?: string;
  catatanApoteker?: string;
  fotoUrls?: string[];
  revisiKe?: number;
  riwayatRevisi?: RevisiGR[];
  createdAt: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
}

//  Purchase Invoice 

export interface PurchaseInvoice {
  id: string;
  noInvoice: string;
  noInvoiceSupplier?: string;
  grId: string;
  noGR: string;
  poId: string;
  noPO: string;
  supplierId: string;
  supplierName: string;
  status: InvoiceStatus;
  subtotalNilai?: number;
  nilaiPPN?: number;
  totalNilai: number;
  terminPembayaran?: TerminPembayaran;
  tanggalInvoice: string;
  tanggalJatuhTempo?: string;
  tanggalBayar?: string;
  filePdfName?: string;
  catatan?: string;
  createdAt: string;
  createdBy: string;
  markedLunasByAt?: string;
}
