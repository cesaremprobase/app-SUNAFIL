'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, CheckCircle, FileText, UploadCloud, Edit3, Loader2, Download, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'
import type { SstRecord } from '../types'
import type { Worker, WorkerDocument } from '@/features/workers/types'

import { updateSstRecord, uploadDocumentToStorage } from '../actions/record-actions'
import { addWorkerDocument, deleteWorkerDocument, getWorkerDocumentsByType } from '@/features/workers/actions/document-actions'

interface RecordEditModalProps {
  record: SstRecord & {
    compliance_percentage?: number
    total_workers?: number
    completed_workers?: number
  }
  workers: Worker[]
  onSave: (r: SstRecord) => void
}

function RecordEditModal({ record, workers, onSave }: RecordEditModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const isIndividual = ['emos', 'epps', 'capacitaciones'].includes(record.record_type || '')

  // Estados Caso General
  const [status, setStatus] = useState(record.status)
  const [date, setDate] = useState(record.next_due_date || '')
  const [notes, setNotes] = useState(record.notes || '')
  const [docName, setDocName] = useState(record.document_name || null)
  const [docPath, setDocPath] = useState(record.document_path || null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estados Caso Individual (Por Trabajador)
  const [workerDocs, setWorkerDocs] = useState<WorkerDocument[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [uploadingWorkerId, setUploadingWorkerId] = useState<string | null>(null)
  const workerFileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  // Cargar documentos del trabajador al abrir modal individual
  useEffect(() => {
    if (open && isIndividual && record.record_type) {
      setLoadingDocs(true)
      getWorkerDocumentsByType(record.record_type)
        .then(docs => {
          setWorkerDocs(docs)
        })
        .catch(() => {
          toast.error('Error cargando los documentos de trabajadores')
        })
        .finally(() => {
          setLoadingDocs(false)
        })
    }
  }, [open, isIndividual, record.record_type])

  // Subida General
  const handleGeneralFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const result = await uploadDocumentToStorage(file, `sst_records/${record.record_type}`)
      setDocName(result.name)
      setDocPath(result.path)
      toast.success('Archivo subido temporalmente')
    } catch (err) {
      toast.error('Error subiendo archivo')
    } finally {
      setIsUploading(false)
    }
  }

  const handleGeneralSave = async () => {
    setIsSaving(true)
    try {
      const payload = { status, next_due_date: date, notes, document_name: docName, document_path: docPath }
      const updatedRecord = await updateSstRecord(record.id, payload)
      onSave(updatedRecord)
      setOpen(false)
      toast.success('Registro general guardado correctamente')
      router.refresh()
    } catch (err) {
      toast.error('Error guardando registro')
    } finally {
      setIsSaving(false)
    }
  }

  // Subida Individual (Trabajador)
  const handleIndividualFileChange = async (workerId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingWorkerId(workerId)
    try {
      const result = await uploadDocumentToStorage(file, `worker_documents/${record.record_type}`)
      const newDoc = await addWorkerDocument({
        worker_id: workerId,
        name: result.name,
        file_path: result.path,
        size_bytes: result.size,
        document_date: new Date().toISOString().split('T')[0],
        sst_record_type: record.record_type
      })
      setWorkerDocs(prev => [newDoc, ...prev])
      toast.success('Documento subido correctamente para el trabajador')
      router.refresh()
    } catch (err) {
      toast.error('Error al subir documento del trabajador')
    } finally {
      setUploadingWorkerId(null)
      if (workerFileInputRefs.current[workerId]) {
        workerFileInputRefs.current[workerId]!.value = ''
      }
    }
  }

  // Eliminar Documento Individual
  const handleIndividualDelete = async (docId: string, filePath: string) => {
    if (!confirm('¿Está seguro de eliminar este documento de compliance?')) return
    try {
      await deleteWorkerDocument(docId, filePath)
      setWorkerDocs(prev => prev.filter(d => d.id !== docId))
      toast.success('Documento eliminado correctamente')
      router.refresh()
    } catch (err) {
      toast.error('Error al eliminar el documento')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <Edit3 className="w-4 h-4" /> Actualizar
      </Button>
      <DialogContent className={`bg-white rounded-xl shadow-lg border border-gray-200 ${isIndividual ? 'sm:max-w-[700px]' : 'sm:max-w-[500px]'}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isIndividual ? <Users className="w-5 h-5 text-blue-600" /> : <FileText className="w-5 h-5 text-blue-600" />}
            Actualizar Registro: {record.name}
          </DialogTitle>
        </DialogHeader>

        {isIndividual ? (
          // ================= CASO INDIVIDUAL (POR TRABAJADOR) =================
          <div className="space-y-4 pt-4">
            <p className="text-sm text-gray-500">
              Este es un registro individual de cumplimiento. Sube el documento correspondiente (EMO, cargo de entrega de EPP, etc.) de manera personalizada para cada uno de los trabajadores activos.
            </p>
            
            {loadingDocs ? (
              <div className="flex flex-col items-center justify-center p-12 text-blue-600 gap-2">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-sm font-medium">Cargando registros de trabajadores...</span>
              </div>
            ) : workers.length === 0 ? (
              <div className="text-center p-8 border border-dashed rounded-lg text-gray-500">
                No hay trabajadores registrados activos para asociar cumplimiento.
              </div>
            ) : (
              <div className="border border-gray-100 rounded-lg max-h-[350px] overflow-y-auto divide-y divide-gray-100">
                {workers.map(worker => {
                  const doc = workerDocs.find(d => d.worker_id === worker.id)
                  const downloadUrl = doc 
                    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/sst-documents/${doc.file_path}`
                    : '#'

                  return (
                    <div key={worker.id} className="p-3 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-semibold text-gray-800 text-sm">{worker.first_name} {worker.last_name}</span>
                        <span className="text-xs text-gray-400">DNI: {worker.document_number} — {worker.job_title}</span>
                      </div>
                      
                      {doc ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-700">
                            Válido
                          </span>
                          <a 
                            href={downloadUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Descargar PDF"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button 
                            onClick={() => handleIndividualDelete(doc.id!, doc.file_path)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">
                            Faltante
                          </span>
                          <input 
                            type="file" 
                            accept=".pdf" 
                            className="hidden" 
                            ref={el => { if (worker.id) workerFileInputRefs.current[worker.id] = el }}
                            onChange={(e) => worker.id && handleIndividualFileChange(worker.id, e)} 
                          />
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 gap-1.5"
                            disabled={uploadingWorkerId === worker.id}
                            onClick={() => worker.id && workerFileInputRefs.current[worker.id]?.click()}
                          >
                            {uploadingWorkerId === worker.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <UploadCloud className="w-3.5 h-3.5" />
                            )}
                            Subir PDF
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
            <div className="flex justify-end pt-2">
              <Button onClick={() => setOpen(false)} className="bg-blue-600 hover:bg-blue-700 text-white">
                Finalizar
              </Button>
            </div>
          </div>
        ) : (
          // ================= CASO GENERAL (ORGANIZACIONAL) =================
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estado del Registro</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione estado" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="valid">Al día</SelectItem>
                    <SelectItem value="pending">Faltante / Pendiente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Próximo Vencimiento</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notas / Observaciones</Label>
              <Textarea 
                placeholder="Ej. Falta firma del comité..." 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
              />
            </div>

            <div className="space-y-2">
              <Label>Evidencia PDF (Opcional)</Label>
              {docName ? (
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2 overflow-hidden text-sm font-medium">
                    <FileText className="w-4 h-4 text-red-500 shrink-0" />
                    <span className="truncate">{docName}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setDocName(null); setDocPath(null); }} className="text-red-500 h-8">Quitar</Button>
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleGeneralFileChange} />
                  {isUploading ? (
                    <div className="flex items-center gap-2 text-blue-600">
                      <Loader2 className="w-5 h-5 animate-spin" /> Subiendo...
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-6 h-6 text-gray-400 mb-2" />
                      <span className="text-sm font-medium text-gray-700">Subir PDF General</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 flex justify-end">
              <Button onClick={handleGeneralSave} disabled={isSaving || isUploading} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function RegistrosManager({ 
  initialRecords = [], 
  workers = [] 
}: { 
  initialRecords?: (SstRecord & {
    compliance_percentage?: number
    total_workers?: number
    completed_workers?: number
  })[]
  workers?: Worker[]
}) {
  const [records, setRecords] = useState(initialRecords)

  const handleUpdateRecord = (updated: SstRecord) => {
    setRecords(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r))
  }

  // Calcular el progreso global promediando los porcentajes reales
  const totalPercentage = records.reduce((sum, r) => sum + (r.compliance_percentage ?? (r.status === 'valid' ? 100 : 0)), 0)
  const progress = records.length > 0 ? Math.round(totalPercentage / records.length) : 0

  return (
    <div className="space-y-6">
      <Card className="border border-gray-100 shadow-md">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">Registros Obligatorios MTPE</CardTitle>
              <CardDescription className="text-gray-500 mt-1">
                Gestiona los 8 registros exigidos por la Ley 29783. Mantén esto al 100% para evitar multas de SUNAFIL.
              </CardDescription>
            </div>
            <div className="flex flex-col items-end bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
              <span className="text-3xl font-black text-blue-700 leading-none">{progress}%</span>
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1">CUMPLIMIENTO</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden mb-8">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${progress === 100 ? 'bg-green-500' : progress > 50 ? 'bg-blue-600' : 'bg-red-500'}`} 
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <div className="grid gap-4">
            {records.map(record => {
              const isIndividual = ['emos', 'epps', 'capacitaciones'].includes(record.record_type || '')
              const pct = record.compliance_percentage ?? (record.status === 'valid' ? 100 : 0)

              return (
                <div key={record.id} className="p-4 bg-white border border-gray-200 rounded-xl flex items-center justify-between hover:border-gray-300 transition-colors">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className={`p-2 rounded-full shrink-0 ${pct === 100 ? 'bg-green-100 text-green-600' : pct > 0 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                      {pct === 100 ? <CheckCircle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">{record.name}</h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-medium mt-1">
                        {isIndividual ? (
                          <span className={pct === 100 ? "text-green-600" : "text-amber-600"}>
                            {pct}% completado ({record.completed_workers || 0}/{record.total_workers || 0} trabajadores)
                          </span>
                        ) : (
                          <span className={record.status === 'valid' ? "text-green-600" : "text-red-600"}>
                            {record.status === 'valid' ? 'Al día' : 'Faltante'}
                          </span>
                        )}
                        
                        {!isIndividual && record.next_due_date && (
                          <span className="text-gray-400">
                            Vence: {new Date(record.next_due_date).toLocaleDateString()}
                          </span>
                        )}
                        
                        {!isIndividual && record.document_name && (
                          <span className="text-blue-600 flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" /> {record.document_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <RecordEditModal record={record} workers={workers} onSave={handleUpdateRecord} />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
