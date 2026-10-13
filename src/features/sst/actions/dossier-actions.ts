'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ingestDocument } from '../services/dossier-service'

export async function uploadAndIngestWorkerDocument(formData: FormData) {
  const supabase = await createClient()

  const workerId = formData.get('workerId') as string
  const documentType = formData.get('documentType') as string
  const documentDate = formData.get('documentDate') as string
  const file = formData.get('file') as File

  if (!workerId || !file || !documentType) {
    throw new Error('Faltan campos obligatorios para subir el documento.')
  }

  const fileExt = file.name.split('.').pop()
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const storagePath = `legajos/${workerId}/${documentType}_${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('sst-documents')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: true
    })

  if (uploadError) {
    console.error('Error subiendo archivo a Supabase Storage:', uploadError)
    throw new Error(`Error subiendo archivo: ${uploadError.message}`)
  }

  // Obtener URL o path
  await ingestDocument({
    source: 'web',
    targetType: 'worker',
    codeOrWorkerId: workerId,
    documentType,
    filePath: storagePath,
    fileName: sanitizedName,
    fileSize: file.size,
    documentDate: documentDate || undefined
  })

  revalidatePath('/expediente')
  revalidatePath('/workers')
  revalidatePath('/registros')
  revalidatePath('/dashboard')

  return { success: true, filePath: storagePath }
}

export async function uploadAndIngestCompanyDocument(formData: FormData) {
  const supabase = await createClient()

  const requirementCode = formData.get('requirementCode') as string
  const file = formData.get('file') as File

  if (!requirementCode || !file) {
    throw new Error('Faltan campos obligatorios para el documento institucional.')
  }

  const fileExt = file.name.split('.').pop()
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const storagePath = `empresa/${requirementCode}/${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('sst-documents')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: true
    })

  if (uploadError) {
    console.error('Error subiendo documento de empresa:', uploadError)
    throw new Error(`Error subiendo archivo: ${uploadError.message}`)
  }

  await ingestDocument({
    source: 'web',
    targetType: 'company',
    codeOrWorkerId: requirementCode,
    filePath: storagePath,
    fileName: sanitizedName,
    fileSize: file.size
  })

  revalidatePath('/expediente')
  revalidatePath('/dashboard')
  revalidatePath('/registros')

  return { success: true, filePath: storagePath }
}

export async function getDocumentDownloadUrl(filePath: string) {
  const supabase = await createClient()

  // Bucket es público según migración, pero creamos signed URL o public URL para visualización segura
  const { data } = supabase.storage
    .from('sst-documents')
    .getPublicUrl(filePath)

  return data.publicUrl
}
