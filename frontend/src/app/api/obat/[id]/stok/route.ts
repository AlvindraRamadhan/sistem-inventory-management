import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string }> }

export async function GET(_: Request, { params }: Params) {
  const { id } = await params
  try {
    const [result, batches] = await Promise.all([
      prisma.batch.aggregate({
        where: { obatId: id, status: "AKTIF", qty: { gt: 0 } },
        _sum: { qty: true },
      }),
      prisma.batch.findMany({
        where: { obatId: id, status: "AKTIF", qty: { gt: 0 } },
        include: { lokasi: { select: { id: true, kode: true, nama: true } } },
        orderBy: { expiredDate: "asc" },
      }),
    ])

    return NextResponse.json({
      stokTotal: result._sum.qty ?? 0,
      batches,
    })
  } catch {
    return NextResponse.json({ error: "Gagal mengambil data stok" }, { status: 500 })
  }
}
