'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  console.log('Intentando login para:', data.email)
  const { data: authData, error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    console.error('Error de login Supabase:', error.message)
    return { success: false, error: error.message }
  }

  console.log('Login exitoso para:', data.email)
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  console.log('Intentando registro para:', data.email)
  const { data: authData, error } = await supabase.auth.signUp(data)

  if (error) {
    console.error('Error de registro Supabase:', error.message)
    return { success: false, error: error.message }
  }

  console.log('Registro procesado. Usuario:', authData.user?.email, 'Confirmación requerida:', authData.session === null)
  
  if (authData.user && authData.session === null) {
    return { success: true, message: 'Registro exitoso. Revisa tu correo para verificar tu cuenta antes de iniciar sesión.' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  
  revalidatePath('/', 'layout')
  redirect('/login')
}
