import { create } from "zustand";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuditAction =
  | "STOK_MASUK"
  | "STOK_KELUAR"
  | "DEFEKTA_LAPOR"
  | "DEFEKTA_APPROVE"
  | "DEFEKTA_REJECT"
  | "OPNAME_BUAT"
  | "OPNAME_APPROVE"
  | "OPNAME_REJECT"
  | "MUTASI_LOKASI"
  | "PO_BUAT"
  | "PO_APPROVE"
  | "PO_REJECT"
  | "GR_INPUT"
  | "GR_APPROVE"
  | "GR_REJECT"
  | "OBAT_BUAT"
  | "OBAT_EDIT"
  | "OBAT_HAPUS"
  | "BATCH_BUAT"
  | "BATCH_EDIT"
  | "RESEP_BUAT"
  | "LOGIN"
  | "LOGOUT";

export type AuditEntityType =
  | "OBAT"
  | "BATCH"
  | "PO"
  | "GR"
  | "INVOICE"
  | "DEFEKTA"
  | "OPNAME"
  | "MUTASI"
  | "RESEP"
  | "USER";

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: AuditAction | string;
  entityType: AuditEntityType | string;
  entityId: string;
  description: string;
  before?: object;
  after?: object;
  ipAddress?: string;
}

// ─── Seed data (20 records) ───────────────────────────────────────────────────

function mins(n: number) {
  return new Date(Date.now() - n * 60_000).toISOString();
}
function hrs(n: number) {
  return new Date(Date.now() - n * 3_600_000).toISOString();
}
function days(n: number) {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}

const SEED_LOGS: AuditLog[] = [
  {
    id: "AL-001",
    timestamp: mins(5),
    userId: "2", userName: "Siti Rahayu, S.Farm", userRole: "apoteker",
    action: "STOK_KELUAR", entityType: "BATCH", entityId: "B-004",
    description: "Stok keluar: Ciprofloxacin 500mg (Batch BT2024-CP003) — 14 unit, Resep RES-2026-0530-002",
    before: { qty: 44 }, after: { qty: 30 },
    ipAddress: "192.168.1.12",
  },
  {
    id: "AL-002",
    timestamp: mins(28),
    userId: "2", userName: "Siti Rahayu, S.Farm", userRole: "apoteker",
    action: "STOK_KELUAR", entityType: "BATCH", entityId: "B-005",
    description: "Stok keluar: Dexamethasone 0.5mg (Batch BT2024-DX009) — 15 unit, Resep RES-2026-0530-001",
    before: { qty: 100 }, after: { qty: 85 },
    ipAddress: "192.168.1.12",
  },
  {
    id: "AL-003",
    timestamp: hrs(1),
    userId: "2", userName: "Siti Rahayu, S.Farm", userRole: "apoteker",
    action: "DEFEKTA_LAPOR", entityType: "DEFEKTA", entityId: "QR-002",
    description: "Laporan defekta: Vitamin B Complex (Batch BT2024-VB017) — 250 unit. Alasan: Label batch tidak terbaca",
    after: { status: "PENDING" },
    ipAddress: "192.168.1.12",
  },
  {
    id: "AL-004",
    timestamp: hrs(2),
    userId: "1", userName: "Dr. Ahmad Supriadi", userRole: "admin",
    action: "GR_APPROVE", entityType: "GR", entityId: "GR-2026-003",
    description: "Admin menyetujui Good Receipt GR-2026-003 dari PT. Kimia Farma (2 item, total 990 unit)",
    before: { status: "MENUNGGU_REVIEW" }, after: { status: "SELESAI" },
    ipAddress: "192.168.1.5",
  },
  {
    id: "AL-005",
    timestamp: hrs(2),
    userId: "2", userName: "Siti Rahayu, S.Farm", userRole: "apoteker",
    action: "STOK_MASUK", entityType: "BATCH", entityId: "B-006",
    description: "Stok masuk dari GR-2026-003: Metformin 500mg (Batch BT-MET-0426) — 600 unit ke Rak A1",
    after: { batchNumber: "BT-MET-0426", qty: 600, lokasiId: "LOK-A1" },
    ipAddress: "192.168.1.12",
  },
  {
    id: "AL-006",
    timestamp: hrs(3),
    userId: "2", userName: "Siti Rahayu, S.Farm", userRole: "apoteker",
    action: "STOK_MASUK", entityType: "BATCH", entityId: "B-012",
    description: "Stok masuk dari GR-2026-003: Glibenclamide 5mg (Batch BT-GLB-0426) — 390 unit ke Rak A1",
    after: { batchNumber: "BT-GLB-0426", qty: 390, lokasiId: "LOK-A1" },
    ipAddress: "192.168.1.12",
  },
  {
    id: "AL-007",
    timestamp: hrs(5),
    userId: "2", userName: "Siti Rahayu, S.Farm", userRole: "apoteker",
    action: "OPNAME_BUAT", entityType: "OPNAME", entityId: "OP-002",
    description: "Stok opname OP-2026-002 dibuat — 20 item diperiksa, selisih: +1 / -3",
    after: { noOpname: "OP-2026-002", status: "PENDING", totalItems: 20 },
    ipAddress: "192.168.1.12",
  },
  {
    id: "AL-008",
    timestamp: hrs(6),
    userId: "2", userName: "Siti Rahayu, S.Farm", userRole: "apoteker",
    action: "STOK_KELUAR", entityType: "BATCH", entityId: "B-007",
    description: "Stok keluar: Omeprazole 20mg (Batch BT2024-OM006) — 14 unit, Resep RES-2026-0522-001",
    before: { qty: 69 }, after: { qty: 55 },
    ipAddress: "192.168.1.12",
  },
  {
    id: "AL-009",
    timestamp: hrs(8),
    userId: "2", userName: "Siti Rahayu, S.Farm", userRole: "apoteker",
    action: "STOK_KELUAR", entityType: "BATCH", entityId: "B-009",
    description: "Stok keluar: Ondansetron 4mg (Batch BT2024-ON019) — 10 unit, Resep RES-2026-0524-003",
    before: { qty: 52 }, after: { qty: 42 },
    ipAddress: "192.168.1.12",
  },
  {
    id: "AL-010",
    timestamp: hrs(10),
    userId: "1", userName: "Dr. Ahmad Supriadi", userRole: "admin",
    action: "DEFEKTA_APPROVE", entityType: "DEFEKTA", entityId: "QR-001",
    description: "Admin menyetujui defekta: Simvastatin 20mg (Batch BT2024-SV018) — 60 unit dimusnahkan",
    before: { status: "PENDING" }, after: { status: "APPROVED" },
    ipAddress: "192.168.1.5",
  },
  {
    id: "AL-011",
    timestamp: days(1),
    userId: "2", userName: "Siti Rahayu, S.Farm", userRole: "apoteker",
    action: "MUTASI_LOKASI", entityType: "MUTASI", entityId: "MUT-2026-001",
    description: "Mutasi lokasi: Amoxicillin 500mg (Batch BT2025-AM001B) — 50 unit dari Rak A1 ke Rak A2",
    before: { lokasiId: "LOK-A1" }, after: { lokasiId: "LOK-A2" },
    ipAddress: "192.168.1.12",
  },
  {
    id: "AL-012",
    timestamp: days(1),
    userId: "1", userName: "Dr. Ahmad Supriadi", userRole: "admin",
    action: "OPNAME_APPROVE", entityType: "OPNAME", entityId: "OP-001",
    description: "Admin menyetujui opname OP-2026-001 — 18 item, selisih +3 / -5 dikoreksi",
    before: { status: "PENDING" }, after: { status: "APPROVED" },
    ipAddress: "192.168.1.5",
  },
  {
    id: "AL-013",
    timestamp: days(2),
    userId: "2", userName: "Siti Rahayu, S.Farm", userRole: "apoteker",
    action: "DEFEKTA_LAPOR", entityType: "DEFEKTA", entityId: "QR-001",
    description: "Laporan defekta: Simvastatin 20mg (Batch BT2024-SV018) — 60 unit. Alasan: Strip packaging rusak",
    after: { status: "PENDING" },
    ipAddress: "192.168.1.12",
  },
  {
    id: "AL-014",
    timestamp: days(2),
    userId: "2", userName: "Siti Rahayu, S.Farm", userRole: "apoteker",
    action: "STOK_MASUK", entityType: "BATCH", entityId: "B-016",
    description: "Stok masuk dari GR-2026-005: Vitamin C 500mg (Batch BT-VTC-0426) — 500 unit ke Rak A2",
    after: { batchNumber: "BT-VTC-0426", qty: 500, lokasiId: "LOK-A2" },
    ipAddress: "192.168.1.12",
  },
  {
    id: "AL-015",
    timestamp: days(3),
    userId: "1", userName: "Dr. Ahmad Supriadi", userRole: "admin",
    action: "GR_APPROVE", entityType: "GR", entityId: "GR-2026-005",
    description: "Admin menyetujui Good Receipt GR-2026-005 dari PT. Anugrah Argon Medica (3 item)",
    before: { status: "MENUNGGU_REVIEW" }, after: { status: "SELESAI" },
    ipAddress: "192.168.1.5",
  },
  {
    id: "AL-016",
    timestamp: days(5),
    userId: "2", userName: "Siti Rahayu, S.Farm", userRole: "apoteker",
    action: "GR_INPUT", entityType: "GR", entityId: "GR-2026-005",
    description: "Apoteker menginput GR-2026-005: 3 jenis obat, total 1050 unit diterima",
    before: { status: "MENUNGGU_INPUT" }, after: { status: "MENUNGGU_REVIEW" },
    ipAddress: "192.168.1.12",
  },
  {
    id: "AL-017",
    timestamp: days(7),
    userId: "1", userName: "Dr. Ahmad Supriadi", userRole: "admin",
    action: "OBAT_BUAT", entityType: "OBAT", entityId: "19",
    description: "Obat baru ditambahkan: Ondansetron 4mg (Kode: OND-019, Kategori: Obat Lambung)",
    after: { nama: "Ondansetron 4mg", kode: "OND-019", stokMinimal: 20 },
    ipAddress: "192.168.1.5",
  },
  {
    id: "AL-018",
    timestamp: days(10),
    userId: "1", userName: "Dr. Ahmad Supriadi", userRole: "admin",
    action: "PO_APPROVE", entityType: "PO", entityId: "PO-2026-003",
    description: "Admin menyetujui PO-2026-003 ke PT. Kimia Farma — 5 item, nilai Rp 8.750.000",
    before: { status: "DRAFT" }, after: { status: "SENT" },
    ipAddress: "192.168.1.5",
  },
  {
    id: "AL-019",
    timestamp: days(12),
    userId: "2", userName: "Siti Rahayu, S.Farm", userRole: "apoteker",
    action: "PO_BUAT", entityType: "PO", entityId: "PO-2026-003",
    description: "Purchase Order PO-2026-003 dibuat untuk PT. Kimia Farma — 5 jenis obat",
    after: { status: "DRAFT", supplierId: "s-001" },
    ipAddress: "192.168.1.12",
  },
  {
    id: "AL-020",
    timestamp: days(14),
    userId: "2", userName: "Siti Rahayu, S.Farm", userRole: "apoteker",
    action: "LOGIN", entityType: "USER", entityId: "2",
    description: "Login berhasil: Siti Rahayu, S.Farm (Apoteker)",
    ipAddress: "192.168.1.12",
  },
];

// ─── Store ────────────────────────────────────────────────────────────────────

interface AuditLogState {
  logs: AuditLog[];
  addLog: (log: AuditLog) => void;
  clearLogs: () => void;
}

export const useAuditLogStore = create<AuditLogState>()((set) => ({
  logs: [...SEED_LOGS],

  addLog: (log) =>
    set((s) => ({ logs: [log, ...s.logs] })),

  clearLogs: () => set({ logs: [] }),
}));
