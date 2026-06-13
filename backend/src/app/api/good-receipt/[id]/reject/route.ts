import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { rejectedReason, rejectedBy } = body

    if (!rejectedReason) {
      return NextResponse.json({ error: 'Field rejectedReason wajib diisi' }, { status: 400 })
    }

    const existing = await prisma.goodReceipt.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Good Receipt tidak ditemukan' }, { status: 404 })
    if (existing.status !== 'PERLU_REVIEW_ADMIN') {
      return NextResponse.json({ error: `GR berstatus ${existing.status}, tidak dapat ditolak` }, { status: 422 })
    }

    await prisma.$transaction([
      prisma.goodReceipt.update({
        where: { id },
        data: { status: 'PERLU_INPUT_APOTEKER', rejectedReason },
      }),
      prisma.grRevisi.create({
        data: {
          grId: id,
          revisiKe: existing.revisiKe,
          alasanPenolakan: rejectedReason,
          snapshot: {},
          submittedBy: rejectedBy ?? existing.createdBy,
        },
      }),
    ])

    return NextResponse.json({ data: { id, status: 'PERLU_INPUT_APOTEKER' } })
  } catch (error) {
    console.error(`PATCH /api/good-receipt/[id]/reject error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
