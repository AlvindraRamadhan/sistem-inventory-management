import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
import { logAction } from '../../../../../lib/audit-log'

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

    const defekta = await prisma.defekta.findUnique({ where: { id } })
    if (!defekta) {
      return NextResponse.json({ error: 'Defekta tidak ditemukan' }, { status: 404 })
    }
    if (defekta.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Defekta sudah berstatus ${defekta.status}` },
        { status: 422 }
      )
    }

    const [updated] = await prisma.$transaction([
      prisma.defekta.update({
        where: { id },
        data: { status: 'APPROVED', approvedBy, approvedAt: new Date() },
      }),
      prisma.batch.update({
        where: { id: defekta.batchId },
        data: { qty: { decrement: defekta.qty } },
      }),
      prisma.obat.update({
        where: { id: defekta.obatId },
        data: { stokSaat: { decrement: defekta.qty } },
      }),
    ])

    await logAction({
      userId: approvedBy,
      userName: approvedByName ?? 'Unknown',
      userRole: approvedByRole ?? 'admin',
      action: 'APPROVE',
      entityType: 'Defekta',
      entityId: id,
      description: `Defekta disetujui: ${defekta.qty} unit batch ${defekta.batchNumber}`,
      beforeData: defekta,
      afterData: updated,
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error(`PATCH /api/defekta/[id]/approve error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
