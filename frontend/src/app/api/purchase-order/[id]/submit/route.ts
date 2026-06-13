import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const po = await prisma.purchaseOrder.findUnique({ where: { id } })
    if (!po) return NextResponse.json({ error: 'Purchase Order tidak ditemukan' }, { status: 404 })
    if (po.status !== 'DRAFT') {
      return NextResponse.json({ error: `PO berstatus ${po.status}, tidak dapat disubmit` }, { status: 422 })
    }

    const [updated] = await prisma.$transaction([
      prisma.purchaseOrder.update({
        where: { id },
        data: { status: 'PENDING_APPROVAL' },
      }),
      prisma.notification.create({
        data: {
          notifType: 'PO_APPROVAL',
          type: 'action',
          title: 'Purchase Order Menunggu Persetujuan',
          message: `PO ${po.noPo} memerlukan persetujuan Anda`,
          href: `/procurement/purchase-order/${id}`,
          targetRoles: ['admin'],
        },
      }),
    ])

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error(`PATCH /api/purchase-order/[id]/submit error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
