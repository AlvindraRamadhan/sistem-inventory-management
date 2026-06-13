export interface LogActionParams {
  userId: string
  userName: string
  userRole: string
  action: string
  entityType: string
  entityId: string
  description: string
  beforeData?: object
  afterData?: object
  ipAddress?: string
}

export async function logAction(params: LogActionParams): Promise<void> {
  try {
    await fetch('/api/audit-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
  } catch {
    // Audit log failure is non-critical — don't throw
    console.error('Failed to write audit log:', params)
  }
}

// Convenience wrappers — only the transport inside logAction() changed
export const logStokMasuk = (params: Omit<LogActionParams, 'action' | 'entityType'> & { entityId: string }) =>
  logAction({ ...params, action: 'CREATE', entityType: 'StokMasuk' })

export const logStokKeluar = (params: Omit<LogActionParams, 'action' | 'entityType'> & { entityId: string }) =>
  logAction({ ...params, action: 'CREATE', entityType: 'StokKeluar' })

export const logDefekta = (params: Omit<LogActionParams, 'entityType'> & { entityId: string }) =>
  logAction({ ...params, entityType: 'Defekta' })

export const logPurchaseOrder = (params: Omit<LogActionParams, 'entityType'> & { entityId: string }) =>
  logAction({ ...params, entityType: 'PurchaseOrder' })

export const logGoodReceipt = (params: Omit<LogActionParams, 'entityType'> & { entityId: string }) =>
  logAction({ ...params, entityType: 'GoodReceipt' })

export const logOpname = (params: Omit<LogActionParams, 'entityType'> & { entityId: string }) =>
  logAction({ ...params, entityType: 'StokOpname' })

export const logMutasi = (params: Omit<LogActionParams, 'entityType'> & { entityId: string }) =>
  logAction({ ...params, entityType: 'MutasiLokasi' })
