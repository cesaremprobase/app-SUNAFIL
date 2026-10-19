'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { ingestDocument } from '../services/dossier-service'

export async function uploadAndIngestWorkerDocument(formData: FormData) {
  // Intentar primero con el cliente de sesión del usuario autenticado para respetar RBAC
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  const supabase = user ? userClient : createAdminClient()

  const workerId = formData.get('workerId') as string
  const documentType = formData.get('documentType') as string
  const documentDate = formData.get('documentDate') as string
  const year = formData.get('year') ? String(formData.get('year')) : (documentDate ? documentDate.slice(0, 4) : '2026')
  const file = formData.get('file') as File

  if (!workerId || !file || !documentType) {
    throw new Error('Faltan campos obligatorios para subir el documento.')
  }

  const fileExt = file.name.split('.').pop() || 'pdf'
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const storagePath = `legajos/${year}/${workerId}/${documentType}_${Date.now()}.${fileExt}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const contentType = file.type || (fileExt === 'pdf' ? 'application/pdf' : 'image/jpeg')

  const { error: uploadError } = await supabase.storage
    .from('sst-documents')
    .upload(storagePath, buffer, {
      contentType,
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
    documentDate: documentDate || `${year}-01-01`
  })

  revalidatePath('/expediente')
  revalidatePath('/workers')
  revalidatePath('/registros')
  revalidatePath('/dashboard')

  return { success: true, filePath: storagePath }
}

export async function uploadAndIngestCompanyDocument(formData: FormData) {
  // Intentar primero con el cliente de sesión del usuario autenticado
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  const supabase = user ? userClient : createAdminClient()

  const requirementCode = formData.get('requirementCode') as string
  const year = formData.get('year') ? String(formData.get('year')) : '2026'
  const file = formData.get('file') as File

  if (!requirementCode || !file) {
    throw new Error('Faltan campos obligatorios para el documento institucional.')
  }

  const fileExt = file.name.split('.').pop() || 'pdf'
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const storagePath = `empresa/${year}/${requirementCode}/${Date.now()}.${fileExt}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const contentType = file.type || (fileExt === 'pdf' ? 'application/pdf' : 'image/jpeg')

  const { error: uploadError } = await supabase.storage
    .from('sst-documents')
    .upload(storagePath, buffer, {
      contentType,
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
    fileSize: file.size,
    documentDate: `${year}-01-01`
  })

  revalidatePath('/expediente')
  revalidatePath('/dashboard')
  revalidatePath('/registros')

  return { success: true, filePath: storagePath }
}

export async function getDocumentDownloadUrl(filePath: string) {
  const supabase = await createClient()

  // Generar URL firmada temporal de 15 minutos (900 seg) para máxima seguridad
  const { data, error } = await supabase.storage
    .from('sst-documents')
    .createSignedUrl(filePath, 900)

  if (error || !data?.signedUrl) {
    const { data: publicData } = supabase.storage
      .from('sst-documents')
      .getPublicUrl(filePath)
    return publicData.publicUrl
  }

  return data.signedUrl
}
