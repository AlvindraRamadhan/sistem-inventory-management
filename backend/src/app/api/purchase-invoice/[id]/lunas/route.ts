import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { tanggalBayar, markedLunasByUid } = body

    if (!markedLunasByUid) {
      return NextResponse.json({ error: 'Field markedLunasByUid wajib diisi' }, { status: 400 })
    }

    const invoice = await prisma.purchaseInvoice.findUnique({ where: { id } })
    if (!invoice) return NextResponse.json({ error: 'Invoice tidak ditemukan' }, { status: 404 })
    if (invoice.status === 'LUNAS') {
      return NextResponse.json({ error: 'Invoice sudah berstatus LUNAS' }, { status: 422 })
    }

    const updated = await prisma.purchaseInvoice.update({
      where: { id },
      data: {
        status: 'LUNAS',
        tanggalBayar: tanggalBayar ? new Date(tanggalBayar) : new Date(),
        markedLunasByUid,
        markedLunasAt: new Date(),
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error(`PATCH /api/purchase-invoice/[id]/lunas error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
