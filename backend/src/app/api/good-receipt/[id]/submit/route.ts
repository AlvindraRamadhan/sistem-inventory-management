import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { items, catatanApoteker, fotoUrls, submittedBy } = body

    if (!Array.isArray(items) || !submittedBy) {
      return NextResponse.json({ error: 'Field items dan submittedBy wajib diisi' }, { status: 400 })
    }

    const existing = await prisma.goodReceipt.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Good Receipt tidak ditemukan' }, { status: 404 })
    if (!['MENUNGGU_KEDATANGAN', 'PERLU_INPUT_APOTEKER'].includes(existing.status)) {
      return NextResponse.json({ error: `GR berstatus ${existing.status}, tidak dapat disubmit` }, { status: 422 })
    }

    const nextRevisi = existing.revisiKe + 1

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.grItem.update({
          where: { id: item.id },
          data: {
            qtyTerima: item.qtyTerima,
            batchNumber: item.batchNumber,
            tanggalProduksi: item.tanggalProduksi ? new Date(item.tanggalProduksi) : undefined,
            expiredDate: item.expiredDate ? new Date(item.expiredDate) : undefined,
            lokasiId: item.lokasiId,
            kondisi: item.kondisi ?? 'BAIK',
            keteranganKondisi: item.keteranganKondisi,
          },
        })
      }

      await tx.goodReceipt.update({
        where: { id },
        data: {
          status: 'PERLU_REVIEW_ADMIN',
          catatanApoteker,
          fotoUrls: fotoUrls ?? [],
          revisiKe: { increment: 1 },
          tanggalTerima: new Date(),
        },
      })

      await tx.grRevisi.create({
        data: {
          grId: id,
          revisiKe: nextRevisi,
          alasanPenolakan: '-',
          catatanApoteker,
          fotoUrls: fotoUrls ?? [],
          snapshot: items,
          submittedBy,
        },
      })
    })

    return NextResponse.json({ data: { id, status: 'PERLU_REVIEW_ADMIN' } })
  } catch (error) {
    console.error(`PATCH /api/good-receipt/[id]/submit error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
