// Canonical Zod schemas for every master-data form.
// All error messages are in Indonesian.
// Import from here in new features; existing forms may still use their own
// per-file imports for backward compatibility.

import { z } from "zod";

//  Re-exports 

export { obatBaseSchema, obatSchema, type ObatFormValues } from "./obat";
export { supplierBaseSchema, type SupplierFormValues } from "./supplier";

//  Kategori 

export const kategoriSchema = z.object({
  kode: z
    .string()
    .min(1, "Kode wajib diisi")
    .max(5, "Kode maksimal 5 karakter")
    .regex(/^[A-Z0-9]+$/, "Kode hanya boleh huruf kapital dan angka"),
  nama: z.string().min(2, "Nama kategori minimal 2 karakter"),
  warna: z.string().min(1, "Warna wajib dipilih"),
  deskripsi: z.string().optional(),
  isActive: z.boolean(),
});

export type KategoriFormValues = z.infer<typeof kategoriSchema>;

//  Satuan 

export const satuanSchema = z.object({
  singkatan: z
    .string()
    .min(1, "Singkatan wajib diisi")
    .max(5, "Singkatan maksimal 5 karakter")
    .regex(/^[A-Za-z]+$/, "Singkatan hanya boleh berisi huruf"),
  nama: z.string().min(2, "Nama satuan minimal 2 karakter"),
  deskripsi: z.string().optional(),
  isActive: z.boolean(),
});

export type SatuanFormValues = z.infer<typeof satuanSchema>;

//  Lokasi Gudang 

export const lokasiSchema = z.object({
  nama: z.string().min(2, "Nama lokasi minimal 2 karakter"),
  tipe: z.enum(["GUDANG", "RUANG", "RAK", "LACI"]),
  parentId: z.string().optional(),
  kapasitas: z.number().min(1, "Kapasitas minimal 1 unit"),
  kondisi: z.enum(["SUHU_RUANG", "DINGIN", "TERKONTROL"]),
  keterangan: z.string().optional(),
});

export type LokasiFormValues = z.infer<typeof lokasiSchema>;
