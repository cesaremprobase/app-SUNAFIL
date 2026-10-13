'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getSstRecords() {
  const supabase = await createClient()
  const { data: records, error } = await supabase
    .from('sst_records')
    .select('*')
    .order('created_at', { ascending: true })
    
  if (error) {
    console.error('Error fetching sst records:', error)
    return []
  }

  // Traer trabajadores activos
  const { data: workers } = await supabase
    .from('workers')
    .select('id')
    .eq('is_active', true)

  const totalWorkers = workers?.length || 0

  // Procesar e inyectar porcentajes reales para individuales
  const processedRecords = await Promise.all((records || []).map(async (record) => {
    const isIndividual = ['emos', 'epps', 'capacitaciones'].includes(record.record_type)
    
    if (isIndividual) {
      if (totalWorkers === 0) {
        return {
          ...record,
          status: 'pending',
          compliance_percentage: 0,
          total_workers: 0,
          completed_workers: 0
        }
      }
      
      // Contar documentos
      const { data: docs } = await supabase
        .from('worker_documents')
        .select('worker_id')
        .eq('sst_record_type', record.record_type)
        
      const uniqueWorkersWithDoc = new Set((docs || []).map(d => d.worker_id))
      const completedWorkers = uniqueWorkersWithDoc.size
      const pct = Math.round((completedWorkers / totalWorkers) * 100)
      
      return {
        ...record,
        status: pct === 100 ? 'valid' : 'pending',
        compliance_percentage: pct,
        total_workers: totalWorkers,
        completed_workers: completedWorkers
      }
    } else {
      return {
        ...record,
        compliance_percentage: record.status === 'valid' ? 100 : 0
      }
    }
  }))

  return processedRecords
}

export async function updateSstRecord(recordId: string, payload: any) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('sst_records')
    .update({
      status: payload.status,
      next_due_date: payload.next_due_date || null,
      notes: payload.notes || null,
      document_name: payload.document_name || null,
      document_path: payload.document_path || null,
      last_updated_at: new Date().toISOString()
    })
    .eq('id', recordId)
    .select()
    .single()

  if (error) {
    console.error('Error updating sst record:', error)
    throw new Error('No se pudo actualizar el registro')
  }

  revalidatePath('/registros')
  revalidatePath('/dashboard')
  return data
}

export async function uploadDocumentToStorage(file: File, folder: string) {
  const supabase = await createClient()
  
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
  const filePath = `${folder}/${fileName}`
  
  const { data, error } = await supabase.storage
    .from('sst-documents')
    .upload(filePath, file)
    
  if (error) {
    console.error('Error uploading file:', error)
    throw new Error('No se pudo subir el archivo PDF')
  }
  
  return {
    path: filePath,
    name: file.name,
    size: file.size
  }
}
