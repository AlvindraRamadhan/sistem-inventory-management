import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { obatId, batchId, batchNumber, qty, alasan, createdBy } = body

    if (!obatId || !batchId || !batchNumber || !qty || !alasan || !createdBy) {
      return NextResponse.json(
        { error: 'Field obatId, batchId, batchNumber, qty, alasan, createdBy wajib diisi' },
        { status: 400 }
      )
    }

    const defekta = await prisma.defekta.create({
      data: { obatId, batchId, batchNumber, qty, alasan, status: 'PENDING', createdBy },
    })

    return NextResponse.json({ data: defekta }, { status: 201 })
  } catch (error) {
    console.error('POST /api/defekta error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
