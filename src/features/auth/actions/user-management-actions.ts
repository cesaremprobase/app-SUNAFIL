'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface UserProfile {
  id: string
  email: string
  role: 'admin' | 'supervisor_sst' | 'pending' | 'rejected'
  is_approved: boolean
  approved_at?: string | null
  created_at: string
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (error || !data) {
    // Si es cesarestebandelao@gmail.com asegurar perfil admin
    if (user.email === 'cesarestebandelao@gmail.com') {
      return {
        id: user.id,
        email: user.email!,
        role: 'admin',
        is_approved: true,
        created_at: new Date().toISOString()
      }
    }
    return null
  }

  return data
}

export async function getUserProfiles(): Promise<UserProfile[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user profiles:', error)
    return []
  }

  return data || []
}

export async function approveUser(userId: string, role: 'admin' | 'supervisor_sst' = 'supervisor_sst') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('user_profiles')
    .update({
      role,
      is_approved: true,
      approved_by: user?.id,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (error) {
    console.error('Error approving user:', error)
    throw new Error('No se pudo aprobar al usuario')
  }

  revalidatePath('/settings')
  return { success: true }
}

export async function revokeUserAccess(userId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('user_profiles')
    .update({
      role: 'rejected',
      is_approved: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (error) {
    console.error('Error revoking user:', error)
    throw new Error('No se pudo revocar el acceso')
  }

  revalidatePath('/settings')
  return { success: true }
}
