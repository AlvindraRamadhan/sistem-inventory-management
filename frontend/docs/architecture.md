# Frontend Architecture — Smart Clinic Inventory Management

> **Version:** 1.0  
> **Last Updated:** 2026-05-29  
> **Scope:** Next.js 16 App Router frontend only

---

## Table of Contents

1. [Tech Stack Decisions](#1-tech-stack-decisions)
2. [Project Structure](#2-project-structure)
3. [Role System & RBAC](#3-role-system--rbac)
4. [Module Catalogue](#4-module-catalogue)
5. [State Management Strategy](#5-state-management-strategy)
6. [Data Fetching & Caching](#6-data-fetching--caching)
7. [Form Architecture](#7-form-architecture)
8. [Table Architecture](#8-table-architecture)
9. [Key Domain Patterns](#9-key-domain-patterns)
10. [Export & Reporting](#10-export--reporting)
11. [Routing & Layout Conventions](#11-routing--layout-conventions)
12. [Authentication Flow](#12-authentication-flow)

---

## 1. Tech Stack Decisions

### Core

| Layer | Library | Version | Rationale |
|---|---|---|---|
| Framework | **Next.js** App Router | 16.2.6 | RSC, nested layouts, server actions — no separate BFF needed |
| Language | **TypeScript** strict mode | ^5 | End-to-end type safety from API contract to UI |
| Styling | **Tailwind CSS** v4 | ^4 | Utility-first, no runtime CSS |
| Component Kit | **shadcn/ui** (Default style, Slate base) | ^4.8 | Copy-owned components — no version lock-in, full customisation |

### State

| Concern | Library | Version | Rationale |
|---|---|---|---|
| Client/UI state | **Zustand** v5 | ^5.0 | Minimal boilerplate, no Provider wrapping |
| Server/async state | **TanStack Query** v5 | ^5.100 | Caching, background refetch, optimistic updates |

### Forms & Validation

| Concern | Library | Version |
|---|---|---|
| Form engine | **React Hook Form** v7 | ^7.76 |
| Schema validation | **Zod** v4 | ^4.4 |
| RHF ↔ Zod bridge | **@hookform/resolvers** | ^5.4 |

> Zod schemas serve dual purpose: runtime validation in forms **and** API response parsing via `z.parse()`.

### Data Display

| Concern | Library | Version |
|---|---|---|
| Headless tables | **TanStack Table** v8 | ^8.21 |
| Charts | **Recharts** v3 | ^3.8 |
| Icons | **Lucide React** | ^1.17 |
| Date utilities | **date-fns** v4 | ^4.3 |

### UX & Utilities

| Concern | Library | Version |
|---|---|---|
| Toast notifications | **Sonner** v2 | ^2.0 (mounted in root layout) |
| Drawer | **vaul** | ^1.1 |
| Command palette | **cmdk** | ^1.1 |
| Dark mode | **next-themes** | ^0.4 |
| Resizable panels | **react-resizable-panels** | ^4.11 |

### Export

| Concern | Library | Version |
|---|---|---|
| Excel export | **xlsx** | ^0.18 |
| PDF export | **jspdf** + **jspdf-autotable** | ^4.2 / ^5.0 |

---

## 2. Project Structure

```
frontend/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Public auth group — no sidebar
│   │   └── login/
│   ├── (dashboard)/            # Protected group — shared sidebar layout
│   │   ├── layout.tsx          # Shell: sidebar + topbar + Toaster
│   │   ├── dashboard/
│   │   ├── master-data/
│   │   │   ├── obat/
│   │   │   ├── kategori/
│   │   │   └── lokasi/
│   │   ├── supplier/
│   │   ├── procurement/
│   │   │   ├── purchase-order/
│   │   │   ├── good-receipt/
│   │   │   └── invoice/
│   │   ├── inventory/
│   │   │   ├── stok-masuk/
│   │   │   ├── stok-keluar/
│   │   │   ├── opname/
│   │   │   └── mutasi/
│   │   ├── defekta/
│   │   ├── e-prescribing/
│   │   ├── alkes/
│   │   │   └── kalibrasi/
│   │   ├── analytics/
│   │   ├── notifications/
│   │   └── audit-log/
│   ├── globals.css
│   └── layout.tsx              # Root: ThemeProvider, QueryClientProvider
│
├── components/
│   ├── ui/                     # shadcn/ui primitives (copy-owned)
│   ├── layout/                 # Sidebar, Topbar, Breadcrumb
│   ├── data-table/             # TanStack Table wrappers
│   ├── charts/                 # Recharts wrappers
│   ├── forms/                  # Shared form field components
│   └── [module]/               # Module-scoped components
│
├── lib/
│   ├── fefo.ts                 # FEFO batch selection engine
│   ├── approval-machine.ts     # Approval state machine
│   ├── axios.ts                # Axios instance + interceptors
│   ├── auth.ts                 # Session helpers
│   ├── export/
│   │   ├── excel.ts            # xlsx helpers
│   │   └── pdf.ts              # jspdf helpers
│   └── utils.ts                # cn(), formatters
│
├── hooks/                      # Custom React hooks
├── stores/                     # Zustand store slices
├── services/                   # API service functions (typed)
├── constants/
│   └── query-keys.ts           # TanStack Query key factory
├── types/                      # Shared TypeScript types/interfaces
├── schemas/                    # Zod validation schemas
└── docs/
    └── architecture.md         # This file
```

---

## 3. Role System & RBAC

### Roles

| Role | Persona | Primary Concern |
|---|---|---|
| **ADMIN** | Kepala Farmasi / Manajer | Strategis: approval, PO, analytics, master data, supplier |
| **APOTEKER** | Staf Farmasi | Operasional harian: input stok, keluar, defekta, opname, GR |
| **DOKTER** | Dokter / Klinisi | E-Prescribing: read-only interface resep pasien |

### Permission Model

RBAC di frontend bersifat **permission-based**, bukan role-check langsung. Role di-resolve menjadi set of permissions saat login; komponen hanya memeriksa permission, bukan role string.

```ts
// types/auth.ts
type Permission =
  | "purchase_order:create"
  | "purchase_order:approve"
  | "good_receipt:create"
  | "good_receipt:approve"
  | "stock_out:create"
  | "opname:create"
  | "defekta:create"
  | "defekta:approve"
  | "master_data:write"
  | "supplier:write"
  | "analytics:view"
  | "audit_log:view"
  | "kalibrasi:manage"
  | "e_prescribing:view";

// Usage in component
const { hasPermission } = useAuth();
if (!hasPermission("purchase_order:approve")) return <Forbidden />;
```

### Role → Permission Matrix

| Permission | ADMIN | APOTEKER | DOKTER |
|---|:---:|:---:|:---:|
| `purchase_order:create` | ✓ | ✓ | — |
| `purchase_order:approve` | ✓ | — | — |
| `good_receipt:create` | — | ✓ | — |
| `good_receipt:approve` | ✓ | — | — |
| `stock_out:create` | — | ✓ | — |
| `opname:create` | — | ✓ | — |
| `defekta:create` | — | ✓ | — |
| `defekta:approve` | ✓ | — | — |
| `master_data:write` | ✓ | — | — |
| `supplier:write` | ✓ | — | — |
| `analytics:view` | ✓ | — | — |
| `audit_log:view` | ✓ | — | — |
| `kalibrasi:manage` | ✓ | — | — |
| `e_prescribing:view` | — | ✓ | ✓ |

---

## 4. Module Catalogue

### Module 1 — Authentication & RBAC

**Owner route:** `/login`  
**Components:** `LoginForm`, `SessionGuard`  
**Patterns:** httpOnly cookie session, Axios refresh-token interceptor, permission resolver  

Flow:  
```
POST /auth/login → set httpOnly cookie (access + refresh)
→ resolve permissions from role
→ redirect ke dashboard role-specific
```

---

### Module 2 — Dashboard

**Owner route:** `/dashboard`  
**Variants:** Admin dashboard (KPI cards, Pareto chart, stok kritis) vs Apoteker dashboard (aktifitas hari ini, item hampir expired, GR pending)  
**Components:** `KpiCard`, `ParetoChart`, `CriticalStockTable`, `ExpiryAlertList`  
**Data:** Server-rendered initial data via RSC + client revalidation dengan TanStack Query  

---

### Module 3 — Master Data

**Owner route:** `/master-data/{obat,kategori,lokasi}`  
**Access:** ADMIN only (`master_data:write`)  
**Components:** `ObatTable`, `ObatFormDialog`, `KategoriTable`, `LokasiTable`  
**Patterns:** TanStack Table + optimistic delete, Zod schema validation  

Entities:
- **Obat** — nama, kode, kategori, satuan, stok_minimum, harga_beli, harga_jual, lokasi
- **Kategori** — nama, deskripsi
- **Lokasi Gudang** — kode_lokasi, nama, kapasitas

---

### Module 4 — Supplier Management

**Owner route:** `/supplier`  
**Access:** ADMIN (`supplier:write`)  
**Components:** `SupplierTable`, `SupplierFormDrawer`, `SupplierDetailSheet`  
**Features:** CRUD supplier, riwayat PO per supplier, rating evaluasi  

---

### Module 5 — Procurement (PO → GR → Invoice)

**Owner route:** `/procurement/{purchase-order,good-receipt,invoice}`  
**Access:** PO create (APOTEKER + ADMIN), approve (ADMIN); GR create (APOTEKER), approve (ADMIN)

#### Sub-module: Purchase Order

Approval state machine:
```
DRAFT → [submit] → PENDING_APPROVAL → [approve] → APPROVED
                                     → [reject]  → REJECTED
REJECTED → [revise] → PENDING_APPROVAL
```

**Optimistic update:** Ya — approve PO. Rollback on server error.

#### Sub-module: Good Receipt (GR)

- Input penerimaan barang per line item PO
- Validasi quantity ≤ quantity PO
- Catat batch number + expired date (digunakan FEFO engine)
- **Optimistic update:** Ya — approve GR

#### Sub-module: Invoice

- Rekonsiliasi GR dengan invoice supplier
- Status: DRAFT → VERIFIED → PAID

---

### Module 6 — Inventory

**Owner route:** `/inventory/{stok-masuk,stok-keluar,opname,mutasi}`

#### Stok Masuk

- Entry manual penambahan stok (non-PO)
- Input: obat, batch, expired date, qty, lokasi, alasan
- **No optimistic update** — stok harus akurat

#### Stok Keluar (FEFO)

- Pengeluaran stok mengikuti FEFO engine (`lib/fefo.ts`)
- FEFO engine: pure function, sort batch by `expiredDate ASC`, ambil qty dari batch terlama dulu
- **No optimistic update** — stok harus akurat

```ts
// lib/fefo.ts (concept)
export function selectBatchesFEFO(
  batches: StokBatch[],
  requestedQty: number
): SelectedBatch[] {
  const sorted = [...batches].sort(
    (a, b) => new Date(a.expiredDate).getTime() - new Date(b.expiredDate).getTime()
  );
  // fill requestedQty from sorted batches
}
```

#### Opname (Stock Count)

- Rekonsiliasi stok fisik vs stok sistem
- Generate selisih (surplus / defisit)
- Approval Admin sebelum adjustment diterapkan
- **No optimistic update**

#### Mutasi

- Perpindahan stok antar lokasi gudang
- Input: obat, dari-lokasi, ke-lokasi, qty, batch

---

### Module 7 — Defekta & Quarantine

**Owner route:** `/defekta`  
**Access:** Create (APOTEKER), Approve (ADMIN)

- Pelaporan obat rusak / expired / tidak layak
- Status: DRAFT → PENDING_APPROVAL → APPROVED (disposed) / REJECTED
- Approval Admin wajib sebelum disposal
- Tracking: alasan defekta, foto bukti, nilai kerugian

---

### Module 8 — E-Prescribing Interface

**Owner route:** `/e-prescribing`  
**Access:** APOTEKER (dispensing) + DOKTER (read-only resep)

- DOKTER: tulis resep digital per pasien, baca status dispensing
- APOTEKER: terima resep, verifikasi ketersediaan stok, dispensing (trigger stok keluar FEFO)
- Interface DOKTER = read-only, tidak ada aksi write di luar resep sendiri

---

### Module 9 — Alkes & Kalibrasi

**Owner route:** `/alkes`, `/alkes/kalibrasi`  
**Access:** ADMIN (`kalibrasi:manage`)

- Inventori alat kesehatan (terpisah dari obat)
- Jadwal kalibrasi berkala per alat
- Alert kalibrasi jatuh tempo (via Notifications module)
- Status kalibrasi: VALID / OVERDUE / IN_CALIBRATION

---

### Module 10 — Analytics & Pareto

**Owner route:** `/analytics`  
**Access:** ADMIN (`analytics:view`)

- **Pareto Chart (80/20):** obat dengan nilai/volume tertinggi
- **Trend Stok:** pergerakan stok per periode
- **Nilai Inventori:** total nilai stok berdasarkan FIFO/average cost
- **Supplier Performance:** lead time, fill rate per supplier
- **Expiry Monitoring:** stok akan expired dalam N hari

Library: Recharts (`BarChart`, `LineChart`, `ComposedChart`)

---

### Module 11 — Notifications & Audit Log

**Owner route:** `/notifications`, `/audit-log`

#### Notifications

- Stok di bawah minimum → alert Apoteker
- Kalibrasi jatuh tempo → alert Admin
- PO/GR/Defekta pending approval → alert Admin
- Resep menunggu dispensing → alert Apoteker

#### Audit Log

- Read-only, ADMIN only (`audit_log:view`)
- Setiap mutasi data tercatat: who, what, when, before, after
- Filter: user, modul, rentang tanggal, tipe aksi

---

## 5. State Management Strategy

### Zustand — Client/UI State Only

Zustand digunakan **hanya untuk state UI** yang tidak perlu di-persist ke server:

```ts
// stores/sidebar-store.ts
interface SidebarStore {
  isCollapsed: boolean;
  toggle: () => void;
}

// stores/auth-store.ts
interface AuthStore {
  user: User | null;
  permissions: Permission[];
  setSession: (user: User, permissions: Permission[]) => void;
  clearSession: () => void;
}
```

**Tidak digunakan Zustand untuk:** data server, filter table, pagination — semua itu TanStack Query + URL state.

### URL State — Filter & Pagination

Filter tabel dan pagination disimpan di URL search params sehingga bisa di-bookmark dan di-share:

```
/inventory/stok-keluar?page=2&search=amoxicillin&status=APPROVED
```

---

## 6. Data Fetching & Caching

### TanStack Query — Server State

```ts
// constants/query-keys.ts
export const queryKeys = {
  obat: {
    all: ["obat"] as const,
    list: (params: ObatParams) => ["obat", "list", params] as const,
    detail: (id: string) => ["obat", "detail", id] as const,
  },
  purchaseOrder: {
    all: ["purchase-order"] as const,
    list: (params: POParams) => ["purchase-order", "list", params] as const,
    detail: (id: string) => ["purchase-order", "detail", id] as const,
  },
  // ...per module
};
```

### Optimistic Updates Policy

| Operation | Optimistic Update | Rationale |
|---|:---:|---|
| Approve PO | **Yes** | Low-risk, reversible, improves UX |
| Approve GR | **Yes** | Low-risk, reversible |
| Create PO | **Yes** | Draft state, easily corrected |
| Stock Out | **No** | Stok harus akurat, no race condition |
| Opname adjustment | **No** | Audit-critical |
| Defekta approval | **No** | Irreversible disposal action |

### RSC vs Client Components

- **RSC (Server Components):** layout, initial data loading, pages yang tidak butuh interaktivitas
- **Client Components (`"use client"`):** form, table dengan filter interaktif, chart, komponen yang menggunakan hooks

---

## 7. Form Architecture

Semua form menggunakan stack: **React Hook Form + Zod + shadcn/ui Form primitives**.

```
Zod Schema (schemas/[module].ts)
    ↓ zodResolver
React Hook Form (useForm)
    ↓
shadcn/ui <Form> <FormField> <FormControl>
    ↓
API service call onSubmit
    ↓
TanStack Query invalidateQueries
```

Schema Zod bersifat **canonical** — schema yang sama digunakan untuk validasi form dan parsing response API.

---

## 8. Table Architecture

Semua tabel menggunakan **TanStack Table v8** (headless) dengan wrapper `DataTable` component.

```
TanStack Table (useReactTable)
    ↓
<DataTable> wrapper (components/data-table/)
    ↓ composes:
<DataTableToolbar>   — search, filter, column visibility
<DataTablePagination> — page size, prev/next
<DataTableBody>       — rows, loading skeleton, empty state
```

Fitur standar semua tabel:
- Server-side sorting dan filtering (params → TanStack Query)
- Column visibility toggle
- Export to Excel / PDF
- Row selection untuk bulk actions
- Loading skeleton state

---

## 9. Key Domain Patterns

### FEFO Engine (`lib/fefo.ts`)

Pure function — tidak ada side effect, mudah di-unit test.

```
Input:  batches[] (StokBatch dengan expiredDate), requestedQty
Output: SelectedBatch[] (batch mana + qty dari masing-masing)
```

Algoritma: sort batches by `expiredDate ASC` → ambil dari batch pertama sampai `requestedQty` terpenuhi.

### Approval State Machine (`lib/approval-machine.ts`)

```
         submit()
DRAFT ─────────────→ PENDING_APPROVAL
                           │
              approve() ───┤─── reject()
                 │         │         │
                 ▼         │         ▼
             APPROVED      │      REJECTED
                           │         │
                           │ revise() │
                           └──────────┘
                                 │
                                 ▼
                          PENDING_APPROVAL
```

Digunakan oleh: PO, GR, Defekta, Opname.

### Auth & Token Refresh

```
Request → Axios interceptor
    → if 401 → POST /auth/refresh (httpOnly cookie)
    → if success → retry original request
    → if fail → clearSession() → redirect /login
```

---

## 10. Export & Reporting

### Excel Export (`lib/export/excel.ts`)

Menggunakan library **xlsx**. Output: `.xlsx` file diunduh langsung dari browser.

Target: semua halaman tabel utama (Stok, PO, GR, Opname, Defekta).

### PDF Export (`lib/export/pdf.ts`)

Menggunakan **jspdf + jspdf-autotable**. Output: `.pdf` dengan header klinik, tabel data, footer timestamp.

Target: laporan formal (Laporan Opname, Laporan Defekta, Laporan Stok Akhir Bulan).

---

## 11. Routing & Layout Conventions

```
app/
├── (auth)/              # Route group — TIDAK ada layout protected
│   └── login/page.tsx
└── (dashboard)/         # Route group — semua route protected
    ├── layout.tsx        # <SessionGuard> + Sidebar + Topbar + <Toaster>
    └── [module]/
        ├── page.tsx      # List view (RSC)
        ├── [id]/
        │   └── page.tsx  # Detail view (RSC)
        └── _components/  # Module-scoped components (prefixed _ = tidak di-route)
```

### Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Route segment | `kebab-case` | `purchase-order/` |
| Page component | `PascalCase` default export | `export default function PurchaseOrderPage()` |
| Component files | `PascalCase.tsx` | `PurchaseOrderTable.tsx` |
| Hook files | `camelCase.ts` | `usePurchaseOrders.ts` |
| Service files | `camelCase.ts` | `purchaseOrderService.ts` |
| Store files | `kebab-case-store.ts` | `auth-store.ts` |
| Schema files | `kebab-case.schema.ts` | `purchase-order.schema.ts` |

---

## 12. Authentication Flow

```
1. User → POST /auth/login (credentials)
2. Server → set httpOnly cookie (access_token + refresh_token)
3. Server → return { user, role, permissions[] }
4. Client → setSession(user, permissions) ke Zustand auth-store
5. Client → redirect ke /dashboard

6. On every API request:
   Axios interceptor → reads cookie automatically (httpOnly, same-site)

7. On 401 response:
   Axios interceptor → POST /auth/refresh
   → success: retry original request
   → fail: clearSession() + router.push('/login')

8. On page load (SSR):
   SessionGuard (Server Component) → verify cookie server-side
   → invalid: redirect('/login')
   → valid: render page
```

---

*Dokumen ini adalah living document. Update setiap kali ada keputusan arsitektur baru.*
