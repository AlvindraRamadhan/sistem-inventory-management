import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') ?? ''
    const status = searchParams.get('status')
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10)))
    const skip = (page - 1) * limit

    const where: Parameters<typeof prisma.alkes.findMany>[0]['where'] = {}

    if (search) {
      where.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
        { kode: { contains: search, mode: 'insensitive' } },
        { merek: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status) {
      where.status = status as Parameters<typeof prisma.alkes.findMany>[0]['where']['status']
    }

    const [data, total] = await Promise.all([
      prisma.alkes.findMany({
        where,
        include: { lokasi: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.alkes.count({ where }),
    ])

    return NextResponse.json({
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('GET /api/alkes error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const count = await prisma.alkes.count()
    const kode = `ALK-${String(count + 1).padStart(3, '0')}`

    const alkes = await prisma.alkes.create({
      data: {
        kode,
        nama: body.nama,
        merek: body.merek,
        model: body.model,
        serialNumber: body.serialNumber,
        lokasiId: body.lokasiId,
        status: body.status ?? 'AKTIF',
        tanggalKalibrasiTerakhir: body.tanggalKalibrasiTerakhir
          ? new Date(body.tanggalKalibrasiTerakhir)
          : undefined,
        tanggalKalibrasiSelanjutnya: body.tanggalKalibrasiSelanjutnya
          ? new Date(body.tanggalKalibrasiSelanjutnya)
          : undefined,
      },
      include: { lokasi: true },
    })

    return NextResponse.json({ data: alkes }, { status: 201 })
  } catch (error) {
    console.error('POST /api/alkes error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
