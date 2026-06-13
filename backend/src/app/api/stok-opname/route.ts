import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tanggalOpname, catatan, items, createdBy } = body

    if (!tanggalOpname || !Array.isArray(items) || items.length === 0 || !createdBy) {
      return NextResponse.json(
        { error: 'Field tanggalOpname, items, createdBy wajib diisi' },
        { status: 400 }
      )
    }

    const now = new Date()
    const yyyy = now.getFullYear().toString()
    const mm = String(now.getMonth() + 1).padStart(2, '0')

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const countThisMonth = await prisma.stokOpname.count({
      where: { createdAt: { gte: startOfMonth, lte: endOfMonth } },
    })
    const noOpname = `OP/${yyyy}/${mm}/${String(countThisMonth + 1).padStart(3, '0')}`

    // Ambil qtySystem dari batch saat ini untuk setiap item
    const batchIds: string[] = items.map((i: { batchId: string }) => i.batchId)
    const batches = await prisma.batch.findMany({
      where: { id: { in: batchIds } },
    })
    const batchMap = new Map(batches.map((b) => [b.id, b]))

    const opname = await prisma.stokOpname.create({
      data: {
        noOpname,
        tanggalOpname: new Date(tanggalOpname),
        catatan,
        createdBy,
        status: 'PENDING',
        items: {
          create: items.map((item: {
            batchId: string
            obatId: string
            lokasiId: string
          }) => {
            const batch = batchMap.get(item.batchId)
            if (!batch) throw new Error(`Batch ${item.batchId} tidak ditemukan`)
            return {
              obatId: item.obatId,
              batchId: item.batchId,
              batchNumber: batch.batchNumber,
              expiredDate: batch.expiredDate,
              lokasiId: item.lokasiId,
              qtySystem: batch.qty,
              qtyFisik: batch.qty, // default sama dengan system
            }
          }),
        },
      },
      include: { items: true },
    })

    return NextResponse.json({ data: opname }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    console.error('POST /api/stok-opname error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
