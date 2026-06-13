import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface SafetyStockRow {
  id: string
  kode: string
  nama: string
  kategori_nama: string
  satuan_nama: string
  stok_saat: number
  stok_minimal: number
  avg_daily_usage: number
}

export async function GET() {
  try {
    const rows = await prisma.$queryRaw<SafetyStockRow[]>`
      SELECT
        o.id,
        o.kode,
        o.nama,
        COALESCE(k.nama, 'Umum')  AS kategori_nama,
        COALESCE(s.nama, 'unit')  AS satuan_nama,
        o.stok_saat,
        o.stok_minimal,
        COALESCE(
          (
            SELECT SUM(sk.total_qty)::float / 30
            FROM stok_keluar sk
            WHERE sk.obat_id = o.id
              AND sk.created_at >= NOW() - INTERVAL '30 days'
          ),
          0
        ) AS avg_daily_usage
      FROM obat o
      LEFT JOIN kategori k ON o.kategori_id = k.id
      LEFT JOIN satuan   s ON o.satuan_id   = s.id
      WHERE o.is_active = true
      ORDER BY avg_daily_usage DESC
    `

    const data = rows.map((r: SafetyStockRow) => {
      const avgDaily = Number(r.avg_daily_usage)
      const safetyStock = Math.ceil(avgDaily * 7)
      const hariTersisa = avgDaily > 0 ? Math.floor(Number(r.stok_saat) / avgDaily) : null

      return {
        obatId: r.id,
        kodeObat: r.kode,
        namaObat: r.nama,
        kategoriNama: r.kategori_nama,
        satuanNama: r.satuan_nama,
        stokSaat: Number(r.stok_saat),
        thresholdMin: Number(r.stok_minimal),
        leadTime: 7,
        avgDailyUsage: Math.round(avgDaily * 100) / 100,
        safetyStock,
        hariTersisa,
        isKritis: Number(r.stok_saat) <= Number(r.stok_minimal),
      }
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error("GET /api/analytics/safety-stock error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
