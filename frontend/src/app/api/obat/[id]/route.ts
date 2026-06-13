import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { obatBaseSchema } from "@/lib/validations/obat"
import { ZodError } from "zod"

type Params = { params: Promise<{ id: string }> }

export async function GET(_: Request, { params }: Params) {
  const { id } = await params
  try {
    const data = await prisma.obat.findUnique({
      where: { id },
      include: {
        kategori: { select: { id: true, nama: true } },
        satuan: { select: { id: true, nama: true, singkatan: true } },
        supplier: { select: { id: true, nama: true } },
        lokasiDefault: { select: { id: true, kode: true, nama: true } },
      },
    })
    if (!data) return NextResponse.json({ error: "Obat tidak ditemukan" }, { status: 404 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Gagal mengambil data obat" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  try {
    const body = await request.json()
    const parsed = obatBaseSchema.partial().parse(body)

    const data = await prisma.obat.update({
      where: { id },
      data: {
        ...(parsed.nama && { nama: parsed.nama }),
        ...(parsed.kategoriId && { kategoriId: parsed.kategoriId }),
        ...(parsed.satuanId && { satuanId: parsed.satuanId }),
        ...(parsed.hargaBeli !== undefined && { hargaBeli: parsed.hargaBeli }),
        ...(parsed.lokasiDefaultId !== undefined && {
          lokasiDefaultId: parsed.lokasiDefaultId ?? null,
        }),
        ...(parsed.stokMinimal !== undefined && { stokMinimal: parsed.stokMinimal }),
        ...(parsed.stokMaksimal !== undefined && { stokMaksimal: parsed.stokMaksimal ?? null }),
        ...(parsed.isActive !== undefined && { isActive: parsed.isActive }),
      },
      include: {
        kategori: { select: { id: true, nama: true } },
        satuan: { select: { id: true, nama: true, singkatan: true } },
      },
    })
    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof ZodError) return NextResponse.json({ error: err.issues }, { status: 422 })
    return NextResponse.json({ error: "Gagal mengupdate obat" }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params
  try {
    // Soft delete — set isActive = false
    const data = await prisma.obat.update({
      where: { id },
      data: { isActive: false },
    })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Gagal menonaktifkan obat" }, { status: 500 })
  }
}
