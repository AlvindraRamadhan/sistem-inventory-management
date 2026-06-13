import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { lokasiSchema } from "@/lib/validations/master-data"
import { ZodError } from "zod"

type Params = { params: Promise<{ id: string }> }

export async function GET(_: Request, { params }: Params) {
  const { id } = await params
  try {
    const data = await prisma.lokasiGudang.findUnique({ where: { id } })
    if (!data) return NextResponse.json({ error: "Lokasi tidak ditemukan" }, { status: 404 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Gagal mengambil data lokasi" }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params
  try {
    const body = await request.json()
    const parsed = lokasiSchema.partial().parse(body)

    let path: string | undefined
    if (parsed.nama || parsed.parentId !== undefined) {
      const current = await prisma.lokasiGudang.findUnique({ where: { id } })
      if (!current) return NextResponse.json({ error: "Lokasi tidak ditemukan" }, { status: 404 })

      const nama = parsed.nama ?? current.nama
      const parentId = parsed.parentId !== undefined ? parsed.parentId : current.parentId

      if (parentId) {
        const parent = await prisma.lokasiGudang.findUnique({ where: { id: parentId } })
        path = parent ? `${parent.path} / ${nama}` : nama
      } else {
        path = nama
      }
    }

    const data = await prisma.lokasiGudang.update({
      where: { id },
      data: {
        ...(parsed.nama && { nama: parsed.nama }),
        ...(parsed.tipe && { tipe: parsed.tipe as "GUDANG" | "RUANG" | "RAK" | "LACI" }),
        ...(parsed.parentId !== undefined && { parentId: parsed.parentId ?? null }),
        ...(path && { path }),
        ...(parsed.kapasitas !== undefined && { kapasitas: parsed.kapasitas }),
        ...(parsed.kondisi && { kondisi: parsed.kondisi as "SUHU_RUANG" | "DINGIN" | "TERKONTROL" }),
        ...(parsed.keterangan !== undefined && { keterangan: parsed.keterangan ?? null }),
      },
    })

    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 422 })
    }
    return NextResponse.json({ error: "Gagal mengupdate lokasi" }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const { id } = await params
  try {
    const batchCount = await prisma.batch.count({ where: { lokasiId: id } })
    if (batchCount > 0) {
      return NextResponse.json(
        { error: "Lokasi masih digunakan oleh batch aktif" },
        { status: 400 }
      )
    }

    await prisma.lokasiGudang.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Gagal menghapus lokasi" }, { status: 500 })
  }
}
