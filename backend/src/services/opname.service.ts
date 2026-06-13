import axios from 'axios'

export interface OpnameItem {
  obatId: string
  batchId: string
  lokasiId: string
}

export interface CreateOpnamePayload {
  tanggalOpname: string
  catatan?: string
  items: OpnameItem[]
  createdBy: string
}

export interface ApproveOpnamePayload {
  approvedBy: string
  approvedByName?: string
  approvedByRole?: string
}

export interface CreateMutasiPayload {
  obatId: string
  batchId: string
  dariLokasiId: string
  keLokasiId: string
  qty: number
  catatan?: string
  createdBy: string
  createdByName?: string
  createdByRole?: string
}

const opnameService = {
  create: async (payload: CreateOpnamePayload) => {
    const { data } = await axios.post('/api/stok-opname', payload)
    return data
  },

  updateItemQtyFisik: async (opnameId: string, itemId: string, qtyFisik: number) => {
    const { data } = await axios.patch(
      `/api/stok-opname/${opnameId}/item/${itemId}`,
      { qtyFisik }
    )
    return data
  },

  approve: async (opnameId: string, payload: ApproveOpnamePayload) => {
    const { data } = await axios.patch(`/api/stok-opname/${opnameId}/approve`, payload)
    return data
  },
}

export const mutasiService = {
  create: async (payload: CreateMutasiPayload) => {
    const { data } = await axios.post('/api/mutasi-lokasi', payload)
    return data
  },
}

export default opnameService
