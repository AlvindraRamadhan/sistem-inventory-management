import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { logAction } from '../../../lib/audit-log'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      obatId,
      batchNumber,
      expiredDate,
      qty,
      lokasiId,
      hargaBeli,
      alasan,
      referenceId,
      referenceType,
      // Auth context expected from body (will come from session middleware in production)
      createdBy,
      createdByName,
      createdByRole,
    } = body

    if (!obatId || !batchNumber || !expiredDate || !qty || !lokasiId || !alasan || !createdBy) {
      return NextResponse.json(
        { error: 'Field obatId, batchNumber, expiredDate, qty, lokasiId, alasan, createdBy wajib diisi' },
        { status: 400 }
      )
    }

    const parsedExpiredDate = new Date(expiredDate)

    const result = await prisma.$transaction(async (tx) => {
      // 1. Cek apakah batch sudah ada
      const existingBatch = await tx.batch.findUnique({
        where: { obatId_batchNumber: { obatId, batchNumber } },
      })

      // 2. Upsert batch
      const batch = existingBatch
        ? await tx.batch.update({
            where: { id: existingBatch.id },
            data: { qty: { increment: qty } },
          })
        : await tx.batch.create({
            data: {
              obatId,
              batchNumber,
              tglProduksi: body.tglProduksi ? new Date(body.tglProduksi) : undefined,
              expiredDate: parsedExpiredDate,
              qty,
              lokasiId,
              hargaBeli: hargaBeli ?? 0,
              status: 'AKTIF',
            },
          })

      // 3. Insert stok masuk record
      const stokMasuk = await tx.stokMasuk.create({
        data: {
          obatId,
          batchNumber,
          expiredDate: parsedExpiredDate,
          qty,
          lokasiId,
          hargaBeli: hargaBeli ?? 0,
          alasan,
          referenceId,
          referenceType,
          createdBy,
        },
      })

      // 4. Update stok_saat di obat
      await tx.obat.update({
        where: { id: obatId },
        data: { stokSaat: { increment: qty } },
      })

      return { stokMasuk, batch }
    })

    // 5. Log audit (di luar transaction — non-critical)
    await logAction({
      userId: createdBy,
      userName: createdByName ?? 'Unknown',
      userRole: createdByRole ?? 'apoteker',
      action: 'CREATE',
      entityType: 'StokMasuk',
      entityId: result.stokMasuk.id,
      description: `Stok masuk ${qty} unit obat ${obatId}, batch ${batchNumber}`,
      afterData: result.stokMasuk,
    })

    return NextResponse.json({ data: result }, { status: 201 })
  } catch (error) {
    console.error('POST /api/stok-masuk error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
