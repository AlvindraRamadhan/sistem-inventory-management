# 💊 Sistem Manajemen Inventory Apotek

[![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.8.0-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Supabase](https://img.shields.io/badge/Supabase-2.107.0-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-38BDF8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

Sistem informasi manajemen inventory apotek berbasis web yang dibangun dengan Next.js 15 (fullstack). Mengelola seluruh siklus pengadaan obat — dari purchase order, penerimaan barang, hingga pengeluaran stok — dilengkapi analitik dan audit trail lengkap.

> 📖 **API Documentation:** [SwaggerHub — Sistem Inventory API v1.0.0](https://app.swaggerhub.com/apis/universitasahmaddahl/sistem-inventory-api/1.0.0)

---

## 📋 Daftar Isi

- [Tech Stack](#-tech-stack)
- [Fitur Utama](#-fitur-utama)
- [Struktur Folder](#-struktur-folder)
- [Prerequisites](#-prerequisites)
- [Instalasi](#-instalasi)
- [Environment Variables](#-environment-variables)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [API Endpoints](#-api-endpoints)
- [Role-Based Access](#-role-based-access)
- [Database Schema](#-database-schema)
- [Contributing](#-contributing)

---

## 🛠 Tech Stack

| Kategori | Teknologi | Versi |
|---|---|---|
| **Framework** | Next.js (App Router, fullstack) | 16.2.6 |
| **Language** | TypeScript | 5.x |
| **UI Library** | React | 19.2.4 |
| **Styling** | Tailwind CSS + shadcn/ui | 4.x |
| **ORM** | Prisma | 7.8.0 |
| **Database** | PostgreSQL (via Supabase) | — |
| **Auth** | Supabase Auth + SSR | 2.107.0 |
| **State Management** | Zustand | 5.0.14 |
| **Data Fetching** | TanStack React Query | 5.100.14 |
| **Form Handling** | React Hook Form + Zod | 7.76.1 / 4.4.3 |
| **Charts** | Recharts | 3.8.1 |
| **HTTP Client** | Axios | 1.17.0 |
| **PDF Export** | jsPDF + AutoTable | 4.2.1 |
| **Excel Export** | SheetJS (xlsx) | 0.18.5 |
| **Icons** | Lucide React | 1.17.0 |
| **Notifications** | Sonner | 2.0.7 |
| **API Docs** | Swagger UI React | 5.32.6 |

---

## ✨ Fitur Utama

### 📦 Manajemen Stok
- **Stok Masuk** — pencatatan penerimaan obat ke gudang
- **Stok Keluar** — pencatatan pengeluaran obat (FIFO per batch)
- **Mutasi Lokasi** — transfer stok antar lokasi gudang
- **Batch & Expired Tracking** — pemantauan nomor batch dan tanggal kadaluarsa

### 🛒 Pengadaan (Procurement)
- **Purchase Order (PO)** — pembuatan, approval, dan tracking status PO ke supplier
- **Good Receipt (GR)** — penerimaan dan verifikasi barang dari supplier (multi-step review)
- **Purchase Invoice** — manajemen invoice pembelian dengan upload PDF dan pelunasan

### 📊 Inventory Management
- **Master Data** — obat, kategori, satuan, lokasi gudang, supplier
- **Stok Opname** — rekonsiliasi stok fisik vs sistem dengan approval workflow
- **Defekta & Karantina** — pelaporan dan penanganan obat rusak/kadaluarsa

### 🏥 Alat Kesehatan (Alkes)
- Manajemen inventaris peralatan medis
- Penjadwalan dan pencatatan kalibrasi berkala

### 📈 Analitik & Laporan
- **Dashboard** — ringkasan KPI stok, nilai inventory, alert kadaluarsa
- **Analisis Pareto (ABC)** — klasifikasi obat berdasarkan nilai konsumsi
- **Safety Stock & Reorder Point** — kalkulasi otomatis stok minimum
- **Fast/Slow Moving Analysis** — identifikasi pergerakan stok
- **Weekly Movement Trend** — tren masuk/keluar mingguan

### 🔒 Sistem & Keamanan
- **Role-Based Access Control** — Admin dan Apoteker dengan hak akses terpisah
- **Audit Log** — rekam jejak seluruh aktivitas sistem
- **Notifikasi** — alert stok rendah, kadaluarsa, dan status approval
- **API Documentation** — Swagger UI terintegrasi di `/api-docs`

---

## 📁 Struktur Folder

```
sistem-inventory/
├── frontend/                        # Aplikasi Next.js (UI + API Routes)
│   ├── prisma/
│   │   └── schema.prisma            # Definisi database schema
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/              # Halaman autentikasi
│   │   │   │   └── auth/login/
│   │   │   ├── (dashboard)/         # Halaman terproteksi
│   │   │   │   ├── admin/           # Halaman khusus Admin
│   │   │   │   │   ├── analytics/
│   │   │   │   │   ├── master-data/
│   │   │   │   │   ├── procurement/
│   │   │   │   │   ├── supplier/
│   │   │   │   │   ├── defekta/
│   │   │   │   │   ├── opname/
│   │   │   │   │   ├── alkes/
│   │   │   │   │   └── audit-log/
│   │   │   │   └── apoteker/        # Halaman khusus Apoteker
│   │   │   │       ├── stok-masuk/
│   │   │   │       ├── stok-keluar/
│   │   │   │       ├── good-receipt/
│   │   │   │       ├── defekta/
│   │   │   │       ├── opname/
│   │   │   │       ├── mutasi-lokasi/
│   │   │   │       └── alkes/
│   │   │   ├── api/                 # Next.js API Routes (REST)
│   │   │   │   ├── kategori/
│   │   │   │   ├── obat/
│   │   │   │   ├── satuan/
│   │   │   │   ├── lokasi-gudang/
│   │   │   │   ├── supplier/
│   │   │   │   ├── batch/
│   │   │   │   ├── stok-masuk/
│   │   │   │   ├── stok-keluar/
│   │   │   │   ├── defekta/
│   │   │   │   ├── stok-opname/
│   │   │   │   ├── mutasi-lokasi/
│   │   │   │   ├── alkes/
│   │   │   │   ├── purchase-order/
│   │   │   │   ├── good-receipt/
│   │   │   │   ├── purchase-invoice/
│   │   │   │   ├── analytics/
│   │   │   │   ├── audit-log/
│   │   │   │   └── notifications/
│   │   │   └── api-docs/            # Swagger UI page
│   │   ├── components/
│   │   │   ├── features/            # Feature-specific components
│   │   │   ├── layout/              # Layout (sidebar, navbar, dll)
│   │   │   ├── shared/              # Komponen reusable
│   │   │   └── ui/                  # shadcn/ui components
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── lib/
│   │   │   ├── supabase/            # Supabase client (browser, server, SSR)
│   │   │   ├── constants/           # Konstanta (roles, routes, status)
│   │   │   ├── validations/         # Zod schemas
│   │   │   └── utils/               # Utilities (audit, notif trigger)
│   │   ├── services/                # API service layer (axios)
│   │   ├── store/                   # Zustand stores
│   │   ├── types/                   # TypeScript type definitions
│   │   └── middleware.ts            # Auth middleware (route protection)
│   ├── public/
│   ├── .env.local                   # Environment variables (tidak di-commit)
│   ├── .env.example                 # Template environment variables
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   └── package.json
│
└── backend/                         # Backend Next.js (API-only / SSR admin)
    ├── prisma/
    │   └── schema.prisma
    ├── src/
    │   └── app/
    │       └── api/                 # API Routes (mirror frontend/api)
    ├── .env
    └── package.json
```

---

## ✅ Prerequisites

Pastikan tools berikut sudah terinstall:

| Tool | Versi Minimum | Link |
|---|---|---|
| **Node.js** | 18.x LTS | [nodejs.org](https://nodejs.org/) |
| **npm** | 9.x | Bundled dengan Node.js |
| **Git** | 2.x | [git-scm.com](https://git-scm.com/) |
| **Supabase Account** | — | [supabase.com](https://supabase.com/) |

---

## 🚀 Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/your-username/sistem-inventory.git
cd sistem-inventory
```

### 2. Install Dependencies — Frontend

```bash
cd frontend
npm install
```

### 3. Install Dependencies — Backend

```bash
cd ../backend
npm install
```

### 4. Setup Environment Variables

Salin file contoh dan isi dengan nilai yang sesuai:

```bash
# Di folder frontend
cp .env.example .env.local

# Di folder backend
cp .env.example .env
```

Lihat bagian [Environment Variables](#-environment-variables) untuk detail setiap variabel.

### 5. Setup Database

```bash
# Di folder frontend (schema.prisma ada di sini)
cd frontend

# Push schema ke Supabase PostgreSQL
npx prisma db push

# Generate Prisma Client
npx prisma generate

# (Opsional) Buka Prisma Studio untuk eksplorasi data
npx prisma studio
```

### 6. Setup Supabase Auth

Di Supabase Dashboard:
1. Buka **Authentication → URL Configuration**
2. Tambahkan `http://localhost:3000/auth/callback` ke **Redirect URLs**
3. (Opsional) Aktifkan **Email OTP** atau **Magic Link** sesuai kebutuhan

---

## 🔐 Environment Variables

### `frontend/.env.local`

```env
# ─── Database (Prisma + Supabase PostgreSQL) ───────────────────────────────
# Connection pooling via PgBouncer (digunakan Prisma di runtime)
DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection (digunakan untuk migrasi Prisma)
DIRECT_URL="postgresql://postgres.<project-ref>:<password>@db.<project-ref>.supabase.co:5432/postgres"

# ─── Supabase ───────────────────────────────────────────────────────────────
# URL project Supabase (public)
NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"

# Anon key (public, digunakan di browser)
NEXT_PUBLIC_SUPABASE_ANON_KEY="<your-anon-key>"

# Service role key (RAHASIA — hanya untuk server-side)
SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>"

# ─── App ────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# URL callback setelah login (harus sama dengan Supabase redirect URL)
AUTH_REDIRECT_URL="http://localhost:3000/auth/callback"

NODE_ENV="development"
```

### `backend/.env`

```env
# ─── Database ───────────────────────────────────────────────────────────────
DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.<project-ref>:<password>@db.<project-ref>.supabase.co:5432/postgres"

# ─── Supabase ───────────────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<your-anon-key>"
SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>"

NODE_ENV="development"
```

> ⚠️ **Catatan Keamanan:** Jangan pernah commit file `.env.local` atau `.env` ke repository. Pastikan file tersebut sudah ada di `.gitignore`.

---

## ▶️ Menjalankan Aplikasi

### Development

```bash
# Jalankan frontend (dari folder frontend/)
cd frontend
npm run dev
# → http://localhost:3000

# Jalankan backend (dari folder backend/, terminal terpisah)
cd backend
npm run dev
# → http://localhost:3001 (atau port yang dikonfigurasi)
```

### Production Build

```bash
# Build frontend
cd frontend
npm run build
npm run start

# Build backend
cd backend
npm run build
npm run start
```

### Perintah Lain

```bash
# Lint check
npm run lint

# Buka Prisma Studio (GUI database)
npx prisma studio

# Sinkronisasi schema ke database (development)
npx prisma db push

# Regenerate Prisma Client setelah ubah schema
npx prisma generate
```

---

## 🌐 API Endpoints

Dokumentasi lengkap tersedia di SwaggerHub:

> 📖 **[Lihat Full API Documentation →](https://app.swaggerhub.com/apis/universitasahmaddahl/sistem-inventory-api/1.0.0)**

Atau akses Swagger UI lokal di: `http://localhost:3000/api-docs`

### Ringkasan Endpoint

| Modul | Method | Path | Deskripsi |
|---|---|---|---|
| **Master Data** | | | |
| Kategori | `GET POST` | `/api/kategori` | List & buat kategori |
| | `GET PUT DELETE` | `/api/kategori/:id` | Detail, update, hapus |
| Satuan | `GET POST` | `/api/satuan` | List & buat satuan |
| Obat | `GET POST` | `/api/obat` | List & tambah obat |
| | `GET` | `/api/obat/:id/stok` | Info stok obat |
| Lokasi Gudang | `GET POST` | `/api/lokasi-gudang` | List & buat lokasi |
| Supplier | `GET POST` | `/api/supplier` | List & tambah supplier |
| **Stok** | | | |
| Stok Masuk | `GET POST` | `/api/stok-masuk` | Catat penerimaan stok |
| Stok Keluar | `GET POST` | `/api/stok-keluar` | Catat pengeluaran stok |
| Batch | `GET` | `/api/batch` | List batch & expired tracking |
| Mutasi Lokasi | `GET POST` | `/api/mutasi-lokasi` | Transfer stok antar lokasi |
| Stok Opname | `GET POST` | `/api/stok-opname` | Rekonsiliasi stok fisik |
| | `POST` | `/api/stok-opname/:id/approve` | Approve opname |
| Defekta | `GET POST` | `/api/defekta` | Lapor & list defekta |
| | `POST` | `/api/defekta/:id/approve` | Approve defekta |
| | `POST` | `/api/defekta/:id/reject` | Reject defekta |
| **Alkes** | | | |
| | `GET POST` | `/api/alkes` | List & tambah alkes |
| | `GET PUT DELETE` | `/api/alkes/:id` | Detail, update, hapus |
| | `GET POST` | `/api/alkes/:id/kalibrasi` | Record kalibrasi |
| **Pengadaan** | | | |
| Purchase Order | `GET POST` | `/api/purchase-order` | List & buat PO |
| | `POST` | `/api/purchase-order/:id/submit` | Submit PO |
| | `POST` | `/api/purchase-order/:id/approve` | Approve PO |
| | `POST` | `/api/purchase-order/:id/reject` | Reject PO |
| Good Receipt | `GET POST` | `/api/good-receipt` | List & buat GR |
| | `POST` | `/api/good-receipt/:id/approve` | Approve GR (update stok) |
| Purchase Invoice | `GET POST` | `/api/purchase-invoice` | List & buat invoice |
| | `POST` | `/api/purchase-invoice/:id/lunas` | Tandai lunas |
| | `POST` | `/api/purchase-invoice/:id/upload-pdf` | Upload dokumen |
| **Analitik** | | | |
| | `GET` | `/api/analytics/dashboard` | KPI ringkasan |
| | `GET` | `/api/analytics/pareto` | Analisis ABC |
| | `GET` | `/api/analytics/safety-stock` | Safety stock & ROP |
| | `GET` | `/api/analytics/fast-slow` | Fast/slow moving |
| | `GET` | `/api/analytics/weekly-movement` | Tren mingguan |
| **Sistem** | | | |
| | `GET` | `/api/audit-log` | Log aktivitas |
| | `GET POST` | `/api/notifications` | Notifikasi pengguna |

---

## 👥 Role-Based Access

Sistem memiliki dua role utama yang dikelola melalui tabel `Profile` di database:

### 🔴 Admin

Akses penuh ke seluruh sistem melalui route `/admin/*`:

| Modul | Hak Akses |
|---|---|
| Master Data (obat, kategori, satuan, lokasi, supplier) | ✅ CRUD |
| Purchase Order | ✅ Buat, Submit, **Approve/Reject** |
| Good Receipt | ✅ Review & **Approve/Reject** |
| Purchase Invoice | ✅ CRUD, Lunas, Upload PDF |
| Defekta | ✅ **Approve/Reject** |
| Stok Opname | ✅ **Approve** |
| Alkes & Kalibrasi | ✅ CRUD |
| Analytics & Laporan | ✅ Akses penuh |
| Audit Log | ✅ Read-only |
| Pengaturan Sistem | ✅ |

### 🔵 Apoteker

Akses operasional harian melalui route `/apoteker/*`:

| Modul | Hak Akses |
|---|---|
| Stok Masuk | ✅ Catat |
| Stok Keluar | ✅ Catat |
| Mutasi Lokasi | ✅ Buat |
| Good Receipt | ✅ Input data penerimaan |
| Defekta | ✅ Lapor |
| Stok Opname | ✅ Input stok fisik |
| Alkes | ✅ View & catat kalibrasi |
| Master Data | ❌ Read-only |
| Approval workflow | ❌ Tidak bisa approve |

> Proteksi route diimplementasikan di `src/middleware.ts` menggunakan Supabase session + role check.

---

## 🗄️ Database Schema

Database PostgreSQL dikelola oleh **Prisma ORM** dan di-host di **Supabase**. Schema lengkap ada di [`frontend/prisma/schema.prisma`](frontend/prisma/schema.prisma).

### Models Utama

```
Profile              → User profiles (id, role, nama, email)
│
├── Master Data
│   ├── Kategori     → Kategori obat
│   ├── Satuan       → Satuan ukuran (tablet, kapsul, dll)
│   ├── LokasiGudang → Lokasi gudang (hirarki: gudang → ruang → rak → laci)
│   ├── Supplier     → Data supplier
│   ├── Obat         → Master data obat (relasi ke Kategori, Satuan)
│   └── Alkes        → Alat kesehatan
│
├── Stok & Batch
│   ├── Batch        → Nomor batch + tanggal kadaluarsa (relasi ke Obat)
│   ├── StokMasuk    → Transaksi masuk (relasi ke Obat, Batch, Lokasi)
│   ├── StokKeluar   → Transaksi keluar (relasi ke Obat, Lokasi)
│   ├── MutasiLokasi → Transfer antar lokasi
│   └── StokOpname   → Rekonsiliasi stok + OpnameItem
│
├── Defekta          → Pelaporan obat rusak/kadaluarsa
│
├── Pengadaan
│   ├── PurchaseOrder → PO + PoItem (line items)
│   ├── GoodReceipt   → GR + GrItem + GrRevisi (revision history)
│   └── PurchaseInvoice → Invoice pembelian
│
├── Alkes
│   └── KalibrasiRecord → Riwayat kalibrasi alat
│
└── Sistem
    ├── AuditLog     → Rekam jejak seluruh aksi pengguna
    └── Notification → Notifikasi in-app
```

### Enum Penting

| Enum | Values |
|---|---|
| `UserRole` | `admin`, `apoteker` |
| `POStatus` | `DRAFT` → `PENDING_APPROVAL` → `APPROVED` → `SENT` → `PARTIAL` → `COMPLETED` \| `CANCELLED` |
| `GRStatus` | `MENUNGGU_KEDATANGAN` → `PERLU_INPUT_APOTEKER` → `PERLU_REVIEW_ADMIN` → `DISETUJUI` \| `DITOLAK` |
| `InvoiceStatus` | `BELUM_BAYAR`, `LUNAS`, `JATUH_TEMPO` |
| `OpnameStatus` | `PENDING`, `APPROVED`, `REJECTED` |
| `AlkesStatus` | `AKTIF`, `TIDAK_AKTIF`, `DALAM_PERBAIKAN` |

---

## 🤝 Contributing

Kontribusi sangat disambut! Ikuti langkah berikut:

### 1. Fork & Clone

```bash
git clone https://github.com/your-username/sistem-inventory.git
```

### 2. Buat Branch Baru

```bash
# Format: feat/nama-fitur atau fix/nama-bug
git checkout -b feat/fitur-baru
```

### 3. Commit Convention

Gunakan format [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: tambah fitur export laporan PDF
fix: perbaiki kalkulasi safety stock
refactor: ekstrak komponen tabel ke shared/
docs: update README instalasi
```

### 4. Push & Pull Request

```bash
git push origin feat/fitur-baru
```

Buat Pull Request ke branch `main` dengan deskripsi perubahan yang jelas.

### Panduan Pengembangan

- Gunakan TypeScript — hindari `any`
- Validasi input dengan **Zod** di sisi API route
- Jalankan `npm run lint` sebelum commit
- Setiap perubahan schema Prisma wajib diikuti `npx prisma generate`
- Aksi yang mengubah data wajib dicatat ke tabel `AuditLog`

---

## 📄 License

Project ini menggunakan lisensi [MIT](LICENSE).

---

<div align="center">
  <p>Dibuat dengan ❤️ untuk manajemen inventory apotek yang lebih baik</p>
  <p>
    <a href="https://app.swaggerhub.com/apis/universitasahmaddahl/sistem-inventory-api/1.0.0">API Docs</a> ·
    <a href="https://github.com/your-username/sistem-inventory/issues">Report Bug</a> ·
    <a href="https://github.com/your-username/sistem-inventory/issues">Request Feature</a>
  </p>
</div>
