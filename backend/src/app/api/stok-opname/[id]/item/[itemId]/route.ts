import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../../lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const { id, itemId } = params
    const body = await request.json()
    const { qtyFisik } = body

    if (qtyFisik === undefined || qtyFisik === null) {
      return NextResponse.json({ error: 'Field qtyFisik wajib diisi' }, { status: 400 })
    }

    const opname = await prisma.stokOpname.findUnique({ where: { id } })
    if (!opname) {
      return NextResponse.json({ error: 'Stok opname tidak ditemukan' }, { status: 404 })
    }
    if (opname.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Opname sudah berstatus ${opname.status}, tidak dapat diubah` },
        { status: 422 }
      )
    }

    const item = await prisma.opnameItem.findFirst({
      where: { id: itemId, opnameId: id },
    })
    if (!item) {
      return NextResponse.json({ error: 'Item opname tidak ditemukan' }, { status: 404 })
    }

    const updated = await prisma.opnameItem.update({
      where: { id: itemId },
      data: { qtyFisik },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error(`PATCH /api/stok-opname/[id]/item/[itemId] error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
