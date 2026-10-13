-- Add sst_record_type column to worker_documents
ALTER TABLE public.worker_documents 
ADD COLUMN IF NOT EXISTS sst_record_type TEXT NULL;

-- Create an index to speed up compliance category queries
CREATE INDEX IF NOT EXISTS idx_worker_documents_sst_record_type 
ON public.worker_documents(sst_record_type);

-- Comment explaining the column usage
COMMENT ON COLUMN public.worker_documents.sst_record_type 
IS 'Vínculo opcional con las categorías de sst_records (e.g. emos, epps, capacitaciones)';
