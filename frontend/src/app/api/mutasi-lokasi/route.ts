import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logAction } from '@/lib/audit-log'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { obatId, batchId, dariLokasiId, keLokasiId, qty, catatan, createdBy, createdByName, createdByRole } = body

    if (!obatId || !batchId || !dariLokasiId || !keLokasiId || !qty || !createdBy) {
      return NextResponse.json(
        { error: 'Field obatId, batchId, dariLokasiId, keLokasiId, qty, createdBy wajib diisi' },
        { status: 400 }
      )
    }

    const now = new Date()
    const yyyy = now.getFullYear().toString()
    const mm = String(now.getMonth() + 1).padStart(2, '0')

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const countThisMonth = await prisma.mutasiLokasi.count({
      where: { createdAt: { gte: startOfMonth, lte: endOfMonth } },
    })
    const noMutasi = `MUT/${yyyy}/${mm}/${String(countThisMonth + 1).padStart(3, '0')}`

    const mutasi = await prisma.$transaction(async (tx) => {
      const batch = await tx.batch.findUnique({ where: { id: batchId } })
      if (!batch) throw new Error(`Batch ${batchId} tidak ditemukan`)
      if (batch.qty < qty) throw new Error(`Stok batch tidak mencukupi untuk mutasi`)

      if (qty === batch.qty) {
        // Full transfer — pindahkan lokasi batch yang ada
        await tx.batch.update({
          where: { id: batchId },
          data: { lokasiId: keLokasiId },
        })
      } else {
        // Partial transfer — kurangi batch asal, buat batch baru di tujuan
        await tx.batch.update({
          where: { id: batchId },
          data: { qty: { decrement: qty } },
        })
        await tx.batch.create({
          data: {
            obatId,
            batchNumber: batch.batchNumber,
            expiredDate: batch.expiredDate,
            qty,
            lokasiId: keLokasiId,
            hargaBeli: batch.hargaBeli,
            status: 'AKTIF',
          },
        })
      }

      const mutasi = await tx.mutasiLokasi.create({
        data: {
          noMutasi,
          obatId,
          batchId,
          batchNumber: batch.batchNumber,
          expiredDate: batch.expiredDate,
          dariLokasiId,
          keLokasiId,
          qty,
          catatan,
          createdBy,
        },
      })

      return mutasi
    })

    await logAction({
      userId: createdBy,
      userName: createdByName ?? 'Unknown',
      userRole: createdByRole ?? 'apoteker',
      action: 'CREATE',
      entityType: 'MutasiLokasi',
      entityId: mutasi.id,
      description: `Mutasi ${noMutasi}: ${qty} unit dari lokasi ${dariLokasiId} ke ${keLokasiId}`,
      afterData: mutasi,
    })

    return NextResponse.json({ data: mutasi }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    const isValidation = message.includes('tidak ditemukan') || message.includes('tidak mencukupi')
    console.error('POST /api/mutasi-lokasi error:', error)
    return NextResponse.json({ error: message }, { status: isValidation ? 422 : 500 })
  }
}
