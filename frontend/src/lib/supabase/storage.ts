import { createClient } from './client'

export async function uploadGRPhoto(grId: string, file: File): Promise<string> {
  const supabase = createClient()
  const safeName = file.name.replace(/\s/g, '_')
  const fileName = `${grId}/${Date.now()}_${safeName}`

  const { error } = await supabase.storage.from('gr-photos').upload(fileName, file)
  if (error) throw error

  const { data } = supabase.storage.from('gr-photos').getPublicUrl(fileName)
  return data.publicUrl
}

export async function getGRPhotoSignedUrl(fileName: string, expiresIn = 3600): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase.storage
    .from('gr-photos')
    .createSignedUrl(fileName, expiresIn)
  if (error) throw error
  return data.signedUrl
}

export async function deleteGRPhoto(fileName: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.storage.from('gr-photos').remove([fileName])
  if (error) throw error
}

export async function uploadInvoicePDF(invoiceId: string, file: File): Promise<string> {
  const supabase = createClient()
  const safeName = file.name.replace(/\s/g, '_')
  const fileName = `${invoiceId}/${safeName}`

  const { error } = await supabase.storage
    .from('invoice-pdf')
    .upload(fileName, file, { upsert: true })
  if (error) throw error

  return fileName
}

export async function getInvoicePDFSignedUrl(fileName: string): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase.storage
    .from('invoice-pdf')
    .createSignedUrl(fileName, 3600)
  if (error) throw error
  return data.signedUrl
}
