'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LegalRequirement, WorkerLegajoSummary, DossierSummary } from '../../types/dossier'
import { DossierHeader } from './DossierHeader'
import { CompanyDossierView } from './CompanyDossierView'
import { WorkerLegajosView } from './WorkerLegajosView'
import { Building2, Users, FileSpreadsheet, ArrowRight, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface DossierTabsContainerProps {
  summary: DossierSummary
  companyRequirements: LegalRequirement[]
  workerLegajos: WorkerLegajoSummary[]
  selectedYear?: number
}

export function DossierTabsContainer({
  summary,
  companyRequirements,
  workerLegajos,
  selectedYear = 2026
}: DossierTabsContainerProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'empresa' | 'trabajadores' | 'mtpe'>('empresa')

  const handleYearChange = (year: number) => {
    router.push(`/expediente?year=${year}`)
  }

  return (
    <div className="space-y-6">
      <DossierHeader summary={summary} />

      {/* Selector de Periodo Anual SUNAFIL (2023, 2024, 2025, 2026) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-gray-900">Periodo de Inspección:</span>
          <span className="text-xs text-gray-500">Filtrar evidencias y requerimientos por año</span>
        </div>

        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg">
          {[2023, 2024, 2025, 2026].map((yr) => {
            const isSelected = selectedYear === yr
            return (
              <button
                key={yr}
                onClick={() => handleYearChange(yr)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-bold transition-all",
                  isSelected
                    ? "bg-white text-blue-700 shadow-xs border border-gray-200"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50"
                )}
              >
                Año {yr}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selector de Pestañas / Módulos de Inspección */}
      <div className="flex border-b border-gray-200 gap-2">
        <button
          onClick={() => setActiveTab('empresa')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-all ${
            activeTab === 'empresa'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>1. Documentos Empresa</span>
          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full font-semibold">
            {summary.companyRequirementsCount.digitalized}/{summary.companyRequirementsCount.total}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('trabajadores')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-all ${
            activeTab === 'trabajadores'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>2. Legajos por Trabajador</span>
          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full font-semibold">
            {summary.workerLegajosCount.completeLegajos}/{summary.workerLegajosCount.totalWorkers}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('mtpe')}
          className={`flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm transition-all ${
            activeTab === 'mtpe'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>3. Los 8 Registros MTPE</span>
        </button>
      </div>

      {/* Contenido de la Pestaña Activa */}
      <div>
        {activeTab === 'empresa' && (
          <CompanyDossierView requirements={companyRequirements} selectedYear={selectedYear} />
        )}

        {activeTab === 'trabajadores' && (
          <WorkerLegajosView legajos={workerLegajos} selectedYear={selectedYear} />
        )}

        {activeTab === 'mtpe' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Los 8 Registros Obligatorios del MTPE (R.M. 050-2013-TR)
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Formatos referenciales exigidos por SUNAFIL: Accidentes, EMOs, Inspecciones, Estadísticas, EPPs, Capacitaciones, Auditorías y Monitoreos.
                </p>
              </div>
              <Link 
                href="/registros"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
              >
                Ir al Administrador de Registros <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 border rounded-lg bg-gray-50">1. Registro de Accidentes de Trabajo, Enfermedades e Incidentes Peligrosos</div>
              <div className="p-3 border rounded-lg bg-gray-50">2. Registro de Exámenes Médicos Ocupacionales (EMOs)</div>
              <div className="p-3 border rounded-lg bg-gray-50">3. Registro del Monitoreo de Agentes Físicos, Químicos, Biológicos y Disergonómicos</div>
              <div className="p-3 border rounded-lg bg-gray-50">4. Registro de Inspecciones Internas de Seguridad y Salud en el Trabajo</div>
              <div className="p-3 border rounded-lg bg-gray-50">5. Registro de Estadísticas de Seguridad y Salud</div>
              <div className="p-3 border rounded-lg bg-gray-50">6. Registro de Equipos de Seguridad o Emergencia (EPP)</div>
              <div className="p-3 border rounded-lg bg-gray-50">7. Registro de Inducción, Capacitación, Entrenamiento y Simulacros</div>
              <div className="p-3 border rounded-lg bg-gray-50">8. Registro de Auditorías</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
