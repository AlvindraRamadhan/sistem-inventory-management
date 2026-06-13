import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { obatBaseSchema } from "@/lib/validations/obat"
import { ZodError } from "zod"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"))
    const search = searchParams.get("search") ?? undefined
    const kategoriId = searchParams.get("kategoriId") ?? undefined
    const isActiveParam = searchParams.get("isActive")
    const isActive = isActiveParam !== null ? isActiveParam === "true" : undefined

    const where = {
      ...(isActive !== undefined && { isActive }),
      ...(kategoriId && { kategoriId }),
      ...(search && {
        OR: [
          { nama: { contains: search, mode: "insensitive" as const } },
          { kode: { contains: search, mode: "insensitive" as const } },
          { namaGenerik: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    }

    const [obat, total] = await Promise.all([
      prisma.obat.findMany({
        where,
        include: {
          kategori: { select: { id: true, nama: true } },
          satuan: { select: { id: true, nama: true, singkatan: true } },
          supplier: { select: { id: true, nama: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { nama: "asc" },
      }),
      prisma.obat.count({ where }),
    ])

    return NextResponse.json({
      data: obat,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  } catch {
    return NextResponse.json({ error: "Gagal mengambil data obat" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = obatBaseSchema.parse(body)

    let kode = parsed.kode
    if (!kode) {
      const last = await prisma.obat.findFirst({
        orderBy: { kode: "desc" },
        where: { kode: { startsWith: "OBT-" } },
      })
      const nextNum = last ? parseInt(last.kode.slice(4)) + 1 : 1
      kode = `OBT-${String(nextNum).padStart(3, "0")}`
    }

    const data = await prisma.obat.create({
      data: {
        kode,
        nama: parsed.nama,
        kategoriId: parsed.kategoriId,
        satuanId: parsed.satuanId,
        hargaBeli: parsed.hargaBeli,
        lokasiDefaultId: parsed.lokasiDefaultId ?? null,
        stokMinimal: parsed.stokMinimal,
        stokMaksimal: parsed.stokMaksimal ?? null,
        isActive: parsed.isActive ?? true,
      },
      include: {
        kategori: { select: { id: true, nama: true } },
        satuan: { select: { id: true, nama: true, singkatan: true } },
      },
    })

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    if (err instanceof ZodError) return NextResponse.json({ error: err.issues }, { status: 422 })
    return NextResponse.json({ error: "Gagal membuat data obat" }, { status: 500 })
  }
}
