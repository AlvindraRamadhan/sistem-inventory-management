import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { rejectedReason } = body

    if (!rejectedReason) {
      return NextResponse.json({ error: 'Field rejectedReason wajib diisi' }, { status: 400 })
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

    const updated = await prisma.defekta.update({
      where: { id },
      data: { status: 'REJECTED', rejectedReason },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error(`PATCH /api/defekta/[id]/reject error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
