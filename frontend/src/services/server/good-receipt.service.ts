import axios from 'axios'

const BASE = '/api/good-receipt'

export interface CreateGrPayload {
  poId: string
  tanggalPerkiraanDatang?: string
  createdBy: string
}

export interface GrItemSubmit {
  id: string
  qtyTerima: number
  batchNumber?: string
  tanggalProduksi?: string
  expiredDate?: string
  lokasiId?: string
  kondisi?: 'BAIK' | 'RUSAK'
  keteranganKondisi?: string
}

export interface SubmitGrPayload {
  items: GrItemSubmit[]
  catatanApoteker?: string
  fotoUrls?: string[]
  submittedBy: string
}

export interface ApproveGrPayload {
  approvedBy: string
  approvedByName?: string
  approvedByRole: string
  catatanAdmin?: string
}

export interface RejectGrPayload {
  rejectedReason: string
  rejectedBy?: string
}

const goodReceiptService = {
  createFromPo: async (payload: CreateGrPayload) => {
    const { data } = await axios.post(BASE, payload)
    return data
  },

  submit: async (id: string, payload: SubmitGrPayload) => {
    const { data } = await axios.patch(`${BASE}/${id}/submit`, payload)
    return data
  },

  approve: async (id: string, payload: ApproveGrPayload) => {
    const { data } = await axios.patch(`${BASE}/${id}/approve`, payload)
    return data
  },

  reject: async (id: string, payload: RejectGrPayload) => {
    const { data } = await axios.patch(`${BASE}/${id}/reject`, payload)
    return data
  },
}

export default goodReceiptService
