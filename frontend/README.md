# Smart Clinic — Sistem Inventaris Frontend

Sistem manajemen inventaris farmasi berbasis web untuk klinik modern. Dibangun dengan Next.js 16 App Router, TypeScript, dan Tailwind CSS. Mencakup seluruh alur kerja pengadaan, pengelolaan stok, dan pelaporan dengan role-based access control.

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + shadcn/ui |
| State Management | Zustand 5 |
| Data Fetching | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Tables | TanStack Table v8 |
| Icons | Lucide React |
| Export | jsPDF + XLSX |
| Font | Inter Variable |

---

## Fitur Utama

### Role: Admin

| Fitur | Deskripsi |
|-------|-----------|
| Dashboard | Ringkasan stok kritis, PO aktif, GR pending, grafik mingguan |
| Master Data — Obat | Katalog obat dengan satuan, kategori, dan stok minimum |
| Master Data — Kategori | Pengelolaan kategori obat |
| Master Data — Lokasi Gudang | Struktur gudang hierarki (Gudang → Ruang → Rak → Laci) |
| Master Data — Batch & Expired | Tracking batch dan tanggal kedaluwarsa (FEFO) |
| Supplier | CRUD supplier dengan kontak dan riwayat transaksi |
| Purchase Order | Buat, review, dan approve PO ke supplier |
| Good Receipt | Terima dan verifikasi barang dari PO |
| Invoice | Manajemen invoice pengadaan |
| Defekta & Quarantine | Approve laporan barang rusak/expired dari apoteker |
| Validasi Opname | Review dan approve hasil stock opname |
| Alat Kesehatan | Manajemen alkes dan jadwal kalibrasi |
| Analisis Pareto | Analisis ABC — obat dengan nilai tertinggi |
| Safety Stock | Perhitungan stok aman berdasarkan lead time |
| Laporan | Ekspor laporan ke PDF/Excel |
| Audit Log | Trail aktivitas seluruh pengguna sistem |

### Role: Apoteker

| Fitur | Deskripsi |
|-------|-----------|
| Dashboard | Ringkasan stok, GR pending, alert kedaluwarsa |
| Stok Masuk | Input penerimaan barang ke gudang |
| Stok Keluar | Dispensing obat ke poli/pasien |
| Good Receipt | Input detail penerimaan barang dari PO |
| Defekta | Laporkan barang rusak/expired untuk dikarantina |
| Stok Opname | Hitung fisik stok dan ajukan ke admin |
| Mutasi Lokasi | Pindah stok antar lokasi gudang |
| E-Prescribing | Lihat resep digital dari dokter (read-only) |
| Alat Kesehatan | Input hasil kalibrasi alkes |

---

## Struktur Proyek

```
src/
├── app/
│   ├── (auth)/              # Halaman login (public)
│   └── (dashboard)/         # Halaman terproteksi
│       ├── admin/           # Semua halaman admin
│       └── apoteker/        # Semua halaman apoteker
├── components/
│   ├── layout/              # Sidebar, Header, AuthProvider, Breadcrumb
│   ├── features/            # Komponen per fitur (form, tabel, dll)
│   ├── shared/              # RoleGate, komponen reusable
│   └── ui/                  # shadcn/ui primitives
├── hooks/
│   ├── queries/             # TanStack Query hooks per domain
│   ├── use-auth.ts          # Auth hooks (useRequireAuth, dll)
│   └── use-role.ts          # Feature access matrix
├── lib/
│   ├── api-client.ts        # Mock delay & pagination helpers
│   ├── constants/           # Roles, permissions, routes
│   ├── mock-data/           # Data mock (dashboard, master-data, dll)
│   └── validations/         # Zod schemas
├── services/                # Layer service (mock API per domain)
├── store/                   # Zustand stores (auth, sidebar, notifikasi)
└── types/                   # TypeScript type definitions
```

---

## Akun Demo

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@smartclinic.com` | `admin1234` |
| Apoteker | `apoteker@smartclinic.com` | `apoteker1234` |

> Akun demo tersedia langsung di halaman login — klik tombol **Admin** atau **Apoteker** untuk mengisi otomatis.

---

## Menjalankan Proyek

### Prasyarat

- Node.js >= 18
- npm / yarn / pnpm

### Instalasi

```bash
# Clone repository
git clone <repository-url>
cd frontend

# Install dependencies
npm install

# Jalankan development server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

### Build Production

```bash
npm run build
npm run start
```

### Lint

```bash
npm run lint
```

---

## Catatan Pengembangan

- **Data**: Seluruh data menggunakan mock in-memory. Setiap service di `src/services/` menggunakan `mockDelay()` untuk mensimulasikan latency jaringan. Belum terhubung ke backend.
- **Autentikasi**: Session hanya tersimpan di memory (tidak di localStorage). Refresh halaman akan mengarahkan kembali ke halaman login — perilaku ini disengaja untuk keamanan sistem klinik.
- **FEFO**: First Expired First Out diterapkan pada logika pengeluaran stok — batch dengan tanggal kedaluwarsa terdekat diprioritaskan.
- **Audit Trail**: Setiap aksi mutasi data dicatat dengan timestamp, user, dan detail perubahan.
- **Export**: Laporan dapat diekspor ke PDF (jsPDF) dan Excel (XLSX) langsung dari browser.

---

## Status Proyek

> **Frontend-only prototype** — Semua fitur UI sudah lengkap dan fungsional dengan data mock. Siap untuk integrasi backend REST API.

---

## Lisensi

Proyek ini bersifat privat. Seluruh hak cipta milik pemilik proyek.
