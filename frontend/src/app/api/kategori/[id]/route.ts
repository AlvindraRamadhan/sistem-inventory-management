import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z, ZodError } from "zod"

type Params = { params: Promise<{ id: string }> }

const updateSchema = z.object({
  nama: z.string().min(2).optional(),
  deskripsi: z.string().optional(),
})

export async function GET(_: Request, { params }: Params) {
  const { id } = await params
  try {
    const data = await prisma.kategori.findUnique({ where: { id } })
    if (!data) return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Gagal mengambil kategori" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  try {
    const body = await request.json()
    const parsed = updateSchema.parse(body)
    const data = await prisma.kategori.update({ where: { id }, data: parsed })
    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof ZodError) return NextResponse.json({ error: err.issues }, { status: 422 })
    return NextResponse.json({ error: "Gagal mengupdate kategori" }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params
  try {
    const obatCount = await prisma.obat.count({ where: { kategoriId: id } })
    if (obatCount > 0) {
      return NextResponse.json(
        { error: "Kategori masih digunakan oleh data obat" },
        { status: 400 }
      )
    }
    await prisma.kategori.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Gagal menghapus kategori" }, { status: 500 })
  }
}
