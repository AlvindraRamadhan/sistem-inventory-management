import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const supplierId = searchParams.get('supplierId')
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10)))
    const skip = (page - 1) * limit

    // Auto-update invoice yang sudah lewat jatuh tempo
    await prisma.purchaseInvoice.updateMany({
      where: {
        status: 'BELUM_BAYAR',
        tanggalJatuhTempo: { lt: new Date() },
      },
      data: { status: 'JATUH_TEMPO' },
    })

    const where: Parameters<typeof prisma.purchaseInvoice.findMany>[0]['where'] = {}
    if (status) where.status = status as any
    if (supplierId) where.supplierId = supplierId

    const [invoices, total] = await Promise.all([
      prisma.purchaseInvoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          supplier: { select: { nama: true } },
          gr: { select: { noGr: true } },
        },
      }),
      prisma.purchaseInvoice.count({ where }),
    ])

    const now = new Date()
    const data = invoices.map((inv) => ({
      ...inv,
      isOverdue:
        inv.status !== 'LUNAS' &&
        inv.tanggalJatuhTempo !== null &&
        inv.tanggalJatuhTempo < now,
    }))

    return NextResponse.json({
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('GET /api/purchase-invoice error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
