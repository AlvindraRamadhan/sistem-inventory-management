import axios from "axios"

export interface Satuan {
  id: string
  nama: string
  singkatan: string
  createdAt: string
}

export interface CreateSatuanDto {
  nama: string
  singkatan: string
}

export type UpdateSatuanDto = Partial<CreateSatuanDto>

export const satuanService = {
  getAll: (): Promise<Satuan[]> =>
    axios.get("/api/satuan").then((r) => r.data),

  getById: (id: string): Promise<Satuan> =>
    axios.get(`/api/satuan/${id}`).then((r) => r.data),

  create: (data: CreateSatuanDto): Promise<Satuan> =>
    axios.post("/api/satuan", data).then((r) => r.data),

  update: (id: string, data: UpdateSatuanDto): Promise<Satuan> =>
    axios.patch(`/api/satuan/${id}`, data).then((r) => r.data),

  delete: (id: string): Promise<{ success: boolean }> =>
    axios.delete(`/api/satuan/${id}`).then((r) => r.data),
}
