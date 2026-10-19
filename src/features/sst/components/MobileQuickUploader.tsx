'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Camera, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  ExternalLink, 
  FileText, 
  Building2, 
  HeartPulse, 
  ShieldCheck, 
  GraduationCap, 
  HardHat,
  Filter,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { WorkerLegajoSummary, LegalRequirement } from '../types/dossier'
import { getDocumentDownloadUrl } from '../actions/dossier-actions'

interface MobileQuickUploaderProps {
  workerLegajos?: WorkerLegajoSummary[]
  companyRequirements?: LegalRequirement[]
  initialTipo?: string
}

type AreaType = 'emo' | 'risst' | 'epp' | 'capacitaciones' | 'empresa'

const AREAS: Array<{
  id: AreaType
  label: string
  shortLabel: string
  icon: any
  docTypeKey: 'emo' | 'risst_cargo' | 'epp_cargo' | 'capacitaciones' | null
  description: string
  color: string
}> = [
  {
    id: 'emo',
    label: 'Exámenes Médicos (EMO)',
    shortLabel: 'EMOs',
    icon: HeartPulse,
    docTypeKey: 'emo',
    description: 'Certificados de Aptitud Médica Ocupacional firmados por médico y trabajador.',
    color: 'emerald'
  },
  {
    id: 'risst',
    label: 'Cargos de Entrega RISST',
    shortLabel: 'RISST',
    icon: ShieldCheck,
    docTypeKey: 'risst_cargo',
    description: 'Cargo firmado por el trabajador confirmando la recepción física del RISST.',
    color: 'blue'
  },
  {
    id: 'epp',
    label: 'Cargos de Entrega de EPP',
    shortLabel: 'EPPs',
    icon: HardHat,
    docTypeKey: 'epp_cargo',
    description: 'Constancia firmada de entrega de cascos, botas, lentes y equipos de seguridad.',
    color: 'amber'
  },
  {
    id: 'capacitaciones',
    label: '4 Capacitaciones de Ley',
    shortLabel: 'Cursos',
    icon: GraduationCap,
    docTypeKey: 'capacitaciones',
    description: 'Constancias de inducción y las 4 capacitaciones anuales obligatorias.',
    color: 'purple'
  },
  {
    id: 'empresa',
    label: 'Documentos de Empresa',
    shortLabel: 'Empresa',
    icon: Building2,
    docTypeKey: null,
    description: 'IPERC, Plan Anual SST, Política y Libro de Actas del Comité firmados.',
    color: 'indigo'
  }
]

export function MobileQuickUploader({
  workerLegajos = [],
  companyRequirements = [],
  initialTipo = 'emo'
}: MobileQuickUploaderProps) {
  const router = useRouter()
  const cleanTipo = (initialTipo?.toLowerCase() as AreaType) || 'emo'
  
  const [activeArea, setActiveArea] = useState<AreaType>(
    AREAS.some(a => a.id === cleanTipo) ? cleanTipo : 'emo'
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [filterMissingOnly, setFilterMissingOnly] = useState(false)
  const [uploadingTargetId, setUploadingTargetId] = useState<string | null>(null)

  const currentAreaConfig = AREAS.find(a => a.id === activeArea) || AREAS[0]

  // Estadísticas del área actual
  const stats = useMemo(() => {
    if (activeArea === 'empresa') {
      const completed = companyRequirements.filter(r => r.isComplete).length
      return { total: companyRequirements.length, completed, pending: companyRequirements.length - completed }
    }
    const reqKey = currentAreaConfig.docTypeKey!
    const completed = workerLegajos.filter(w => {
      const req = w.requirements.find(r => r.type === reqKey)
      return req?.isComplete
    }).length
    return { total: workerLegajos.length, completed, pending: workerLegajos.length - completed }
  }, [activeArea, currentAreaConfig, workerLegajos, companyRequirements])

  // Filtrado de trabajadores
  const filteredWorkers = useMemo(() => {
    return workerLegajos.filter(w => {
      const matchesSearch = 
        w.workerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.documentNumber.includes(searchTerm) ||
        w.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())

      if (!matchesSearch) return false

      if (filterMissingOnly && currentAreaConfig.docTypeKey) {
        const req = w.requirements.find(r => r.type === currentAreaConfig.docTypeKey)
        return !req?.isComplete
      }

      return true
    })
  }, [workerLegajos, searchTerm, filterMissingOnly, currentAreaConfig])

  // Mapeo de área a tipo de documento
  const typeMapping: Record<string, string> = {
    emo: 'emos',
    risst: 'risst',
    epp: 'epps',
    capacitaciones: 'capacitaciones'
  }

  // Manejo de subida de archivo de trabajador via API Route (no Server Action)
  const handleWorkerFileUpload = async (workerId: string, file: File) => {
    setUploadingTargetId(workerId)
    const formData = new FormData()
    formData.append('workerId', workerId)
    formData.append('documentType', typeMapping[activeArea] || activeArea)
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload/worker', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error || 'Error desconocido')
      toast.success('¡Documento digitalizado con éxito!')
      router.refresh()
    } catch (err: any) {
      toast.error(`Error al subir: ${err.message}`)
    } finally {
      setUploadingTargetId(null)
    }
  }

  // Manejo de subida de documento de empresa via API Route
  const handleCompanyFileUpload = async (requirementCode: string, file: File) => {
    setUploadingTargetId(requirementCode)
    const formData = new FormData()
    formData.append('requirementCode', requirementCode)
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload/company', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json.error || 'Error desconocido')
      toast.success('¡Documento institucional cargado con éxito!')
      router.refresh()
    } catch (err: any) {
      toast.error(`Error al subir: ${err.message}`)
    } finally {
      setUploadingTargetId(null)
    }
  }

  // Ver documento
  const handleViewDocument = async (filePath: string) => {
    try {
      const url = await getDocumentDownloadUrl(filePath)
      window.open(url, '_blank')
    } catch {
      toast.error('No se pudo abrir el documento.')
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
      {/* Cabecera Principal */}
      <div>
        <h1 className="text-xl font-bold text-gray-950 flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-600" />
          Cargar Fotos y Escaneos
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Toma fotos o sube desde Google Drive directo al área y trabajador que corresponda.
        </p>
      </div>

      {/* Selector Horizontal de Áreas (Tabs adaptados para móvil) */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {AREAS.map(area => {
          const isSelected = activeArea === area.id
          const Icon = area.icon
          return (
            <button
              key={area.id}
              onClick={() => {
                setActiveArea(area.id)
                setSearchTerm('')
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 border",
                isSelected
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{area.shortLabel}</span>
            </button>
          )
        })}
      </div>

      {/* Tarjeta de Resumen y Progreso del Área Seleccionada */}
      <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <span>{currentAreaConfig.label}</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {currentAreaConfig.description}
            </p>
          </div>
          <span className="text-xs font-bold px-2 py-1 bg-blue-50 text-blue-700 rounded-lg flex-shrink-0">
            {stats.completed} / {stats.total}
          </span>
        </div>

        {/* Barra de progreso */}
        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-blue-600 h-full rounded-full transition-all duration-300"
            style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* SECCIÓN 1: TRABAJADORES (Para EMO, RISST, EPP, Capacitaciones) */}
      {activeArea !== 'empresa' && (
        <div className="space-y-3">
          {/* Barra de búsqueda y filtro */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por DNI o apellido..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-900 placeholder:text-gray-400 outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={() => setFilterMissingOnly(!filterMissingOnly)}
              className={cn(
                "px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-colors flex-shrink-0",
                filterMissingOnly
                  ? "bg-amber-500 text-white border-amber-500 font-semibold"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              )}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{filterMissingOnly ? 'Solo faltantes' : 'Todos'}</span>
            </button>
          </div>

          {/* Lista de Trabajadores */}
          <div className="space-y-2">
            {filteredWorkers.length === 0 ? (
              <div className="text-center py-8 bg-white border border-gray-200 rounded-xl">
                <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs font-medium text-gray-600">No se encontraron trabajadores con ese criterio.</p>
              </div>
            ) : (
              filteredWorkers.map(w => {
                const req = w.requirements.find(r => r.type === currentAreaConfig.docTypeKey)
                const isComplete = req?.isComplete || false
                const isUploading = uploadingTargetId === w.workerId

                return (
                  <div
                    key={w.workerId}
                    className="bg-white border border-gray-200 rounded-xl p-3 shadow-xs flex flex-col gap-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0",
                          isComplete ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-700"
                        )}>
                          {w.workerName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">
                            {w.workerName}
                          </p>
                          <p className="text-[11px] text-gray-500 truncate">
                            DNI: <span className="font-semibold text-gray-700">{w.documentNumber}</span> • {w.jobTitle}
                          </p>
                        </div>
                      </div>

                      {/* Badge de estado */}
                      {isComplete ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex-shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Subido
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md flex-shrink-0">
                          Pendiente
                        </span>
                      )}
                    </div>

                    {/* Botón de Acción Directo */}
                    {/* Botones de Acción Directos: Cámara y Archivos/Drive */}
                    <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                      {isComplete && req?.filePath && (
                        <button
                          onClick={() => handleViewDocument(req.filePath!)}
                          className="py-1.5 px-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-medium border border-gray-200 transition-colors flex items-center gap-1 flex-shrink-0"
                          title="Ver documento actual"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Ver</span>
                        </button>
                      )}

                      {/* Opción 1: Cámara en vivo */}
                      <div className="flex-1 relative overflow-hidden rounded-lg">
                        <div className={cn(
                          "flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all pointer-events-none",
                          "bg-blue-600 hover:bg-blue-700 text-white shadow-xs",
                          isUploading && "opacity-60"
                        )}>
                          {isUploading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <>
                              <Camera className="w-3.5 h-3.5" />
                              <span>Cámara</span>
                            </>
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                          disabled={isUploading}
                          onChange={e => {
                            const file = e.target.files?.[0]
                            e.target.value = ''
                            if (file) handleWorkerFileUpload(w.workerId, file)
                          }}
                        />
                      </div>

                      {/* Opción 2: Archivos / Google Drive */}
                      <div className="flex-1 relative overflow-hidden rounded-lg">
                        <div className={cn(
                          "flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all pointer-events-none",
                          "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-xs",
                          isUploading && "opacity-60"
                        )}>
                          <Upload className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Drive / Archivo</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                          disabled={isUploading}
                          onChange={e => {
                            const file = e.target.files?.[0]
                            e.target.value = ''
                            if (file) handleWorkerFileUpload(w.workerId, file)
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* SECCIÓN 2: DOCUMENTOS DE EMPRESA (IPERC, Plan Anual, Política, Actas) */}
      {activeArea === 'empresa' && (
        <div className="space-y-2.5">
          {companyRequirements.map(req => {
            const isUploading = uploadingTargetId === req.code

            return (
              <div 
                key={req.code}
                className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                        {req.code}
                      </span>
                      <h3 className="text-xs font-bold text-gray-900">
                        {req.title}
                      </h3>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {req.description}
                    </p>
                    <p className="text-[10px] text-blue-600 font-medium mt-0.5">
                      Base legal: {req.legalBasis}
                    </p>
                  </div>

                  {req.isComplete ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Firmado
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md flex-shrink-0">
                      Requerido
                    </span>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  {req.isComplete && req.filePath && (
                    <button
                      onClick={() => handleViewDocument(req.filePath!)}
                      className="py-1.5 px-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-medium border border-gray-200 flex items-center gap-1 flex-shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Ver</span>
                    </button>
                  )}

                  {/* Opción 1: Cámara en vivo */}
                  <div className="flex-1 relative overflow-hidden rounded-lg">
                    <div className={cn(
                      "flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all pointer-events-none",
                      "bg-blue-600 hover:bg-blue-700 text-white shadow-xs",
                      isUploading && "opacity-60"
                    )}>
                      {isUploading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <Camera className="w-3.5 h-3.5" />
                          <span>Cámara</span>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                      disabled={isUploading}
                      onChange={e => {
                        const file = e.target.files?.[0]
                        e.target.value = ''
                        if (file) handleCompanyFileUpload(req.code, file)
                      }}
                    />
                  </div>

                  {/* Opción 2: Archivos / Google Drive */}
                  <div className="flex-1 relative overflow-hidden rounded-lg">
                    <div className={cn(
                      "flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all pointer-events-none",
                      "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-xs",
                      isUploading && "opacity-60"
                    )}>
                      <Upload className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Drive / Archivo</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                      disabled={isUploading}
                      onChange={e => {
                        const file = e.target.files?.[0]
                        e.target.value = ''
                        if (file) handleCompanyFileUpload(req.code, file)
                      }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
