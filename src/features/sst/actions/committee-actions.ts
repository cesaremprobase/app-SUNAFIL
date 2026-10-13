'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getCommitteeMembers() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sst_committee')
    .select(`
      *,
      workers (
        first_name,
        last_name,
        document_number,
        job_title
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching committee members:', error)
    return []
  }

  return data
}

export async function assignCommitteeRole(formData: FormData) {
  const supabase = await createClient()
  
  const assignmentData = {
    worker_id: formData.get('worker_id') as string,
    role: formData.get('role') as string,
    start_date: formData.get('start_date') as string,
    end_date: formData.get('end_date') as string,
    is_active: true,
  }

  // Deactivate previous active roles for this worker if needed, 
  // or just insert the new one.
  const { data, error } = await supabase
    .from('sst_committee')
    .insert([assignmentData])
    .select()

  if (error) {
    console.error('Error assigning committee role:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/sst/committee')
  revalidatePath('/dashboard') // Also update dashboard semaphore
  return { success: true, data }
}

export async function deactivateCommitteeRole(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('sst_committee')
    .update({ is_active: false })
    .eq('id', id)

  if (error) {
    console.error('Error deactivating committee role:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/sst/committee')
  revalidatePath('/dashboard')
  return { success: true }
}
