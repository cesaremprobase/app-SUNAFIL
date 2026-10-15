'use client'

import { useState } from 'react'
import { WorkerLegajoSummary, WorkerLegajoRequirement } from '../../types/dossier'
import { uploadAndIngestWorkerDocument, getDocumentDownloadUrl } from '../../actions/dossier-actions'
import { 
  Users, 
  Search, 
  CheckCircle2, 
  Clock, 
  Upload, 
  ExternalLink, 
  AlertCircle,
  Loader2,
  Camera,
  FileCheck,
  UploadCloud
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SeedWorkersButton } from '@/features/workers/components/SeedWorkersButton'
import { toast } from 'sonner'

interface WorkerLegajosViewProps {
  legajos: WorkerLegajoSummary[]
}

export function WorkerLegajosView({ legajos }: WorkerLegajosViewProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'incomplete' | 'complete'>('all')

  // Estado para modal de subida de documento a un trabajador
  const [uploadTarget, setUploadTarget] = useState<{
    worker: WorkerLegajoSummary
    req: WorkerLegajoRequirement
  } | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [documentDate, setDocumentDate] = useState(new Date().toISOString().split('T')[0])
  const [isUploading, setIsUploading] = useState(false)

  // Filtrado
  const filteredLegajos = legajos.filter(worker => {
    const matchesSearch = 
      worker.workerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.documentNumber.includes(searchTerm) ||
      worker.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch) return false

    if (filterStatus === 'incomplete') {
      return worker.completionRate < 100
    }
    if (filterStatus === 'complete') {
      return worker.completionRate === 100
    }
    return true
  })

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadTarget || !file) {
      toast.error('Selecciona un archivo PDF o imagen')
      return
    }

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('workerId', uploadTarget.worker.workerId)
      formData.append('documentType', uploadTarget.req.type)
      formData.append('documentDate', documentDate)
      formData.append('file', file)

      await uploadAndIngestWorkerDocument(formData)
      toast.success(`${uploadTarget.req.label} guardado para ${uploadTarget.worker.workerName}`)
      setUploadTarget(null)
      setFile(null)
    } catch (err: any) {
      toast.error(err.message || 'Error al subir documento')
    } finally {
      setIsUploading(false)
    }
  }

  const handleOpenDoc = async (filePath: string) => {
    try {
      const url = await getDocumentDownloadUrl(filePath)
      window.open(url, '_blank')
    } catch {
      toast.error('No se pudo abrir el documento')
    }
  }

  if (legajos.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <Users className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-gray-900">Aún no hay trabajadores en el sistema</h3>
          <p className="text-sm text-gray-500 max-w-lg mx-auto">
            Hemos detectado la nómina oficial de los <strong>33 trabajadores</strong> de tu empresa. Cárgala ahora para ver de inmediato la matriz de los 4 sellos legales y qué documento físico falta digitalizar por cada uno.
          </p>
        </div>
        <div className="pt-2">
          <SeedWorkersButton />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Explicación y Filtros */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
        <Users className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
        <div className="text-sm text-purple-900">
          <p className="font-semibold">Legajos Individuales de SST por Trabajador (Fiscalización SUNAFIL)</p>
          <p className="text-purple-700 mt-0.5">
            Por cada trabajador activo en planilla, el inspector solicita acreditar: 
            <strong> 1) Cargo firmado de RISST</strong>, 
            <strong> 2) EMO vigente</strong>, 
            <strong> 3) Cargo de EPPs</strong> y 
            <strong> 4) Constancia de las 4 capacitaciones anuales</strong>.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Buscador */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, cargo o DNI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Botones de filtro rápido */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterStatus === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Todos ({legajos.length})
          </button>
          <button
            onClick={() => setFilterStatus('incomplete')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterStatus === 'incomplete'
                ? 'bg-amber-600 text-white'
                : 'bg-white border border-gray-200 text-amber-700 hover:bg-amber-50'
            }`}
          >
            Pendientes ({legajos.filter(w => w.completionRate < 100).length})
          </button>
          <button
            onClick={() => setFilterStatus('complete')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterStatus === 'complete'
                ? 'bg-emerald-600 text-white'
                : 'bg-white border border-gray-200 text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            Completos ({legajos.filter(w => w.completionRate === 100).length})
          </button>
        </div>
      </div>

      {/* Tabla / Matriz de Legajos */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Trabajador / Cargo</th>
                <th className="py-3 px-3 text-center">1. Cargo RISST</th>
                <th className="py-3 px-3 text-center">2. EMO (Aptitud)</th>
                <th className="py-3 px-3 text-center">3. Entrega EPP</th>
                <th className="py-3 px-3 text-center">4. Capacitación</th>
                <th className="py-3 px-4 text-right">Completitud</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredLegajos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400 text-sm">
                    No se encontraron trabajadores que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredLegajos.map((worker) => (
                  <tr key={worker.workerId} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900">{worker.workerName}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                        <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">
                          DNI {worker.documentNumber}
                        </span>
                        <span>•</span>
                        <span>{worker.jobTitle}</span>
                      </div>
                    </td>

                    {/* Las 4 columnas de requisitos legales */}
                    {worker.requirements.map((req) => (
                      <td key={req.type} className="py-3.5 px-3 text-center">
                        {req.isComplete ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => req.filePath && handleOpenDoc(req.filePath)}
                              title={`Ver ${req.label} (${req.fileName || 'PDF'})`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200 hover:bg-emerald-100 transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>OK</span>
                              <ExternalLink className="w-3 h-3 text-emerald-500 ml-0.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setUploadTarget({ worker, req })}
                            title={`Digitalizar ${req.label} de ${worker.workerName}`}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200 hover:bg-amber-100 transition-colors"
                          >
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Subir</span>
                            <Upload className="w-3 h-3 text-amber-500 ml-0.5" />
                          </button>
                        )}
                      </td>
                    ))}

                    {/* Porcentaje y estado de completitud */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className={`text-xs font-bold ${
                          worker.completionRate === 100 
                            ? 'text-emerald-700' 
                            : worker.completionRate >= 50 
                            ? 'text-amber-700' 
                            : 'text-red-700'
                        }`}>
                          {worker.completionRate}%
                        </span>
                        <div className="w-14 bg-gray-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              worker.completionRate === 100 
                                ? 'bg-emerald-500' 
                                : worker.completionRate >= 50 
                                ? 'bg-amber-500' 
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${worker.completionRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Carga de Documento a Trabajador */}
      <Dialog open={Boolean(uploadTarget)} onOpenChange={(open) => {
        if (!open) {
          setUploadTarget(null)
          setFile(null)
        }
      }}>
        <DialogContent 
          style={{ backgroundColor: '#ffffff' }}
          className="sm:max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200"
        >
          <DialogHeader>
            <DialogTitle>Digitalizar Documento de Trabajador</DialogTitle>
            <DialogDescription>
              {uploadTarget?.req.label} para <strong>{uploadTarget?.worker.workerName}</strong> (DNI {uploadTarget?.worker.documentNumber})
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpload} className="space-y-4 pt-2">
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 space-y-1">
              <p className="font-semibold text-gray-900">Requisito Legal:</p>
              <p>{uploadTarget?.req.legalBasis}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Fecha del Documento Físico
              </label>
              <input
                type="date"
                value={documentDate}
                onChange={(e) => setDocumentDate(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700">
                Selecciona cómo deseas cargar el documento:
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Opción 1: Cámara en vivo */}
                <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50/80 hover:bg-gray-100 p-3 text-center transition-colors">
                  <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                    <Camera className="w-5 h-5 text-blue-600" />
                    <span className="text-xs font-semibold text-gray-800">Tomar Foto</span>
                    <span className="text-[10px] text-gray-400">Cámara en vivo</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </div>

                {/* Opción 2: Archivos / Google Drive */}
                <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50/80 hover:bg-gray-100 p-3 text-center transition-colors">
                  <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                    <UploadCloud className="w-5 h-5 text-emerald-600" />
                    <span className="text-xs font-semibold text-gray-800">Archivos / Drive</span>
                    <span className="text-[10px] text-gray-400">PDF o foto guardada</span>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              {/* Archivo Seleccionado */}
              {file && (
                <div className="flex items-center justify-between p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs animate-in fade-in">
                  <div className="flex items-center gap-2 truncate">
                    <FileCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span className="font-semibold text-blue-900 truncate">{file.name}</span>
                  </div>
                  <span className="text-[10px] text-blue-700 font-medium whitespace-nowrap">{(file.size / 1024).toFixed(0)} KB</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setUploadTarget(null)
                  setFile(null)
                }}
                disabled={isUploading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isUploading || !file}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                Guardar en Legajo
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
