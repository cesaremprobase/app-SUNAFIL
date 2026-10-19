import { createClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase con privilegios de Administrador / Service Role.
 * Se utiliza exclusivamente en el backend (Webhooks de Telegram, Server Actions de carga rápida)
 * para garantizar que la subida de archivos no sea bloqueada por RLS anónimo.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  // Si existe SUPABASE_SERVICE_ROLE_KEY se usa para bypass de RLS.
  // De lo contrario se usa la publishable/anon key.
  const supabaseKey = 
    process.env.SUPABASE_SERVICE_ROLE_KEY || 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
