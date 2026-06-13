import { z } from "zod";

export const stokMasukSchema = z.object({
  obatId: z.string().min(1, "Obat wajib dipilih"),
  batchNumber: z.string().min(1, "Batch number wajib diisi"),
  expiredDate: z.string().min(1, "Expired date wajib diisi"),
  qty: z.number().min(1, "Qty minimal 1"),
  lokasiId: z.string().min(1, "Lokasi wajib dipilih"),
  hargaBeli: z.number().min(0),
  alasan: z.string().min(1, "Alasan wajib diisi"),
});

export type StokMasukFormValues = z.infer<typeof stokMasukSchema>;

//  Stok Masuk Manual (form schema for manual stock entry) 

export const stokMasukManualSchema = z.object({
  obatId: z.string().min(1, "Obat wajib dipilih"),
  batchNumber: z
    .string()
    .min(1, "Batch number wajib diisi")
    .max(50, "Maksimal 50 karakter"),
  tglProduksi: z.string().optional(),
  expiredDate: z.string().min(1, "Expired date wajib diisi"),
  qty: z.number().int("Jumlah harus bilangan bulat").min(1, "Jumlah minimal 1"),
  lokasiId: z.string().min(1, "Lokasi wajib dipilih"),
  supplierId: z.string().optional(),
  sumber: z
    .enum(["PEMBELIAN_REGULAR", "DONASI", "HIBAH", "KOREKSI"] as const)
    .refine((v) => v !== undefined, "Sumber wajib dipilih"),
  keterangan: z.string().optional(),
});

export type StokMasukManualFormValues = z.infer<typeof stokMasukManualSchema>;

export const stokKeluarSchema = z.object({
  obatId: z.string().min(1, "Obat wajib dipilih"),
  qty: z.number().min(1, "Qty minimal 1"),
  alasan: z.string().min(1, "Alasan wajib diisi"),
  referenceId: z.string().optional(),
  referenceType: z.enum(["RESEP", "MANUAL"]).optional(),
});

export type StokKeluarFormValues = z.infer<typeof stokKeluarSchema>;

export const opnameItemSchema = z.object({
  batchId: z.string().min(1),
  qtyFisik: z.number().min(0, "Qty fisik tidak boleh negatif"),
});

export const opnameSchema = z.object({
  tanggalOpname: z.string().min(1, "Tanggal opname wajib diisi"),
  items: z.array(opnameItemSchema).min(1, "Minimal satu item"),
});

export type OpnameFormValues = z.infer<typeof opnameSchema>;
