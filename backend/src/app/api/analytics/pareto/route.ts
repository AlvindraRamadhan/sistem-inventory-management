import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

interface ParetoRow {
  nama: string
  kode: string
  nilai_keluar: number
}

export async function GET() {
  try {
    const rows = await prisma.$queryRaw<ParetoRow[]>`
      SELECT
        o.nama,
        o.kode,
        SUM(skb.qty * b.harga_beli)::float AS nilai_keluar
      FROM stok_keluar sk
      JOIN stok_keluar_batch skb ON sk.id = skb.stok_keluar_id
      JOIN batch b               ON skb.batch_id = b.id
      JOIN obat o                ON sk.obat_id = o.id
      WHERE sk.created_at >= NOW() - INTERVAL '3 months'
      GROUP BY o.id, o.nama, o.kode
      ORDER BY nilai_keluar DESC
    `

    const total = rows.reduce((sum, r) => sum + Number(r.nilai_keluar), 0)

    let cumulative = 0
    const data = rows.map((r) => {
      const nilaiKeluar = Number(r.nilai_keluar)
      cumulative += nilaiKeluar
      const cumulativePct = total > 0 ? (cumulative / total) * 100 : 0
      const kategori =
        cumulativePct - (nilaiKeluar / total) * 100 < 80
          ? 'A'
          : cumulativePct - (nilaiKeluar / total) * 100 < 95
          ? 'B'
          : 'C'
      return {
        nama: r.nama,
        kode: r.kode,
        nilaiKeluar,
        cumulativePct: Math.round(cumulativePct * 100) / 100,
        kategori,
      }
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error('GET /api/analytics/pareto error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
