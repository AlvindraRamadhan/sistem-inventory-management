import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { generateMonthlyCode } from '../../../lib/generate-code'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const supplierId = searchParams.get('supplierId')
    const tanggalFrom = searchParams.get('tanggalFrom')
    const tanggalTo = searchParams.get('tanggalTo')
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10)))
    const skip = (page - 1) * limit

    const where: Parameters<typeof prisma.purchaseOrder.findMany>[0]['where'] = {}
    if (status) where.status = status as any
    if (supplierId) where.supplierId = supplierId
    if (tanggalFrom || tanggalTo) {
      where.tanggalPo = {}
      if (tanggalFrom) where.tanggalPo.gte = new Date(tanggalFrom)
      if (tanggalTo) where.tanggalPo.lte = new Date(tanggalTo)
    }

    const [data, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          supplier: { select: { nama: true } },
          items: { include: { obat: { select: { nama: true } } } },
        },
      }),
      prisma.purchaseOrder.count({ where }),
    ])

    return NextResponse.json({
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('GET /api/purchase-order error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      supplierId,
      terminPembayaran,
      ppnIncluded,
      tanggalPo,
      tanggalKirim,
      catatan,
      items,
      createdBy,
    } = body

    if (!supplierId || !terminPembayaran || !Array.isArray(items) || items.length === 0 || !createdBy) {
      return NextResponse.json(
        { error: 'Field supplierId, terminPembayaran, items, createdBy wajib diisi' },
        { status: 400 }
      )
    }

    const noPo = await generateMonthlyCode('purchaseOrder')

    const po = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
        data: {
          noPo,
          supplierId,
          status: 'DRAFT',
          terminPembayaran,
          ppnIncluded: ppnIncluded ?? false,
          tanggalPo: tanggalPo ? new Date(tanggalPo) : new Date(),
          tanggalKirim: tanggalKirim ? new Date(tanggalKirim) : undefined,
          catatan,
          createdBy,
        },
      })

      await tx.poItem.createMany({
        data: items.map((item: { obatId: string; satuanNama: string; qty: number; hargaBeli: number }) => ({
          poId: po.id,
          obatId: item.obatId,
          satuanNama: item.satuanNama,
          qty: item.qty,
          hargaBeli: item.hargaBeli,
        })),
      })

      const subtotal = items.reduce(
        (sum: number, i: { qty: number; hargaBeli: number }) => sum + i.qty * i.hargaBeli,
        0
      )
      const ppn = ppnIncluded ? subtotal * 0.11 : 0

      const updated = await tx.purchaseOrder.update({
        where: { id: po.id },
        data: { subtotalNilai: subtotal, totalPpn: ppn, totalNilai: subtotal + ppn },
        include: {
          supplier: { select: { nama: true } },
          items: { include: { obat: { select: { nama: true } } } },
        },
      })

      return updated
    })

    return NextResponse.json({ data: po }, { status: 201 })
  } catch (error) {
    console.error('POST /api/purchase-order error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
