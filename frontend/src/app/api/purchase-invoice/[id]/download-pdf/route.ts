import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const invoice = await prisma.purchaseInvoice.findUnique({ where: { id } })
    if (!invoice) return NextResponse.json({ error: 'Invoice tidak ditemukan' }, { status: 404 })
    if (!invoice.filePdfName) {
      return NextResponse.json({ error: 'Invoice belum memiliki file PDF' }, { status: 404 })
    }

    const supabase = createServerClient()
    const { data, error } = await supabase.storage
      .from('invoice-pdf')
      .createSignedUrl(invoice.filePdfName, 3600)

    if (error || !data) {
      console.error('Supabase signed URL error:', error)
      return NextResponse.json({ error: 'Gagal membuat link download' }, { status: 500 })
    }

    return NextResponse.json({ url: data.signedUrl })
  } catch (error) {
    console.error(`GET /api/purchase-invoice/[id]/download-pdf error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
