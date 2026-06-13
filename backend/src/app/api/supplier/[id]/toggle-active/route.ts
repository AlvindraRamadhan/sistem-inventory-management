import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'

export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const existing = await prisma.supplier.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Supplier tidak ditemukan' }, { status: 404 })
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: { isActive: !existing.isActive },
    })

    return NextResponse.json({ data: supplier })
  } catch (error) {
    console.error(`PATCH /api/supplier/[id]/toggle-active error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
