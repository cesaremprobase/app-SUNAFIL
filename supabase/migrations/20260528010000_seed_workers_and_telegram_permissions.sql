-- ==============================================================================
-- 1. SEED DE LOS 33 TRABAJADORES OFICIALES (Nómina SUNAFIL)
-- ==============================================================================
INSERT INTO public.workers (first_name, last_name, document_number, job_title, hire_date, is_active)
VALUES
  ('ELOY ADALICIO', 'DEL AGUILA GARAY', '42788318', 'Operario', '2024-01-15', true),
  ('EFRAIN CESAR', 'ESTEBAN DE LA O', '47726832', 'Operario', '2024-01-15', true),
  ('JHIM ROGER', 'ACOSTA TALANCHA', '41159726', 'Operario', '2024-01-15', true),
  ('ESTEFANI MELISSA', 'LOPEZ CAICO', '47887861', 'Operario', '2024-01-15', true),
  ('ADUAR RODANIN', 'CARRANZA ROMERO', '40434803', 'Operario', '2024-01-15', true),
  ('FRANS ANTONY', 'FLORES CUBILLOS', '73797569', 'Operario', '2024-01-15', true),
  ('MAYKON YAKSON', 'MELGAREJO SILVA', '43055144', 'Operario', '2024-01-15', true),
  ('FRANCO CHARLIES', 'ACOSTA FIGUEREDO', '73595742', 'Operario', '2024-01-15', true),
  ('DONY JEINER', 'MALPARTIDA DORIA', '46820231', 'Operario', '2024-01-15', true),
  ('WILDER JHONATAN', 'LLANTO FIGUEREDO', '46555587', 'Operario', '2024-01-15', true),
  ('HECTOR PEPE', 'MANDUJANO RODRIGUEZ', '40657146', 'Operario', '2024-01-15', true),
  ('JHONEL SEMEIAS', 'RIVERA COLLAZOS', '80350104', 'Operario', '2024-01-15', true),
  ('GELFREDO', 'MARTEL ROSAS', '42544452', 'Operario', '2024-01-15', true),
  ('LUIS ANTONIO', 'MARIN GERVACIO', '46020916', 'Operario', '2024-01-15', true),
  ('RODIL', 'CHAVEZ CORI', '42420568', 'Operario', '2024-01-15', true),
  ('JUAN CARLOS', 'MANZANO DIAZ', '45555718', 'Operario', '2024-01-15', true),
  ('IBAN YONI', 'ALMERCO MALPARTIDA', '10443906', 'Operario', '2024-01-15', true),
  ('BILE MEDARDO', 'RUBIO ATENCIA', '71580929', 'Operario', '2024-01-15', true),
  ('WILMER', 'MERINO NOREÑA', '44143371', 'Operario', '2024-01-15', true),
  ('ALEX ALESANDRO', 'CISNEROS BRAVO', '45332692', 'Operario', '2024-01-15', true),
  ('BERGILIO', 'CRUZ MERINO', '40222881', 'Operario', '2024-01-15', true),
  ('RONALDO', 'ÑAUPA CRUZ', '71300573', 'Operario', '2024-01-15', true),
  ('YONER', 'ALEJO RUFINO', '43348343', 'Operario', '2024-01-15', true),
  ('EDU LEONARDO', 'ALEJO CRISTOBAL', '61103006', 'Operario', '2024-01-15', true),
  ('WILFREDO TEOFILO', 'SAMUDIO FULGENCIO', '74933176', 'Operario', '2024-01-15', true),
  ('MICHER JHANS', 'ROJAS PEREZ', '77498608', 'Operario', '2024-01-15', true),
  ('CLAUDIA', 'PEREZ LEANDRO', '75013640', 'Operario', '2024-01-15', true),
  ('LIZ CORINA', 'CONCHA GARAY', '41366849', 'Operario', '2024-01-15', true),
  ('JULIA', 'PEREZ LEANDRO', '75013639', 'Operario', '2024-01-15', true),
  ('CLUBER', 'LLANTO RUIZ', '22410762', 'Operario', '2024-01-15', true),
  ('JUAN CARLOS', 'PARDAVE CAYCO', '44732050', 'Operario', '2024-01-15', true),
  ('ANDERSON LUIYE', 'LEANDRO SALAS', '46779509', 'Operario', '2024-01-15', true),
  ('LENNIN YORQUIÑO', 'ATAVILLOS MAIZ', '73265507', 'Operario', '2024-01-15', true)
ON CONFLICT (document_number) 
DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  is_active = true;

-- ==============================================================================
-- 2. PERMISOS PARA LECTURA DE TRABAJADORES (Telegram Bot y Mini App)
-- ==============================================================================
DROP POLICY IF EXISTS "Allow read workers" ON public.workers;
CREATE POLICY "Allow read workers" 
ON public.workers FOR SELECT 
USING (true);

-- ==============================================================================
-- 3. PERMISOS PARA DOCUMENTOS DE TRABAJADORES Y EXPEDIENTE
-- ==============================================================================
DROP POLICY IF EXISTS "Allow read worker_documents" ON public.worker_documents;
CREATE POLICY "Allow read worker_documents" 
ON public.worker_documents FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow insert worker_documents" ON public.worker_documents;
CREATE POLICY "Allow insert worker_documents" 
ON public.worker_documents FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update worker_documents" ON public.worker_documents;
CREATE POLICY "Allow update worker_documents" 
ON public.worker_documents FOR UPDATE 
USING (true);

-- Documentos de SST (Registros institucionales)
DROP POLICY IF EXISTS "Allow read sst_documents" ON public.sst_documents;
CREATE POLICY "Allow read sst_documents" 
ON public.sst_documents FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Allow insert sst_documents" ON public.sst_documents;
CREATE POLICY "Allow insert sst_documents" 
ON public.sst_documents FOR INSERT 
WITH CHECK (true);

-- ==============================================================================
-- 4. PERMISOS DE STORAGE (Subida desde Bot y Mini App Móvil)
-- ==============================================================================
DROP POLICY IF EXISTS "Allow bot and web upload to sst-documents" ON storage.objects;
CREATE POLICY "Allow bot and web upload to sst-documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'sst-documents');

DROP POLICY IF EXISTS "Allow bot and web update to sst-documents" ON storage.objects;
CREATE POLICY "Allow bot and web update to sst-documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'sst-documents');

DROP POLICY IF EXISTS "Allow bot and web read from sst-documents" ON storage.objects;
CREATE POLICY "Allow bot and web read from sst-documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'sst-documents');

-- ==============================================================================
-- 5. SESIONES STATELESS DEL BOT DE TELEGRAM (Persistencia entre lambdas)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.telegram_bot_sessions (
  chat_id text PRIMARY KEY,
  file_id text NOT NULL,
  file_name text,
  is_pdf boolean DEFAULT false,
  doc_type text,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.telegram_bot_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to telegram_bot_sessions" ON public.telegram_bot_sessions;
CREATE POLICY "Allow all access to telegram_bot_sessions" 
ON public.telegram_bot_sessions FOR ALL 
USING (true) 
WITH CHECK (true);

