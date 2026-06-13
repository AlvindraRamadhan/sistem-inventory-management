import axios from 'axios'

const BASE = '/api/audit-log'

export interface AuditLogParams {
  userId?: string
  action?: string
  entityType?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  limit?: number
}

const activityLogService = {
  getAll: async (params?: AuditLogParams) => {
    const { data } = await axios.get(BASE, { params })
    return data
  },
}

export default activityLogService
