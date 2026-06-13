import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    const existing = await prisma.alkes.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Alkes tidak ditemukan' }, { status: 404 })
    }

    const alkes = await prisma.alkes.update({
      where: { id },
      data: {
        nama: body.nama,
        merek: body.merek,
        model: body.model,
        serialNumber: body.serialNumber,
        lokasiId: body.lokasiId,
        status: body.status,
        tanggalKalibrasiTerakhir: body.tanggalKalibrasiTerakhir
          ? new Date(body.tanggalKalibrasiTerakhir)
          : undefined,
        tanggalKalibrasiSelanjutnya: body.tanggalKalibrasiSelanjutnya
          ? new Date(body.tanggalKalibrasiSelanjutnya)
          : undefined,
      },
      include: { lokasi: true },
    })

    return NextResponse.json({ data: alkes })
  } catch (error) {
    console.error(`PATCH /api/alkes/[id] error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
