# Design System — Smart Clinic Sistem Inventaris

> Dokumen ini merupakan referensi resmi design system untuk project **Smart Clinic Sistem Inventaris**. Semua keputusan visual, ukuran, warna, dan komponen di-generate langsung dari source code project.

---

## Daftar Isi

1. [Stack & Library](#1-stack--library)
2. [Warna (Color System)](#2-warna-color-system)
3. [Tipografi](#3-tipografi)
4. [Border Radius](#4-border-radius)
5. [Layout & Ukuran](#5-layout--ukuran)
6. [Sidebar](#6-sidebar)
7. [Header](#7-header)
8. [Komponen UI (shadcn/ui)](#8-komponen-ui-shadcnui)
9. [Button System](#9-button-system)
10. [Badge & Status Color](#10-badge--status-color)
11. [Stats Card](#11-stats-card)
12. [Data Table](#12-data-table)
13. [Ikon](#13-ikon)
14. [Animasi & Transisi](#14-animasi--transisi)
15. [Scrollbar](#15-scrollbar)
16. [Tema (Dark Mode)](#16-tema-dark-mode)
17. [Struktur Folder Komponen](#17-struktur-folder-komponen)

---

## 1. Stack & Library

### Framework Utama

| Library | Versi | Keterangan |
|---|---|---|
| Next.js | 16.2.6 | App Router, RSC |
| React | 19.2.4 | |
| TypeScript | 5 | Strict mode |
| Tailwind CSS | v4 | Via `@tailwindcss/postcss` |

### UI & Styling

| Library | Versi | Keterangan |
|---|---|---|
| shadcn/ui | radix-nova | Style sistem komponen |
| Radix UI | 1.4.3 | Primitif aksesibel |
| class-variance-authority | 0.7.1 | Variant system (cva) |
| clsx | 2.1.1 | Utilitas classname |
| tailwind-merge | 3.6.0 | Merge Tailwind classes |
| tw-animate-css | 1.4.0 | Animasi CSS |
| next-themes | 0.4.6 | Dark/light mode |
| Lucide React | 1.17.0 | Icon library |
| Sonner | 2.0.7 | Toast notification |

### Form & Validasi

| Library | Versi | Keterangan |
|---|---|---|
| React Hook Form | 7.76.1 | Form state management |
| @hookform/resolvers | 5.4.0 | Adapter validasi |
| Zod | 4.4.3 | Schema validation |

### Data & State

| Library | Versi | Keterangan |
|---|---|---|
| @tanstack/react-query | 5.100.14 | Server state & caching |
| @tanstack/react-table | 8.21.3 | Tabel toolkit |
| Zustand | 5.0.14 | Client state management |
| Axios | 1.17.0 | HTTP client |

### Database & Auth

| Library | Versi | Keterangan |
|---|---|---|
| @supabase/supabase-js | 2.107.0 | Backend & auth |
| @supabase/ssr | 0.10.3 | SSR auth |
| Prisma Client | 7.8.0 | ORM |
| @prisma/adapter-pg | 7.8.0 | PostgreSQL adapter |

### Chart & Export

| Library | Versi | Keterangan |
|---|---|---|
| Recharts | 3.8.1 | Grafik & visualisasi |
| jsPDF | 4.2.1 | Export PDF |
| jspdf-autotable | 5.0.8 | Tabel di PDF |
| xlsx | 0.18.5 | Export Excel |
| date-fns | 4.3.0 | Format tanggal |

### Konfigurasi shadcn (`components.json`)

```json
{
  "style": "radix-nova",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

---

## 2. Warna (Color System)

Semua warna didefinisikan sebagai **CSS Custom Properties** di `src/app/globals.css` dan dibaca oleh Tailwind melalui directive `@theme inline`.

### Light Mode (Default)

```css
:root {
  /* Background & Surface */
  --background:         #f9fafb;   /* gray-50 — halaman utama */
  --foreground:         #111827;   /* gray-900 — teks utama */
  --card:               #ffffff;   /* putih — card/panel */
  --card-foreground:    #111827;
  --popover:            #ffffff;
  --popover-foreground: #111827;

  /* Brand — Emerald Green */
  --primary:            #10b981;   /* emerald-500 */
  --primary-foreground: #ffffff;
  --secondary:          #d1fae5;   /* emerald-100 */
  --secondary-foreground: #047857; /* emerald-700 */

  /* Neutral */
  --muted:              #f3f4f6;   /* gray-100 */
  --muted-foreground:   #6b7280;   /* gray-500 */
  --accent:             #f3f4f6;
  --accent-foreground:  #111827;

  /* Semantic */
  --destructive:        #ef4444;   /* red-500 */
  --destructive-foreground: #ffffff;
  --success:            #10b981;
  --success-foreground: #ffffff;
  --warning:            #f59e0b;   /* amber-500 */
  --warning-foreground: #ffffff;
  --info:               #3b82f6;   /* blue-500 */
  --info-foreground:    #ffffff;

  /* UI Structure */
  --border:             #e5e7eb;   /* gray-200 */
  --input:              #f3f4f6;
  --ring:               #10b981;   /* focus ring = primary */
  --radius:             0.625rem;  /* 10px base */

  /* Sidebar */
  --sidebar:            #ffffff;
  --sidebar-foreground: #111827;
  --sidebar-primary:    #10b981;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent:     #f3f4f6;
  --sidebar-accent-foreground: #111827;
  --sidebar-border:     #e5e7eb;
  --sidebar-ring:       #10b981;
}
```

### Dark Mode

```css
.dark {
  --background:         #111827;   /* gray-900 */
  --foreground:         #f9fafb;
  --card:               #1f2937;   /* gray-800 */
  --card-foreground:    #f9fafb;
  --secondary:          #064e3b;   /* emerald-900 */
  --secondary-foreground: #d1fae5;
  --muted:              #1f2937;
  --muted-foreground:   #9ca3af;   /* gray-400 */
  --border:             #374151;   /* gray-700 */
  --input:              #374151;

  /* Sidebar tetap putih di dark mode (brand consistency) */
  --sidebar:            #ffffff;
  --sidebar-foreground: #111827;
  --sidebar-accent:     #f3f4f6;
  --sidebar-border:     #e5e7eb;
}
```

> **Catatan:** Sidebar sengaja menggunakan warna putih di dark mode agar visual brand konsisten.

### Chart Colors

| Token | Light | Dark | Keterangan |
|---|---|---|---|
| `--chart-1` | `#10b981` | `#34d399` | Emerald — primary line |
| `--chart-2` | `#047857` | `#10b981` | Emerald dark — secondary |
| `--chart-3` | `#6b7280` | `#9ca3af` | Gray — netral |
| `--chart-4` | `#f59e0b` | `#fbbf24` | Amber — warning |
| `--chart-5` | `#ef4444` | `#f87171` | Red — danger |

### Palette Referensi Cepat

| Nama | Hex | Token Tailwind |
|---|---|---|
| Brand Primary | `#10b981` | `emerald-500` |
| Brand Dark | `#047857` | `emerald-700` |
| Brand Light | `#d1fae5` | `emerald-100` |
| Success | `#10b981` | `emerald-500` |
| Warning | `#f59e0b` | `amber-500` |
| Danger | `#ef4444` | `red-500` |
| Info | `#3b82f6` | `blue-500` |
| Gray Page BG | `#f9fafb` | `gray-50` |
| Gray Card BG | `#ffffff` | `white` |
| Gray Text | `#111827` | `gray-900` |
| Gray Muted | `#6b7280` | `gray-500` |
| Gray Border | `#e5e7eb` | `gray-200` |

---

## 3. Tipografi

### Font Family

| Peran | Font | Fallback |
|---|---|---|
| Sans (body & heading) | `Inter Variable` | `sans-serif` |
| Monospace | `ui-monospace` | `Consolas, monospace` |

Sumber: `@fontsource-variable/inter` v5.2.8

### Typography Components (`src/components/shared/typography.tsx`)

| Komponen | Class Tailwind | Size | Weight | Kegunaan |
|---|---|---|---|---|
| `PageTitle` | `text-2xl font-semibold` | 24px | 600 | Judul halaman |
| `SectionTitle` | `text-lg font-semibold` | 18px | 600 | Judul section |
| `CardTitle` | `text-base font-semibold` | 16px | 600 | Judul card |
| `Label` | `text-sm font-medium` | 14px | 500 | Label form |
| `BodyText` | `text-sm leading-relaxed` | 14px | 400 | Teks konten |
| `Caption` | `text-xs` | 12px | 400 | Helper / caption |
| `Mono` | `font-mono text-sm` | 14px | 400 | Kode / ID |

---

## 4. Border Radius

Semua radius dikalkulasi dari `--radius` base token (10px).

```css
--radius:    0.625rem;              /* 10px — base */
--radius-sm: calc(var(--radius) * 0.6);  /* 6px  */
--radius-md: calc(var(--radius) * 0.8);  /* 8px  */
--radius-lg: var(--radius);              /* 10px */
--radius-xl: calc(var(--radius) * 1.4);  /* 14px */
```

### Penggunaan di Komponen

| Elemen | Radius |
|---|---|
| Card | `rounded-xl` (14px) |
| Button default | `rounded-lg` (10px) |
| Input | `rounded-lg` (10px) |
| Badge | `rounded-md` (8px) |
| Avatar | `rounded-full` |
| Sidebar logo icon | `rounded-xl` |
| User menu button | `rounded-2xl` |
| Dialog | `rounded-xl` |

---

## 5. Layout & Ukuran

### Struktur Halaman Dashboard

```
┌──────────────────────────────────────────────┐
│              HEADER (h-[72px])               │
├─────────────────┬────────────────────────────┤
│                 │                            │
│    SIDEBAR      │      MAIN CONTENT          │
│  72px / 288px   │   flex-1, p-4 / lg:p-6    │
│                 │                            │
│                 │                            │
└─────────────────┴────────────────────────────┘
```

### Breakpoint Responsif

| Breakpoint | Lebar | Perilaku Sidebar |
|---|---|---|
| Mobile | `< 768px` | Sidebar jadi drawer (fixed + overlay) |
| Desktop | `≥ 768px` | Sidebar inline, bisa di-collapse |

### Padding Konten Utama

| Breakpoint | Padding |
|---|---|
| Mobile | `p-4` (16px) |
| Desktop (lg) | `p-6` (24px) |

---

## 6. Sidebar

**File:** `src/components/layout/sidebar.tsx`

### Dimensi

| State | Lebar |
|---|---|
| Expanded (Desktop) | `w-72` = **288px** |
| Collapsed (Desktop) | `w-[72px]` = **72px** |
| Mobile open | `w-72` = 288px, `translate-x-0` |
| Mobile closed | `w-72`, `translate-x-[-100%]` (tersembunyi) |

### Logo Header Sidebar

```
Tinggi: h-[72px]   (sejajar dengan Header)
Padding expanded:   px-5 (20px)
Padding collapsed:  px-0, konten center
```

- Icon logo: `h-10 w-10` (40×40px), `rounded-xl`, `bg-emerald-500`
- Icon di dalamnya: `Package` dari Lucide, `h-5 w-5` (20×20px), putih
- Nama brand: `text-sm font-semibold` — "Smart Clinic"
- Subtitle: `text-[10px] uppercase tracking-[0.15em]` — "Sistem Inventaris"

### Visual Sidebar

```css
background:   var(--sidebar)       = #ffffff
border-right: var(--sidebar-border) = #e5e7eb
```

### Sidebar Mobile

- Position: `fixed left-0 top-0 z-40`
- Backdrop: `fixed inset-0 z-30 bg-black/30 backdrop-blur-[1px]`
- Backdrop menutup sidebar ketika diklik

### Transisi Sidebar

```css
/* Desktop — animasi lebar */
transition-[width] duration-300 ease-in-out

/* Mobile — animasi slide */
transition-transform duration-300 ease-in-out
```

### Sidebar Navigation (`src/components/layout/sidebar-nav.tsx`)

- Role-based menu: **Admin** dan **Apoteker** punya menu berbeda
- Section headers: "Manajemen Data", "Pengadaan", "Laporan", dll.
- Item aktif: background `primary/10`, teks `primary`
- Item hover: background `sidebar-accent`
- Collapsed state: tampilkan ikon saja + Tooltip
- Badge notification: ditampilkan di item menu yang relevan

---

## 7. Header

**File:** `src/components/layout/header.tsx`

### Dimensi

```
Tinggi:  h-[72px]  = 72px
Padding: px-6      = 24px kiri & kanan
z-index: z-40
Position: sticky top-0
```

### Visual Header

```css
background:   bg-background/95 + backdrop-blur
box-shadow:   shadow-[0_3px_6px_rgba(0,0,0,0.12)]
```

### Anatomi Header (Kiri ke Kanan)

```
[Sidebar Toggle]  [Breadcrumb]  ────────  [Theme Toggle]  [Notifikasi]  [User Menu]
```

**Kiri:**
- `Button variant="ghost" size="icon-lg"` — toggle sidebar
- `AppBreadcrumb` — navigasi breadcrumb otomatis dari route

**Kanan (gap-3 antar elemen):**
- `ThemeToggle` — switch light/dark
- `NotificationDropdown` — bell icon + dropdown notifikasi
- `User Menu` — dropdown profil user

### User Menu Button

```css
height:        h-12  (48px)
padding:       px-4
border-radius: rounded-2xl
```

- Avatar: `h-10 w-10`, `bg-primary/10`, inisial teks `text-primary text-sm`
- Nama user: `text-base font-medium`, max 180px dengan truncate
- Role: `text-xs text-muted-foreground`

---

## 8. Komponen UI (shadcn/ui)

Semua komponen berada di `src/components/ui/` (31 file).

### Daftar Komponen

| Komponen | File | Keterangan |
|---|---|---|
| Button | `button.tsx` | Primary action element |
| Card | `card.tsx` | Container konten utama |
| Badge | `badge.tsx` | Label status/tag |
| Input | `input.tsx` | Text input |
| Textarea | `textarea.tsx` | Multi-line input |
| Label | `label.tsx` | Form label |
| Select | `select.tsx` | Dropdown pilihan |
| Checkbox | `checkbox.tsx` | Centang pilihan |
| Radio Group | `radio-group.tsx` | Pilihan tunggal |
| Switch | `switch.tsx` | Toggle on/off |
| Dialog | `dialog.tsx` | Modal/popup |
| Alert Dialog | `alert-dialog.tsx` | Konfirmasi aksi |
| Dropdown Menu | `dropdown-menu.tsx` | Menu dropdown |
| Sheet | `sheet.tsx` | Slide-out panel |
| Tabs | `tabs.tsx` | Tab navigasi |
| Accordion | `accordion.tsx` | Collapsible section |
| Popover | `popover.tsx` | Floating content |
| Tooltip | `tooltip.tsx` | Hover info |
| Table | `table.tsx` | Tabel data |
| Breadcrumb | `breadcrumb.tsx` | Navigasi path |
| Avatar | `avatar.tsx` | Gambar pengguna |
| Progress | `progress.tsx` | Progress bar |
| Skeleton | `skeleton.tsx` | Loading placeholder |
| Scroll Area | `scroll-area.tsx` | Scrollable container |
| Separator | `separator.tsx` | Garis pemisah |
| Command | `command.tsx` | Command palette |
| Sonner | `sonner.tsx` | Toast notification |
| Input Group | `input-group.tsx` | Input dengan addon |

### Card Component

```
<Card>
  <CardHeader>
    <CardTitle>     — heading card
    <CardDescription> — subjudul/helper
    <CardAction>    — area aksi kanan atas
  </CardHeader>
  <CardContent>    — konten utama
  <CardFooter>     — footer (muted bg)
</Card>
```

- Default padding: dari Card
- Ring border: `foreground/10` opacity
- Dua ukuran: `default` dan `sm`

---

## 9. Button System

**File:** `src/components/ui/button.tsx`

### Variants

| Variant | Tampilan | Kapan digunakan |
|---|---|---|
| `default` | Emerald background + teks putih | Primary action (simpan, tambah) |
| `outline` | Border + background transparan | Secondary action |
| `secondary` | Emerald-100 background | Alternatif action |
| `ghost` | Tanpa background, hover effect | Tertiary / subtle |
| `destructive` | Red-100 background | Aksi bahaya (hapus) |
| `link` | Teks primary + underline | Link appearance |

### Sizes

| Size | Height | Padding | Icon | Font | Kapan |
|---|---|---|---|---|---|
| `xs` | 24px | px-2 | 12px | xs | Kontrol kecil |
| `sm` | 28px | px-2.5 | 14px | 0.8rem | Compact |
| `default` | 32px | px-2.5 | 16px | 14px | Standard |
| `lg` | 36px | px-2.5 | 16px | 14px | Besar |
| `action` | 36px | px-4 | 16px | 14px | CTA utama |
| `icon` | 32px | square | — | — | Ikon saja |
| `icon-xs` | 24px | square | 12px | — | Ikon kecil |
| `icon-sm` | 28px | square | 14px | — | Ikon sedang |
| `icon-lg` | 36px | square | 16px | — | Ikon besar |

### Focus Ring

```css
ring-offset: 3px
ring-color:  ring/50
```

---

## 10. Badge & Status Color

**File:** `src/components/shared/status-badge.tsx`

### Badge Variants

| Variant | Tampilan |
|---|---|
| `filled` (default) | Solid background berwarna |
| `outline` | Hanya border, teks berwarna |

### Peta Status → Warna

#### Status Penerimaan Barang (Good Receipt)

| Status | Warna | Variant |
|---|---|---|
| `MENUNGGU_INPUT` | Blue | outline |
| `MENUNGGU_REVIEW` | Amber | outline |
| `DITOLAK` | Red | destructive |
| `SELESAI` | Green | default |

#### Status Purchase Order

| Status | Warna | Variant |
|---|---|---|
| `DRAFT` | Gray | secondary |
| `SENT` | Blue | outline |
| `PARTIAL_RECEIVED` | Amber | outline |
| `RECEIVED` | Green | default |
| `INVOICED` | Purple | default |
| `PAID` | Green | default |

#### Status Stok

| Status | Warna | Keterangan |
|---|---|---|
| `AKTIF` | Green | Stok normal |
| `QUARANTINE` | Orange | Dalam karantina |
| `DEFEKTA` | Red | Barang rusak |
| `KADALUARSA` | Red | Expired |

#### Status Persetujuan

| Status | Warna |
|---|---|
| `PENDING` | Amber |
| `APPROVED` | Green |
| `REJECTED` | Red |

#### Indikator Level Stok

| Level | Warna | Keterangan |
|---|---|---|
| `AMAN` | Green | Stok cukup |
| `MENIPIS` | Amber | Perlu restock |
| `KRITIS` | Red | Stok sangat sedikit |

#### Status Alkes (Peralatan Medis)

| Status | Warna |
|---|---|
| `AKTIF` | Green |
| `PERBAIKAN` | Orange |
| `KALIBRASI` | Blue |
| `TIDAK_AKTIF` | Red |

---

## 11. Stats Card

**File:** `src/components/shared/stats-card.tsx`

### Anatomi

```
┌─────────────────────────────────┐
│  Judul Metrik        [Icon Badge]│
│                                 │
│  999.999             subtitle   │
│  ↑ +12% dari bulan lalu        │
└─────────────────────────────────┘
```

- Value: `text-3xl font-bold`
- Icon badge: pojok kanan atas, ukuran `h-10 w-10`
- Trend: panah naik/turun + persentase

### Variants

| Variant | Background Icon | Kapan |
|---|---|---|
| `default` | `emerald/10` | Metrik umum |
| `success` | `green-100` | Metrik positif |
| `warning` | `amber-100` | Metrik perhatian |
| `danger` | `red-100` | Metrik kritis |

---

## 12. Data Table

**File:** `src/components/shared/data-table.tsx`

**Engine:** TanStack React Table v8

### Fitur

- Search/filter per kolom
- Sort kolom (ascending/descending)
- Pagination dengan jump ke halaman
- Loading skeleton state
- Row click handler
- Empty state (kosong)
- Custom toolbar slot
- Responsive

### Toolbar Default

```
[Search Input]              [Kolom Kustom]     [Showing X of Y]  [< Prev  Page  Next >]
```

---

## 13. Ikon

**Library:** Lucide React v1.17.0

### Ikon Umum per Kategori

| Kategori | Ikon |
|---|---|
| Navigasi | `LayoutDashboard`, `PanelLeft`, `ChevronDown`, `ChevronRight`, `Home` |
| Aksi | `Plus`, `Edit`, `Trash2`, `Download`, `Upload`, `Copy`, `Search` |
| Status | `CheckCircle`, `AlertCircle`, `XCircle`, `Clock`, `AlertTriangle` |
| Bisnis | `Package`, `Pill`, `Truck`, `ShoppingCart`, `Receipt`, `Barcode` |
| Alkes | `Stethoscope`, `Wrench` |
| Analitik | `BarChart3`, `TrendingUp`, `TrendingDown` |
| Notifikasi | `Bell` |
| User | `User`, `LogOut`, `Settings` |
| UI | `Filter`, `Menu`, `X`, `SlidersHorizontal` |

### Ukuran Standar

| Konteks | Size Class |
|---|---|
| Inline / button | `h-4 w-4` (16px) |
| Navigation item | `h-4 w-4` atau `h-5 w-5` |
| Sidebar logo | `h-5 w-5` (20px) |
| Header toggle | `h-10 w-10` (40px) |
| Empty state | `h-10 w-10` atau `h-12 w-12` |

---

## 14. Animasi & Transisi

### CSS Animations

Diimport dari `tw-animate-css`.

### Transisi Komponen

| Komponen | CSS Transition |
|---|---|
| Sidebar width (desktop) | `transition-[width] duration-300 ease-in-out` |
| Sidebar slide (mobile) | `transition-transform duration-300 ease-in-out` |
| Theme toggle | `transition-all duration-200` |
| Button | `transition-all outline-none` |
| Warna / hover | `transition-colors` |

---

## 15. Scrollbar

Didefinisikan di `src/app/globals.css`:

```css
::-webkit-scrollbar        { width: 6px; height: 6px; }
::-webkit-scrollbar-track  { background: var(--muted); }
::-webkit-scrollbar-thumb  { background: var(--border); border-radius: 9999px; }
::-webkit-scrollbar-thumb:hover { background: var(--muted-foreground) / 0.3; }
```

---

## 16. Tema (Dark Mode)

**Provider:** `next-themes` v0.4.6

```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="light"
  enableSystem
  disableTransitionOnChange={false}
>
```

- Default: `light`
- Deteksi system preference: aktif
- Toggle: `ThemeToggle` component di header
- Implementasi: tambah/hapus class `.dark` di `<html>`
- Sidebar tetap **putih** di dark mode untuk konsistensi brand

---

## 17. Struktur Folder Komponen

```
src/
├── app/
│   ├── globals.css          ← Design tokens (CSS variables)
│   ├── layout.tsx           ← Root layout + Providers
│   └── (dashboard)/
│       └── layout.tsx       ← Dashboard shell (sidebar + header + main)
│
├── components/
│   ├── ui/                  ← 31 shadcn/ui primitive components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   └── ... (28 lainnya)
│   │
│   ├── shared/              ← Reusable business components
│   │   ├── page-header.tsx
│   │   ├── data-table.tsx
│   │   ├── stats-card.tsx
│   │   ├── status-badge.tsx
│   │   ├── typography.tsx
│   │   ├── empty-state.tsx
│   │   ├── loading-skeleton.tsx
│   │   ├── confirm-dialog.tsx
│   │   └── export-button.tsx
│   │
│   ├── layout/              ← Layout shell components
│   │   ├── sidebar.tsx      ← Sidebar panel (72px / 288px)
│   │   ├── sidebar-nav.tsx  ← Navigation menu (role-based)
│   │   ├── header.tsx       ← Top header (72px)
│   │   ├── breadcrumb.tsx   ← Auto breadcrumb
│   │   └── theme-toggle.tsx ← Dark/light switcher
│   │
│   └── features/            ← Feature-specific components
│       ├── alkes/
│       ├── analytics/
│       ├── audit/
│       ├── auth/
│       ├── dashboard/
│       ├── defekta/
│       ├── e-prescribing/
│       ├── inventory/
│       ├── master-data/
│       ├── notifications/
│       ├── pengaturan/
│       ├── procurement/
│       ├── profil/
│       └── supplier/
│
├── lib/
│   ├── utils.ts             ← cn() utility
│   ├── constants/
│   │   ├── roles.ts         ← User roles & permissions
│   │   ├── routes.ts        ← Semua app routes
│   │   └── status.ts        ← Status labels & color map
│   └── validations/         ← Zod schemas
│
├── store/
│   ├── auth-store.ts        ← Auth state
│   ├── sidebar-store.ts     ← Sidebar open/collapsed state
│   └── notification-store.ts
│
└── hooks/                   ← Custom React hooks
    ├── use-auth.ts
    ├── use-sidebar.ts
    ├── use-role.ts
    └── use-*.ts             ← Query hooks per fitur
```

---

## Ringkasan Cepat

| Aspek | Nilai |
|---|---|
| Brand color | Emerald (`#10b981`) |
| Header height | **72px** |
| Sidebar expanded | **288px** |
| Sidebar collapsed | **72px** |
| Font | Inter Variable |
| Radius base | 10px |
| Breakpoint mobile | `< 768px` |
| Content padding | `p-4` / `lg:p-6` |
| Icon library | Lucide React |
| UI components | shadcn/ui (radix-nova style) |
| Theme | Light default, Dark supported |
| Language | Bahasa Indonesia |
