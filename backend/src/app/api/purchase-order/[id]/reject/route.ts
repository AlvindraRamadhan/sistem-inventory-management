import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { rejectedReason, approvedByRole } = body

    if (!rejectedReason) {
      return NextResponse.json({ error: 'Field rejectedReason wajib diisi' }, { status: 400 })
    }
    if (approvedByRole !== 'admin') {
      return NextResponse.json({ error: 'Hanya admin yang dapat menolak PO' }, { status: 403 })
    }

    const po = await prisma.purchaseOrder.findUnique({ where: { id } })
    if (!po) return NextResponse.json({ error: 'Purchase Order tidak ditemukan' }, { status: 404 })
    if (po.status !== 'PENDING_APPROVAL') {
      return NextResponse.json({ error: `PO berstatus ${po.status}, tidak dapat ditolak` }, { status: 422 })
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'CANCELLED', rejectedReason },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error(`PATCH /api/purchase-order/[id]/reject error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
