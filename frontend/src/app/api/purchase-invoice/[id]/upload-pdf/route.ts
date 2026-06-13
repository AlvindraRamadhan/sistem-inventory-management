import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const invoice = await prisma.purchaseInvoice.findUnique({ where: { id } })
    if (!invoice) return NextResponse.json({ error: 'Invoice tidak ditemukan' }, { status: 404 })

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'File PDF wajib dikirim' }, { status: 400 })
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File harus berformat PDF' }, { status: 400 })
    }

    const fileName = `${invoice.noInvoice.replace(/\//g, '-')}-${Date.now()}.pdf`
    const arrayBuffer = await file.arrayBuffer()

    const supabase = createServerClient()
    const { error: uploadError } = await supabase.storage
      .from('invoice-pdf')
      .upload(fileName, arrayBuffer, { contentType: 'application/pdf', upsert: true })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json({ error: 'Gagal mengupload file' }, { status: 500 })
    }

    const updated = await prisma.purchaseInvoice.update({
      where: { id },
      data: { filePdfName: fileName },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error(`POST /api/purchase-invoice/[id]/upload-pdf error:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
