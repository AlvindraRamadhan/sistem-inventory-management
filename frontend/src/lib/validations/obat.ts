import { z } from "zod";

// Base schema — used by zodResolver (avoids Zod v4 refine type inference issues)
export const obatBaseSchema = z.object({
  kode: z
    .string()
    .min(1, "Kode wajib diisi")
    .regex(/^OBT-\d{3}$/, "Format kode: OBT-XXX (contoh: OBT-021)"),
  nama: z.string().min(3, "Nama minimal 3 karakter"),
  kategoriId: z.string().min(1, "Kategori wajib dipilih"),
  satuanId: z.string().min(1, "Satuan wajib dipilih"),
  hargaBeli: z.number().min(1, "Harga harus lebih dari 0"),
  lokasiDefaultId: z.string().optional(),
  stokMinimal: z.number().min(0, "Tidak boleh negatif"),
  stokMaksimal: z.number().min(0, "Tidak boleh negatif").optional(),
  keterangan: z.string().optional(),
  isActive: z.boolean(),
});

// Full schema with cross-field validation — use for manual validation if needed
export const obatSchema = obatBaseSchema.refine(
  (data) =>
    data.stokMaksimal === undefined ||
    data.stokMaksimal === 0 ||
    data.stokMinimal < data.stokMaksimal,
  {
    message: "Stok maksimal harus lebih besar dari stok minimal",
    path: ["stokMaksimal"],
  }
);

// Form values type from the base schema
export type ObatFormValues = z.infer<typeof obatBaseSchema>;
