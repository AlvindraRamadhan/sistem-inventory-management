import axios from "axios"
import type { PaginatedResponse } from "@/lib/api-client"

export interface ObatKategori {
  id: string
  nama: string
}

export interface ObatSatuan {
  id: string
  nama: string
  singkatan: string
}

export interface ObatSupplier {
  id: string
  nama: string
}

export interface ObatItem {
  id: string
  kode: string
  nama: string
  namaGenerik?: string | null
  kategoriId: string
  satuanId: string
  supplierId?: string | null
  lokasiDefaultId?: string | null
  stokMinimal: number
  stokMaksimal?: number | null
  hargaBeli: string
  hargaJual?: string | null
  stokSaat: number
  isActive: boolean
  kategori: ObatKategori
  satuan: ObatSatuan
  supplier?: ObatSupplier | null
  createdAt: string
  updatedAt: string
}

export interface ObatStats {
  total: number
  aman: number
  menipis: number
  kritis: number
}

export interface ObatParams {
  page?: number
  limit?: number
  search?: string
  kategoriId?: string
  isActive?: boolean
}

export interface CreateObatDto {
  nama: string
  namaGenerik?: string
  kategoriId: string
  satuanId: string
  supplierId?: string
  lokasiDefaultId?: string
  hargaBeli: number
  hargaJual?: number
  stokMinimal: number
  stokMaksimal?: number
  isActive?: boolean
}

export type UpdateObatDto = Partial<CreateObatDto>

export interface ObatStokResult {
  stokTotal: number
  batches: {
    id: string
    batchNumber: string
    qty: number
    expiredDate: string
    lokasi: { id: string; kode: string; nama: string }
  }[]
}

export const obatService = {
  getAll: async (params?: ObatParams): Promise<PaginatedResponse<ObatItem>> => {
    const query = new URLSearchParams()
    if (params?.page) query.set("page", String(params.page))
    if (params?.limit) query.set("limit", String(params.limit))
    if (params?.search) query.set("search", params.search)
    if (params?.kategoriId) query.set("kategoriId", params.kategoriId)
    if (params?.isActive !== undefined) query.set("isActive", String(params.isActive))
    return axios.get(`/api/obat?${query}`).then((r) => r.data)
  },

  getById: (id: string): Promise<ObatItem> =>
    axios.get(`/api/obat/${id}`).then((r) => r.data),

  create: (data: CreateObatDto): Promise<ObatItem> =>
    axios.post("/api/obat", data).then((r) => r.data),

  update: (id: string, data: UpdateObatDto): Promise<ObatItem> =>
    axios.patch(`/api/obat/${id}`, data).then((r) => r.data),

  softDelete: (id: string): Promise<ObatItem> =>
    axios.patch(`/api/obat/${id}`, { isActive: false }).then((r) => r.data),

  getStokSummary: (id: string): Promise<ObatStokResult> =>
    axios.get(`/api/obat/${id}/stok`).then((r) => r.data),
}
