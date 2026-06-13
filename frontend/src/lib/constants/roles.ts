export const ROLES = {
  ADMIN: "admin",
  APOTEKER: "apoteker",
} as const

export type UserRole = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrator",
  apoteker: "Apoteker",
}

export const PERMISSIONS = {
  // Purchase Order
  PURCHASE_ORDER_CREATE: "purchase_order:create",
  PURCHASE_ORDER_APPROVE: "purchase_order:approve",
  // Good Receipt
  GOOD_RECEIPT_CREATE: "good_receipt:create",
  GOOD_RECEIPT_APPROVE: "good_receipt:approve",
  // Inventory
  STOCK_OUT_CREATE: "stock_out:create",
  OPNAME_CREATE: "opname:create",
  // Defekta
  DEFEKTA_CREATE: "defekta:create",
  DEFEKTA_APPROVE: "defekta:approve",
  // Master Data
  MASTER_DATA_WRITE: "master_data:write",
  SUPPLIER_WRITE: "supplier:write",
  // Analytics & Audit
  ANALYTICS_VIEW: "analytics:view",
  AUDIT_LOG_VIEW: "audit_log:view",
  // Alkes
  KALIBRASI_MANAGE: "kalibrasi:manage",
  // E-Prescribing
  E_PRESCRIBING_VIEW: "e_prescribing:view",
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    PERMISSIONS.PURCHASE_ORDER_CREATE,
    PERMISSIONS.PURCHASE_ORDER_APPROVE,
    PERMISSIONS.GOOD_RECEIPT_APPROVE,
    PERMISSIONS.DEFEKTA_APPROVE,
    PERMISSIONS.MASTER_DATA_WRITE,
    PERMISSIONS.SUPPLIER_WRITE,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.AUDIT_LOG_VIEW,
    PERMISSIONS.KALIBRASI_MANAGE,
  ],
  apoteker: [
    PERMISSIONS.PURCHASE_ORDER_CREATE,
    PERMISSIONS.GOOD_RECEIPT_CREATE,
    PERMISSIONS.STOCK_OUT_CREATE,
    PERMISSIONS.OPNAME_CREATE,
    PERMISSIONS.DEFEKTA_CREATE,
    PERMISSIONS.E_PRESCRIBING_VIEW,
  ],
}
