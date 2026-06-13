import { z } from "zod";

export const supplierBaseSchema = z.object({
  kode: z
    .string()
    .min(1, "Kode wajib diisi")
    .regex(/^SUP-\d{3}$/, "Format kode: SUP-XXX (contoh: SUP-011)"),
  nama: z.string().min(3, "Nama supplier minimal 3 karakter"),
  kontakPerson: z.string().min(2, "Nama kontak minimal 2 karakter"),
  telepon: z
    .string()
    .min(8, "Nomor telepon minimal 8 karakter")
    .max(20, "Nomor telepon terlalu panjang")
    .regex(
      /^[\d\s\-\+\(\)]+$/,
      "Nomor telepon hanya boleh berisi angka, spasi, +, -, ()"
    ),
  email: z.string().email("Format email tidak valid"),
  kota: z.string().min(2, "Kota minimal 2 karakter"),
  status: z.enum(["AKTIF", "TIDAK_AKTIF"]),
});

export type SupplierFormValues = z.infer<typeof supplierBaseSchema>;
