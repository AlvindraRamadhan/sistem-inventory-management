import axios from 'axios'

const BASE = '/api/purchase-order'

export interface PoItemPayload {
  obatId: string
  satuanNama: string
  qty: number
  hargaBeli: number
}

export interface CreatePoPayload {
  supplierId: string
  terminPembayaran: string
  ppnIncluded?: boolean
  tanggalPo?: string
  tanggalKirim?: string
  catatan?: string
  items: PoItemPayload[]
  createdBy: string
}

export interface PoParams {
  status?: string
  supplierId?: string
  tanggalFrom?: string
  tanggalTo?: string
  page?: number
  limit?: number
}

export interface ApproveRejectPayload {
  approvedBy: string
  approvedByName?: string
  approvedByRole: string
  rejectedReason?: string
}

const purchaseOrderService = {
  getAll: async (params?: PoParams) => {
    const { data } = await axios.get(BASE, { params })
    return data
  },

  create: async (payload: CreatePoPayload) => {
    const { data } = await axios.post(BASE, payload)
    return data
  },

  submit: async (id: string) => {
    const { data } = await axios.patch(`${BASE}/${id}/submit`)
    return data
  },

  approve: async (id: string, payload: ApproveRejectPayload) => {
    const { data } = await axios.patch(`${BASE}/${id}/approve`, payload)
    return data
  },

  reject: async (id: string, payload: ApproveRejectPayload) => {
    const { data } = await axios.patch(`${BASE}/${id}/reject`, payload)
    return data
  },

  cancel: async (id: string) => {
    const { data } = await axios.patch(`${BASE}/${id}/cancel`)
    return data
  },
}

export default purchaseOrderService
