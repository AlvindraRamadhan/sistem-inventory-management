import axios from "axios"
import type { ABCCategory } from "@/types/analytics"

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalObat: number
  totalStok: number
  stokKritis: number
  nearExpired: number
  pendingPO: number
  pendingGR: number
  invoiceAlert: number
}

// ─── Weekly Movement ──────────────────────────────────────────────────────────

export interface WeeklyMovementRow {
  week: string
  total: number
}

export interface WeeklyMovementData {
  stokMasuk: WeeklyMovementRow[]
  stokKeluar: WeeklyMovementRow[]
}

// ─── Pareto ───────────────────────────────────────────────────────────────────

export interface ParetoAnalysisParams {
  periode: string
  kategori?: string
}

export interface ParetoAnalysisItem {
  obatId: string
  namaObat: string
  kategoriNama: string
  satuanNama: string
  totalQty: number
  nilaiTotal: number
  persentase: number
  kumulatif: number
  abc: ABCCategory
}

export interface ParetoAbcSummary {
  A: { count: number; nilai: number }
  B: { count: number; nilai: number }
  C: { count: number; nilai: number }
}

export interface ParetoAnalysisResponse {
  items: ParetoAnalysisItem[]
  totalNilai: number
  summary: ParetoAbcSummary
  periode: { dari: string; sampai: string }
}

// ─── Safety Stock ─────────────────────────────────────────────────────────────

export interface SafetyStockItem {
  obatId: string
  kodeObat: string
  namaObat: string
  kategoriNama: string
  satuanNama: string
  stokSaat: number
  thresholdMin: number
  leadTime: number
  avgDailyUsage: number
  safetyStock: number
  hariTersisa: number | null
  isKritis: boolean
}

// ─── Fast/Slow Moving ─────────────────────────────────────────────────────────

export interface FastSlowItem {
  obatId: string
  namaObat: string
  kategoriNama: string
  satuanNama: string
  stokSaat: number
  totalKeluar: number
  avgPerBulan: number
  lastTransaksi: string
  moving: "FAST" | "MEDIUM" | "SLOW" | "NON_MOVING"
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const analyticsService = {
  getDashboardStats: (): Promise<DashboardStats> =>
    axios.get("/api/analytics/dashboard").then((r) => r.data.data),

  getWeeklyMovement: (): Promise<WeeklyMovementData> =>
    axios.get("/api/analytics/weekly-movement").then((r) => r.data.data),

  getParetoAnalysis: (params: ParetoAnalysisParams): Promise<ParetoAnalysisResponse> =>
    axios
      .get("/api/analytics/pareto", { params })
      .then((r) => r.data.data),

  getSafetyStock: (): Promise<SafetyStockItem[]> =>
    axios.get("/api/analytics/safety-stock").then((r) => r.data.data),

  getFastSlowItems: (): Promise<FastSlowItem[]> =>
    axios.get("/api/analytics/fast-slow").then((r) => r.data.data),
}
