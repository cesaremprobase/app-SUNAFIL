-- ==============================================================================
-- MIGRATION: Security Hardening, Private Storage & RBAC (Role-Based Access Control)
-- ==============================================================================

-- 1. CONVERTIR BUCKET A PRIVADO (Cero accesos anónimos a EMOs y documentos médicos)
UPDATE storage.buckets 
SET public = false 
WHERE id = 'sst-documents';

-- Eliminar políticas anteriores de Storage
DROP POLICY IF EXISTS "Allow public read access to sst-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public insert to sst-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update to sst-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete from sst-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated read sst-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated insert sst-documents" ON storage.objects;
DROP POLICY IF EXISTS "Approved users can read storage objects" ON storage.objects;
DROP POLICY IF EXISTS "Approved users can upload storage objects" ON storage.objects;
DROP POLICY IF EXISTS "Admins and supervisors can delete storage objects" ON storage.objects;

-- 2. TABLA DE PERFILES DE USUARIO Y ROLES (RBAC)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text CHECK (role IN ('admin', 'supervisor_sst', 'pending', 'rejected')) DEFAULT 'pending' NOT NULL,
  is_approved boolean DEFAULT false NOT NULL,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Función de ayuda: verificar si el usuario actual es Administrador
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND role = 'admin' AND is_approved = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función de ayuda: verificar si el usuario actual está Aprobado
CREATE OR REPLACE FUNCTION public.is_approved_user()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() AND is_approved = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. POLÍTICAS RLS EN USER_PROFILES
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can delete user profiles" ON public.user_profiles;

CREATE POLICY "Users can read own profile" 
ON public.user_profiles FOR SELECT 
USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can update user profiles" 
ON public.user_profiles FOR UPDATE 
USING (public.is_admin());

CREATE POLICY "Admins can delete user profiles" 
ON public.user_profiles FOR DELETE 
USING (public.is_admin());

-- 4. TRIGGER: AUTO-REGISTRO Y ASIGNACIÓN DE SUPER ADMIN
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  is_super_admin boolean;
BEGIN
  is_super_admin := (NEW.email = 'cesarestebandelao@gmail.com');

  INSERT INTO public.user_profiles (
    id, 
    email, 
    role, 
    is_approved,
    approved_at
  ) VALUES (
    NEW.id,
    NEW.email,
    CASE WHEN is_super_admin THEN 'admin' ELSE 'pending' END,
    is_super_admin,
    CASE WHEN is_super_admin THEN now() ELSE NULL END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = CASE WHEN is_super_admin THEN 'admin' ELSE public.user_profiles.role END,
    is_approved = CASE WHEN is_super_admin THEN true ELSE public.user_profiles.is_approved END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Retroactivo: asegurar perfil admin para usuarios ya existentes en auth.users
INSERT INTO public.user_profiles (id, email, role, is_approved, approved_at)
SELECT id, email, 
       CASE WHEN email = 'cesarestebandelao@gmail.com' THEN 'admin' ELSE 'pending' END,
       CASE WHEN email = 'cesarestebandelao@gmail.com' THEN true ELSE false END,
       CASE WHEN email = 'cesarestebandelao@gmail.com' THEN now() ELSE NULL END
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  is_approved = EXCLUDED.is_approved;

-- 5. POLÍTICAS DE ALMACENAMIENTO (STORAGE PRIVADO SEGURO)
CREATE POLICY "Approved users can read storage objects"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'sst-documents' AND 
  public.is_approved_user()
);

CREATE POLICY "Approved users can upload storage objects"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'sst-documents' AND 
  public.is_approved_user()
);

CREATE POLICY "Admins and supervisors can delete storage objects"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'sst-documents' AND 
  public.is_admin()
);

-- 6. ACTUALIZAR POLÍTICAS DE TABLAS DEL NEGOCIO (Solo usuarios aprobados)
-- Workers
DROP POLICY IF EXISTS "Authenticated users can read workers" ON public.workers;
DROP POLICY IF EXISTS "Authenticated users can insert workers" ON public.workers;
DROP POLICY IF EXISTS "Authenticated users can update workers" ON public.workers;
DROP POLICY IF EXISTS "Authenticated users can delete workers" ON public.workers;
DROP POLICY IF EXISTS "Approved users read workers" ON public.workers;
DROP POLICY IF EXISTS "Approved users insert workers" ON public.workers;
DROP POLICY IF EXISTS "Approved users update workers" ON public.workers;
DROP POLICY IF EXISTS "Only admins delete workers" ON public.workers;

CREATE POLICY "Approved users read workers" ON public.workers FOR SELECT USING (public.is_approved_user());
CREATE POLICY "Approved users insert workers" ON public.workers FOR INSERT WITH CHECK (public.is_approved_user());
CREATE POLICY "Approved users update workers" ON public.workers FOR UPDATE USING (public.is_approved_user());
CREATE POLICY "Only admins delete workers" ON public.workers FOR DELETE USING (public.is_admin());

-- Worker Documents (EMOs, EPPs)
DROP POLICY IF EXISTS "Authenticated users can read worker_documents" ON public.worker_documents;
DROP POLICY IF EXISTS "Authenticated users can insert worker_documents" ON public.worker_documents;
DROP POLICY IF EXISTS "Authenticated users can update worker_documents" ON public.worker_documents;
DROP POLICY IF EXISTS "Authenticated users can delete worker_documents" ON public.worker_documents;
DROP POLICY IF EXISTS "Approved users read worker_documents" ON public.worker_documents;
DROP POLICY IF EXISTS "Approved users insert worker_documents" ON public.worker_documents;
DROP POLICY IF EXISTS "Approved users update worker_documents" ON public.worker_documents;
DROP POLICY IF EXISTS "Only admins delete worker_documents" ON public.worker_documents;

CREATE POLICY "Approved users read worker_documents" ON public.worker_documents FOR SELECT USING (public.is_approved_user());
CREATE POLICY "Approved users insert worker_documents" ON public.worker_documents FOR INSERT WITH CHECK (public.is_approved_user());
CREATE POLICY "Approved users update worker_documents" ON public.worker_documents FOR UPDATE USING (public.is_approved_user());
CREATE POLICY "Only admins delete worker_documents" ON public.worker_documents FOR DELETE USING (public.is_admin());
