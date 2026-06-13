import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const obatId = searchParams.get('obatId')
    const status = searchParams.get('status')
    const expiredBefore = searchParams.get('expiredBefore')
    const orderByParam = searchParams.get('orderBy')

    const where: Parameters<typeof prisma.batch.findMany>[0]['where'] = {}

    if (obatId) where.obatId = obatId
    if (status) {
      where.status = status as Parameters<typeof prisma.batch.findMany>[0]['where']['status']
    }
    if (expiredBefore) where.expiredDate = { lte: new Date(expiredBefore) }

    // FEFO by default, or when orderBy=fefo is explicitly requested
    const orderBy: Parameters<typeof prisma.batch.findMany>[0]['orderBy'] =
      !orderByParam || orderByParam === 'fefo'
        ? { expiredDate: 'asc' }
        : { createdAt: 'desc' }

    const data = await prisma.batch.findMany({
      where,
      orderBy,
      include: {
        obat: { select: { id: true, kode: true, nama: true } },
        lokasi: { select: { id: true, kode: true, nama: true } },
      },
    })

    return NextResponse.json({ data })
  } catch (error) {
    console.error('GET /api/batch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
