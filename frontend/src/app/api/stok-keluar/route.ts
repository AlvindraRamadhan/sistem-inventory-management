import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logAction } from '@/lib/audit-log'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      obatId,
      batches,
      alasan,
      referenceId,
      referenceType,
      createdBy,
      createdByName,
      createdByRole,
    } = body

    if (!obatId || !Array.isArray(batches) || batches.length === 0 || !alasan || !createdBy) {
      return NextResponse.json(
        { error: 'Field obatId, batches, alasan, createdBy wajib diisi' },
        { status: 400 }
      )
    }

    const stokKeluar = await prisma.$transaction(async (tx) => {
      // Validasi semua batch punya qty yang cukup
      for (const item of batches) {
        const batch = await tx.batch.findUnique({ where: { id: item.batchId } })
        if (!batch || batch.qty < item.qty) {
          throw new Error(`Stok batch ${item.batchId} tidak mencukupi`)
        }
      }

      const totalQty = batches.reduce((sum: number, b: { qty: number }) => sum + b.qty, 0)

      // Insert stok keluar
      const stokKeluar = await tx.stokKeluar.create({
        data: { obatId, totalQty, alasan, referenceId, referenceType, createdBy },
      })

      // Process setiap batch
      for (const item of batches) {
        const batch = await tx.batch.findUnique({ where: { id: item.batchId } })
        const newQty = batch!.qty - item.qty

        await tx.stokKeluarBatch.create({
          data: {
            stokKeluarId: stokKeluar.id,
            batchId: item.batchId,
            batchNumber: batch!.batchNumber,
            expiredDate: batch!.expiredDate,
            qty: item.qty,
          },
        })

        await tx.batch.update({
          where: { id: item.batchId },
          data: { qty: newQty, status: newQty === 0 ? 'HABIS' : 'AKTIF' },
        })
      }

      // Update stok_saat di obat
      await tx.obat.update({
        where: { id: obatId },
        data: { stokSaat: { decrement: totalQty } },
      })

      return stokKeluar
    })

    await logAction({
      userId: createdBy,
      userName: createdByName ?? 'Unknown',
      userRole: createdByRole ?? 'apoteker',
      action: 'CREATE',
      entityType: 'StokKeluar',
      entityId: stokKeluar.id,
      description: `Stok keluar obat ${obatId} dari ${batches.length} batch`,
      afterData: stokKeluar,
    })

    return NextResponse.json({ data: stokKeluar }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    const isValidation = message.includes('tidak mencukupi')
    console.error('POST /api/stok-keluar error:', error)
    return NextResponse.json({ error: message }, { status: isValidation ? 422 : 500 })
  }
}
