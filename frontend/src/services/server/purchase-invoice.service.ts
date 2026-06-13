import axios from 'axios'

const BASE = '/api/purchase-invoice'

export interface InvoiceParams {
  status?: string
  supplierId?: string
  page?: number
  limit?: number
}

export interface LunasPayload {
  tanggalBayar?: string
  markedLunasByUid: string
}

const purchaseInvoiceService = {
  getAll: async (params?: InvoiceParams) => {
    const { data } = await axios.get(BASE, { params })
    return data
  },

  markLunas: async (id: string, payload: LunasPayload) => {
    const { data } = await axios.patch(`${BASE}/${id}/lunas`, payload)
    return data
  },

  uploadPdf: async (id: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await axios.post(`${BASE}/${id}/upload-pdf`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  getDownloadUrl: async (id: string): Promise<{ url: string }> => {
    const { data } = await axios.get(`${BASE}/${id}/download-pdf`)
    return data
  },
}

export default purchaseInvoiceService
