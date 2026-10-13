import { z } from "zod";

export const SstRecordSchema = z.object({
  id: z.string().uuid().optional(),
  record_type: z.string().optional(),
  name: z.string().optional(),
  status: z.enum(["valid", "pending"]),
  next_due_date: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  document_path: z.string().nullable().optional(),
  document_name: z.string().nullable().optional(),
});

export type SstRecord = z.infer<typeof SstRecordSchema>;

export const CommitteeMemberSchema = z.object({
  id: z.string().uuid().optional(),
  worker_id: z.string().uuid(),
  role: z.enum(["presidente", "secretario", "miembro_titular", "miembro_suplente"]),
  start_date: z.string(),
  end_date: z.string(),
  is_active: z.boolean().default(true).optional(),
  workers: z.object({
    first_name: z.string(),
    last_name: z.string(),
    document_number: z.string(),
    job_title: z.string(),
  }).optional(),
});

export type CommitteeMember = z.infer<typeof CommitteeMemberSchema>;
