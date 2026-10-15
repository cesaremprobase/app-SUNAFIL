'use client'

import { useState } from 'react'
import { LegalRequirement } from '../../types/dossier'
import { uploadAndIngestCompanyDocument, getDocumentDownloadUrl } from '../../actions/dossier-actions'
import { 
  Building2, 
  FileCheck, 
  UploadCloud, 
  ExternalLink, 
  Clock, 
  AlertCircle,
  Loader2,
  Camera
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface CompanyDossierViewProps {
  requirements: LegalRequirement[]
}

export function CompanyDossierView({ requirements }: CompanyDossierViewProps) {
  const [selectedReq, setSelectedReq] = useState<LegalRequirement | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReq || !file) {
      toast.error('Selecciona un archivo PDF o imagen para subir')
      return
    }

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('requirementCode', selectedReq.code)
      formData.append('file', file)

      await uploadAndIngestCompanyDocument(formData)
      toast.success(`Documento "${selectedReq.title}" digitalizado correctamente`)
      setSelectedReq(null)
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

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Building2 className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-semibold">Documentación Institucional de la Empresa (Art. 32 D.S. 005-2012-TR)</p>
          <p className="text-blue-700 mt-0.5">
            Estos documentos deben estar permanentemente a disposición del inspector de trabajo en el centro de labores.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {requirements.map((req) => {
          const isDigital = req.status === 'digitalizado'

          return (
            <div 
              key={req.code}
              className={`border rounded-xl p-5 bg-white transition-all shadow-sm flex flex-col justify-between ${
                isDigital ? 'border-emerald-200' : 'border-amber-200 bg-amber-50/20'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                    {req.code}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    isDigital ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {isDigital ? (
                      <>
                        <FileCheck className="w-3.5 h-3.5" /> Digitalizado
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5" /> Pendiente Físico
                      </>
                    )}
                  </span>
                </div>

                <h3 className="text-base font-bold text-gray-900 leading-snug">
                  {req.title}
                </h3>
                <p className="text-xs text-gray-600">
                  {req.description}
                </p>

                <div className="pt-2 border-t border-gray-100 text-[11px] text-gray-500 font-medium">
                  ⚖️ <span className="font-semibold">Base Legal:</span> {req.legalBasis}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between">
                {isDigital && req.filePath ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenDoc(req.filePath!)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Ver PDF / Archivo
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => setSelectedReq(req)}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Reemplazar
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Falta digitalizar
                  </span>
                )}

                <Button
                  size="sm"
                  variant={isDigital ? 'outline' : 'default'}
                  className={!isDigital ? 'bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5' : 'text-xs gap-1.5'}
                  onClick={() => setSelectedReq(req)}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  {isDigital ? 'Actualizar' : 'Subir Documento'}
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal de Carga de Documento Institucional */}
      <Dialog open={Boolean(selectedReq)} onOpenChange={(open) => {
        if (!open) {
          setSelectedReq(null)
          setFile(null)
        }
      }}>
        <DialogContent 
          style={{ backgroundColor: '#ffffff' }}
          className="sm:max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200"
        >
          <DialogHeader>
            <DialogTitle>Digitalizar Documento Institucional</DialogTitle>
            <DialogDescription>
              {selectedReq?.title} ({selectedReq?.code})
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpload} className="space-y-4 pt-2">
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 space-y-1">
              <p><span className="font-semibold text-gray-900">Requisito SUNAFIL:</span> {selectedReq?.legalBasis}</p>
              <p className="text-gray-500">Sube el documento escaneado con las firmas y sellos correspondientes.</p>
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
                  setSelectedReq(null)
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
                Guardar en Expediente
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
