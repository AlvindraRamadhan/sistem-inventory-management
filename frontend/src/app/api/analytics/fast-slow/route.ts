import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface FastSlowRow {
  obat_id: string
  nama: string
  kategori_nama: string
  satuan_nama: string
  stok_saat: number
  total_keluar_6m: number
  avg_per_bulan: number
  last_transaksi: Date | null
}

export async function GET() {
  try {
    const rows = await prisma.$queryRaw<FastSlowRow[]>`
      SELECT
        o.id                                          AS obat_id,
        o.nama,
        COALESCE(k.nama, 'Umum')                      AS kategori_nama,
        COALESCE(s.nama, 'unit')                      AS satuan_nama,
        o.stok_saat,
        COALESCE(SUM(sk.total_qty), 0)::float         AS total_keluar_6m,
        COALESCE(SUM(sk.total_qty)::float / 6, 0)     AS avg_per_bulan,
        MAX(sk.created_at)                            AS last_transaksi
      FROM obat o
      LEFT JOIN kategori k  ON o.kategori_id = k.id
      LEFT JOIN satuan   s  ON o.satuan_id   = s.id
      LEFT JOIN stok_keluar sk
        ON sk.obat_id = o.id
       AND sk.created_at >= NOW() - INTERVAL '6 months'
      WHERE o.is_active = true
      GROUP BY o.id, o.nama, k.nama, s.nama, o.stok_saat
      ORDER BY avg_per_bulan DESC
    `

    const now = new Date().toISOString().slice(0, 10)

    const data = rows.map((r: FastSlowRow) => {
      const avgPerBulan = Math.round(Number(r.avg_per_bulan))
      const totalKeluar = Math.round(Number(r.total_keluar_6m))
      const lastTransaksi = r.last_transaksi
        ? new Date(r.last_transaksi).toISOString().slice(0, 10)
        : now

      let moving: "FAST" | "MEDIUM" | "SLOW" | "NON_MOVING"
      if (avgPerBulan === 0) moving = "NON_MOVING"
      else if (avgPerBulan >= 20) moving = "FAST"
      else if (avgPerBulan >= 5) moving = "MEDIUM"
      else moving = "SLOW"

      return {
        obatId: r.obat_id,
        namaObat: r.nama,
        kategoriNama: r.kategori_nama,
        satuanNama: r.satuan_nama,
        stokSaat: Number(r.stok_saat),
        totalKeluar,
        avgPerBulan,
        lastTransaksi,
        moving,
      }
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error("GET /api/analytics/fast-slow error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
