// ─── Good Receipt Status ──────────────────────────────────────────────────────

export const GR_STATUS = {
  MENUNGGU_INPUT: "MENUNGGU_INPUT",
  MENUNGGU_REVIEW: "MENUNGGU_REVIEW",
  DITOLAK: "DITOLAK",
  SELESAI: "SELESAI",
} as const

export type GRStatus = (typeof GR_STATUS)[keyof typeof GR_STATUS]

export const GR_STATUS_LABEL: Record<GRStatus, string> = {
  MENUNGGU_INPUT: "Menunggu Input",
  MENUNGGU_REVIEW: "Menunggu Review",
  DITOLAK: "Ditolak",
  SELESAI: "Selesai",
}

//  Purchase Order Status 

export const PO_STATUS = {
  DRAFT: "DRAFT",
  SENT: "SENT",
  PARTIAL_RECEIVED: "PARTIAL_RECEIVED",
  RECEIVED: "RECEIVED",
  INVOICED: "INVOICED",
  PAID: "PAID",
} as const

export type POStatus = (typeof PO_STATUS)[keyof typeof PO_STATUS]

export const PO_STATUS_LABEL: Record<POStatus, string> = {
  DRAFT: "Draft",
  SENT: "Terkirim",
  PARTIAL_RECEIVED: "Diterima Sebagian",
  RECEIVED: "Diterima",
  INVOICED: "Diinvoice",
  PAID: "Lunas",
}

//  Stok Status 

export const STOK_STATUS = {
  AKTIF: "AKTIF",
  QUARANTINE: "QUARANTINE",
  DEFEKTA: "DEFEKTA",
  KADALUARSA: "KADALUARSA",
} as const

export type StokStatus = (typeof STOK_STATUS)[keyof typeof STOK_STATUS]

export const STOK_STATUS_LABEL: Record<StokStatus, string> = {
  AKTIF: "Aktif",
  QUARANTINE: "Karantina",
  DEFEKTA: "Defekta",
  KADALUARSA: "Kadaluarsa",
}

//  Defekta Status 

export const DEFEKTA_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const

export type DefektaStatus = (typeof DEFEKTA_STATUS)[keyof typeof DEFEKTA_STATUS]

export const DEFEKTA_STATUS_LABEL: Record<DefektaStatus, string> = {
  PENDING: "Menunggu Persetujuan",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
}

//  Supplier Status 

export const SUPPLIER_STATUS = {
  AKTIF: "AKTIF",
  TIDAK_AKTIF: "TIDAK_AKTIF",
} as const

export type SupplierStatus = (typeof SUPPLIER_STATUS)[keyof typeof SUPPLIER_STATUS]

export const SUPPLIER_STATUS_LABEL: Record<SupplierStatus, string> = {
  AKTIF: "Aktif",
  TIDAK_AKTIF: "Tidak Aktif",
}

//  Alkes Status 

export const ALKES_STATUS = {
  AKTIF: "AKTIF",
  PERBAIKAN: "PERBAIKAN",
  KALIBRASI: "KALIBRASI",
  TIDAK_AKTIF: "TIDAK_AKTIF",
} as const

export type AlkesStatus = (typeof ALKES_STATUS)[keyof typeof ALKES_STATUS]

export const ALKES_STATUS_LABEL: Record<AlkesStatus, string> = {
  AKTIF: "Aktif",
  PERBAIKAN: "Dalam Perbaikan",
  KALIBRASI: "Sedang Dikalibrasi",
  TIDAK_AKTIF: "Tidak Aktif",
}

//  Opname Status 

export const OPNAME_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const

export type OpnameStatus = (typeof OPNAME_STATUS)[keyof typeof OPNAME_STATUS]

export const OPNAME_STATUS_LABEL: Record<OpnameStatus, string> = {
  PENDING: "Menunggu Persetujuan",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
}

//  Invoice Status 

export const INVOICE_STATUS = {
  UNPAID: "UNPAID",
  PARTIAL: "PARTIAL",
  PAID: "PAID",
} as const

export type InvoiceStatus = (typeof INVOICE_STATUS)[keyof typeof INVOICE_STATUS]

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  UNPAID: "Belum Dibayar",
  PARTIAL: "Dibayar Sebagian",
  PAID: "Lunas",
}

//  Kalibrasi Record Status 

export const KALIBRASI_STATUS = {
  TERJADWAL: "TERJADWAL",
  SELESAI: "SELESAI",
  TERLAMBAT: "TERLAMBAT",
} as const

export type KalibrasiStatus = (typeof KALIBRASI_STATUS)[keyof typeof KALIBRASI_STATUS]

export const KALIBRASI_STATUS_LABEL: Record<KalibrasiStatus, string> = {
  TERJADWAL: "Terjadwal",
  SELESAI: "Selesai",
  TERLAMBAT: "Terlambat",
}

//  Status Color Mapping (untuk badge/chip UI) 

export type StatusColor = "default" | "secondary" | "destructive" | "outline"

export const GR_STATUS_COLOR: Record<GRStatus, StatusColor> = {
  MENUNGGU_INPUT: "secondary",
  MENUNGGU_REVIEW: "outline",
  DITOLAK: "destructive",
  SELESAI: "default",
}

export const PO_STATUS_COLOR: Record<POStatus, StatusColor> = {
  DRAFT: "secondary",
  SENT: "outline",
  PARTIAL_RECEIVED: "outline",
  RECEIVED: "default",
  INVOICED: "default",
  PAID: "default",
}

export const DEFEKTA_STATUS_COLOR: Record<DefektaStatus, StatusColor> = {
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
}

export const OPNAME_STATUS_COLOR: Record<OpnameStatus, StatusColor> = {
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
}

export const ALKES_STATUS_COLOR: Record<AlkesStatus, StatusColor> = {
  AKTIF: "default",
  PERBAIKAN: "secondary",
  KALIBRASI: "outline",
  TIDAK_AKTIF: "destructive",
}

export const STOK_STATUS_COLOR: Record<StokStatus, StatusColor> = {
  AKTIF: "default",
  QUARANTINE: "outline",
  DEFEKTA: "destructive",
  KADALUARSA: "destructive",
}

export const INVOICE_STATUS_COLOR: Record<InvoiceStatus, StatusColor> = {
  UNPAID: "destructive",
  PARTIAL: "outline",
  PAID: "default",
}

export const KALIBRASI_STATUS_COLOR: Record<KalibrasiStatus, StatusColor> = {
  TERJADWAL: "secondary",
  SELESAI: "default",
  TERLAMBAT: "destructive",
}
