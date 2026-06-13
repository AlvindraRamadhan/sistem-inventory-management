import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z, ZodError } from "zod"

const createSchema = z.object({
  nama: z.string().min(2),
  singkatan: z.string().min(1).max(5),
})

export async function GET() {
  try {
    const data = await prisma.satuan.findMany({ orderBy: { nama: "asc" } })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Gagal mengambil data satuan" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = createSchema.parse(body)
    const data = await prisma.satuan.create({ data: parsed })
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    if (err instanceof ZodError) return NextResponse.json({ error: err.issues }, { status: 422 })
    return NextResponse.json({ error: "Gagal membuat satuan" }, { status: 500 })
  }
}

