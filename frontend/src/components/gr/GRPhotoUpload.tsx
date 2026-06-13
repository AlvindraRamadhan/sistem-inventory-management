'use client'

import { useRef, useState } from 'react'
import { uploadGRPhoto } from '@/lib/supabase/storage'

interface GRPhotoUploadProps {
  grId: string
  onUploaded: (urls: string[]) => void
}

export default function GRPhotoUpload({ grId, onUploaded }: GRPhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    setError(null)

    const urls: string[] = []
    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        setError(`File ${file.name} melebihi batas 5MB`)
        continue
      }
      try {
        const url = await uploadGRPhoto(grId, file)
        urls.push(url)
      } catch {
        setError(`Gagal mengupload ${file.name}`)
      }
    }

    const allUrls = [...uploaded, ...urls]
    setUploaded(allUrls)
    onUploaded(allUrls)
    setUploading(false)
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">Foto Kondisi Barang</label>

      <div
        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 hover:border-blue-400"
        onClick={() => inputRef.current?.click()}
      >
        <svg className="mb-2 h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
        <p className="text-sm text-gray-500">
          {uploading ? 'Mengupload...' : 'Klik untuk pilih foto (JPG, PNG, max 5MB)'}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={uploading}
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {uploaded.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {uploaded.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`foto-${i + 1}`}
              className="h-20 w-20 rounded object-cover border"
            />
          ))}
        </div>
      )}
    </div>
  )
}
