import { z } from "zod";

export const WorkerSchema = z.object({
  id: z.string().uuid().optional(),
  first_name: z.string().min(1, "El nombre es requerido"),
  last_name: z.string().min(1, "El apellido es requerido"),
  document_number: z.string().min(8, "DNI debe tener 8 dígitos"),
  job_title: z.string().min(1, "El cargo es requerido"),
  hire_date: z.string().min(1, "La fecha es requerida"),
  is_active: z.boolean().default(true).optional(),
});

export type Worker = z.infer<typeof WorkerSchema>;

export const WorkerDocumentSchema = z.object({
  id: z.string().uuid().optional(),
  worker_id: z.string().uuid(),
  name: z.string().min(1),
  file_path: z.string(),
  size_bytes: z.number().optional(),
  document_date: z.string().optional(),
  sst_record_type: z.string().nullable().optional(),
});

export type WorkerDocument = z.infer<typeof WorkerDocumentSchema>;
