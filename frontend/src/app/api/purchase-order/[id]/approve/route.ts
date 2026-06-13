import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logAction } from '@/lib/audit-log'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { approvedBy, approvedByName, approvedByRole } = body

    if (!approvedBy) {
      return NextResponse.json({ error: 'Field approvedBy wajib diisi' }, { status: 400 })
    }
    if (approvedByRole !== 'admin') {
      return NextResponse.json({ error: 'Hanya admin yang dapat menyetujui PO' }, { status: 403 })
    }

    const po = await prisma.purchaseOrder.findUnique({ where: { id } })
    if (!po) return NextResponse.json({ error: 'Purchase Order tidak ditemukan' }, { status: 404 })
    if (po.status !== 'PENDING_APPROVAL') {
      return NextResponse.json({ error: `PO berstatus ${po.status}, tidak dapat disetujui` }, { status: 422 })
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy, approvedAt: new Date() },
    })

    await logAction({
      userId: approvedBy,
      userName: approvedByName ?? 'Unknown',
      userRole: approvedByRole,
      action: 'APPROVE',
      entityType: 'PurchaseOrder',
      entityId: id,
      description: `PO ${po.noPo} disetujui`,
      beforeData: po,
      afterData: updated,
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error(`PATCH /api/purchase-order/[id]/approve error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
