import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type RawCount = [{ count: bigint }]

export async function GET() {
  try {
    const now = new Date()
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const [
      totalObat,
      totalStokAgg,
      stokKritisRaw,
      nearExpired,
      pendingPO,
      pendingGR,
      invoiceAlert,
    ] = await Promise.all([
      prisma.obat.count({ where: { isActive: true } }),

      prisma.batch.aggregate({
        where: { status: "AKTIF" },
        _sum: { qty: true },
      }),

      prisma.$queryRaw<RawCount>`
        SELECT COUNT(*)::bigint as count
        FROM obat
        WHERE is_active = true AND stok_saat <= stok_minimal
      `,

      prisma.batch.count({
        where: {
          status: "AKTIF",
          qty: { gt: 0 },
          expiredDate: { lte: in30Days },
        },
      }),

      prisma.purchaseOrder.count({ where: { status: "PENDING_APPROVAL" } }),

      prisma.goodReceipt.count({
        where: { status: { in: ["PERLU_INPUT_APOTEKER", "PERLU_REVIEW_ADMIN"] } },
      }),

      prisma.purchaseInvoice.count({
        where: {
          status: { not: "LUNAS" },
          tanggalJatuhTempo: { lte: in7Days },
        },
      }),
    ])

    return NextResponse.json({
      data: {
        totalObat,
        totalStok: totalStokAgg._sum.qty ?? 0,
        stokKritis: Number(stokKritisRaw[0]?.count ?? 0),
        nearExpired,
        pendingPO,
        pendingGR,
        invoiceAlert,
      },
    })
  } catch (error) {
    console.error("GET /api/analytics/dashboard error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
