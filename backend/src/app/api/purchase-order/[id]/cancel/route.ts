import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'

export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const po = await prisma.purchaseOrder.findUnique({ where: { id } })
    if (!po) return NextResponse.json({ error: 'Purchase Order tidak ditemukan' }, { status: 404 })
    if (!['DRAFT', 'PENDING_APPROVAL'].includes(po.status)) {
      return NextResponse.json({ error: `PO berstatus ${po.status}, tidak dapat dibatalkan` }, { status: 422 })
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'CANCELLED' },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error(`PATCH /api/purchase-order/[id]/cancel error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
