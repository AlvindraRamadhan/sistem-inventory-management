import axios from 'axios'

export interface BatchParams {
  obatId?: string
  status?: 'AKTIF' | 'KADALUARSA' | 'HABIS' | 'RUSAK'
  expiredBefore?: string
  orderBy?: 'fefo' | 'latest'
}

export interface StokMasukPayload {
  obatId: string
  batchNumber: string
  expiredDate: string
  qty: number
  lokasiId: string
  hargaBeli?: number
  alasan: string
  tglProduksi?: string
  referenceId?: string
  referenceType?: string
  createdBy: string
  createdByName?: string
  createdByRole?: string
}

const stokMasukService = {
  getBatch: async (params?: BatchParams) => {
    const { data } = await axios.get('/api/batch', { params })
    return data
  },

  create: async (payload: StokMasukPayload) => {
    const { data } = await axios.post('/api/stok-masuk', payload)
    return data
  },
}

export default stokMasukService
