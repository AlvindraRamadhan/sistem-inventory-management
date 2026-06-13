import type { AlkesStatus, KalibrasiStatus } from "@/lib/constants/status";

export type { AlkesStatus, KalibrasiStatus };

//  Alkes (Alat Kesehatan) 

export interface Alkes {
  id: string;
  kode: string;
  nama: string;
  merek?: string;
  model?: string;
  serialNumber?: string;
  lokasiId: string;
  lokasiNama?: string;
  status: AlkesStatus;
  tanggalKalibrasiTerakhir?: string;
  tanggalKalibrasiSelanjutnya?: string;
  createdAt: string;
  updatedAt: string;
}

//  Kalibrasi Record 

export interface KalibrasiRecord {
  id: string;
  alkesId: string;
  alkesNama: string;
  alkesKode: string;
  status: KalibrasiStatus;
  tanggalKalibrasi?: string;
  tanggalSelanjutnya: string;
  intervalBulan: number;
  sertifikatNo?: string;
  petugasKalibrasi?: string;
  catatan?: string;
  createdAt: string;
  updatedAt: string;
}
