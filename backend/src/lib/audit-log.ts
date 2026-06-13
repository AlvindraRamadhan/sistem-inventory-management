import { prisma } from './prisma'

interface LogActionParams {
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
    await prisma.auditLog.create({ data: params })
  } catch (err) {
    // Audit log failure must not break the main flow
    console.error('logAction failed:', err)
  }
}
