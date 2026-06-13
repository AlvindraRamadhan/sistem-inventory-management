import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

interface SafetyStockRow {
  id: string
  kode: string
  nama: string
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
      WHERE o.is_active = true
      ORDER BY avg_daily_usage DESC
    `

    const data = rows.map((r) => {
      const avgDaily = Number(r.avg_daily_usage)
      // Safety stock = rata-rata pemakaian * lead time (default 7 hari)
      const safetyStock = Math.ceil(avgDaily * 7)
      // Estimasi hari tersisa
      const hariTersisa = avgDaily > 0 ? Math.floor(r.stok_saat / avgDaily) : null

      return {
        id: r.id,
        kode: r.kode,
        nama: r.nama,
        stokSaat: Number(r.stok_saat),
        stokMinimal: Number(r.stok_minimal),
        avgDailyUsage: Math.round(avgDaily * 100) / 100,
        safetyStock,
        hariTersisa,
        isKritis: Number(r.stok_saat) <= Number(r.stok_minimal),
      }
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error('GET /api/analytics/safety-stock error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
