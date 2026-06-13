import { prisma } from './prisma'

type MonthlyCodeModel = 'purchaseOrder' | 'goodReceipt' | 'purchaseInvoice' | 'mutasiLokasi' | 'stokOpname'

const modelConfig: Record<MonthlyCodeModel, { prefix: string; field: string; dateField: string }> = {
  purchaseOrder:    { prefix: 'PO',  field: 'noPo',      dateField: 'createdAt' },
  goodReceipt:      { prefix: 'GR',  field: 'noGr',      dateField: 'createdAt' },
  purchaseInvoice:  { prefix: 'INV', field: 'noInvoice', dateField: 'createdAt' },
  mutasiLokasi:     { prefix: 'MUT', field: 'noMutasi',  dateField: 'createdAt' },
  stokOpname:       { prefix: 'OP',  field: 'noOpname',  dateField: 'createdAt' },
}

export async function generateMonthlyCode(model: MonthlyCodeModel): Promise<string> {
  const now = new Date()
  const yyyy = now.getFullYear().toString()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  const count = await (prisma[model] as any).count({
    where: { createdAt: { gte: startOfMonth, lte: endOfMonth } },
  })

  const { prefix } = modelConfig[model]
  return `${prefix}/${yyyy}/${mm}/${String(count + 1).padStart(3, '0')}`
}
