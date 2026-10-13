'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getWorkerDocuments(workerId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('worker_documents')
    .select('*')
    .eq('worker_id', workerId)
    .order('created_at', { ascending: false })
    
  if (error) {
    console.error('Error fetching worker documents:', error)
    return []
  }
  return data || []
}

export async function getWorkerDocumentsByType(type: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('worker_documents')
    .select('*')
    .eq('sst_record_type', type)
    .order('created_at', { ascending: false })
    
  if (error) {
    console.error('Error fetching worker documents by type:', error)
    return []
  }
  return data || []
}

export async function addWorkerDocument(payload: any) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('worker_documents')
    .insert([
      {
        worker_id: payload.worker_id,
        name: payload.name,
        file_path: payload.file_path,
        size_bytes: payload.size_bytes,
        document_date: payload.document_date,
        sst_record_type: payload.sst_record_type || null
      }
    ])
    .select()
    .single()

  if (error) {
    console.error('Error inserting worker document:', error)
    throw new Error('No se pudo guardar el documento')
  }

  revalidatePath('/workers')
  revalidatePath('/registros')
  return data
}

export async function deleteWorkerDocument(id: string, filePath: string) {
  const supabase = await createClient()
  
  // First delete from DB
  const { error: dbError } = await supabase
    .from('worker_documents')
    .delete()
    .eq('id', id)

  if (dbError) {
    console.error('Error deleting worker document:', dbError)
    throw new Error('No se pudo eliminar el documento de la base de datos')
  }

  // Then delete from storage
  const { error: storageError } = await supabase.storage
    .from('sst-documents')
    .remove([filePath])
    
  if (storageError) {
    console.error('Error deleting file from storage:', storageError)
    // We don't throw here to not break UI if file was already missing
  }

  revalidatePath('/workers')
  return { success: true }
}
