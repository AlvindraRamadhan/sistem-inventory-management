import axios from "axios"

export type TipeLokasi = "GUDANG" | "RUANG" | "RAK" | "LACI"
export type KondisiPenyimpanan = "SUHU_RUANG" | "DINGIN" | "TERKONTROL"

export const TIPE_LOKASI_LABEL: Record<TipeLokasi, string> = {
  GUDANG: "Gudang",
  RUANG: "Ruang",
  RAK: "Rak",
  LACI: "Laci",
}

export const KONDISI_LABEL: Record<KondisiPenyimpanan, string> = {
  SUHU_RUANG: "Suhu Ruang",
  DINGIN: "Dingin",
  TERKONTROL: "Terkontrol",
}

export interface LokasiGudang {
  id: string
  kode: string
  nama: string
  tipe: TipeLokasi
  parentId?: string | null
  kapasitas?: number | null
  terpakai: number
  kondisi: KondisiPenyimpanan
  keterangan?: string | null
  path: string
  children?: LokasiGudang[]
  createdAt: string
  updatedAt: string
}

export interface CreateLokasiGudangDto {
  nama: string
  tipe: TipeLokasi
  parentId?: string
  kapasitas?: number
  kondisi?: KondisiPenyimpanan
  keterangan?: string
}

export type UpdateLokasiGudangDto = Partial<CreateLokasiGudangDto>

export interface LokasiGudangParams {
  search?: string
  flat?: boolean
}

function buildTree(flat: LokasiGudang[]): LokasiGudang[] {
  const map = new Map<string, LokasiGudang>()
  const roots: LokasiGudang[] = []
  flat.forEach((l) => map.set(l.id, { ...l, children: [] }))
  map.forEach((l) => {
    if (l.parentId && map.has(l.parentId)) {
      map.get(l.parentId)!.children!.push(l)
    } else {
      roots.push(l)
    }
  })
  return roots
}

export const lokasiGudangService = {
  getAll: async (params?: LokasiGudangParams): Promise<LokasiGudang[]> => {
    const data: LokasiGudang[] = await axios.get("/api/lokasi-gudang").then((r) => r.data)
    let items = data
    if (params?.search) {
      const q = params.search.toLowerCase()
      items = items.filter(
        (l) => l.nama.toLowerCase().includes(q) || l.kode.toLowerCase().includes(q)
      )
    }
    if (params?.flat) return items
    return buildTree(items)
  },

  getById: (id: string): Promise<LokasiGudang> =>
    axios.get(`/api/lokasi-gudang/${id}`).then((r) => r.data),

  create: (data: CreateLokasiGudangDto): Promise<LokasiGudang> =>
    axios.post("/api/lokasi-gudang", data).then((r) => r.data),

  update: (id: string, data: UpdateLokasiGudangDto): Promise<LokasiGudang> =>
    axios.patch(`/api/lokasi-gudang/${id}`, data).then((r) => r.data),

  delete: (id: string): Promise<{ success: boolean }> =>
    axios.delete(`/api/lokasi-gudang/${id}`).then((r) => r.data),
}
