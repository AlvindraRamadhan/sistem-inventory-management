import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateMonthlyCode } from '@/lib/generate-code'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { poId, tanggalPerkiraanDatang, createdBy } = body

    if (!poId || !createdBy) {
      return NextResponse.json({ error: 'Field poId dan createdBy wajib diisi' }, { status: 400 })
    }

    const noGr = await generateMonthlyCode('goodReceipt')

    const gr = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id: poId },
        include: { items: { include: { obat: true } } },
      })
      if (!po) throw new Error('Purchase Order tidak ditemukan')
      if (!['APPROVED', 'PARTIAL'].includes(po.status)) {
        throw new Error(`PO berstatus ${po.status}, tidak dapat dibuat GR`)
      }

      const gr = await tx.goodReceipt.create({
        data: {
          noGr,
          poId,
          supplierId: po.supplierId,
          status: 'MENUNGGU_KEDATANGAN',
          tanggalPerkiraanDatang: tanggalPerkiraanDatang
            ? new Date(tanggalPerkiraanDatang)
            : undefined,
          createdBy,
        },
      })

      await tx.grItem.createMany({
        data: po.items.map((item) => ({
          grId: gr.id,
          poItemId: item.id,
          obatId: item.obatId,
          satuanNama: item.satuanNama,
          qtyPo: item.qty,
          qtyTerima: 0,
          hargaBeli: item.hargaBeli,
        })),
      })

      await tx.purchaseOrder.update({
        where: { id: poId },
        data: { status: 'PARTIAL' },
      })

      return gr
    })

    return NextResponse.json({ data: gr }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    const isValidation = message.includes('tidak ditemukan') || message.includes('tidak dapat')
    console.error('POST /api/good-receipt error:', error)
    return NextResponse.json({ error: message }, { status: isValidation ? 422 : 500 })
  }
}
