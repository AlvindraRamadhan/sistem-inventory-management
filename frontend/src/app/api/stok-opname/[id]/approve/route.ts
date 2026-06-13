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

    const existing = await prisma.stokOpname.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Stok opname tidak ditemukan' }, { status: 404 })
    }
    if (existing.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Opname sudah berstatus ${existing.status}` },
        { status: 422 }
      )
    }

    await prisma.$transaction(async (tx) => {
      const opname = await tx.stokOpname.findUnique({
        where: { id },
        include: { items: true },
      })

      await tx.stokOpname.update({
        where: { id },
        data: { status: 'APPROVED', approvedBy, approvedAt: new Date() },
      })

      for (const item of opname!.items) {
        const selisih = item.qtyFisik - item.qtySystem
        if (selisih === 0) continue

        await tx.batch.update({
          where: { id: item.batchId },
          data: { qty: item.qtyFisik },
        })

        await tx.obat.update({
          where: { id: item.obatId },
          data: { stokSaat: { increment: selisih } },
        })

        if (selisih > 0) {
          await tx.stokMasuk.create({
            data: {
              obatId: item.obatId,
              batchNumber: item.batchNumber,
              expiredDate: item.expiredDate,
              qty: selisih,
              lokasiId: item.lokasiId,
              hargaBeli: 0,
              alasan: 'Koreksi opname',
              referenceId: id,
              referenceType: 'OPNAME',
              createdBy: approvedBy,
            },
          })
        } else {
          const stokKeluar = await tx.stokKeluar.create({
            data: {
              obatId: item.obatId,
              totalQty: Math.abs(selisih),
              alasan: 'Koreksi opname',
              referenceId: id,
              referenceType: 'OPNAME',
              createdBy: approvedBy,
            },
          })
          await tx.stokKeluarBatch.create({
            data: {
              stokKeluarId: stokKeluar.id,
              batchId: item.batchId,
              batchNumber: item.batchNumber,
              expiredDate: item.expiredDate,
              qty: Math.abs(selisih),
            },
          })
        }
      }
    })

    await logAction({
      userId: approvedBy,
      userName: approvedByName ?? 'Unknown',
      userRole: approvedByRole ?? 'admin',
      action: 'APPROVE',
      entityType: 'StokOpname',
      entityId: id,
      description: `Stok opname ${existing.noOpname} disetujui dan koreksi stok diterapkan`,
    })

    return NextResponse.json({ data: { id, status: 'APPROVED' } })
  } catch (error) {
    console.error(`PATCH /api/stok-opname/[id]/approve error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
