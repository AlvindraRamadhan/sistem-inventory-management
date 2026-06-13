'use client'

import { useRef, useState } from 'react'
import { uploadInvoicePDF, getInvoicePDFSignedUrl } from '@/lib/supabase/storage'
import purchaseInvoiceService from '@/services/server/purchase-invoice.service'

interface InvoicePDFActionsProps {
  invoiceId: string
  filePdfName: string | null
  isAdmin: boolean
}

export default function InvoicePDFActions({ invoiceId, filePdfName, isAdmin }: InvoicePDFActionsProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [currentFileName, setCurrentFileName] = useState(filePdfName)
  const [error, setError] = useState<string | null>(null)

  const handleUpload = async (file: File | null) => {
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('File harus berformat PDF')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File melebihi batas 10MB')
      return
    }

    setUploading(true)
    setError(null)
    try {
      const fileName = await uploadInvoicePDF(invoiceId, file)
      // Sync fileName ke database melalui API
      await purchaseInvoiceService.uploadPdf(invoiceId, file)
      setCurrentFileName(fileName)
    } catch {
      setError('Gagal mengupload PDF')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async () => {
    if (!currentFileName) return
    setDownloading(true)
    setError(null)
    try {
      const signedUrl = await getInvoicePDFSignedUrl(currentFileName)
      window.open(signedUrl, '_blank')
    } catch {
      setError('Gagal membuat link download')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      {isAdmin && (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            {uploading ? 'Mengupload...' : currentFileName ? 'Ganti PDF' : 'Upload PDF'}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => handleUpload(e.target.files?.[0] ?? null)}
          />
        </>
      )}

      {currentFileName && (
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {downloading ? 'Memuat...' : 'Download PDF'}
        </button>
      )}

      {!currentFileName && !isAdmin && (
        <span className="text-sm text-gray-400">PDF belum diupload</span>
      )}

      {error && <span className="text-sm text-red-500">{error}</span>}
    </div>
  )
}
