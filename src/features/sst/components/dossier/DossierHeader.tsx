import { DossierSummary } from '../../types/dossier'
import { ShieldCheck, AlertTriangle, FileText, Users, FolderClock } from 'lucide-react'

interface DossierHeaderProps {
  summary: DossierSummary
}

export function DossierHeader({ summary }: DossierHeaderProps) {
  const isHighRisk = summary.overallReadiness < 70

  return (
    <div className="space-y-6">
      {/* Banner Principal de Inspección */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isHighRisk ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {isHighRisk ? 'Riesgo Alto de Observación SUNAFIL' : 'Expediente en Orden'}
              </span>
              <span className="text-xs text-gray-500">Ley N° 29783 & D.S. 005-2012-TR</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-950 tracking-tight">
              Expediente Digital de Inspección SUNAFIL
            </h1>
            <p className="text-sm text-gray-600 max-w-2xl">
              Estructura centralizada de evidencias documentales obligatorias. Cada documento físico escaneado blinda a la empresa ante requerimientos de inspectores de trabajo.
            </p>
          </div>

          {/* Indicador Radial / Porcentaje */}
          <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-xl p-4 self-start md:self-auto">
            <div className="text-right">
              <p className="text-xs font-medium text-gray-500 uppercase">Preparación General</p>
              <p className="text-3xl font-extrabold text-gray-900">{summary.overallReadiness}%</p>
              <p className="text-xs text-gray-400">del dossier digitalizado</p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              summary.overallReadiness >= 80 
                ? 'bg-emerald-600 text-white' 
                : summary.overallReadiness >= 50 
                ? 'bg-amber-500 text-white' 
                : 'bg-red-600 text-white'
            }`}>
              {summary.overallReadiness >= 80 ? (
                <ShieldCheck className="w-7 h-7" />
              ) : (
                <AlertTriangle className="w-7 h-7" />
              )}
            </div>
          </div>
        </div>

        {/* Barra de progreso visual */}
        <div className="mt-6">
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                summary.overallReadiness >= 80 
                  ? 'bg-emerald-500' 
                  : summary.overallReadiness >= 50 
                  ? 'bg-amber-500' 
                  : 'bg-red-500'
              }`}
              style={{ width: `${summary.overallReadiness}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tarjetas de Métricas Clave */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Documentos Físicos Pendientes</span>
            <FolderClock className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-gray-950 mt-2">
            {summary.totalPendingPhysicalDocuments}
          </p>
          <p className="text-xs text-amber-600 mt-1">Por escanear o digitalizar</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Archivos Digitalizados</span>
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-950 mt-2">
            {summary.totalDigitalizedDocuments} / {summary.totalRequiredDocuments}
          </p>
          <p className="text-xs text-blue-600 mt-1">Disponibles con respaldo PDF</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Docs. Institucionales (Empresa)</span>
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-gray-950 mt-2">
            {summary.companyRequirementsCount.digitalized} / {summary.companyRequirementsCount.total}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {summary.companyRequirementsCount.pending > 0 
              ? `${summary.companyRequirementsCount.pending} faltantes` 
              : 'Completo al 100%'}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Legajos de Trabajadores</span>
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-950 mt-2">
            {summary.workerLegajosCount.completeLegajos} / {summary.workerLegajosCount.totalWorkers}
          </p>
          <p className="text-xs text-purple-600 mt-1">
            {summary.workerLegajosCount.incompleteLegajos} con papeles pendientes
          </p>
        </div>
      </div>
    </div>
  )
}
