import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: alkesId } = params

    const existing = await prisma.alkes.findUnique({ where: { id: alkesId } })
    if (!existing) {
      return NextResponse.json({ error: 'Alkes tidak ditemukan' }, { status: 404 })
    }

    const records = await prisma.kalibrasiRecord.findMany({
      where: { alkesId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ data: records })
  } catch (error) {
    console.error(`GET /api/alkes/[id]/kalibrasi error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: alkesId } = params
    const body = await request.json()

    const existing = await prisma.alkes.findUnique({ where: { id: alkesId } })
    if (!existing) {
      return NextResponse.json({ error: 'Alkes tidak ditemukan' }, { status: 404 })
    }

    const tanggalKalibrasi = body.tanggalKalibrasi
      ? new Date(body.tanggalKalibrasi)
      : new Date()
    const tanggalSelanjutnya = new Date(body.tanggalSelanjutnya)

    const kalibrasiData = {
      alkesId,
      status: 'SELESAI' as const,
      tanggalKalibrasi,
      tanggalSelanjutnya,
      intervalBulan: body.intervalBulan ?? 12,
      sertifikatNo: body.sertifikatNo,
      petugasKalibrasi: body.petugasKalibrasi,
      catatan: body.catatan,
    }

    const updateData = {
      tanggalKalibrasiTerakhir: tanggalKalibrasi,
      tanggalKalibrasiSelanjutnya: tanggalSelanjutnya,
      status: 'AKTIF' as const,
    }

    const [kalibrasiRecord] = await prisma.$transaction([
      prisma.kalibrasiRecord.create({ data: kalibrasiData }),
      prisma.alkes.update({ where: { id: alkesId }, data: updateData }),
    ])

    return NextResponse.json({ data: kalibrasiRecord }, { status: 201 })
  } catch (error) {
    console.error(`POST /api/alkes/[id]/kalibrasi error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
