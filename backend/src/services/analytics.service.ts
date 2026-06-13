import axios from 'axios'

const BASE = '/api/analytics'

const analyticsService = {
  getDashboard: async () => {
    const { data } = await axios.get(`${BASE}/dashboard`)
    return data
  },

  getWeeklyMovement: async () => {
    const { data } = await axios.get(`${BASE}/weekly-movement`)
    return data
  },

  getPareto: async () => {
    const { data } = await axios.get(`${BASE}/pareto`)
    return data
  },

  getSafetyStock: async () => {
    const { data } = await axios.get(`${BASE}/safety-stock`)
    return data
  },
}

export default analyticsService
