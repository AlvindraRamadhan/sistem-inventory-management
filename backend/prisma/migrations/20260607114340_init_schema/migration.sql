-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'apoteker');

-- CreateEnum
CREATE TYPE "TipeLokasi" AS ENUM ('GUDANG', 'RUANG', 'RAK', 'LACI');

-- CreateEnum
CREATE TYPE "KondisiPenyimpanan" AS ENUM ('SUHU_RUANG', 'DINGIN', 'TERKONTROL');

-- CreateEnum
CREATE TYPE "StokStatus" AS ENUM ('AKTIF', 'KADALUARSA', 'HABIS', 'RUSAK');

-- CreateEnum
CREATE TYPE "OpnameStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "POStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'PARTIAL', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GRStatus" AS ENUM ('MENUNGGU_KEDATANGAN', 'PERLU_INPUT_APOTEKER', 'PERLU_REVIEW_ADMIN', 'DISETUJUI', 'DITOLAK');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('BELUM_BAYAR', 'LUNAS', 'JATUH_TEMPO');

-- CreateEnum
CREATE TYPE "AlkesStatus" AS ENUM ('AKTIF', 'TIDAK_AKTIF', 'DALAM_PERBAIKAN');

-- CreateEnum
CREATE TYPE "KalibrasiStatus" AS ENUM ('TERJADWAL', 'SELESAI', 'TERLAMBAT');

-- CreateEnum
CREATE TYPE "TerminPembayaran" AS ENUM ('7_HARI', '14_HARI', '30_HARI', 'COD');

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'apoteker',
    "unit" TEXT,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kategori" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "deskripsi" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kategori_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "satuan" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nama" TEXT NOT NULL,
    "singkatan" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "satuan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lokasi_gudang" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "tipe" "TipeLokasi" NOT NULL,
    "parent_id" UUID,
    "path" TEXT NOT NULL,
    "kapasitas" INTEGER,
    "terpakai" INTEGER NOT NULL DEFAULT 0,
    "kondisi" "KondisiPenyimpanan" NOT NULL DEFAULT 'SUHU_RUANG',
    "keterangan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lokasi_gudang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "pic" TEXT,
    "telepon" TEXT,
    "email" TEXT,
    "alamat" TEXT,
    "termin" "TerminPembayaran" NOT NULL DEFAULT '30_HARI',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obat" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "nama_generik" TEXT,
    "kategori_id" UUID NOT NULL,
    "satuan_id" UUID NOT NULL,
    "supplier_id" UUID,
    "lokasi_default_id" UUID,
    "stok_minimal" INTEGER NOT NULL DEFAULT 0,
    "stok_maksimal" INTEGER,
    "harga_beli" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "harga_jual" DECIMAL(15,2),
    "stok_saat" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "obat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alkes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "merek" TEXT,
    "model" TEXT,
    "serial_number" TEXT,
    "lokasi_id" UUID,
    "status" "AlkesStatus" NOT NULL DEFAULT 'AKTIF',
    "tanggal_kalibrasi_terakhir" DATE,
    "tanggal_kalibrasi_selanjutnya" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alkes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kalibrasi_record" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "alkes_id" UUID NOT NULL,
    "status" "KalibrasiStatus" NOT NULL DEFAULT 'TERJADWAL',
    "tanggal_kalibrasi" DATE,
    "tanggal_selanjutnya" DATE NOT NULL,
    "interval_bulan" INTEGER NOT NULL DEFAULT 12,
    "sertifikat_no" TEXT,
    "petugas_kalibrasi" TEXT,
    "catatan" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kalibrasi_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "obat_id" UUID NOT NULL,
    "batch_number" TEXT NOT NULL,
    "tgl_produksi" DATE,
    "expired_date" DATE NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 0,
    "lokasi_id" UUID NOT NULL,
    "harga_beli" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "StokStatus" NOT NULL DEFAULT 'AKTIF',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stok_masuk" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "obat_id" UUID NOT NULL,
    "batch_number" TEXT NOT NULL,
    "expired_date" DATE NOT NULL,
    "qty" INTEGER NOT NULL,
    "lokasi_id" UUID NOT NULL,
    "harga_beli" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "alasan" TEXT NOT NULL,
    "reference_id" TEXT,
    "reference_type" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stok_masuk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stok_keluar" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "obat_id" UUID NOT NULL,
    "total_qty" INTEGER NOT NULL,
    "alasan" TEXT NOT NULL,
    "reference_id" TEXT,
    "reference_type" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stok_keluar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stok_keluar_batch" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "stok_keluar_id" UUID NOT NULL,
    "batch_id" UUID NOT NULL,
    "batch_number" TEXT NOT NULL,
    "expired_date" DATE NOT NULL,
    "qty" INTEGER NOT NULL,

    CONSTRAINT "stok_keluar_batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "defekta" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "obat_id" UUID NOT NULL,
    "batch_id" UUID NOT NULL,
    "batch_number" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "alasan" TEXT NOT NULL,
    "status" "OpnameStatus" NOT NULL DEFAULT 'PENDING',
    "catatan_admin" TEXT,
    "created_by" UUID NOT NULL,
    "approved_by" UUID,
    "approved_at" TIMESTAMP(3),
    "rejected_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "defekta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stok_opname" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "no_opname" TEXT NOT NULL,
    "status" "OpnameStatus" NOT NULL DEFAULT 'PENDING',
    "tanggal_opname" DATE NOT NULL,
    "catatan" TEXT,
    "created_by" UUID NOT NULL,
    "approved_by" UUID,
    "approved_at" TIMESTAMP(3),
    "rejected_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stok_opname_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opname_item" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "opname_id" UUID NOT NULL,
    "obat_id" UUID NOT NULL,
    "batch_id" UUID NOT NULL,
    "batch_number" TEXT NOT NULL,
    "expired_date" DATE NOT NULL,
    "lokasi_id" UUID NOT NULL,
    "qty_system" INTEGER NOT NULL,
    "qty_fisik" INTEGER NOT NULL,

    CONSTRAINT "opname_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mutasi_lokasi" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "no_mutasi" TEXT NOT NULL,
    "obat_id" UUID NOT NULL,
    "batch_id" UUID NOT NULL,
    "batch_number" TEXT NOT NULL,
    "expired_date" DATE NOT NULL,
    "dari_lokasi_id" UUID NOT NULL,
    "ke_lokasi_id" UUID NOT NULL,
    "qty" INTEGER NOT NULL,
    "catatan" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mutasi_lokasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "no_po" TEXT NOT NULL,
    "supplier_id" UUID NOT NULL,
    "status" "POStatus" NOT NULL DEFAULT 'DRAFT',
    "termin_pembayaran" "TerminPembayaran" NOT NULL,
    "ppn_included" BOOLEAN NOT NULL DEFAULT false,
    "subtotal_nilai" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_ppn" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_nilai" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tanggal_po" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tanggal_kirim" DATE,
    "catatan" TEXT,
    "created_by" UUID NOT NULL,
    "approved_by" UUID,
    "approved_at" TIMESTAMP(3),
    "rejected_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "po_item" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "po_id" UUID NOT NULL,
    "obat_id" UUID NOT NULL,
    "satuan_nama" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "harga_beli" DECIMAL(15,2) NOT NULL,

    CONSTRAINT "po_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "good_receipt" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "no_gr" TEXT NOT NULL,
    "po_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "status" "GRStatus" NOT NULL DEFAULT 'MENUNGGU_KEDATANGAN',
    "tanggal_perkiraan_datang" DATE,
    "tanggal_terima" DATE,
    "catatan" TEXT,
    "catatan_admin" TEXT,
    "catatan_apoteker" TEXT,
    "foto_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "revisi_ke" INTEGER NOT NULL DEFAULT 0,
    "created_by" UUID NOT NULL,
    "approved_by" UUID,
    "approved_at" TIMESTAMP(3),
    "rejected_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "good_receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gr_item" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gr_id" UUID NOT NULL,
    "po_item_id" UUID NOT NULL,
    "obat_id" UUID NOT NULL,
    "satuan_nama" TEXT NOT NULL,
    "qty_po" INTEGER NOT NULL,
    "qty_terima" INTEGER NOT NULL DEFAULT 0,
    "batch_number" TEXT,
    "tanggal_produksi" DATE,
    "expired_date" DATE,
    "harga_beli" DECIMAL(15,2) NOT NULL,
    "lokasi_id" UUID,
    "kondisi" TEXT DEFAULT 'BAIK',
    "keterangan_kondisi" TEXT,

    CONSTRAINT "gr_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gr_revisi" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "gr_id" UUID NOT NULL,
    "revisi_ke" INTEGER NOT NULL,
    "alasan_penolakan" TEXT NOT NULL,
    "catatan_apoteker" TEXT,
    "foto_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "snapshot" JSONB NOT NULL DEFAULT '{}',
    "submitted_by" UUID NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gr_revisi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_invoice" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "no_invoice" TEXT NOT NULL,
    "no_invoice_supplier" TEXT,
    "gr_id" UUID NOT NULL,
    "po_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'BELUM_BAYAR',
    "subtotal_nilai" DECIMAL(15,2),
    "nilai_ppn" DECIMAL(15,2),
    "total_nilai" DECIMAL(15,2) NOT NULL,
    "termin_pembayaran" "TerminPembayaran",
    "tanggal_invoice" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tanggal_jatuh_tempo" DATE,
    "tanggal_bayar" DATE,
    "file_pdf_name" TEXT,
    "catatan" TEXT,
    "created_by" UUID NOT NULL,
    "marked_lunas_by" UUID,
    "marked_lunas_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "user_name" TEXT NOT NULL,
    "user_role" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "before_data" JSONB,
    "after_data" JSONB,
    "ip_address" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "notif_type" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "href" TEXT,
    "target_roles" TEXT[],
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "target_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kategori_kode_key" ON "kategori"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "satuan_nama_key" ON "satuan"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "lokasi_gudang_kode_key" ON "lokasi_gudang"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_kode_key" ON "supplier"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "obat_kode_key" ON "obat"("kode");

-- CreateIndex
CREATE INDEX "obat_kategori_id_idx" ON "obat"("kategori_id");

-- CreateIndex
CREATE INDEX "obat_supplier_id_idx" ON "obat"("supplier_id");

-- CreateIndex
CREATE INDEX "obat_is_active_idx" ON "obat"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "alkes_kode_key" ON "alkes"("kode");

-- CreateIndex
CREATE INDEX "alkes_status_idx" ON "alkes"("status");

-- CreateIndex
CREATE INDEX "alkes_lokasi_id_idx" ON "alkes"("lokasi_id");

-- CreateIndex
CREATE INDEX "batch_obat_id_idx" ON "batch"("obat_id");

-- CreateIndex
CREATE INDEX "batch_status_idx" ON "batch"("status");

-- CreateIndex
CREATE INDEX "batch_expired_date_idx" ON "batch"("expired_date");

-- CreateIndex
CREATE INDEX "batch_lokasi_id_idx" ON "batch"("lokasi_id");

-- CreateIndex
CREATE UNIQUE INDEX "batch_obat_id_batch_number_key" ON "batch"("obat_id", "batch_number");

-- CreateIndex
CREATE INDEX "stok_masuk_obat_id_idx" ON "stok_masuk"("obat_id");

-- CreateIndex
CREATE INDEX "stok_masuk_created_at_idx" ON "stok_masuk"("created_at");

-- CreateIndex
CREATE INDEX "stok_keluar_obat_id_idx" ON "stok_keluar"("obat_id");

-- CreateIndex
CREATE INDEX "stok_keluar_created_at_idx" ON "stok_keluar"("created_at");

-- CreateIndex
CREATE INDEX "defekta_status_idx" ON "defekta"("status");

-- CreateIndex
CREATE INDEX "defekta_obat_id_idx" ON "defekta"("obat_id");

-- CreateIndex
CREATE UNIQUE INDEX "stok_opname_no_opname_key" ON "stok_opname"("no_opname");

-- CreateIndex
CREATE INDEX "stok_opname_status_idx" ON "stok_opname"("status");

-- CreateIndex
CREATE UNIQUE INDEX "mutasi_lokasi_no_mutasi_key" ON "mutasi_lokasi"("no_mutasi");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_order_no_po_key" ON "purchase_order"("no_po");

-- CreateIndex
CREATE INDEX "purchase_order_supplier_id_idx" ON "purchase_order"("supplier_id");

-- CreateIndex
CREATE INDEX "purchase_order_status_idx" ON "purchase_order"("status");

-- CreateIndex
CREATE UNIQUE INDEX "good_receipt_no_gr_key" ON "good_receipt"("no_gr");

-- CreateIndex
CREATE INDEX "good_receipt_po_id_idx" ON "good_receipt"("po_id");

-- CreateIndex
CREATE INDEX "good_receipt_status_idx" ON "good_receipt"("status");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_invoice_no_invoice_key" ON "purchase_invoice"("no_invoice");

-- CreateIndex
CREATE INDEX "purchase_invoice_supplier_id_idx" ON "purchase_invoice"("supplier_id");

-- CreateIndex
CREATE INDEX "purchase_invoice_status_idx" ON "purchase_invoice"("status");

-- CreateIndex
CREATE INDEX "audit_log_user_id_idx" ON "audit_log"("user_id");

-- CreateIndex
CREATE INDEX "audit_log_action_idx" ON "audit_log"("action");

-- CreateIndex
CREATE INDEX "audit_log_entity_type_idx" ON "audit_log"("entity_type");

-- CreateIndex
CREATE INDEX "audit_log_timestamp_idx" ON "audit_log"("timestamp");

-- CreateIndex
CREATE INDEX "notification_is_read_idx" ON "notification"("is_read");

-- CreateIndex
CREATE INDEX "notification_created_at_idx" ON "notification"("created_at");

-- AddForeignKey
ALTER TABLE "lokasi_gudang" ADD CONSTRAINT "lokasi_gudang_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "lokasi_gudang"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obat" ADD CONSTRAINT "obat_kategori_id_fkey" FOREIGN KEY ("kategori_id") REFERENCES "kategori"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obat" ADD CONSTRAINT "obat_satuan_id_fkey" FOREIGN KEY ("satuan_id") REFERENCES "satuan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obat" ADD CONSTRAINT "obat_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "obat" ADD CONSTRAINT "obat_lokasi_default_id_fkey" FOREIGN KEY ("lokasi_default_id") REFERENCES "lokasi_gudang"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alkes" ADD CONSTRAINT "alkes_lokasi_id_fkey" FOREIGN KEY ("lokasi_id") REFERENCES "lokasi_gudang"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kalibrasi_record" ADD CONSTRAINT "kalibrasi_record_alkes_id_fkey" FOREIGN KEY ("alkes_id") REFERENCES "alkes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch" ADD CONSTRAINT "batch_obat_id_fkey" FOREIGN KEY ("obat_id") REFERENCES "obat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batch" ADD CONSTRAINT "batch_lokasi_id_fkey" FOREIGN KEY ("lokasi_id") REFERENCES "lokasi_gudang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stok_masuk" ADD CONSTRAINT "stok_masuk_obat_id_fkey" FOREIGN KEY ("obat_id") REFERENCES "obat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stok_masuk" ADD CONSTRAINT "stok_masuk_lokasi_id_fkey" FOREIGN KEY ("lokasi_id") REFERENCES "lokasi_gudang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stok_masuk" ADD CONSTRAINT "stok_masuk_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stok_keluar" ADD CONSTRAINT "stok_keluar_obat_id_fkey" FOREIGN KEY ("obat_id") REFERENCES "obat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stok_keluar" ADD CONSTRAINT "stok_keluar_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stok_keluar_batch" ADD CONSTRAINT "stok_keluar_batch_stok_keluar_id_fkey" FOREIGN KEY ("stok_keluar_id") REFERENCES "stok_keluar"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stok_keluar_batch" ADD CONSTRAINT "stok_keluar_batch_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defekta" ADD CONSTRAINT "defekta_obat_id_fkey" FOREIGN KEY ("obat_id") REFERENCES "obat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defekta" ADD CONSTRAINT "defekta_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defekta" ADD CONSTRAINT "defekta_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "defekta" ADD CONSTRAINT "defekta_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stok_opname" ADD CONSTRAINT "stok_opname_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stok_opname" ADD CONSTRAINT "stok_opname_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opname_item" ADD CONSTRAINT "opname_item_opname_id_fkey" FOREIGN KEY ("opname_id") REFERENCES "stok_opname"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opname_item" ADD CONSTRAINT "opname_item_obat_id_fkey" FOREIGN KEY ("obat_id") REFERENCES "obat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opname_item" ADD CONSTRAINT "opname_item_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opname_item" ADD CONSTRAINT "opname_item_lokasi_id_fkey" FOREIGN KEY ("lokasi_id") REFERENCES "lokasi_gudang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mutasi_lokasi" ADD CONSTRAINT "mutasi_lokasi_obat_id_fkey" FOREIGN KEY ("obat_id") REFERENCES "obat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mutasi_lokasi" ADD CONSTRAINT "mutasi_lokasi_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mutasi_lokasi" ADD CONSTRAINT "mutasi_lokasi_dari_lokasi_id_fkey" FOREIGN KEY ("dari_lokasi_id") REFERENCES "lokasi_gudang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mutasi_lokasi" ADD CONSTRAINT "mutasi_lokasi_ke_lokasi_id_fkey" FOREIGN KEY ("ke_lokasi_id") REFERENCES "lokasi_gudang"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mutasi_lokasi" ADD CONSTRAINT "mutasi_lokasi_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order" ADD CONSTRAINT "purchase_order_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "po_item" ADD CONSTRAINT "po_item_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "purchase_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "po_item" ADD CONSTRAINT "po_item_obat_id_fkey" FOREIGN KEY ("obat_id") REFERENCES "obat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "good_receipt" ADD CONSTRAINT "good_receipt_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "purchase_order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "good_receipt" ADD CONSTRAINT "good_receipt_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "good_receipt" ADD CONSTRAINT "good_receipt_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "good_receipt" ADD CONSTRAINT "good_receipt_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gr_item" ADD CONSTRAINT "gr_item_gr_id_fkey" FOREIGN KEY ("gr_id") REFERENCES "good_receipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gr_item" ADD CONSTRAINT "gr_item_po_item_id_fkey" FOREIGN KEY ("po_item_id") REFERENCES "po_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gr_item" ADD CONSTRAINT "gr_item_lokasi_id_fkey" FOREIGN KEY ("lokasi_id") REFERENCES "lokasi_gudang"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gr_revisi" ADD CONSTRAINT "gr_revisi_gr_id_fkey" FOREIGN KEY ("gr_id") REFERENCES "good_receipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gr_revisi" ADD CONSTRAINT "gr_revisi_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_invoice" ADD CONSTRAINT "purchase_invoice_gr_id_fkey" FOREIGN KEY ("gr_id") REFERENCES "good_receipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_invoice" ADD CONSTRAINT "purchase_invoice_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_invoice" ADD CONSTRAINT "purchase_invoice_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_invoice" ADD CONSTRAINT "purchase_invoice_marked_lunas_by_fkey" FOREIGN KEY ("marked_lunas_by") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
