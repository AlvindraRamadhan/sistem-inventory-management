import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface WeekRow {
  week: Date
  total: bigint
}

export async function GET() {
  try {
    const [stokMasuk, stokKeluar] = await Promise.all([
      prisma.$queryRaw<WeekRow[]>`
        SELECT
          DATE_TRUNC('week', created_at) AS week,
          SUM(qty)::bigint                AS total
        FROM stok_masuk
        WHERE created_at >= NOW() - INTERVAL '8 weeks'
        GROUP BY DATE_TRUNC('week', created_at)
        ORDER BY week ASC
      `,
      prisma.$queryRaw<WeekRow[]>`
        SELECT
          DATE_TRUNC('week', created_at) AS week,
          SUM(total_qty)::bigint          AS total
        FROM stok_keluar
        WHERE created_at >= NOW() - INTERVAL '8 weeks'
        GROUP BY DATE_TRUNC('week', created_at)
        ORDER BY week ASC
      `,
    ])

    const serialize = (rows: WeekRow[]) =>
      rows.map((r) => ({ week: r.week.toISOString(), total: Number(r.total) }))

    return NextResponse.json({
      data: {
        stokMasuk: serialize(stokMasuk),
        stokKeluar: serialize(stokKeluar),
      },
    })
  } catch (error) {
    console.error("GET /api/analytics/weekly-movement error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
