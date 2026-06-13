import axios from 'axios'

const BASE_URL = '/api/supplier'

export interface SupplierParams {
  search?: string
  isActive?: boolean
  page?: number
  limit?: number
}

export interface CreateSupplierPayload {
  nama: string
  pic?: string
  telepon?: string
  email?: string
  alamat?: string
  termin?: string
  isActive?: boolean
}

export interface UpdateSupplierPayload extends Partial<CreateSupplierPayload> {}

const supplierService = {
  getAll: async (params?: SupplierParams) => {
    const { data } = await axios.get(BASE_URL, { params })
    return data
  },

  create: async (payload: CreateSupplierPayload) => {
    const { data } = await axios.post(BASE_URL, payload)
    return data
  },

  update: async (id: string, payload: UpdateSupplierPayload) => {
    const { data } = await axios.patch(`${BASE_URL}/${id}`, payload)
    return data
  },

  toggleActive: async (id: string) => {
    const { data } = await axios.patch(`${BASE_URL}/${id}/toggle-active`)
    return data
  },
}

export default supplierService
