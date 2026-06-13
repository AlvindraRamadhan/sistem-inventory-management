# Backend Roadmap — Supabase PostgreSQL + Prisma 7
## Smart Clinic Inventory Management System

> **Diupdate:** 2026-06-07  
> **Stack:** Supabase (Auth + Storage + Realtime) + PostgreSQL + Prisma 7 ORM  
> **Frontend:** Next.js 16 App Router  
> **Backend folder:** `../backend/` (schema management & Prisma)

---

## Arsitektur Keputusan

```
frontend/ (Next.js App Router)
  ├── Supabase Auth     → login, session, middleware
  ├── Prisma Client     → query DB di server components / API routes
  ├── Supabase Storage  → upload foto GR & PDF invoice
  ├── Supabase Realtime → push notification realtime
  └── Axios + TanStack Query → client-side HTTP calls ke API routes

backend/ (Prisma schema management)
  ├── prisma/schema.prisma  → definisi semua model
  ├── prisma/migrations/    → migration history
  └── supabase/migrations/  → RLS + SQL functions (non-Prisma)
```

**Aturan penting:**
- Operasi DB (CRUD) → **Prisma Client** (server-side only)
- Auth, session, token → **Supabase Auth** (`@supabase/ssr`)
- File upload/download → **Supabase Storage**
- Push notifikasi realtime → **Supabase Realtime**
- Prisma TIDAK dipakai di client component (browser)

---

## Status Progress

| Phase | Nama | Status |
|---|---|---|
| 0 | Setup & Dependencies | ✅ SELESAI |
| 1 | Prisma Schema & Migration | 🔲 Belum |
| 2 | RLS Policies (SQL) | 🔲 Belum |
| 3 | Supabase Client Helpers + Middleware | 🔲 Belum |
| 4 | Autentikasi (Ganti Mock Auth) | 🔲 Belum |
| 5 | Service Layer — Master Data | 🔲 Belum |
| 6 | Service Layer — Inventory | 🔲 Belum |
| 7 | Service Layer — Procurement | 🔲 Belum |
| 8 | Service Layer — Analytics & Audit | 🔲 Belum |
| 9 | Storage (Foto GR & PDF Invoice) | 🔲 Belum |
| 10 | Realtime Notifications | 🔲 Belum |
| 11 | Finalisasi & Cleanup | 🔲 Belum |

---

## ✅ PHASE 0 — SELESAI (Tidak Perlu Dijalankan Lagi)

Semua item berikut sudah dikerjakan:

- [x] Folder `backend/` dibuat
- [x] Prisma 7 terinstall (`prisma`, `@prisma/client` ^7.8.0)
- [x] `prisma init` dijalankan
- [x] `prisma.config.ts` dengan dotenv aktif
- [x] Supabase project dibuat & di-link
- [x] Remote schema didownload ke `supabase/migrations/`
- [x] Prisma Client berhasil generate ke `generated/prisma/`
- [x] Dependencies terinstall: axios, bcryptjs, sonner, @supabase/supabase-js, @supabase/ssr, react-query, react-hook-form, zod
- [x] `.env` terkonfigurasi lengkap (DATABASE_URL, DIRECT_URL, SUPABASE keys)

---

---

# PHASE 1 — Prisma Schema & Migration

> Dikerjakan di folder `backend/`

## Step 1.1 — Fix Datasource & Buat Semua Model Prisma

### Prompt:

```
Kita sedang mengerjakan folder backend/ dari sistem inventory klinik.
File prisma/schema.prisma saat ini baru punya generator dan datasource kosong (belum ada model).
prisma.config.ts sudah aktif dengan dotenv dan DATABASE_URL dari .env.

Yang harus dilakukan:

1. Update datasource di prisma/schema.prisma:

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

Penjelasan: DATABASE_URL menggunakan pgbouncer (pooling) untuk runtime, 
DIRECT_URL adalah koneksi langsung untuk prisma migrate.

2. Buat semua ENUM di schema.prisma:

enum UserRole {
  admin
  apoteker
}

enum TipeLokasi {
  GUDANG
  RUANG
  RAK
  LACI
}

enum KondisiPenyimpanan {
  SUHU_RUANG
  DINGIN
  TERKONTROL
}

enum StokStatus {
  AKTIF
  KADALUARSA
  HABIS
  RUSAK
}

enum OpnameStatus {
  PENDING
  APPROVED
  REJECTED
}

enum POStatus {
  DRAFT
  PENDING_APPROVAL
  APPROVED
  SENT
  PARTIAL
  COMPLETED
  CANCELLED
}

enum GRStatus {
  MENUNGGU_KEDATANGAN
  PERLU_INPUT_APOTEKER
  PERLU_REVIEW_ADMIN
  DISETUJUI
  DITOLAK
}

enum InvoiceStatus {
  BELUM_BAYAR
  LUNAS
  JATUH_TEMPO
}

enum AlkesStatus {
  AKTIF
  TIDAK_AKTIF
  DALAM_PERBAIKAN
}

enum KalibrasiStatus {
  TERJADWAL
  SELESAI
  TERLAMBAT
}

enum TerminPembayaran {
  TUJUH_HARI   @map("7_HARI")
  EMPAT_BELAS_HARI  @map("14_HARI")
  TIGA_PULUH_HARI   @map("30_HARI")
  COD
}

3. Buat semua model Prisma sesuai domain sistem inventory:

model Profile {
  id        String   @id @db.Uuid
  name      String
  email     String
  role      UserRole @default(apoteker)
  unit      String?
  avatarUrl String?  @map("avatar_url")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  stokMasukCreated    StokMasuk[]         @relation("StokMasukCreatedBy")
  stokKeluarCreated   StokKeluar[]        @relation("StokKeluarCreatedBy")
  defektaCreated      Defekta[]           @relation("DefektaCreatedBy")
  defektaApproved     Defekta[]           @relation("DefektaApprovedBy")
  opnameCreated       StokOpname[]        @relation("OpnameCreatedBy")
  opnameApproved      StokOpname[]        @relation("OpnameApprovedBy")
  mutasiCreated       MutasiLokasi[]      @relation("MutasiCreatedBy")
  poCreated           PurchaseOrder[]     @relation("POCreatedBy")
  poApproved          PurchaseOrder[]     @relation("POApprovedBy")
  grCreated           GoodReceipt[]       @relation("GRCreatedBy")
  grApproved          GoodReceipt[]       @relation("GRApprovedBy")
  grRevisiSubmitted   GrRevisi[]          @relation("GrRevisiSubmittedBy")
  invoiceCreated      PurchaseInvoice[]   @relation("InvoiceCreatedBy")
  invoiceMarkedLunas  PurchaseInvoice[]   @relation("InvoiceMarkedLunasBy")
  auditLogs           AuditLog[]
  notificationTargets Notification[]

  @@map("profiles")
}

model Kategori {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  kode      String   @unique
  nama      String
  deskripsi String?
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  obat      Obat[]

  @@map("kategori")
}

model Satuan {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  nama      String   @unique
  singkatan String
  createdAt DateTime @default(now()) @map("created_at")
  obat      Obat[]

  @@map("satuan")
}

model LokasiGudang {
  id        String              @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  kode      String              @unique
  nama      String
  tipe      TipeLokasi
  parentId  String?             @map("parent_id") @db.Uuid
  path      String
  kapasitas Int?
  terpakai  Int                 @default(0)
  kondisi   KondisiPenyimpanan  @default(SUHU_RUANG)
  keterangan String?
  createdAt DateTime            @default(now()) @map("created_at")
  updatedAt DateTime            @updatedAt @map("updated_at")

  parent    LokasiGudang?      @relation("LokasiHierarchy", fields: [parentId], references: [id])
  children  LokasiGudang[]     @relation("LokasiHierarchy")

  obatDefault      Obat[]         @relation("ObatLokasiDefault")
  batches          Batch[]
  stokMasuk        StokMasuk[]
  alkesItems       Alkes[]
  grItems          GrItem[]
  opnameItems      OpnameItem[]
  mutasiDari       MutasiLokasi[] @relation("MutasiDariLokasi")
  mutasiKe         MutasiLokasi[] @relation("MutasiKeLokasi")

  @@map("lokasi_gudang")
}

model Supplier {
  id        String            @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  kode      String            @unique
  nama      String
  pic       String?
  telepon   String?
  email     String?
  alamat    String?
  termin    TerminPembayaran  @default(TIGA_PULUH_HARI)
  isActive  Boolean           @default(true) @map("is_active")
  createdAt DateTime          @default(now()) @map("created_at")
  updatedAt DateTime          @updatedAt @map("updated_at")

  obat             Obat[]
  purchaseOrders   PurchaseOrder[]
  goodReceipts     GoodReceipt[]
  purchaseInvoices PurchaseInvoice[]

  @@map("supplier")
}

model Obat {
  id               String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  kode             String    @unique
  nama             String
  namaGenerik      String?   @map("nama_generik")
  kategoriId       String    @map("kategori_id") @db.Uuid
  satuanId         String    @map("satuan_id") @db.Uuid
  supplierId       String?   @map("supplier_id") @db.Uuid
  lokasiDefaultId  String?   @map("lokasi_default_id") @db.Uuid
  stokMinimal      Int       @default(0) @map("stok_minimal")
  stokMaksimal     Int?      @map("stok_maksimal")
  hargaBeli        Decimal   @default(0) @map("harga_beli") @db.Decimal(15, 2)
  hargaJual        Decimal?  @map("harga_jual") @db.Decimal(15, 2)
  stokSaat         Int       @default(0) @map("stok_saat")
  isActive         Boolean   @default(true) @map("is_active")
  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @updatedAt @map("updated_at")

  kategori       Kategori      @relation(fields: [kategoriId], references: [id])
  satuan         Satuan        @relation(fields: [satuanId], references: [id])
  supplier       Supplier?     @relation(fields: [supplierId], references: [id])
  lokasiDefault  LokasiGudang? @relation("ObatLokasiDefault", fields: [lokasiDefaultId], references: [id])

  batches      Batch[]
  stokMasuk    StokMasuk[]
  stokKeluar   StokKeluar[]
  defekta      Defekta[]
  opnameItems  OpnameItem[]
  mutasi       MutasiLokasi[]
  poItems      PoItem[]

  @@index([kategoriId])
  @@index([supplierId])
  @@index([isActive])
  @@map("obat")
}

model Alkes {
  id                          String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  kode                        String      @unique
  nama                        String
  merek                       String?
  model                       String?
  serialNumber                String?     @map("serial_number")
  lokasiId                    String?     @map("lokasi_id") @db.Uuid
  status                      AlkesStatus @default(AKTIF)
  tanggalKalibrasiTerakhir    DateTime?   @map("tanggal_kalibrasi_terakhir") @db.Date
  tanggalKalibrasiSelanjutnya DateTime?   @map("tanggal_kalibrasi_selanjutnya") @db.Date
  createdAt                   DateTime    @default(now()) @map("created_at")
  updatedAt                   DateTime    @updatedAt @map("updated_at")

  lokasi           LokasiGudang?     @relation(fields: [lokasiId], references: [id])
  kalibrasiRecords KalibrasiRecord[]

  @@index([status])
  @@index([lokasiId])
  @@map("alkes")
}

model KalibrasiRecord {
  id                 String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  alkesId            String          @map("alkes_id") @db.Uuid
  status             KalibrasiStatus @default(TERJADWAL)
  tanggalKalibrasi   DateTime?       @map("tanggal_kalibrasi") @db.Date
  tanggalSelanjutnya DateTime        @map("tanggal_selanjutnya") @db.Date
  intervalBulan      Int             @default(12) @map("interval_bulan")
  sertifikatNo       String?         @map("sertifikat_no")
  petugasKalibrasi   String?         @map("petugas_kalibrasi")
  catatan            String?
  createdAt          DateTime        @default(now()) @map("created_at")
  updatedAt          DateTime        @updatedAt @map("updated_at")

  alkes Alkes @relation(fields: [alkesId], references: [id], onDelete: Cascade)

  @@map("kalibrasi_record")
}

model Batch {
  id           String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  obatId       String     @map("obat_id") @db.Uuid
  batchNumber  String     @map("batch_number")
  tglProduksi  DateTime?  @map("tgl_produksi") @db.Date
  expiredDate  DateTime   @map("expired_date") @db.Date
  qty          Int        @default(0)
  lokasiId     String     @map("lokasi_id") @db.Uuid
  hargaBeli    Decimal    @default(0) @map("harga_beli") @db.Decimal(15, 2)
  status       StokStatus @default(AKTIF)
  createdAt    DateTime   @default(now()) @map("created_at")

  obat             Obat         @relation(fields: [obatId], references: [id])
  lokasi           LokasiGudang @relation(fields: [lokasiId], references: [id])
  defekta          Defekta[]
  opnameItems      OpnameItem[]
  stokKeluarBatch  StokKeluarBatch[]
  mutasi           MutasiLokasi[]

  @@unique([obatId, batchNumber])
  @@index([obatId])
  @@index([status])
  @@index([expiredDate])
  @@index([lokasiId])
  @@map("batch")
}

model StokMasuk {
  id            String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  obatId        String    @map("obat_id") @db.Uuid
  batchNumber   String    @map("batch_number")
  expiredDate   DateTime  @map("expired_date") @db.Date
  qty           Int
  lokasiId      String    @map("lokasi_id") @db.Uuid
  hargaBeli     Decimal   @default(0) @map("harga_beli") @db.Decimal(15, 2)
  alasan        String
  referenceId   String?   @map("reference_id")
  referenceType String?   @map("reference_type")
  createdBy     String    @map("created_by") @db.Uuid
  createdAt     DateTime  @default(now()) @map("created_at")

  obat    Obat         @relation(fields: [obatId], references: [id])
  lokasi  LokasiGudang @relation(fields: [lokasiId], references: [id])
  creator Profile      @relation("StokMasukCreatedBy", fields: [createdBy], references: [id])

  @@index([obatId])
  @@index([createdAt])
  @@map("stok_masuk")
}

model StokKeluar {
  id            String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  obatId        String    @map("obat_id") @db.Uuid
  totalQty      Int       @map("total_qty")
  alasan        String
  referenceId   String?   @map("reference_id")
  referenceType String?   @map("reference_type")
  createdBy     String    @map("created_by") @db.Uuid
  createdAt     DateTime  @default(now()) @map("created_at")

  obat    Obat              @relation(fields: [obatId], references: [id])
  creator Profile           @relation("StokKeluarCreatedBy", fields: [createdBy], references: [id])
  batches StokKeluarBatch[]

  @@index([obatId])
  @@index([createdAt])
  @@map("stok_keluar")
}

model StokKeluarBatch {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  stokKeluarId  String   @map("stok_keluar_id") @db.Uuid
  batchId       String   @map("batch_id") @db.Uuid
  batchNumber   String   @map("batch_number")
  expiredDate   DateTime @map("expired_date") @db.Date
  qty           Int

  stokKeluar StokKeluar @relation(fields: [stokKeluarId], references: [id], onDelete: Cascade)
  batch      Batch      @relation(fields: [batchId], references: [id])

  @@map("stok_keluar_batch")
}

model Defekta {
  id              String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  obatId          String       @map("obat_id") @db.Uuid
  batchId         String       @map("batch_id") @db.Uuid
  batchNumber     String       @map("batch_number")
  qty             Int
  alasan          String
  status          OpnameStatus @default(PENDING)
  catatanAdmin    String?      @map("catatan_admin")
  createdBy       String       @map("created_by") @db.Uuid
  approvedBy      String?      @map("approved_by") @db.Uuid
  approvedAt      DateTime?    @map("approved_at")
  rejectedReason  String?      @map("rejected_reason")
  createdAt       DateTime     @default(now()) @map("created_at")
  updatedAt       DateTime     @updatedAt @map("updated_at")

  obat     Obat    @relation(fields: [obatId], references: [id])
  batch    Batch   @relation(fields: [batchId], references: [id])
  creator  Profile @relation("DefektaCreatedBy", fields: [createdBy], references: [id])
  approver Profile? @relation("DefektaApprovedBy", fields: [approvedBy], references: [id])

  @@index([status])
  @@index([obatId])
  @@map("defekta")
}

model StokOpname {
  id              String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  noOpname        String       @unique @map("no_opname")
  status          OpnameStatus @default(PENDING)
  tanggalOpname   DateTime     @map("tanggal_opname") @db.Date
  catatan         String?
  createdBy       String       @map("created_by") @db.Uuid
  approvedBy      String?      @map("approved_by") @db.Uuid
  approvedAt      DateTime?    @map("approved_at")
  rejectedReason  String?      @map("rejected_reason")
  createdAt       DateTime     @default(now()) @map("created_at")
  updatedAt       DateTime     @updatedAt @map("updated_at")

  creator  Profile      @relation("OpnameCreatedBy", fields: [createdBy], references: [id])
  approver Profile?     @relation("OpnameApprovedBy", fields: [approvedBy], references: [id])
  items    OpnameItem[]

  @@index([status])
  @@map("stok_opname")
}

model OpnameItem {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  opnameId    String   @map("opname_id") @db.Uuid
  obatId      String   @map("obat_id") @db.Uuid
  batchId     String   @map("batch_id") @db.Uuid
  batchNumber String   @map("batch_number")
  expiredDate DateTime @map("expired_date") @db.Date
  lokasiId    String   @map("lokasi_id") @db.Uuid
  qtySystem   Int      @map("qty_system")
  qtyFisik    Int      @map("qty_fisik")

  opname Stok0pname   @relation(fields: [opnameId], references: [id], onDelete: Cascade)
  obat   Obat         @relation(fields: [obatId], references: [id])
  batch  Batch        @relation(fields: [batchId], references: [id])
  lokasi LokasiGudang @relation(fields: [lokasiId], references: [id])

  @@map("opname_item")
}

model MutasiLokasi {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  noMutasi       String   @unique @map("no_mutasi")
  obatId         String   @map("obat_id") @db.Uuid
  batchId        String   @map("batch_id") @db.Uuid
  batchNumber    String   @map("batch_number")
  expiredDate    DateTime @map("expired_date") @db.Date
  dariLokasiId   String   @map("dari_lokasi_id") @db.Uuid
  keLokasiId     String   @map("ke_lokasi_id") @db.Uuid
  qty            Int
  catatan        String?
  createdBy      String   @map("created_by") @db.Uuid
  createdAt      DateTime @default(now()) @map("created_at")

  obat       Obat         @relation(fields: [obatId], references: [id])
  batch      Batch        @relation(fields: [batchId], references: [id])
  dariLokasi LokasiGudang @relation("MutasiDariLokasi", fields: [dariLokasiId], references: [id])
  keLokasi   LokasiGudang @relation("MutasiKeLokasi", fields: [keLokasiId], references: [id])
  creator    Profile      @relation("MutasiCreatedBy", fields: [createdBy], references: [id])

  @@map("mutasi_lokasi")
}

model PurchaseOrder {
  id                String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  noPo              String           @unique @map("no_po")
  supplierId        String           @map("supplier_id") @db.Uuid
  status            POStatus         @default(DRAFT)
  terminPembayaran  TerminPembayaran @map("termin_pembayaran")
  ppnIncluded       Boolean          @default(false) @map("ppn_included")
  subtotalNilai     Decimal          @default(0) @map("subtotal_nilai") @db.Decimal(15, 2)
  totalPpn          Decimal          @default(0) @map("total_ppn") @db.Decimal(15, 2)
  totalNilai        Decimal          @default(0) @map("total_nilai") @db.Decimal(15, 2)
  tanggalPo         DateTime         @default(now()) @map("tanggal_po") @db.Date
  tanggalKirim      DateTime?        @map("tanggal_kirim") @db.Date
  catatan           String?
  createdBy         String           @map("created_by") @db.Uuid
  approvedBy        String?          @map("approved_by") @db.Uuid
  approvedAt        DateTime?        @map("approved_at")
  rejectedReason    String?          @map("rejected_reason")
  createdAt         DateTime         @default(now()) @map("created_at")
  updatedAt         DateTime         @updatedAt @map("updated_at")

  supplier     Supplier      @relation(fields: [supplierId], references: [id])
  creator      Profile       @relation("POCreatedBy", fields: [createdBy], references: [id])
  approver     Profile?      @relation("POApprovedBy", fields: [approvedBy], references: [id])
  items        PoItem[]
  goodReceipts GoodReceipt[]

  @@index([supplierId])
  @@index([status])
  @@map("purchase_order")
}

model PoItem {
  id         String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  poId       String  @map("po_id") @db.Uuid
  obatId     String  @map("obat_id") @db.Uuid
  satuanNama String  @map("satuan_nama")
  qty        Int
  hargaBeli  Decimal @map("harga_beli") @db.Decimal(15, 2)

  po      PurchaseOrder @relation(fields: [poId], references: [id], onDelete: Cascade)
  obat    Obat          @relation(fields: [obatId], references: [id])
  grItems GrItem[]

  @@map("po_item")
}

model GoodReceipt {
  id                      String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  noGr                    String   @unique @map("no_gr")
  poId                    String   @map("po_id") @db.Uuid
  supplierId              String   @map("supplier_id") @db.Uuid
  status                  GRStatus @default(MENUNGGU_KEDATANGAN)
  tanggalPerkiraanDatang  DateTime? @map("tanggal_perkiraan_datang") @db.Date
  tanggalTerima           DateTime? @map("tanggal_terima") @db.Date
  catatan                 String?
  catatanAdmin            String?  @map("catatan_admin")
  catatanApoteker         String?  @map("catatan_apoteker")
  fotoUrls                String[] @default([]) @map("foto_urls")
  revisiKe                Int      @default(0) @map("revisi_ke")
  createdBy               String   @map("created_by") @db.Uuid
  approvedBy              String?  @map("approved_by") @db.Uuid
  approvedAt              DateTime? @map("approved_at")
  rejectedReason          String?  @map("rejected_reason")
  createdAt               DateTime @default(now()) @map("created_at")
  updatedAt               DateTime @updatedAt @map("updated_at")

  po               PurchaseOrder     @relation(fields: [poId], references: [id])
  supplier         Supplier          @relation(fields: [supplierId], references: [id])
  creator          Profile           @relation("GRCreatedBy", fields: [createdBy], references: [id])
  approver         Profile?          @relation("GRApprovedBy", fields: [approvedBy], references: [id])
  items            GrItem[]
  riwayatRevisi    GrRevisi[]
  purchaseInvoices PurchaseInvoice[]

  @@index([poId])
  @@index([status])
  @@map("good_receipt")
}

model GrItem {
  id                  String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  grId                String  @map("gr_id") @db.Uuid
  poItemId            String  @map("po_item_id") @db.Uuid
  obatId              String  @map("obat_id") @db.Uuid
  satuanNama          String  @map("satuan_nama")
  qtyPo               Int     @map("qty_po")
  qtyTerima           Int     @default(0) @map("qty_terima")
  batchNumber         String? @map("batch_number")
  tanggalProduksi     DateTime? @map("tanggal_produksi") @db.Date
  expiredDate         DateTime? @map("expired_date") @db.Date
  hargaBeli           Decimal @map("harga_beli") @db.Decimal(15, 2)
  lokasiId            String? @map("lokasi_id") @db.Uuid
  kondisi             String? @default("BAIK")
  keteranganKondisi   String? @map("keterangan_kondisi")

  gr      GoodReceipt   @relation(fields: [grId], references: [id], onDelete: Cascade)
  poItem  PoItem        @relation(fields: [poItemId], references: [id])
  lokasi  LokasiGudang? @relation(fields: [lokasiId], references: [id])

  @@map("gr_item")
}

model GrRevisi {
  id               String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  grId             String   @map("gr_id") @db.Uuid
  revisiKe         Int      @map("revisi_ke")
  alasanPenolakan  String   @map("alasan_penolakan")
  catatanApoteker  String?  @map("catatan_apoteker")
  fotoUrls         String[] @default([]) @map("foto_urls")
  snapshot         Json     @default("{}")
  submittedBy      String   @map("submitted_by") @db.Uuid
  submittedAt      DateTime @default(now()) @map("submitted_at")

  gr          GoodReceipt @relation(fields: [grId], references: [id], onDelete: Cascade)
  submittedBy_ Profile    @relation("GrRevisiSubmittedBy", fields: [submittedBy], references: [id])

  @@map("gr_revisi")
}

model PurchaseInvoice {
  id                 String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  noInvoice          String          @unique @map("no_invoice")
  noInvoiceSupplier  String?         @map("no_invoice_supplier")
  grId               String          @map("gr_id") @db.Uuid
  poId               String          @map("po_id") @db.Uuid
  supplierId         String          @map("supplier_id") @db.Uuid
  status             InvoiceStatus   @default(BELUM_BAYAR)
  subtotalNilai      Decimal?        @map("subtotal_nilai") @db.Decimal(15, 2)
  nilaiPpn           Decimal?        @map("nilai_ppn") @db.Decimal(15, 2)
  totalNilai         Decimal         @map("total_nilai") @db.Decimal(15, 2)
  terminPembayaran   TerminPembayaran? @map("termin_pembayaran")
  tanggalInvoice     DateTime        @default(now()) @map("tanggal_invoice") @db.Date
  tanggalJatuhTempo  DateTime?       @map("tanggal_jatuh_tempo") @db.Date
  tanggalBayar       DateTime?       @map("tanggal_bayar") @db.Date
  filePdfName        String?         @map("file_pdf_name")
  catatan            String?
  createdBy          String          @map("created_by") @db.Uuid
  markedLunasByUid   String?         @map("marked_lunas_by") @db.Uuid
  markedLunasAt      DateTime?       @map("marked_lunas_at")
  createdAt          DateTime        @default(now()) @map("created_at")
  updatedAt          DateTime        @updatedAt @map("updated_at")

  gr            GoodReceipt     @relation(fields: [grId], references: [id])
  supplier      Supplier        @relation(fields: [supplierId], references: [id])
  creator       Profile         @relation("InvoiceCreatedBy", fields: [createdBy], references: [id])
  markedLunasByProfile Profile? @relation("InvoiceMarkedLunasBy", fields: [markedLunasByUid], references: [id])

  @@index([supplierId])
  @@index([status])
  @@map("purchase_invoice")
}

model AuditLog {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  userName    String   @map("user_name")
  userRole    String   @map("user_role")
  action      String
  entityType  String   @map("entity_type")
  entityId    String   @map("entity_id")
  description String
  beforeData  Json?    @map("before_data")
  afterData   Json?    @map("after_data")
  ipAddress   String?  @map("ip_address")
  timestamp   DateTime @default(now())

  user Profile @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([action])
  @@index([entityType])
  @@index([timestamp])
  @@map("audit_log")
}

model Notification {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  notifType     String   @map("notif_type")
  type          String
  title         String
  message       String
  href          String?
  targetRoles   String[] @map("target_roles")
  isRead        Boolean  @default(false) @map("is_read")
  targetUserId  String?  @map("target_user_id") @db.Uuid
  createdAt     DateTime @default(now()) @map("created_at")

  targetUser Profile? @relation(fields: [targetUserId], references: [id])

  @@index([isRead])
  @@index([createdAt])
  @@map("notification")
}

Setelah semua model ditulis, jalankan:
npx prisma format

Pastikan tidak ada syntax error sebelum lanjut ke step berikutnya.
```

---

## Step 1.2 — Jalankan Migration ke Supabase

### Prompt:

```
Kita sudah punya schema.prisma lengkap dengan semua model. Sekarang jalankan migration ke Supabase.

Dari folder backend/, jalankan perintah berikut:

npx prisma migrate dev --name init_schema

Penjelasan:
- Perintah ini membaca DIRECT_URL dari .env (koneksi langsung, bukan pooler)
- Membuat file migration di prisma/migrations/
- Menjalankan migration ke database Supabase

Jika berhasil, semua tabel akan terbuat di database Supabase PostgreSQL.
Jika ada error relasi atau constraint, baca pesan error dengan teliti dan perbaiki schema.prisma.

Setelah berhasil, verifikasi tabel sudah terbuat dengan:
npx prisma studio

Atau cek di Supabase Dashboard → Table Editor — semua tabel harus sudah terlihat.

JANGAN lanjut ke step berikutnya jika ada error migration.
```

---

## Step 1.3 — Setup Prisma Client di Frontend

### Prompt:

```
Kita perlu menggunakan Prisma Client di frontend Next.js untuk query database dari server components dan API routes.

Dari folder frontend/, lakukan:

1. Install Prisma dependencies:
   npm install prisma @prisma/client

2. Buat file prisma/schema.prisma di frontend/ yang isinya SAMA PERSIS dengan backend/prisma/schema.prisma
   (copy paste - keduanya harus selalu sinkron)

3. Update .env.local di frontend/ (jika belum ada):
   DATABASE_URL="postgresql://postgres.zisfxvjhsamlmbwqqdmp:smart-clinic123@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.zisfxvjhsamlmbwqqdmp:smart-clinic123@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"

4. Generate Prisma client di frontend/:
   npx prisma generate

5. Buat file src/lib/prisma.ts sebagai singleton Prisma client:

import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

Singleton pattern ini mencegah hot-reload Next.js membuat koneksi Prisma baru setiap kali.

6. Tambahkan ke package.json scripts:
   "postinstall": "prisma generate"

Ini memastikan Prisma client di-regenerate setiap kali npm install dijalankan.

PENTING: Prisma client HANYA boleh diimport di:
- Server Components (async components)
- API Route Handlers (app/api/route.ts)
- Server Actions ('use server')
JANGAN import prisma di client components ('use client').
```

---

---

# PHASE 2 — RLS Policies (SQL via Supabase)

> Prisma tidak bisa membuat RLS policies — ini harus dilakukan via SQL langsung di Supabase.

## Step 2.1 — RLS Policies Semua Tabel

### Prompt:

```
Buat SQL untuk mengaktifkan Row Level Security (RLS) dan semua policies di Supabase.
Jalankan di Supabase Dashboard → SQL Editor.

PENTING: Jalankan bagian-bagian ini secara terpisah, jangan sekaligus semua.

--- BAGIAN 1: Helper Functions ---

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE SQL STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    auth.jwt() -> 'user_metadata' ->> 'role',
    auth.jwt() ->> 'role'
  )
$$;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
AS $$
  SELECT get_my_role() = 'admin'
$$;

CREATE OR REPLACE FUNCTION is_apoteker()
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER
AS $$
  SELECT get_my_role() = 'apoteker'
$$;

--- BAGIAN 2: Tabel Profiles ---

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  USING (id = auth.uid() OR is_admin());

CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

--- BAGIAN 3: Master Data (kategori, satuan, lokasi_gudang, supplier, obat, alkes) ---

ALTER TABLE kategori ENABLE ROW LEVEL SECURITY;
ALTER TABLE satuan ENABLE ROW LEVEL SECURITY;
ALTER TABLE lokasi_gudang ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier ENABLE ROW LEVEL SECURITY;
ALTER TABLE obat ENABLE ROW LEVEL SECURITY;
ALTER TABLE alkes ENABLE ROW LEVEL SECURITY;
ALTER TABLE kalibrasi_record ENABLE ROW LEVEL SECURITY;

-- Semua authenticated user bisa SELECT, hanya admin yang bisa write
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['kategori','satuan','lokasi_gudang','supplier','obat','alkes','kalibrasi_record'] LOOP
    EXECUTE format('CREATE POLICY "%s_select_auth" ON %I FOR SELECT USING (auth.uid() IS NOT NULL)', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_insert_admin" ON %I FOR INSERT WITH CHECK (is_admin())', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_update_admin" ON %I FOR UPDATE USING (is_admin())', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_delete_admin" ON %I FOR DELETE USING (is_admin())', tbl, tbl);
  END LOOP;
END $$;

--- BAGIAN 4: Inventory ---

ALTER TABLE batch ENABLE ROW LEVEL SECURITY;
ALTER TABLE stok_masuk ENABLE ROW LEVEL SECURITY;
ALTER TABLE stok_keluar ENABLE ROW LEVEL SECURITY;
ALTER TABLE stok_keluar_batch ENABLE ROW LEVEL SECURITY;
ALTER TABLE defekta ENABLE ROW LEVEL SECURITY;
ALTER TABLE stok_opname ENABLE ROW LEVEL SECURITY;
ALTER TABLE opname_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE mutasi_lokasi ENABLE ROW LEVEL SECURITY;

-- Batch: semua bisa SELECT, admin & apoteker bisa INSERT/UPDATE, hanya admin DELETE
CREATE POLICY "batch_select" ON batch FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "batch_insert" ON batch FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "batch_update" ON batch FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "batch_delete" ON batch FOR DELETE USING (is_admin());

-- Stok masuk/keluar: semua SELECT, admin+apoteker INSERT, hanya admin UPDATE/DELETE
DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['stok_masuk','stok_keluar','stok_keluar_batch','mutasi_lokasi'] LOOP
    EXECUTE format('CREATE POLICY "%s_select" ON %I FOR SELECT USING (auth.uid() IS NOT NULL)', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_insert" ON %I FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_update_admin" ON %I FOR UPDATE USING (is_admin())', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_delete_admin" ON %I FOR DELETE USING (is_admin())', tbl, tbl);
  END LOOP;
END $$;

-- Defekta: semua SELECT, apoteker INSERT, admin UPDATE
CREATE POLICY "defekta_select" ON defekta FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "defekta_insert_apoteker" ON defekta FOR INSERT WITH CHECK (is_apoteker());
CREATE POLICY "defekta_update_admin" ON defekta FOR UPDATE USING (is_admin());

-- Stok opname: semua SELECT, semua INSERT, apoteker dan admin UPDATE
CREATE POLICY "opname_select" ON stok_opname FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "opname_insert" ON stok_opname FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "opname_update" ON stok_opname FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "opname_item_select" ON opname_item FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "opname_item_write" ON opname_item FOR ALL USING (auth.uid() IS NOT NULL);

--- BAGIAN 5: Procurement ---

ALTER TABLE purchase_order ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE good_receipt ENABLE ROW LEVEL SECURITY;
ALTER TABLE gr_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE gr_revisi ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoice ENABLE ROW LEVEL SECURITY;

CREATE POLICY "po_select" ON purchase_order FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "po_insert" ON purchase_order FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "po_update" ON purchase_order FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "po_delete_admin" ON purchase_order FOR DELETE USING (is_admin());

DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['po_item','gr_item','gr_revisi'] LOOP
    EXECUTE format('CREATE POLICY "%s_select" ON %I FOR SELECT USING (auth.uid() IS NOT NULL)', tbl, tbl);
    EXECUTE format('CREATE POLICY "%s_write" ON %I FOR ALL USING (auth.uid() IS NOT NULL)', tbl, tbl);
  END LOOP;
END $$;

CREATE POLICY "gr_select" ON good_receipt FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "gr_write" ON good_receipt FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "invoice_select" ON purchase_invoice FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "invoice_insert_admin" ON purchase_invoice FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "invoice_update_admin" ON purchase_invoice FOR UPDATE USING (is_admin());

--- BAGIAN 6: Audit Log & Notification ---

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_select_admin" ON audit_log FOR SELECT USING (is_admin());
CREATE POLICY "audit_log_insert_auth" ON audit_log FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "notification_select_role" ON notification FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      target_user_id = auth.uid() OR
      get_my_role() = ANY(target_roles)
    )
  );

CREATE POLICY "notification_insert_service" ON notification FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "notification_update_read" ON notification FOR UPDATE
  USING (target_user_id = auth.uid() OR get_my_role() = ANY(target_roles));

--- BAGIAN 7: Aktifkan Realtime ---

ALTER PUBLICATION supabase_realtime ADD TABLE notification;

Verifikasi setelah semua selesai:
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
Semua tabel harus rowsecurity = true.
```

---

---

# PHASE 3 — Supabase Client Helpers + Middleware

> Dikerjakan di folder `frontend/`

## Step 3.1 — Supabase Client Helpers

### Prompt:

```
Buat Supabase client helpers di frontend Next.js untuk Auth, Storage, dan Realtime.
File-file ini TIDAK digunakan untuk query database (Prisma yang handle itu).

Buat 3 file berikut:

1. src/lib/supabase/client.ts
   Browser client — dipakai di client components untuk Auth state

import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

2. src/lib/supabase/server.ts
   Server client — dipakai di server components, server actions, route handlers

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

3. src/lib/supabase/middleware.ts
   Untuk refresh session token di middleware

import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  return { supabaseResponse, user }
}
```

---

## Step 3.2 — Next.js Middleware

### Prompt:

```
Buat file src/middleware.ts di frontend Next.js untuk proteksi route.

import { updateSession } from "@/lib/supabase/middleware"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)
  const { pathname } = request.nextUrl

  const isProtectedAdmin = pathname.startsWith("/admin")
  const isProtectedApoteker = pathname.startsWith("/apoteker")
  const isAuthPage = pathname === "/login" || pathname === "/"

  // Redirect ke login jika tidak ada session
  if ((isProtectedAdmin || isProtectedApoteker) && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    return NextResponse.redirect(loginUrl)
  }

  // Redirect ke dashboard sesuai role jika sudah login dan akses /login
  if (isAuthPage && user) {
    const role = user.user_metadata?.role as string | undefined
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = role === "admin" ? "/admin/dashboard" : "/apoteker/dashboard"
    return NextResponse.redirect(redirectUrl)
  }

  // Guard: apoteker tidak boleh akses /admin (kecuali shared routes)
  if (isProtectedAdmin && user?.user_metadata?.role === "apoteker") {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/apoteker/dashboard"
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
```

---

---

# PHASE 4 — Autentikasi (Ganti Mock Auth)

## Step 4.1 — Auth Service + Supabase Auth

### Prompt:

```
Ganti implementasi mock di src/services/auth.service.ts dengan Supabase Auth.
Juga update Zustand auth store untuk sync dengan Supabase session.

1. Rewrite src/services/auth.service.ts:

import { createClient } from "@/lib/supabase/client"

export async function login(email: string, password: string) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  return data
}

export async function logout() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}

export async function getSession() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getCurrentUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  
  // Map Supabase user ke interface User yang ada di src/types/auth.ts
  return {
    id: user.id,
    name: user.user_metadata?.name ?? user.email ?? "",
    email: user.email ?? "",
    role: user.user_metadata?.role ?? "apoteker",
    avatar: user.user_metadata?.avatar_url,
    unit: user.user_metadata?.unit,
  }
}

2. Update src/store/auth-store.ts (Zustand):
   - Tambah initializeFromSession(): panggil getCurrentUser(), set user dan isAuthenticated
   - Tambah listenToAuthChanges(): subscribe ke supabase.auth.onAuthStateChange
   - Di onAuthStateChange: jika event = SIGNED_IN, set user; jika SIGNED_OUT, clear user

3. Buat src/components/providers/auth-provider.tsx (client component):
   - "use client"
   - useEffect yang memanggil initializeFromSession() saat mount
   - Memanggil listenToAuthChanges() dan cleanup subscription saat unmount
   - Wrap children

4. Tambahkan AuthProvider ke src/app/layout.tsx (atau layout yang membungkus semua dashboard routes)

Jangan ubah interface User di src/types/auth.ts — pastikan mapping dari Supabase ke interface tetap sama.
```

---

## Step 4.2 — Seed Data User & Master Data Awal

### Prompt:

```
Buat user testing dan seed data awal untuk sistem inventory klinik.

BAGIAN 1: Buat user via Supabase Dashboard
Buka Supabase Dashboard → Authentication → Users → Add User

User 1 (Admin):
  Email: admin@klinik.com
  Password: Admin@123
  Email Confirm: Centang (langsung verify)
  User Metadata (JSON): {"name": "Administrator", "role": "admin"}

User 2 (Apoteker):
  Email: apoteker@klinik.com
  Password: Apoteker@123
  Email Confirm: Centang
  User Metadata (JSON): {"name": "Apoteker Utama", "role": "apoteker"}

BAGIAN 2: SQL seed data master di Supabase SQL Editor

-- Kategori
INSERT INTO kategori (kode, nama, deskripsi) VALUES
('KAT-001', 'Antibiotik', 'Obat untuk infeksi bakteri'),
('KAT-002', 'Analgesik', 'Obat pereda nyeri'),
('KAT-003', 'Vitamin & Suplemen', 'Vitamin dan suplemen kesehatan'),
('KAT-004', 'Antihipertensi', 'Obat tekanan darah tinggi'),
('KAT-005', 'Antidiabetik', 'Obat diabetes');

-- Satuan
INSERT INTO satuan (nama, singkatan) VALUES
('Tablet', 'Tab'),
('Kapsul', 'Kap'),
('Botol', 'Bot'),
('Ampul', 'Amp'),
('Sachet', 'Scht');

-- Lokasi Gudang
INSERT INTO lokasi_gudang (kode, nama, tipe, parent_id, path, kapasitas, kondisi) VALUES
('GDG-001', 'Gudang Utama', 'GUDANG', NULL, 'Gudang Utama', 1000, 'SUHU_RUANG');

-- Dapatkan ID gudang utama lalu buat ruang
DO $$
DECLARE
  gdg_id UUID;
  ruang_a_id UUID;
  ruang_b_id UUID;
BEGIN
  SELECT id INTO gdg_id FROM lokasi_gudang WHERE kode = 'GDG-001';
  
  INSERT INTO lokasi_gudang (kode, nama, tipe, parent_id, path, kapasitas, kondisi)
  VALUES ('RNG-001', 'Ruang A', 'RUANG', gdg_id, 'Gudang Utama / Ruang A', 500, 'SUHU_RUANG')
  RETURNING id INTO ruang_a_id;
  
  INSERT INTO lokasi_gudang (kode, nama, tipe, parent_id, path, kapasitas, kondisi)
  VALUES ('RNG-002', 'Ruang B (Pendingin)', 'RUANG', gdg_id, 'Gudang Utama / Ruang B (Pendingin)', 200, 'DINGIN')
  RETURNING id INTO ruang_b_id;
  
  INSERT INTO lokasi_gudang (kode, nama, tipe, parent_id, path, kapasitas) VALUES
  ('RAK-001', 'Rak 01', 'RAK', ruang_a_id, 'Gudang Utama / Ruang A / Rak 01', 100),
  ('RAK-002', 'Rak 02', 'RAK', ruang_a_id, 'Gudang Utama / Ruang A / Rak 02', 100),
  ('RAK-003', 'Rak Dingin 01', 'RAK', ruang_b_id, 'Gudang Utama / Ruang B / Rak Dingin 01', 50);
END $$;

-- Supplier contoh
INSERT INTO supplier (kode, nama, pic, telepon, email, alamat, termin) VALUES
('SUP-001', 'PT Kimia Farma', 'Budi Santoso', '021-1234567', 'budi@kimiafarma.co.id', 'Jakarta Selatan', '30_HARI'),
('SUP-002', 'PT Kalbe Farma', 'Siti Rahayu', '021-7654321', 'siti@kalbe.co.id', 'Bekasi', '14_HARI');

Setelah seed berhasil, test login di frontend menggunakan kedua user di atas.
Pastikan redirect ke dashboard yang benar sesuai role.
```

---

---

# PHASE 5 — Service Layer: Master Data

> Pola yang dipakai: **Prisma di server, Axios + TanStack Query di client**
> 
> Setiap entitas akan memiliki:
> - `src/app/api/[entity]/route.ts` — API Route Handler (Prisma)
> - `src/services/[entity].service.ts` — Frontend caller (Axios)

## Step 5.1 — Service Lokasi Gudang

### Prompt:

```
Ganti implementasi mock lokasi gudang dengan Prisma + API Routes.

Struktur yang dibuat:

1. src/app/api/lokasi-gudang/route.ts (GET all, POST create)
2. src/app/api/lokasi-gudang/[id]/route.ts (GET by id, PATCH update, DELETE)

Untuk GET /api/lokasi-gudang:
  import { prisma } from "@/lib/prisma"
  Jalankan: await prisma.lokasiGudang.findMany({ orderBy: [{ tipe: 'asc' }, { nama: 'asc' }] })
  Return JSON response

Untuk POST /api/lokasi-gudang:
  Validasi body dengan Zod (schema yang sudah ada di src/lib/validations/)
  Jika parentId ada, ambil parent untuk build path: parent.path + " / " + nama
  await prisma.lokasiGudang.create({ data: { ...body, path } })

Untuk PATCH /api/lokasi-gudang/[id]:
  await prisma.lokasiGudang.update({ where: { id }, data })

Untuk DELETE /api/lokasi-gudang/[id]:
  Cek dulu apakah ada batch yang pakai lokasi ini:
  const batchCount = await prisma.batch.count({ where: { lokasiId: id } })
  Jika > 0, return 400 error: "Lokasi masih digunakan oleh batch aktif"
  Jika aman: await prisma.lokasiGudang.delete({ where: { id } })

3. Update src/services/lokasi-gudang.service.ts (client-side, pakai Axios):
  import axios from "axios"
  
  export const lokasiGudangService = {
    getAll: () => axios.get('/api/lokasi-gudang').then(r => r.data),
    getById: (id: string) => axios.get(`/api/lokasi-gudang/${id}`).then(r => r.data),
    create: (data: CreateLokasiInput) => axios.post('/api/lokasi-gudang', data).then(r => r.data),
    update: (id: string, data: UpdateLokasiInput) => axios.patch(`/api/lokasi-gudang/${id}`, data).then(r => r.data),
    delete: (id: string) => axios.delete(`/api/lokasi-gudang/${id}`).then(r => r.data),
  }

4. Pastikan mapping snake_case DB → camelCase TypeScript di API response handler
   (Prisma sudah auto-map jika schema menggunakan @map)

Gunakan pola yang sama ini untuk semua service berikutnya.
```

---

## Step 5.2 — Service Kategori, Satuan, Obat

### Prompt:

```
Buat API Routes dan service untuk kategori, satuan, dan obat menggunakan Prisma.

Untuk src/app/api/obat/route.ts (GET dengan filter, POST create):

GET /api/obat dengan query params: page, limit, search, kategoriId, isActive
  const obat = await prisma.obat.findMany({
    where: {
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      kategoriId: kategoriId || undefined,
      OR: search ? [
        { nama: { contains: search, mode: 'insensitive' } },
        { kode: { contains: search, mode: 'insensitive' } },
      ] : undefined,
    },
    include: {
      kategori: { select: { id: true, nama: true } },
      satuan: { select: { id: true, nama: true, singkatan: true } },
      supplier: { select: { id: true, nama: true } },
    },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { nama: 'asc' },
  })

  const total = await prisma.obat.count({ where: /* same conditions */ })

  Return: { data: obat, meta: { total, page, limit, totalPages } }

POST /api/obat:
  Auto-generate kode jika tidak diisi:
  const lastObat = await prisma.obat.findFirst({ orderBy: { kode: 'desc' }, where: { kode: { startsWith: 'OBT-' } } })
  const nextNum = lastObat ? parseInt(lastObat.kode.slice(4)) + 1 : 1
  const kode = `OBT-${String(nextNum).padStart(3, '0')}`

Buat pola yang sama untuk kategori (KAT-) dan satuan.

Update src/services/obat.service.ts, src/services/kategori.service.ts menggunakan Axios.

Untuk src/services/obat.service.ts pastikan ada fungsi:
- getAll(params?): dengan semua filter
- getById(id)
- create(data)
- update(id, data)
- softDelete(id): PATCH isActive = false
- getStokSummary(id): GET /api/obat/{id}/stok

Buat src/app/api/obat/[id]/stok/route.ts:
  const result = await prisma.batch.aggregate({
    where: { obatId: id, status: 'AKTIF', qty: { gt: 0 } },
    _sum: { qty: true },
  })
  return { stokTotal: result._sum.qty ?? 0 }
```

---

## Step 5.3 — Service Supplier & Alkes

### Prompt:

```
Buat API Routes + service untuk supplier dan alkes menggunakan Prisma.

Untuk supplier (src/app/api/supplier/):
GET /api/supplier: findMany dengan filter search (nama, kode, email), isActive, pagination
POST /api/supplier: create, auto-generate kode SUP-NNN
PATCH /api/supplier/[id]: update
PATCH /api/supplier/[id]/toggle-active: { isActive: !current.isActive }

Untuk alkes (src/app/api/alkes/):
GET /api/alkes: findMany dengan include lokasi, filter status
POST /api/alkes: create, auto-generate kode ALK-NNN
PATCH /api/alkes/[id]: update

GET /api/alkes/[id]/kalibrasi: SELECT kalibrasi_record WHERE alkes_id = id ORDER BY createdAt DESC
POST /api/alkes/[id]/kalibrasi:
  1. INSERT kalibrasi_record (status: SELESAI)
  2. UPDATE alkes SET:
     tanggalKalibrasiTerakhir = tanggalKalibrasi
     tanggalKalibrasiSelanjutnya = tanggalSelanjutnya
     status = 'AKTIF'

Gunakan Prisma transaction untuk operasi yang multi-step:
await prisma.$transaction([
  prisma.kalibrasiRecord.create({ data: kalibrasiData }),
  prisma.alkes.update({ where: { id: alkesId }, data: updateData })
])

Update src/services/supplier.service.ts dan src/services/alkes.service.ts menggunakan Axios.
```

---

---

# PHASE 6 — Service Layer: Inventory

## Step 6.1 — Service Batch & Stok Masuk

### Prompt:

```
Buat API Routes + service untuk batch dan stok masuk menggunakan Prisma.

src/app/api/batch/route.ts:
GET: findMany dengan include obat, lokasi. Filter: obatId, status, expiredBefore (untuk alert ED)
  Untuk FEFO ordering: orderBy: { expiredDate: 'asc' }

GET /api/batch?obatId=X&status=AKTIF&orderBy=fefo:
  Dipakai saat form stok keluar untuk pilih batch yang tersedia

POST /api/stok-masuk (src/app/api/stok-masuk/route.ts):
  Body: { obatId, batchNumber, expiredDate, qty, lokasiId, hargaBeli, alasan, referenceId?, referenceType? }
  
  Gunakan Prisma interactive transaction untuk atomic operation:
  
  const result = await prisma.$transaction(async (tx) => {
    // 1. Cek apakah batch sudah ada
    const existingBatch = await tx.batch.findUnique({
      where: { obatId_batchNumber: { obatId, batchNumber } }
    })
    
    // 2. Upsert batch
    const batch = existingBatch
      ? await tx.batch.update({
          where: { id: existingBatch.id },
          data: { qty: { increment: qty } }
        })
      : await tx.batch.create({
          data: { obatId, batchNumber, expiredDate, qty, lokasiId, hargaBeli, status: 'AKTIF' }
        })
    
    // 3. Insert stok masuk record
    const stokMasuk = await tx.stokMasuk.create({
      data: { obatId, batchNumber, expiredDate, qty, lokasiId, hargaBeli, alasan, referenceId, referenceType, createdBy: userId }
    })
    
    // 4. Update stok_saat di obat
    await tx.obat.update({
      where: { id: obatId },
      data: { stokSaat: { increment: qty } }
    })
    
    return { stokMasuk, batch }
  })
  
  // 5. Log audit (di luar transaction — non-critical)
  await logAction({ ... })
  
  return result

Update src/services/stok-masuk.service.ts menggunakan Axios.
```

---

## Step 6.2 — Service Stok Keluar & Defekta

### Prompt:

```
Buat API Routes + service untuk stok keluar dan defekta menggunakan Prisma.

POST /api/stok-keluar:
  Body: { obatId, batches: [{ batchId, qty }], alasan, referenceId?, referenceType? }
  
  Gunakan Prisma $transaction:
  
  await prisma.$transaction(async (tx) => {
    // Validasi semua batch punya qty yang cukup
    for (const item of batches) {
      const batch = await tx.batch.findUnique({ where: { id: item.batchId } })
      if (!batch || batch.qty < item.qty) {
        throw new Error(`Stok batch ${item.batchId} tidak mencukupi`)
      }
    }
    
    const totalQty = batches.reduce((sum, b) => sum + b.qty, 0)
    
    // Insert stok keluar
    const stokKeluar = await tx.stokKeluar.create({
      data: { obatId, totalQty, alasan, referenceId, referenceType, createdBy: userId }
    })
    
    // Process setiap batch
    for (const item of batches) {
      const batch = await tx.batch.findUnique({ where: { id: item.batchId } })
      const newQty = batch!.qty - item.qty
      
      await tx.stokKeluarBatch.create({
        data: { stokKeluarId: stokKeluar.id, batchId: item.batchId, batchNumber: batch!.batchNumber, expiredDate: batch!.expiredDate, qty: item.qty }
      })
      
      await tx.batch.update({
        where: { id: item.batchId },
        data: { qty: newQty, status: newQty === 0 ? 'HABIS' : 'AKTIF' }
      })
    }
    
    // Update stok_saat di obat
    await tx.obat.update({
      where: { id: obatId },
      data: { stokSaat: { decrement: totalQty } }
    })
    
    return stokKeluar
  })

Untuk defekta:
POST /api/defekta: INSERT dengan status PENDING
PATCH /api/defekta/[id]/approve:
  $transaction([
    tx.defekta.update({ where: { id }, data: { status: 'APPROVED', approvedBy, approvedAt: new Date() } }),
    tx.batch.update({ where: { id: defekta.batchId }, data: { qty: { decrement: defekta.qty } } }),
    tx.obat.update({ where: { id: defekta.obatId }, data: { stokSaat: { decrement: defekta.qty } } }),
  ])
  
PATCH /api/defekta/[id]/reject:
  prisma.defekta.update({ status: 'REJECTED', rejectedReason })

Update services menggunakan Axios.
```

---

## Step 6.3 — Service Stok Opname & Mutasi

### Prompt:

```
Buat API Routes + service untuk stok opname dan mutasi lokasi menggunakan Prisma.

POST /api/stok-opname:
  Auto-generate noOpname: 'OP/' + YYYY + '/' + MM + '/' + NNN
  Untuk NNN: COUNT opname di bulan ini + 1, padStart(3, '0')
  INSERT stok_opname
  INSERT opname_item untuk setiap item (qtySystem diambil dari batch.qty saat ini)

PATCH /api/stok-opname/[id]/item/[itemId]:
  { qtyFisik: number }
  UPDATE opname_item SET qty_fisik = ?

PATCH /api/stok-opname/[id]/approve:
  $transaction(async (tx) => {
    const opname = await tx.stokOpname.findUnique({ where: { id }, include: { items: true } })
    
    // Update status opname
    await tx.stokOpname.update({ where: { id }, data: { status: 'APPROVED', approvedBy, approvedAt: new Date() } })
    
    // Apply koreksi untuk setiap item
    for (const item of opname.items) {
      const selisih = item.qtyFisik - item.qtySystem
      if (selisih === 0) continue
      
      // Update batch
      await tx.batch.update({ where: { id: item.batchId }, data: { qty: item.qtyFisik } })
      
      // Update stok_saat obat
      await tx.obat.update({ where: { id: item.obatId }, data: { stokSaat: { increment: selisih } } })
      
      // Buat stok masuk/keluar record untuk trail
      if (selisih > 0) {
        await tx.stokMasuk.create({ data: { ...item, qty: selisih, alasan: 'Koreksi opname', referenceId: id, referenceType: 'OPNAME', createdBy } })
      } else {
        const stokKeluar = await tx.stokKeluar.create({ data: { obatId: item.obatId, totalQty: Math.abs(selisih), alasan: 'Koreksi opname', referenceType: 'OPNAME', createdBy } })
        await tx.stokKeluarBatch.create({ data: { stokKeluarId: stokKeluar.id, batchId: item.batchId, batchNumber: item.batchNumber, expiredDate: item.expiredDate, qty: Math.abs(selisih) } })
      }
    }
  })

Untuk mutasi (src/app/api/mutasi-lokasi/route.ts):
POST /api/mutasi-lokasi:
  Auto-generate noMutasi: 'MUT/' + YYYY + '/' + MM + '/' + NNN
  $transaction(async (tx) => {
    const batch = await tx.batch.findUnique({ where: { id: batchId } })
    
    if (qty === batch.qty) {
      // Full transfer — update lokasi batch
      await tx.batch.update({ where: { id: batchId }, data: { lokasiId: keLokasiId } })
    } else {
      // Partial transfer — kurangi batch asal, buat batch baru di tujuan
      await tx.batch.update({ where: { id: batchId }, data: { qty: { decrement: qty } } })
      await tx.batch.create({ data: { obatId, batchNumber: batch.batchNumber, expiredDate: batch.expiredDate, qty, lokasiId: keLokasiId, hargaBeli: batch.hargaBeli } })
    }
    
    await tx.mutasiLokasi.create({ data: { noMutasi, obatId, batchId, batchNumber: batch.batchNumber, expiredDate: batch.expiredDate, dariLokasiId, keLokasiId, qty, catatan, createdBy } })
  })
```

---

---

# PHASE 7 — Service Layer: Procurement

## Step 7.1 — Service Purchase Order

### Prompt:

```
Buat API Routes + service untuk Purchase Order menggunakan Prisma.

POST /api/purchase-order:
  Auto-generate noPo: 'PO/' + YYYY + '/' + MM + '/' + NNN
  $transaction(async (tx) => {
    const po = await tx.purchaseOrder.create({ data: { noPo, supplierId, status: 'DRAFT', terminPembayaran, ppnIncluded, tanggalPo, catatan, createdBy } })
    
    const poItems = await tx.poItem.createMany({ data: items.map(item => ({ poId: po.id, obatId: item.obatId, satuanNama: item.satuanNama, qty: item.qty, hargaBeli: item.hargaBeli })) })
    
    // Hitung total
    const subtotal = items.reduce((sum, i) => sum + i.qty * i.hargaBeli, 0)
    const ppn = ppnIncluded ? subtotal * 0.11 : 0
    
    await tx.purchaseOrder.update({ where: { id: po.id }, data: { subtotalNilai: subtotal, totalPpn: ppn, totalNilai: subtotal + ppn } })
    
    return po
  })

PATCH /api/purchase-order/[id]/submit:
  Validasi: status harus DRAFT
  UPDATE status = 'PENDING_APPROVAL'
  Kirim notifikasi ke admin

PATCH /api/purchase-order/[id]/approve:
  Validasi: status harus PENDING_APPROVAL, role harus admin
  UPDATE status = 'APPROVED', approvedBy, approvedAt

PATCH /api/purchase-order/[id]/reject:
  Validasi: status harus PENDING_APPROVAL, role harus admin
  UPDATE status = 'REJECTED', rejectedReason

PATCH /api/purchase-order/[id]/cancel:
  Validasi: status harus DRAFT atau PENDING_APPROVAL
  UPDATE status = 'CANCELLED'

GET /api/purchase-order: dengan filter status, supplierId, tanggalPo range, pagination
  include: { supplier: { select: { nama: true } }, items: { include: { obat: { select: { nama: true } } } } }

Update src/services/purchase-order.service.ts menggunakan Axios.
```

---

## Step 7.2 — Service Good Receipt

### Prompt:

```
Buat API Routes + service untuk Good Receipt menggunakan Prisma.

POST /api/good-receipt (createFromPO):
  Body: { poId, tanggalPerkiraanDatang? }
  Auto-generate noGr: 'GR/' + YYYY + '/' + MM + '/' + NNN
  $transaction(async (tx) => {
    // Ambil PO beserta items
    const po = await tx.purchaseOrder.findUnique({ where: { id: poId }, include: { items: { include: { obat: true } } } })
    
    // Buat GR
    const gr = await tx.goodReceipt.create({ data: { noGr, poId, supplierId: po.supplierId, status: 'MENUNGGU_KEDATANGAN', tanggalPerkiraanDatang, createdBy } })
    
    // Buat GR items dari PO items
    await tx.grItem.createMany({
      data: po.items.map(item => ({
        grId: gr.id, poItemId: item.id, obatId: item.obatId, satuanNama: item.satuanNama,
        qtyPo: item.qty, qtyTerima: 0, hargaBeli: item.hargaBeli
      }))
    })
    
    // Update status PO → PARTIAL
    await tx.purchaseOrder.update({ where: { id: poId }, data: { status: 'PARTIAL' } })
    
    return gr
  })

PATCH /api/good-receipt/[id]/submit (apoteker submit):
  $transaction(async (tx) => {
    // Update setiap gr_item
    for (const item of items) {
      await tx.grItem.update({ where: { id: item.id }, data: { qtyTerima: item.qtyTerima, batchNumber: item.batchNumber, tanggalProduksi: item.tanggalProduksi, expiredDate: item.expiredDate, lokasiId: item.lokasiId, kondisi: item.kondisi, keteranganKondisi: item.keteranganKondisi } })
    }
    
    // Update GR status
    await tx.goodReceipt.update({ where: { id }, data: { status: 'PERLU_REVIEW_ADMIN', catatanApoteker, fotoUrls, revisiKe: { increment: 1 } } })
    
    // Insert revisi history
    await tx.grRevisi.create({ data: { grId: id, revisiKe: gr.revisiKe + 1, alasanPenolakan: '-', catatanApoteker, fotoUrls, snapshot: items, submittedBy } })
  })

PATCH /api/good-receipt/[id]/approve (admin):
  $transaction(async (tx) => {
    // Update GR
    await tx.goodReceipt.update({ where: { id }, data: { status: 'DISETUJUI', catatanAdmin, approvedBy, approvedAt: new Date() } })
    
    const grItems = await tx.grItem.findMany({ where: { grId: id } })
    
    for (const item of grItems) {
      if (item.kondisi === 'BAIK' && item.qtyTerima > 0) {
        // Proses stok masuk (lihat pattern di Phase 6.1)
        // UPSERT batch, INSERT stok_masuk, UPDATE obat.stok_saat
      }
      if (item.kondisi === 'RUSAK') {
        // Auto-buat defekta
        await tx.defekta.create({ data: { obatId: item.obatId, batchId: ..., qty: item.qtyTerima, alasan: 'Barang rusak saat GR', createdBy } })
      }
    }
    
    // Auto-buat purchase invoice
    const noInvoice = 'INV/' + ...
    await tx.purchaseInvoice.create({ data: { noInvoice, grId: id, poId: gr.poId, supplierId: gr.supplierId, totalNilai: ..., status: 'BELUM_BAYAR', createdBy } })
    
    // Update PO → COMPLETED
    await tx.purchaseOrder.update({ where: { id: gr.poId }, data: { status: 'COMPLETED' } })
  })

PATCH /api/good-receipt/[id]/reject (admin):
  UPDATE status = 'PERLU_INPUT_APOTEKER', rejectedReason
  INSERT gr_revisi dengan alasanPenolakan
```

---

## Step 7.3 — Service Purchase Invoice

### Prompt:

```
Buat API Routes + service untuk Purchase Invoice menggunakan Prisma.

GET /api/purchase-invoice:
  Fetch semua invoice, tambahkan computed field 'isOverdue' di response:
  const isOverdue = invoice.status !== 'LUNAS' && invoice.tanggalJatuhTempo && invoice.tanggalJatuhTempo < new Date()
  
  Juga auto-update status jika lewat jatuh tempo:
  await prisma.purchaseInvoice.updateMany({
    where: {
      status: 'BELUM_BAYAR',
      tanggalJatuhTempo: { lt: new Date() }
    },
    data: { status: 'JATUH_TEMPO' }
  })

PATCH /api/purchase-invoice/[id]/lunas:
  Body: { tanggalBayar }
  UPDATE status = 'LUNAS', tanggalBayar, markedLunasByUid, markedLunasAt

POST /api/purchase-invoice/[id]/upload-pdf:
  Terima file PDF, upload ke Supabase Storage bucket 'invoice-pdf'
  UPDATE purchase_invoice SET file_pdf_name

GET /api/purchase-invoice/[id]/download-pdf:
  Generate signed URL dari Supabase Storage (expiry 1 jam)
  Return { url: signedUrl }

Untuk signed URL gunakan Supabase server client (bukan Prisma):
  const supabase = await createClient()
  const { data } = await supabase.storage.from('invoice-pdf').createSignedUrl(fileName, 3600)

Update src/services/purchase-invoice.service.ts menggunakan Axios.
```

---

---

# PHASE 8 — Analytics & Audit Log

## Step 8.1 — Service Analytics

### Prompt:

```
Buat API Routes untuk analytics menggunakan Prisma aggregation.

src/app/api/analytics/dashboard/route.ts:
  Jalankan semua query secara parallel dengan Promise.all:
  
  const [totalObat, totalStok, stokKritis, nearExpired, pendingPO, pendingGR, invoiceAlert] = await Promise.all([
    prisma.obat.count({ where: { isActive: true } }),
    prisma.batch.aggregate({ where: { status: 'AKTIF' }, _sum: { qty: true } }),
    prisma.obat.count({ where: { isActive: true, stokSaat: { lte: prisma.obat.fields.stokMinimal } } }),
    // Untuk stokSaat <= stokMinimal, pakai raw query:
    prisma.$queryRaw`SELECT COUNT(*) FROM obat WHERE is_active = true AND stok_saat <= stok_minimal`,
    prisma.batch.count({
      where: {
        status: 'AKTIF',
        qty: { gt: 0 },
        expiredDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }
      }
    }),
    prisma.purchaseOrder.count({ where: { status: 'PENDING_APPROVAL' } }),
    prisma.goodReceipt.count({ where: { status: { in: ['PERLU_INPUT_APOTEKER', 'PERLU_REVIEW_ADMIN'] } } }),
    prisma.purchaseInvoice.count({
      where: {
        status: { not: 'LUNAS' },
        tanggalJatuhTempo: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
      }
    }),
  ])

src/app/api/analytics/weekly-movement/route.ts:
  Gunakan Prisma $queryRaw untuk GROUP BY week:
  
  const stokMasuk = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('week', created_at) as week,
      SUM(qty) as total
    FROM stok_masuk
    WHERE created_at >= NOW() - INTERVAL '8 weeks'
    GROUP BY DATE_TRUNC('week', created_at)
    ORDER BY week ASC
  `

src/app/api/analytics/pareto/route.ts:
  Hitung nilai stok keluar per obat 3 bulan terakhir menggunakan $queryRaw:
  
  SELECT 
    o.nama,
    o.kode,
    SUM(skb.qty * b.harga_beli) as nilai_keluar
  FROM stok_keluar sk
  JOIN stok_keluar_batch skb ON sk.id = skb.stok_keluar_id
  JOIN batch b ON skb.batch_id = b.id
  JOIN obat o ON sk.obat_id = o.id
  WHERE sk.created_at >= NOW() - INTERVAL '3 months'
  GROUP BY o.id, o.nama, o.kode
  ORDER BY nilai_keluar DESC

  Hitung kumulatif persentase dan klasifikasi A/B/C di aplikasi (bukan SQL).

src/app/api/analytics/safety-stock/route.ts:
  SELECT obat (semua aktif) beserta rata-rata pemakaian harian 30 hari terakhir via $queryRaw.

Update src/services/analytics.service.ts menggunakan Axios untuk memanggil endpoint-endpoint ini.
```

---

## Step 8.2 — Audit Log ke Database

### Prompt:

```
Pindahkan audit log dari Zustand (in-memory) ke database via Prisma.

1. Update src/lib/utils/audit-logger.ts:
   Ganti implementasi logAction() dari Zustand ke Prisma/API call:
   
   export async function logAction(params: LogActionParams): Promise<void> {
     try {
       await fetch('/api/audit-log', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(params),
       })
     } catch {
       // Audit log failure is non-critical — don't throw
       console.error('Failed to write audit log:', params)
     }
   }

2. Buat src/app/api/audit-log/route.ts:
   POST: import { prisma } from "@/lib/prisma"
   Verifikasi user dari Supabase session, lalu:
   await prisma.auditLog.create({ data: { ...body, timestamp: new Date() } })

3. GET /api/audit-log (hanya admin):
   findMany dengan filter userId, action, entityType, dateRange
   include: { user: { select: { name: true, role: true } } }
   Dengan pagination

4. Update src/services/activity-log.service.ts menggunakan Axios.

5. Update halaman audit log di src/app/(dashboard)/admin/audit-log/:
   Ganti Zustand store dengan useQuery dari TanStack Query yang fetch /api/audit-log.

6. Hapus src/store/audit-log-store.ts setelah semua referensi dipindah.

Semua fungsi convenience (logStokMasuk, logStokKeluar, dll) di audit-logger.ts tidak perlu diubah — 
hanya implementasi di dalam logAction() yang berubah.
```

---

---

# PHASE 9 — Storage (Foto GR & PDF Invoice)

## Step 9.1 — Setup Supabase Storage

### Prompt:

```
Setup Supabase Storage untuk foto Good Receipt dan PDF Invoice.

1. Di Supabase Dashboard → Storage → New Bucket, buat 2 bucket:
   
   Bucket 1: gr-photos
   - Public: NO (private)
   - File size limit: 5MB
   
   Bucket 2: invoice-pdf
   - Public: NO (private)
   - File size limit: 10MB

2. Di Supabase Dashboard → Storage → Policies, tambahkan policies:

   Untuk gr-photos:
   SELECT: authenticated users
   INSERT: authenticated users (apoteker dan admin)
   DELETE: admin only (jalankan di SQL Editor):
   
   CREATE POLICY "gr_photos_select" ON storage.objects FOR SELECT
     TO authenticated USING (bucket_id = 'gr-photos');
   
   CREATE POLICY "gr_photos_insert" ON storage.objects FOR INSERT
     TO authenticated WITH CHECK (bucket_id = 'gr-photos' AND auth.uid() IS NOT NULL);
   
   CREATE POLICY "gr_photos_delete" ON storage.objects FOR DELETE
     TO authenticated USING (bucket_id = 'gr-photos' AND is_admin());
   
   Buat policies serupa untuk invoice-pdf (hanya admin).

3. Buat src/lib/supabase/storage.ts:

import { createClient } from "@/lib/supabase/client"

export async function uploadGRPhoto(grId: string, file: File): Promise<string> {
  const supabase = createClient()
  const fileName = `${grId}/${Date.now()}_${file.name.replace(/\s/g, '_')}`
  const { error } = await supabase.storage.from('gr-photos').upload(fileName, file)
  if (error) throw error
  const { data } = supabase.storage.from('gr-photos').getPublicUrl(fileName)
  return data.publicUrl
}

export async function uploadInvoicePDF(invoiceId: string, file: File): Promise<string> {
  const supabase = createClient()
  const fileName = `${invoiceId}/${file.name.replace(/\s/g, '_')}`
  const { error } = await supabase.storage.from('invoice-pdf').upload(fileName, file, { upsert: true })
  if (error) throw error
  return fileName
}

export async function getInvoicePDFSignedUrl(fileName: string): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase.storage.from('invoice-pdf').createSignedUrl(fileName, 3600)
  if (error) throw error
  return data.signedUrl
}

4. Integrasikan ke form upload foto GR (di komponen apoteker good receipt submit)
5. Integrasikan ke halaman invoice untuk upload PDF dan download PDF
```

---

---

# PHASE 10 — Realtime Notifications

## Step 10.1 — Notification ke Database + Realtime

### Prompt:

```
Ganti Zustand notification store dengan database Supabase + Realtime.

1. Update src/lib/utils/notification-trigger.ts:
   Ganti semua addNotif() calls dengan fetch ke API:
   
   async function addNotif(params: NotifParams): Promise<void> {
     await fetch('/api/notifications', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(params),
     })
   }

2. Buat src/app/api/notifications/route.ts:
   POST: await prisma.notification.create({ data: { ...body } })
   GET: Ambil notif untuk user yang login berdasarkan role dan target_user_id, dengan filter isRead

3. Buat src/app/api/notifications/[id]/read/route.ts:
   PATCH: await prisma.notification.update({ where: { id }, data: { isRead: true } })

4. Buat src/hooks/use-realtime-notifications.ts:

"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Notification } from "@prisma/client"

export function useRealtimeNotifications(userRole: string, userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  
  useEffect(() => {
    // Fetch initial
    fetch('/api/notifications').then(r => r.json()).then(setNotifications)
    
    // Subscribe realtime
    const supabase = createClient()
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notification',
        filter: `target_user_id=eq.${userId}`,
      }, (payload) => {
        const notif = payload.new as Notification
        if (notif.targetRoles.includes(userRole) || notif.targetUserId === userId) {
          setNotifications(prev => [notif, ...prev])
        }
      })
      .subscribe()
    
    return () => { supabase.removeChannel(channel) }
  }, [userRole, userId])
  
  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
  }
  
  const unreadCount = notifications.filter(n => !n.isRead).length
  
  return { notifications, markAsRead, unreadCount }
}

5. Update komponen notification header untuk menggunakan hook ini
6. Hapus src/store/notification-store.ts
```

---

---

# PHASE 11 — Finalisasi & Cleanup

## Step 11.1 — Hapus Mock Data & Cleanup

### Prompt:

```
Setelah semua Phase 5–10 selesai dan semua service sudah pakai Prisma/Supabase, 
hapus semua mock data dan cleanup.

Yang harus dihapus:
1. Seluruh folder src/lib/mock-data/ (7 files)
2. Fungsi mockDelay() dan paginate() di src/lib/api-client.ts jika sudah tidak dipakai
   (Interface PaginatedResponse dan ApiResponse tetap bisa dipertahankan jika masih dipakai)

Untuk setiap file yang dihapus, cek dulu dengan Grep siapa yang masih import:
- Cari: from "@/lib/mock-data" di semua file
- Ada 11 files yang diketahui masih import mock data
- Ganti setiap import tersebut dengan TanStack Query + service calls

Setelah cleanup:
rtk tsc --noEmit
rtk next build

Pastikan zero TypeScript error dan build berhasil.
```

---

## Step 11.2 — TanStack Query Audit

### Prompt:

```
Audit semua halaman dan komponen — pastikan semua data fetching sudah menggunakan TanStack Query.

Yang harus dicari dan diganti:
1. Cari semua useEffect yang melakukan fetch/service call:
   Grep: useState.*\[\] dan useEffect.*service\|fetch
   Ganti dengan useQuery

2. Cari semua form submit yang langsung call service tanpa useMutation:
   Ganti dengan useMutation + onSuccess invalidateQueries

Pattern standar untuk READ:
  const { data, isLoading, error } = useQuery({
    queryKey: ['obat', filters],
    queryFn: () => obatService.getAll(filters),
  })

Pattern standar untuk WRITE:
  const mutation = useMutation({
    mutationFn: (data) => obatService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obat'] })
      toast.success('Obat berhasil ditambahkan')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

Prioritas halaman yang dicek:
1. Dashboard (admin & apoteker)
2. Daftar Obat, Batch, Alkes
3. Stok Masuk / Keluar
4. Purchase Order, Good Receipt, Invoice
5. Defekta, Opname
6. Analytics
```

---

## Step 11.3 — Security Audit & Production Check

### Prompt:

```
Lakukan audit keamanan dan persiapan production sebelum deploy.

1. Pastikan TIDAK ada secret yang hardcoded di kode:
   Grep di frontend/ dan backend/:
   - "sb_secret_" atau "sb_publishable_" (format lama — sudah diganti)
   - Supabase URL hardcoded: "supabase.co"
   - Password hardcoded: "smart-clinic123" (pastikan tidak ada di kode, hanya di .env)

2. Verifikasi .env.local dan backend/.env ada di .gitignore

3. Buat .env.example di root frontend/ (tanpa nilai sensitif):
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/postgres"
   NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   AUTH_REDIRECT_URL="http://localhost:3000/auth/callback"
   NODE_ENV="development"

4. Prisma Client HANYA server-side — verifikasi tidak ada:
   import { prisma } from "@/lib/prisma" di file yang ada "use client"

5. SUPABASE_SERVICE_ROLE_KEY TIDAK boleh ada NEXT_PUBLIC_ prefix
   Verifikasi sudah aman.

6. RLS Audit — jalankan di Supabase SQL Editor:
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   ORDER BY tablename;
   Semua tabel harus rowsecurity = true.

7. Final check:
   rtk tsc --noEmit
   rtk next build
   
   Zero error = siap production.
```

---

---

## Checklist Progress

### Phase 0 — Setup (SELESAI)
- [x] Backend folder & Prisma 7
- [x] Supabase project & link
- [x] Dependencies (semua)
- [x] Environment variables

### Phase 1 — Prisma Schema & Migration
- [ ] 1.1 Buat semua model di schema.prisma
- [ ] 1.2 Jalankan `prisma migrate dev`
- [ ] 1.3 Setup Prisma Client di frontend

### Phase 2 — RLS Policies
- [ ] 2.1 Helper functions + semua RLS policies

### Phase 3 — Supabase Client Helpers
- [ ] 3.1 client.ts, server.ts, middleware.ts
- [ ] 3.2 Next.js middleware (auth protection)

### Phase 4 — Auth
- [ ] 4.1 Auth service + Zustand sync
- [ ] 4.2 Seed user & master data awal

### Phase 5 — Master Data Services
- [ ] 5.1 Lokasi gudang
- [ ] 5.2 Kategori, Satuan, Obat
- [ ] 5.3 Supplier & Alkes

### Phase 6 — Inventory Services
- [ ] 6.1 Batch & Stok masuk
- [ ] 6.2 Stok keluar & Defekta
- [ ] 6.3 Opname & Mutasi

### Phase 7 — Procurement Services
- [ ] 7.1 Purchase Order
- [ ] 7.2 Good Receipt
- [ ] 7.3 Purchase Invoice

### Phase 8 — Analytics & Audit
- [ ] 8.1 Analytics
- [ ] 8.2 Audit log ke DB

### Phase 9 — Storage
- [ ] 9.1 Storage setup + helpers

### Phase 10 — Realtime
- [ ] 10.1 Notification realtime

### Phase 11 — Finalisasi
- [ ] 11.1 Hapus mock data
- [ ] 11.2 TanStack Query audit
- [ ] 11.3 Security & build check

---

## Catatan Penting

1. **Mulai dari Phase 1** — Phase 0 sudah selesai, langsung ke schema Prisma
2. **Prisma hanya server-side** — JANGAN import prisma di "use client" component
3. **DIRECT_URL** untuk migration Prisma (bukan pgbouncer URL)
4. **DATABASE_URL** (dengan pgbouncer) untuk runtime query di Next.js
5. **Sinkronkan schema.prisma** antara backend/ dan frontend/ — keduanya harus identik
6. **Test setelah setiap phase** — jangan lanjut jika ada TypeScript error
7. **RLS policies** tidak bisa dibuat via Prisma — harus via Supabase SQL Editor
