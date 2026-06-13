import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') ?? ''
    const isActiveParam = searchParams.get('isActive')
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10)))
    const skip = (page - 1) * limit

    const where: Parameters<typeof prisma.supplier.findMany>[0]['where'] = {}

    if (search) {
      where.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
        { kode: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (isActiveParam !== null) {
      where.isActive = isActiveParam === 'true'
    }

    const [data, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.supplier.count({ where }),
    ])

    return NextResponse.json({
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('GET /api/supplier error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const count = await prisma.supplier.count()
    const kode = `SUP-${String(count + 1).padStart(3, '0')}`

    const supplier = await prisma.supplier.create({
      data: {
        kode,
        nama: body.nama,
        pic: body.pic,
        telepon: body.telepon,
        email: body.email,
        alamat: body.alamat,
        termin: body.termin,
        isActive: body.isActive ?? true,
      },
    })

    return NextResponse.json({ data: supplier }, { status: 201 })
  } catch (error) {
    console.error('POST /api/supplier error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
