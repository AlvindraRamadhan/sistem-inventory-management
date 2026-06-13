import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { lokasiSchema } from "@/lib/validations/master-data"
import { ZodError } from "zod"

export async function GET() {
  try {
    const data = await prisma.lokasiGudang.findMany({
      orderBy: [{ tipe: "asc" }, { nama: "asc" }],
    })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Gagal mengambil data lokasi" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = lokasiSchema.parse(body)

    let path = parsed.nama
    if (parsed.parentId) {
      const parent = await prisma.lokasiGudang.findUnique({
        where: { id: parsed.parentId },
      })
      if (!parent) {
        return NextResponse.json({ error: "Lokasi parent tidak ditemukan" }, { status: 404 })
      }
      path = `${parent.path} / ${parsed.nama}`
    }

    // Generate kode: prefix 3 huruf tipe + count+1
    const prefix: Record<string, string> = {
      GUDANG: "GDG",
      RUANG: "RNG",
      RAK: "RAK",
      LACI: "LAC",
    }
    const count = await prisma.lokasiGudang.count({
      where: { tipe: parsed.tipe as "GUDANG" | "RUANG" | "RAK" | "LACI" },
    })
    const kode = `${prefix[parsed.tipe]}-${String(count + 1).padStart(3, "0")}`

    const data = await prisma.lokasiGudang.create({
      data: {
        kode,
        nama: parsed.nama,
        tipe: parsed.tipe as "GUDANG" | "RUANG" | "RAK" | "LACI",
        parentId: parsed.parentId ?? null,
        path,
        kapasitas: parsed.kapasitas ?? null,
        kondisi: (parsed.kondisi ?? "SUHU_RUANG") as "SUHU_RUANG" | "DINGIN" | "TERKONTROL",
        keterangan: parsed.keterangan ?? null,
      },
    })

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 422 })
    }
    return NextResponse.json({ error: "Gagal membuat lokasi" }, { status: 500 })
  }
}
