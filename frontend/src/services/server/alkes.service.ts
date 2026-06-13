import axios from 'axios'

const BASE_URL = '/api/alkes'

export interface AlkesParams {
  search?: string
  status?: 'AKTIF' | 'TIDAK_AKTIF' | 'DALAM_PERBAIKAN'
  page?: number
  limit?: number
}

export interface CreateAlkesPayload {
  nama: string
  merek?: string
  model?: string
  serialNumber?: string
  lokasiId?: string
  status?: 'AKTIF' | 'TIDAK_AKTIF' | 'DALAM_PERBAIKAN'
  tanggalKalibrasiTerakhir?: string
  tanggalKalibrasiSelanjutnya?: string
}

export interface UpdateAlkesPayload extends Partial<CreateAlkesPayload> {}

export interface CreateKalibrasiPayload {
  tanggalKalibrasi?: string
  tanggalSelanjutnya: string
  intervalBulan?: number
  sertifikatNo?: string
  petugasKalibrasi?: string
  catatan?: string
}

const alkesService = {
  getAll: async (params?: AlkesParams) => {
    const { data } = await axios.get(BASE_URL, { params })
    return data
  },

  create: async (payload: CreateAlkesPayload) => {
    const { data } = await axios.post(BASE_URL, payload)
    return data
  },

  update: async (id: string, payload: UpdateAlkesPayload) => {
    const { data } = await axios.patch(`${BASE_URL}/${id}`, payload)
    return data
  },

  getKalibrasi: async (alkesId: string) => {
    const { data } = await axios.get(`${BASE_URL}/${alkesId}/kalibrasi`)
    return data
  },

  addKalibrasi: async (alkesId: string, payload: CreateKalibrasiPayload) => {
    const { data } = await axios.post(`${BASE_URL}/${alkesId}/kalibrasi`, payload)
    return data
  },
}

export default alkesService
