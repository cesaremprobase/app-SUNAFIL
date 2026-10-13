export type DossierCategory = 'empresa' | 'trabajadores' | 'registros_mtpe'

export type DossierItemStatus = 'digitalizado' | 'pendiente_fisico' | 'parcial'

export interface LegalRequirement {
  id: string
  code: string
  title: string
  description: string
  legalBasis: string // Ej: 'Ley 29783 Art. 35', 'D.S. 005-2012-TR Art. 74'
  frequencyMonths: number // 0 = permanente/único, 12 = anual, 24 = bianual
  category: DossierCategory
  isRequired: boolean
  status: DossierItemStatus
  filePath?: string | null
  fileName?: string | null
  updatedAt?: string | null
  completionPercentage?: number
  notes?: string | null
}

export interface WorkerLegajoRequirement {
  type: 'risst_cargo' | 'emo' | 'epp_cargo' | 'capacitaciones'
  label: string
  legalBasis: string
  isComplete: boolean
  documentId?: string
  filePath?: string | null
  fileName?: string | null
  date?: string | null
}

export interface WorkerLegajoSummary {
  workerId: string
  workerName: string
  documentNumber: string
  jobTitle: string
  hireDate: string
  requirements: WorkerLegajoRequirement[]
  completionRate: number // 0 to 100
  status: 'completo' | 'incompleto' | 'critico'
}

export interface DossierSummary {
  overallReadiness: number // 0 to 100%
  totalRequiredDocuments: number
  totalDigitalizedDocuments: number
  totalPendingPhysicalDocuments: number
  companyRequirementsCount: {
    total: number
    digitalized: number
    pending: number
  }
  workerLegajosCount: {
    totalWorkers: number
    completeLegajos: number
    incompleteLegajos: number
    missingDocumentsTotal: number
  }
  mtpeRecordsCount: {
    total: number
    valid: number
    pending: number
  }
}
