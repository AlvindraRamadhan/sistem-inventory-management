import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
import { generateMonthlyCode } from '../../../../../lib/generate-code'
import { logAction } from '../../../../../lib/audit-log'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { approvedBy, approvedByName, approvedByRole, catatanAdmin } = body

    if (!approvedBy) {
      return NextResponse.json({ error: 'Field approvedBy wajib diisi' }, { status: 400 })
    }
    if (approvedByRole !== 'admin') {
      return NextResponse.json({ error: 'Hanya admin yang dapat menyetujui GR' }, { status: 403 })
    }

    const existing = await prisma.goodReceipt.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Good Receipt tidak ditemukan' }, { status: 404 })
    if (existing.status !== 'PERLU_REVIEW_ADMIN') {
      return NextResponse.json({ error: `GR berstatus ${existing.status}, tidak dapat disetujui` }, { status: 422 })
    }

    const noInvoice = await generateMonthlyCode('purchaseInvoice')

    await prisma.$transaction(async (tx) => {
      await tx.goodReceipt.update({
        where: { id },
        data: { status: 'DISETUJUI', catatanAdmin, approvedBy, approvedAt: new Date() },
      })

      const grItems = await tx.grItem.findMany({ where: { grId: id } })

      let totalNilai = 0

      for (const item of grItems) {
        if (item.qtyTerima <= 0) continue

        // Upsert batch untuk semua item yang diterima
        const batchData = {
          obatId: item.obatId,
          batchNumber: item.batchNumber ?? `GR-${id.slice(0, 8)}`,
          expiredDate: item.expiredDate ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          lokasiId: item.lokasiId!,
          hargaBeli: item.hargaBeli,
        }

        if (!item.lokasiId) continue

        const existingBatch = item.batchNumber
          ? await tx.batch.findUnique({
              where: { obatId_batchNumber: { obatId: item.obatId, batchNumber: item.batchNumber } },
            })
          : null

        const batch = existingBatch
          ? await tx.batch.update({
              where: { id: existingBatch.id },
              data: { qty: { increment: item.qtyTerima } },
            })
          : await tx.batch.create({
              data: { ...batchData, qty: item.qtyTerima, status: 'AKTIF' },
            })

        if (item.kondisi === 'BAIK') {
          await tx.stokMasuk.create({
            data: {
              obatId: item.obatId,
              batchNumber: batch.batchNumber,
              expiredDate: batch.expiredDate,
              qty: item.qtyTerima,
              lokasiId: item.lokasiId,
              hargaBeli: item.hargaBeli,
              alasan: `Good Receipt ${existing.noGr}`,
              referenceId: id,
              referenceType: 'GOOD_RECEIPT',
              createdBy: approvedBy,
            },
          })

          await tx.obat.update({
            where: { id: item.obatId },
            data: { stokSaat: { increment: item.qtyTerima } },
          })

          totalNilai += Number(item.hargaBeli) * item.qtyTerima
        } else if (item.kondisi === 'RUSAK') {
          await tx.defekta.create({
            data: {
              obatId: item.obatId,
              batchId: batch.id,
              batchNumber: batch.batchNumber,
              qty: item.qtyTerima,
              alasan: `Barang rusak saat GR ${existing.noGr}`,
              status: 'PENDING',
              createdBy: approvedBy,
            },
          })
        }
      }

      await tx.purchaseInvoice.create({
        data: {
          noInvoice,
          grId: id,
          poId: existing.poId,
          supplierId: existing.supplierId,
          totalNilai,
          status: 'BELUM_BAYAR',
          tanggalInvoice: new Date(),
          createdBy: approvedBy,
        },
      })

      await tx.purchaseOrder.update({
        where: { id: existing.poId },
        data: { status: 'COMPLETED' },
      })
    })

    await logAction({
      userId: approvedBy,
      userName: approvedByName ?? 'Unknown',
      userRole: approvedByRole,
      action: 'APPROVE',
      entityType: 'GoodReceipt',
      entityId: id,
      description: `GR ${existing.noGr} disetujui, stok dan invoice dibuat`,
    })

    return NextResponse.json({ data: { id, status: 'DISETUJUI' } })
  } catch (error) {
    console.error(`PATCH /api/good-receipt/[id]/approve error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
