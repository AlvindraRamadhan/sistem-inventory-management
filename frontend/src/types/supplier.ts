import type { SupplierStatus } from "@/lib/constants/status";

export type { SupplierStatus };

export interface Supplier {
  id: string;
  kode: string;
  nama: string;
  kontakPerson: string;
  telepon: string;
  email: string;
  kota: string;
  alamat?: string;
  status: SupplierStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierForm {
  kode: string;
  nama: string;
  kontakPerson: string;
  telepon: string;
  email: string;
  kota: string;
  status: SupplierStatus;
}
