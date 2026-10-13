-- Create worker_documents table
CREATE TABLE worker_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    size_bytes BIGINT,
    document_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create sst_records table
CREATE TABLE sst_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_type TEXT NOT NULL UNIQUE, -- e.g., 'accidentes', 'emos', etc.
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'valid', 'pending'
    next_due_date DATE,
    notes TEXT,
    document_path TEXT,
    document_name TEXT,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS)
ALTER TABLE worker_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sst_records ENABLE ROW LEVEL SECURITY;

-- Policies for worker_documents
CREATE POLICY "Allow all read access to worker_documents" ON worker_documents FOR SELECT USING (true);
CREATE POLICY "Allow all insert access to worker_documents" ON worker_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update access to worker_documents" ON worker_documents FOR UPDATE USING (true);
CREATE POLICY "Allow all delete access to worker_documents" ON worker_documents FOR DELETE USING (true);

-- Policies for sst_records
CREATE POLICY "Allow all read access to sst_records" ON sst_records FOR SELECT USING (true);
CREATE POLICY "Allow all insert access to sst_records" ON sst_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update access to sst_records" ON sst_records FOR UPDATE USING (true);
CREATE POLICY "Allow all delete access to sst_records" ON sst_records FOR DELETE USING (true);

-- Create storage bucket if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('sst-documents', 'sst-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for storage bucket objects
CREATE POLICY "Allow public read access to sst-documents" ON storage.objects FOR SELECT USING (bucket_id = 'sst-documents');
CREATE POLICY "Allow public insert to sst-documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'sst-documents');
CREATE POLICY "Allow public update to sst-documents" ON storage.objects FOR UPDATE USING (bucket_id = 'sst-documents');
CREATE POLICY "Allow public delete from sst-documents" ON storage.objects FOR DELETE USING (bucket_id = 'sst-documents');

-- Initial records for sst_records
INSERT INTO sst_records (record_type, name, status) VALUES 
    ('accidentes', 'Accidentes e Incidentes', 'pending'),
    ('emos', 'Exámenes Médicos Ocupacionales (EMOs)', 'pending'),
    ('inspecciones', 'Inspecciones Internas', 'pending'),
    ('estadisticas', 'Estadísticas SST', 'pending'),
    ('epps', 'Equipos de Protección Personal (EPPs)', 'pending'),
    ('capacitaciones', 'Inducciones y Capacitaciones', 'pending'),
    ('auditorias', 'Auditorías', 'pending'),
    ('monitoreos', 'Monitoreos Ocupacionales', 'pending')
ON CONFLICT (record_type) DO NOTHING;
