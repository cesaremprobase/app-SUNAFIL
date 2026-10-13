-- Eliminar políticas públicas (20260424000000)
DROP POLICY IF EXISTS "Permitir lectura publica" ON public.workers;
DROP POLICY IF EXISTS "Permitir insert publico" ON public.workers;
DROP POLICY IF EXISTS "Permitir update publico" ON public.workers;
DROP POLICY IF EXISTS "Permitir delete publico" ON public.workers;

-- Eliminar políticas de documents y records (20260428000000)
DROP POLICY IF EXISTS "Allow all read access to worker_documents" ON worker_documents;
DROP POLICY IF EXISTS "Allow all insert access to worker_documents" ON worker_documents;
DROP POLICY IF EXISTS "Allow all update access to worker_documents" ON worker_documents;
DROP POLICY IF EXISTS "Allow all delete access to worker_documents" ON worker_documents;

DROP POLICY IF EXISTS "Allow all read access to sst_records" ON sst_records;
DROP POLICY IF EXISTS "Allow all insert access to sst_records" ON sst_records;
DROP POLICY IF EXISTS "Allow all update access to sst_records" ON sst_records;
DROP POLICY IF EXISTS "Allow all delete access to sst_records" ON sst_records;

-- Habilitar RLS explícito donde faltaba en init
ALTER TABLE sst_committee ENABLE ROW LEVEL SECURITY;
ALTER TABLE sst_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE sst_documents ENABLE ROW LEVEL SECURITY;

-- Crear políticas para usuarios autenticados (Workers)
CREATE POLICY "Authenticated users can read workers" ON public.workers FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert workers" ON public.workers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update workers" ON public.workers FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete workers" ON public.workers FOR DELETE USING (auth.uid() IS NOT NULL);

-- Worker Documents
CREATE POLICY "Authenticated users can read worker_documents" ON worker_documents FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert worker_documents" ON worker_documents FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update worker_documents" ON worker_documents FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete worker_documents" ON worker_documents FOR DELETE USING (auth.uid() IS NOT NULL);

-- SST Records
CREATE POLICY "Authenticated users can read sst_records" ON sst_records FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert sst_records" ON sst_records FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update sst_records" ON sst_records FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete sst_records" ON sst_records FOR DELETE USING (auth.uid() IS NOT NULL);

-- SST Committee
CREATE POLICY "Authenticated users can read sst_committee" ON sst_committee FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert sst_committee" ON sst_committee FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update sst_committee" ON sst_committee FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete sst_committee" ON sst_committee FOR DELETE USING (auth.uid() IS NOT NULL);
