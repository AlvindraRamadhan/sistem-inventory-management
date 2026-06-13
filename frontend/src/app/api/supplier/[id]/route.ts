import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    const existing = await prisma.supplier.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Supplier tidak ditemukan' }, { status: 404 })
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        nama: body.nama,
        pic: body.pic,
        telepon: body.telepon,
        email: body.email,
        alamat: body.alamat,
        termin: body.termin,
        isActive: body.isActive,
      },
    })

    return NextResponse.json({ data: supplier })
  } catch (error) {
    console.error(`PATCH /api/supplier/[id] error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
