export const ROUTES = {
  // Auth
  LOGIN: "/login",

  // Admin Routes
  ADMIN: {
    DASHBOARD: "/admin/dashboard",
    MASTER_DATA: {
      OBAT: "/admin/master-data/obat",
      KATEGORI: "/admin/master-data/kategori",
      LOKASI: "/admin/master-data/lokasi",
      BATCH_TRACKING: "/admin/master-data/batch-tracking",
    },
    SUPPLIER: "/admin/supplier",
    PROCUREMENT: {
      PO: "/admin/procurement/purchase-order",
      GR: "/admin/procurement/good-receipt",
      INVOICE: "/admin/procurement/invoice",
    },
    DEFEKTA: "/admin/defekta",
    OPNAME: "/admin/opname",
    ALKES: "/admin/alkes",
    ANALYTICS: {
      PARETO: "/admin/analytics/pareto",
      LAPORAN: "/admin/analytics/laporan",
      SAFETY_STOCK: "/admin/analytics/safety-stock",
    },
    AUDIT_LOG: "/admin/audit-log",
  },

  // Developer
  API_DOCS: "/api-docs",

  // Shared routes
  NOTIFIKASI: "/notifikasi",
  HELP: "/help",
  PROFIL: (role: "admin" | "apoteker") => `/${role}/profil` as const,
  PENGATURAN: (role: "admin" | "apoteker") => `/${role}/pengaturan` as const,

  // Apoteker Routes
  APOTEKER: {
    DASHBOARD: "/apoteker/dashboard",
    STOK_MASUK: "/apoteker/stok-masuk",
    STOK_KELUAR: "/apoteker/stok-keluar",
    GOOD_RECEIPT: "/apoteker/good-receipt",
    DEFEKTA: "/apoteker/defekta",
    OPNAME: "/apoteker/opname",
    MUTASI_LOKASI: "/apoteker/mutasi-lokasi",
    E_PRESCRIBING: "/apoteker/e-prescribing",
    ALKES: "/apoteker/alkes",
  },
} as const

export type AdminRoute = typeof ROUTES.ADMIN
export type ApotekerRoute = typeof ROUTES.APOTEKER
