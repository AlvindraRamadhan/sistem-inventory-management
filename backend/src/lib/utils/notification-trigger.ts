export interface NotifParams {
  notifType: string
  type: string
  title: string
  message: string
  href?: string
  targetRoles: string[]
  targetUserId?: string
}

async function addNotif(params: NotifParams): Promise<void> {
  try {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
  } catch {
    console.error('Failed to send notification:', params)
  }
}

export const notifyPOApproval = (noPo: string, poId: string) =>
  addNotif({
    notifType: 'PO_APPROVAL',
    type: 'action',
    title: 'Purchase Order Menunggu Persetujuan',
    message: `PO ${noPo} memerlukan persetujuan Anda`,
    href: `/procurement/purchase-order/${poId}`,
    targetRoles: ['admin'],
  })

export const notifyPOApproved = (noPo: string, poId: string, targetUserId?: string) =>
  addNotif({
    notifType: 'PO_APPROVED',
    type: 'info',
    title: 'Purchase Order Disetujui',
    message: `PO ${noPo} telah disetujui`,
    href: `/procurement/purchase-order/${poId}`,
    targetRoles: ['apoteker'],
    targetUserId,
  })

export const notifyPORejected = (noPo: string, poId: string, targetUserId?: string) =>
  addNotif({
    notifType: 'PO_REJECTED',
    type: 'warning',
    title: 'Purchase Order Ditolak',
    message: `PO ${noPo} telah ditolak`,
    href: `/procurement/purchase-order/${poId}`,
    targetRoles: ['apoteker'],
    targetUserId,
  })

export const notifyGRApproval = (noGr: string, grId: string) =>
  addNotif({
    notifType: 'GR_APPROVAL',
    type: 'action',
    title: 'Good Receipt Menunggu Persetujuan',
    message: `GR ${noGr} memerlukan persetujuan Anda`,
    href: `/procurement/good-receipt/${grId}`,
    targetRoles: ['admin'],
  })

export const notifyGRApproved = (noGr: string, grId: string, targetUserId?: string) =>
  addNotif({
    notifType: 'GR_APPROVED',
    type: 'info',
    title: 'Good Receipt Disetujui',
    message: `GR ${noGr} telah disetujui`,
    href: `/procurement/good-receipt/${grId}`,
    targetRoles: ['apoteker'],
    targetUserId,
  })

export const notifyGRRejected = (noGr: string, grId: string, targetUserId?: string) =>
  addNotif({
    notifType: 'GR_REJECTED',
    type: 'warning',
    title: 'Good Receipt Ditolak',
    message: `GR ${noGr} telah ditolak`,
    href: `/procurement/good-receipt/${grId}`,
    targetRoles: ['apoteker'],
    targetUserId,
  })

export const notifyDefektaApproval = (defektaId: string) =>
  addNotif({
    notifType: 'DEFEKTA_APPROVAL',
    type: 'action',
    title: 'Defekta Menunggu Persetujuan',
    message: `Permintaan defekta memerlukan persetujuan Anda`,
    href: `/inventory/defekta/${defektaId}`,
    targetRoles: ['admin'],
  })

export { addNotif }
