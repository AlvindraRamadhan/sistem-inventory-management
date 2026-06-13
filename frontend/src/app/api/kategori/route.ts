import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z, ZodError } from "zod"

const createSchema = z.object({
  nama: z.string().min(2),
  deskripsi: z.string().optional(),
})

export async function GET() {
  try {
    const data = await prisma.kategori.findMany({ orderBy: { nama: "asc" } })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Gagal mengambil data kategori" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = createSchema.parse(body)

    const count = await prisma.kategori.count()
    const kode = `KAT-${String(count + 1).padStart(3, "0")}`

    const data = await prisma.kategori.create({
      data: { kode, nama: parsed.nama, deskripsi: parsed.deskripsi ?? null },
    })
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    if (err instanceof ZodError) return NextResponse.json({ error: err.issues }, { status: 422 })
    return NextResponse.json({ error: "Gagal membuat kategori" }, { status: 500 })
  }
}

