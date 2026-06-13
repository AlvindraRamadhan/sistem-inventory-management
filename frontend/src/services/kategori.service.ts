import axios from "axios"

export interface Kategori {
  id: string
  kode: string
  nama: string
  deskripsi?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateKategoriDto {
  kode: string
  nama: string
  deskripsi?: string
}

export type UpdateKategoriDto = Partial<CreateKategoriDto>

export const kategoriService = {
  getAll: (): Promise<Kategori[]> =>
    axios.get("/api/kategori").then((r) => r.data),

  getById: (id: string): Promise<Kategori> =>
    axios.get(`/api/kategori/${id}`).then((r) => r.data),

  create: (data: CreateKategoriDto): Promise<Kategori> =>
    axios.post("/api/kategori", data).then((r) => r.data),

  update: (id: string, data: UpdateKategoriDto): Promise<Kategori> =>
    axios.patch(`/api/kategori/${id}`, data).then((r) => r.data),

  delete: (id: string): Promise<{ success: boolean }> =>
    axios.delete(`/api/kategori/${id}`).then((r) => r.data),
}
