import { createClient } from '@/lib/supabase/server'
import type { 
  LegalRequirement, 
  WorkerLegajoSummary, 
  WorkerLegajoRequirement, 
  DossierSummary 
} from '../types/dossier'

// Requisitos obligatorios a nivel Empresa según Ley N° 29783 y D.S. 005-2012-TR
const COMPANY_LEGAL_SPECS: Array<{
  code: string
  title: string
  description: string
  legalBasis: string
  frequencyMonths: number
}> = [
  {
    code: 'SST-POL-01',
    title: 'Política y Objetivos del SGSST',
    description: 'Documento firmado por el gerente general que define el compromiso con la seguridad y salud laboral.',
    legalBasis: 'Ley 29783 Art. 22 y 23 / D.S. 005-2012-TR Art. 25',
    frequencyMonths: 12
  },
  {
    code: 'SST-RIS-01',
    title: 'Reglamento Interno de SST (RISST)',
    description: 'Aprobado por el Comité de SST. De cumplimiento obligatorio para empresas con 20 o más trabajadores.',
    legalBasis: 'Ley 29783 Art. 34 y 35 / D.S. 005-2012-TR Art. 74',
    frequencyMonths: 12
  },
  {
    code: 'SST-IPE-01',
    title: 'Matriz IPERC Línea Base',
    description: 'Identificación de Peligros, Evaluación de Riesgos y Medidas de Control por puesto de trabajo.',
    legalBasis: 'Ley 29783 Art. 57 / R.M. 050-2013-TR',
    frequencyMonths: 12
  },
  {
    code: 'SST-MAP-01',
    title: 'Mapa de Riesgos del Centro Laboral',
    description: 'Representación gráfica visible en las instalaciones con las áreas de riesgo y señalética.',
    legalBasis: 'Ley 29783 Art. 35 inc. e / D.S. 005-2012-TR Art. 32',
    frequencyMonths: 12
  },
  {
    code: 'SST-PLA-01',
    title: 'Plan y Programa Anual de SST',
    description: 'Cronograma documentado de actividades, presupuesto y metas de seguridad del año en curso.',
    legalBasis: 'D.S. 005-2012-TR Art. 32 inc. c / R.M. 050-2013-TR',
    frequencyMonths: 12
  },
  {
    code: 'SST-COM-01',
    title: 'Libro de Actas del Comité de SST',
    description: 'Acta de instalación del Comité paritario y actas de reuniones ordinarias mensuales.',
    legalBasis: 'Ley 29783 Art. 29 y 31 / D.S. 005-2012-TR Art. 42',
    frequencyMonths: 1
  }
]

export async function getCompanyDossier(): Promise<LegalRequirement[]> {
  const supabase = await createClient()

  // Buscar si existen en sst_requirements
  const { data: requirements } = await supabase
    .from('sst_requirements')
    .select('*, sst_documents(*)')
    .eq('is_company_level', true)

  // También consultar si hay archivos en sst_records vinculados
  const { data: sstRecords } = await supabase
    .from('sst_records')
    .select('*')

  return COMPANY_LEGAL_SPECS.map(spec => {
    // Buscar en requirements o en sst_records
    const reqMatch = requirements?.find(r => r.code === spec.code)
    const latestDoc = reqMatch?.sst_documents?.[0]
    
    // Buscar por correspondencia en sst_records si no hay en sst_documents
    const recordMatch = sstRecords?.find(rec => {
      if (spec.code === 'SST-RIS-01' && rec.record_type === 'risst') return true
      if (spec.code === 'SST-COM-01' && rec.record_type === 'comite') return true
      return false
    })

    const filePath = latestDoc?.file_url || recordMatch?.document_path || null
    const fileName = latestDoc?.file_url?.split('/').pop() || recordMatch?.document_name || null
    const isDigitalized = Boolean(filePath)

    return {
      id: reqMatch?.id || spec.code,
      code: spec.code,
      title: spec.title,
      description: spec.description,
      legalBasis: spec.legalBasis,
      frequencyMonths: spec.frequencyMonths,
      category: 'empresa',
      isRequired: true,
      status: isDigitalized ? 'digitalizado' : 'pendiente_fisico',
      filePath,
      fileName,
      updatedAt: latestDoc?.created_at || recordMatch?.last_updated_at || null,
      completionPercentage: isDigitalized ? 100 : 0
    }
  })
}

export async function getWorkerLegajosDossier(): Promise<WorkerLegajoSummary[]> {
  const supabase = await createClient()

  // Obtener trabajadores activos
  const { data: workers, error: workersError } = await supabase
    .from('workers')
    .select('*')
    .eq('is_active', true)
    .order('last_name', { ascending: true })

  if (workersError || !workers) {
    console.error('Error cargando trabajadores para el dossier:', workersError)
    return []
  }

  // Obtener todos los documentos asociados a trabajadores
  const { data: documents } = await supabase
    .from('worker_documents')
    .select('*')

  const docsByWorker: Record<string, typeof documents> = {}
  documents?.forEach(doc => {
    if (!docsByWorker[doc.worker_id]) {
      docsByWorker[doc.worker_id] = []
    }
    docsByWorker[doc.worker_id].push(doc)
  })

  return workers.map(worker => {
    const workerDocs = docsByWorker[worker.id] || []

    // 1. Cargo firmado de Entrega de RISST
    const risstDoc = workerDocs.find(d => 
      d.sst_record_type === 'risst' || 
      d.name?.toLowerCase().includes('risst') || 
      d.name?.toLowerCase().includes('reglamento')
    )

    // 2. Examen Médico Ocupacional (EMO vigente)
    const emoDoc = workerDocs.find(d => 
      d.sst_record_type === 'emos' || 
      d.name?.toLowerCase().includes('emo') || 
      d.name?.toLowerCase().includes('medico')
    )

    // 3. Cargo de Entrega de EPPs firmado
    const eppDoc = workerDocs.find(d => 
      d.sst_record_type === 'epps' || 
      d.name?.toLowerCase().includes('epp')
    )

    // 4. Constancia de Capacitaciones (4 obligatorias)
    const capDoc = workerDocs.find(d => 
      d.sst_record_type === 'capacitaciones' || 
      d.name?.toLowerCase().includes('capacita') || 
      d.name?.toLowerCase().includes('induccion')
    )

    const requirements: WorkerLegajoRequirement[] = [
      {
        type: 'risst_cargo',
        label: 'Cargo de Entrega de RISST',
        legalBasis: 'Ley 29783 Art. 35 inc. a (Firma obligatoria del trabajador)',
        isComplete: Boolean(risstDoc),
        documentId: risstDoc?.id,
        filePath: risstDoc?.file_path,
        fileName: risstDoc?.name,
        date: risstDoc?.document_date
      },
      {
        type: 'emo',
        label: 'Certificado de Aptitud Médica (EMO)',
        legalBasis: 'Ley 29783 Art. 49 / R.M. 312-2011-MINSA (Vigencia 2 años)',
        isComplete: Boolean(emoDoc),
        documentId: emoDoc?.id,
        filePath: emoDoc?.file_path,
        fileName: emoDoc?.name,
        date: emoDoc?.document_date
      },
      {
        type: 'epp_cargo',
        label: 'Cargo de Entrega de EPPs',
        legalBasis: 'Ley 29783 Art. 60 (Constancia firmada de recepción)',
        isComplete: Boolean(eppDoc),
        documentId: eppDoc?.id,
        filePath: eppDoc?.file_path,
        fileName: eppDoc?.name,
        date: eppDoc?.document_date
      },
      {
        type: 'capacitaciones',
        label: 'Constancia de 4 Capacitaciones / Inducción',
        legalBasis: 'Ley 29783 Art. 35 inc. b (Mínimo 4 capacitaciones al año)',
        isComplete: Boolean(capDoc),
        documentId: capDoc?.id,
        filePath: capDoc?.file_path,
        fileName: capDoc?.name,
        date: capDoc?.document_date
      }
    ]

    const completedCount = requirements.filter(r => r.isComplete).length
    const completionRate = Math.round((completedCount / requirements.length) * 100)

    let status: 'completo' | 'incompleto' | 'critico' = 'completo'
    if (completionRate < 50) {
      status = 'critico'
    } else if (completionRate < 100) {
      status = 'incompleto'
    }

    return {
      workerId: worker.id,
      workerName: `${worker.first_name} ${worker.last_name}`,
      documentNumber: worker.document_number,
      jobTitle: worker.job_title,
      hireDate: worker.hire_date,
      requirements,
      completionRate,
      status
    }
  })
}

export async function getDossierSummary(): Promise<DossierSummary> {
  const [companyItems, workerLegajos] = await Promise.all([
    getCompanyDossier(),
    getWorkerLegajosDossier()
  ])

  const companyDigitalized = companyItems.filter(i => i.status === 'digitalizado').length
  const companyPending = companyItems.length - companyDigitalized

  const totalWorkers = workerLegajos.length
  const completeLegajos = workerLegajos.filter(w => w.status === 'completo').length
  const incompleteLegajos = totalWorkers - completeLegajos

  let totalWorkerRequirements = totalWorkers * 4
  let completedWorkerRequirements = 0
  workerLegajos.forEach(w => {
    completedWorkerRequirements += w.requirements.filter(r => r.isComplete).length
  })

  const missingWorkerDocs = totalWorkerRequirements - completedWorkerRequirements

  const totalRequired = companyItems.length + totalWorkerRequirements
  const totalDigitalized = companyDigitalized + completedWorkerRequirements
  const totalPendingPhysical = companyPending + missingWorkerDocs

  const overallReadiness = totalRequired > 0 
    ? Math.round((totalDigitalized / totalRequired) * 100) 
    : 0

  return {
    overallReadiness,
    totalRequiredDocuments: totalRequired,
    totalDigitalizedDocuments: totalDigitalized,
    totalPendingPhysicalDocuments: totalPendingPhysical,
    companyRequirementsCount: {
      total: companyItems.length,
      digitalized: companyDigitalized,
      pending: companyPending
    },
    workerLegajosCount: {
      totalWorkers,
      completeLegajos,
      incompleteLegajos,
      missingDocumentsTotal: missingWorkerDocs
    },
    mtpeRecordsCount: {
      total: 8,
      valid: 0,
      pending: 8
    }
  }
}

// Ingestión de documentos (Utilizable por Web UI y por Bot de Telegram)
export interface IngestDocumentPayload {
  source: 'web' | 'telegram'
  targetType: 'company' | 'worker'
  codeOrWorkerId: string // Código de requisito ('SST-POL-01') o UUID de trabajador
  documentType?: 'risst' | 'emos' | 'epps' | 'capacitaciones' | string
  filePath: string
  fileName: string
  fileSize?: number
  documentDate?: string
}

export async function ingestDocument(payload: IngestDocumentPayload) {
  const supabase = await createClient()

  if (payload.targetType === 'worker') {
    const { data, error } = await supabase
      .from('worker_documents')
      .insert({
        worker_id: payload.codeOrWorkerId,
        name: payload.fileName,
        file_path: payload.filePath,
        size_bytes: payload.fileSize || 0,
        document_date: payload.documentDate || new Date().toISOString().split('T')[0],
        sst_record_type: payload.documentType || 'general'
      })
      .select()
      .single()

    if (error) {
      console.error('Error al ingestar documento de trabajador:', error)
      throw new Error(`Error registrando documento: ${error.message}`)
    }
    return data
  } else {
    // Requisito a nivel de empresa
    // 1. Verificar si existe en sst_requirements
    const { data: req } = await supabase
      .from('sst_requirements')
      .select('id')
      .eq('code', payload.codeOrWorkerId)
      .maybeSingle()

    if (req) {
      const { data, error } = await supabase
        .from('sst_documents')
        .insert({
          requirement_id: req.id,
          file_url: payload.filePath,
          issue_date: payload.documentDate || new Date().toISOString().split('T')[0],
          status: 'valid'
        })
        .select()
        .single()

      if (error) {
        console.error('Error al registrar en sst_documents:', error)
        throw new Error(error.message)
      }
      return data
    } else {
      // Fallback a sst_records si aplica
      const typeKey = payload.codeOrWorkerId.toLowerCase().replace('sst-', '').split('-')[0]
      const { data, error } = await supabase
        .from('sst_records')
        .update({
          document_path: payload.filePath,
          document_name: payload.fileName,
          status: 'valid',
          last_updated_at: new Date().toISOString()
        })
        .eq('record_type', typeKey)
        .select()
        .maybeSingle()

      if (error) {
        throw new Error(error.message)
      }
      return data
    }
  }
}
