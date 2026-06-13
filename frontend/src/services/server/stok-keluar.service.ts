import axios from 'axios'

export interface StokKeluarBatchItem {
  batchId: string
  qty: number
}

export interface StokKeluarPayload {
  obatId: string
  batches: StokKeluarBatchItem[]
  alasan: string
  referenceId?: string
  referenceType?: string
  createdBy: string
  createdByName?: string
  createdByRole?: string
}

export interface CreateDefektaPayload {
  obatId: string
  batchId: string
  batchNumber: string
  qty: number
  alasan: string
  createdBy: string
}

export interface ApproveDefektaPayload {
  approvedBy: string
  approvedByName?: string
  approvedByRole?: string
}

const stokKeluarService = {
  create: async (payload: StokKeluarPayload) => {
    const { data } = await axios.post('/api/stok-keluar', payload)
    return data
  },
}

export const defektaService = {
  create: async (payload: CreateDefektaPayload) => {
    const { data } = await axios.post('/api/defekta', payload)
    return data
  },

  approve: async (id: string, payload: ApproveDefektaPayload) => {
    const { data } = await axios.patch(`/api/defekta/${id}/approve`, payload)
    return data
  },

  reject: async (id: string, rejectedReason: string) => {
    const { data } = await axios.patch(`/api/defekta/${id}/reject`, { rejectedReason })
    return data
  },
}

export default stokKeluarService
