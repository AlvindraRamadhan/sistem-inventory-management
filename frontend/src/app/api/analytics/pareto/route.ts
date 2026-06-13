import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"

interface ParetoRow {
  obat_id: string
  nama: string
  kode: string
  kategori_nama: string
  satuan_nama: string
  total_qty: number
  nilai_keluar: number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const periodeMonths = parseInt(searchParams.get("periode") ?? "3") || 3
    const kategori = searchParams.get("kategori")

    const rows: ParetoRow[] = kategori
      ? await prisma.$queryRaw`
          SELECT
            o.id       AS obat_id,
            o.nama,
            o.kode,
            COALESCE(k.nama, 'Umum') AS kategori_nama,
            COALESCE(s.nama, 'unit') AS satuan_nama,
            SUM(skb.qty)::float                AS total_qty,
            SUM(skb.qty * b.harga_beli)::float AS nilai_keluar
          FROM stok_keluar sk
          JOIN stok_keluar_batch skb ON sk.id = skb.stok_keluar_id
          JOIN batch b               ON skb.batch_id = b.id
          JOIN obat o                ON sk.obat_id = o.id
          LEFT JOIN kategori k       ON o.kategori_id = k.id
          LEFT JOIN satuan   s       ON o.satuan_id   = s.id
          WHERE sk.created_at >= NOW() - (${periodeMonths}::int || ' months')::interval
            AND k.nama = ${kategori}
          GROUP BY o.id, o.nama, o.kode, k.nama, s.nama
          ORDER BY nilai_keluar DESC
        `
      : await prisma.$queryRaw`
          SELECT
            o.id       AS obat_id,
            o.nama,
            o.kode,
            COALESCE(k.nama, 'Umum') AS kategori_nama,
            COALESCE(s.nama, 'unit') AS satuan_nama,
            SUM(skb.qty)::float                AS total_qty,
            SUM(skb.qty * b.harga_beli)::float AS nilai_keluar
          FROM stok_keluar sk
          JOIN stok_keluar_batch skb ON sk.id = skb.stok_keluar_id
          JOIN batch b               ON skb.batch_id = b.id
          JOIN obat o                ON sk.obat_id = o.id
          LEFT JOIN kategori k       ON o.kategori_id = k.id
          LEFT JOIN satuan   s       ON o.satuan_id   = s.id
          WHERE sk.created_at >= NOW() - (${periodeMonths}::int || ' months')::interval
          GROUP BY o.id, o.nama, o.kode, k.nama, s.nama
          ORDER BY nilai_keluar DESC
        `

    const totalNilai = rows.reduce((sum, r) => sum + Number(r.nilai_keluar), 0)

    let cumulative = 0
    const items = rows.map((r) => {
      const nilaiTotal = Number(r.nilai_keluar)
      const persentase = totalNilai > 0 ? (nilaiTotal / totalNilai) * 100 : 0
      cumulative += persentase
      const abc: "A" | "B" | "C" =
        cumulative - persentase < 80 ? "A" : cumulative - persentase < 95 ? "B" : "C"

      return {
        obatId: r.obat_id,
        namaObat: r.nama,
        kategoriNama: r.kategori_nama,
        satuanNama: r.satuan_nama,
        totalQty: Math.round(Number(r.total_qty)),
        nilaiTotal,
        persentase: Math.round(persentase * 10) / 10,
        kumulatif: Math.round(cumulative * 10) / 10,
        abc,
      }
    })

    const aItems = items.filter((i) => i.abc === "A")
    const bItems = items.filter((i) => i.abc === "B")
    const cItems = items.filter((i) => i.abc === "C")

    const now = new Date()
    const dari = new Date(now.getFullYear(), now.getMonth() - periodeMonths, 1)

    return NextResponse.json({
      data: {
        items,
        totalNilai,
        summary: {
          A: { count: aItems.length, nilai: aItems.reduce((s, i) => s + i.nilaiTotal, 0) },
          B: { count: bItems.length, nilai: bItems.reduce((s, i) => s + i.nilaiTotal, 0) },
          C: { count: cItems.length, nilai: cItems.reduce((s, i) => s + i.nilaiTotal, 0) },
        },
        periode: {
          dari: dari.toISOString().slice(0, 10),
          sampai: now.toISOString().slice(0, 10),
        },
      },
    })
  } catch (error) {
    console.error("GET /api/analytics/pareto error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
