-- Migration: Init SGSST
-- Description: Creates workers, sst_requirements (catalog for SUNAFIL), and sst_documents tables.

CREATE TABLE public.workers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name text NOT NULL,
  last_name text NOT NULL,
  document_number text UNIQUE NOT NULL,
  job_title text NOT NULL,
  hire_date date NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.sst_requirements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  is_company_level boolean DEFAULT false, -- If true, applies to company (RISST). If false, applies to worker (EMO)
  frequency_months integer, -- 0 means one-time, 12 means annual, etc.
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.sst_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  requirement_id uuid REFERENCES public.sst_requirements(id) ON DELETE CASCADE NOT NULL,
  worker_id uuid REFERENCES public.workers(id) ON DELETE CASCADE, -- Nullable for company-level docs like RISST
  file_url text NOT NULL,
  issue_date date NOT NULL,
  expiry_date date, -- Calculated based on issue_date + frequency_months
  status text check (status in ('valid', 'expired', 'pending_signature')) DEFAULT 'valid',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.sst_committee (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id uuid REFERENCES public.workers(id) ON DELETE CASCADE NOT NULL,
  role text check (role in ('presidente', 'secretario', 'miembro_titular', 'miembro_suplente')) NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed obligatory requirements based on Ley N° 29783 (Company 25-30 employees)
-- NOTE: RISST and Comite are marked as obligatory and company-level.
INSERT INTO public.sst_requirements (code, name, description, is_company_level, frequency_months) VALUES
  ('SST-POL-01', 'Política y Objetivos de SST', 'Política documentada y firmada por la alta dirección.', true, 12),
  ('SST-RIS-01', 'Reglamento Interno de SST (RISST)', 'Reglamento obligatorio para >= 20 trabajadores.', true, 12),
  ('SST-COM-01', 'Actas del Comité de SST', 'Acta de instalación y reuniones mensuales del Comité.', true, 1),
  ('SST-IPE-01', 'Matriz IPERC', 'Identificación de Peligros y Evaluación de Riesgos.', true, 12),
  ('SST-MAP-01', 'Mapa de Riesgos', 'Representación gráfica de zonas de riesgo.', true, 12),
  ('SST-REG-01', 'Registro de Accidentes / Incidentes', 'Formato MTPE para registrar eventualidades.', true, 0),
  ('SST-REG-02', 'Exámenes Médicos Ocupacionales (EMO)', 'Certificado de aptitud médica por trabajador.', false, 24),
  ('SST-REG-03', 'Entrega de EPPs', 'Registro de entrega de Equipos de Protección Personal.', false, 6),
  ('SST-REG-04', 'Inducciones y Capacitaciones', 'Las 4 capacitaciones anuales obligatorias.', false, 3),
  ('SST-REG-05', 'Inspecciones Internas', 'Inspecciones de seguridad en áreas de trabajo.', true, 1),
  ('SST-REG-06', 'Monitoreos Ocupacionales', 'Evaluación de agentes físicos, químicos y disergonómicos.', true, 12),
  ('SST-REG-07', 'Auditorías Internas', 'Auditoría obligatoria de desempeño del SGSST.', true, 24),
  ('SST-REG-08', 'Estadísticas SST', 'Reporte de índices de accidentabilidad.', true, 1);
