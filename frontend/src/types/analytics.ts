//  ABC / Pareto Analysis 

export type ABCCategory = "A" | "B" | "C";

export interface ParetoItem {
  obatId: string;
  namaObat: string;
  nilaiTotal: number;
  persentase: number;
  kumulatif: number;
  kategori: ABCCategory;
}

export interface ParetoData {
  items: ParetoItem[];
  periode: { dari: string; sampai: string };
  totalNilai: number;
}

//  Fast / Slow Moving 

export type MovingCategory = "FAST" | "MEDIUM" | "SLOW" | "NON_MOVING";

export interface FastSlowMoving {
  obatId: string;
  namaObat: string;
  totalKeluar: number;
  avgKeluar: number;       // average per period
  kategori: MovingCategory;
  periodeHari: number;     // analysis window in days
}

//  Safety Stock Alert 

export type AlertLevel = "CRITICAL" | "WARNING" | "OK";

export interface SafetyStockAlert {
  obatId: string;
  namaObat: string;
  stokSaat: number;
  stokMinimal: number;
  selisih: number;          // stokSaat - stokMinimal
  level: AlertLevel;
  estimasiHabis?: number;   // days until stockout based on avg usage
}

//  Trend & Nilai Inventori 

export interface TrendStok {
  tanggal: string;
  stokMasuk: number;
  stokKeluar: number;
  saldoAkhir: number;
}

export interface NilaiInventori {
  tanggal: string;
  nilaiTotal: number;
  jumlahItem: number;
}

//  Supplier Performance 

export interface SupplierPerformance {
  supplierId: string;
  supplierName: string;
  avgLeadTime: number;   // days
  fillRate: number;      // 0–100 percentage
  totalPO: number;
  totalGR: number;
}

//  Dashboard Summary 

export interface DashboardSummary {
  totalObat: number;
  obatExpiredCount: number;
  obatNearExpiredCount: number;   // within 30 days
  stokKritisCount: number;
  nilaiInventoriTotal: number;
  poPendingCount: number;
  grPendingCount: number;
  alkesKalibrasiDueCount: number;
}
