import { z } from "zod";
import { TERMIN_OPTIONS } from "@/types/procurement";

export const poItemSchema = z.object({
  obatId: z.string().min(1, "Obat wajib dipilih"),
  namaObat: z.string().optional(),
  satuanNama: z.string().optional(),
  qty: z.number().min(1, "Qty minimal 1"),
  hargaBeli: z.number().min(0, "Harga beli tidak boleh negatif"),
});

export const purchaseOrderSchema = z.object({
  supplierId: z.string().min(1, "Supplier wajib dipilih"),
  tanggalPO: z.string().min(1, "Tanggal PO wajib diisi"),
  terminPembayaran: z.enum(TERMIN_OPTIONS),
  catatan: z.string().optional(),
  ppnIncluded: z.boolean(),
  items: z.array(poItemSchema).min(1, "Minimal satu item"),
});

export type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;

export const grItemSchema = z.object({
  poItemId: z.string().min(1),
  qtyTerima: z.number().min(0, "Qty tidak boleh negatif"),
  batchNumber: z.string().min(1, "Batch number wajib diisi"),
  expiredDate: z.string().min(1, "Expired date wajib diisi"),
  hargaBeli: z.number().min(0),
});

export const goodReceiptSchema = z.object({
  poId: z.string().min(1, "PO wajib dipilih"),
  tanggalTerima: z.string().min(1, "Tanggal terima wajib diisi"),
  catatan: z.string().optional(),
  items: z.array(grItemSchema).min(1, "Minimal satu item"),
});

export type GoodReceiptFormValues = z.infer<typeof goodReceiptSchema>;
