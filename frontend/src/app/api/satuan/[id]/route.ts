import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z, ZodError } from "zod"

type Params = { params: Promise<{ id: string }> }

const updateSchema = z.object({
  nama: z.string().min(2).optional(),
  singkatan: z.string().min(1).max(5).optional(),
})

export async function GET(_: Request, { params }: Params) {
  const { id } = await params
  try {
    const data = await prisma.satuan.findUnique({ where: { id } })
    if (!data) return NextResponse.json({ error: "Satuan tidak ditemukan" }, { status: 404 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Gagal mengambil satuan" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  try {
    const body = await request.json()
    const parsed = updateSchema.parse(body)
    const data = await prisma.satuan.update({ where: { id }, data: parsed })
    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof ZodError) return NextResponse.json({ error: err.issues }, { status: 422 })
    return NextResponse.json({ error: "Gagal mengupdate satuan" }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params
  try {
    const obatCount = await prisma.obat.count({ where: { satuanId: id } })
    if (obatCount > 0) {
      return NextResponse.json(
        { error: "Satuan masih digunakan oleh data obat" },
        { status: 400 }
      )
    }
    await prisma.satuan.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Gagal menghapus satuan" }, { status: 500 })
  }
}
