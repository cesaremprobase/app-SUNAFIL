'use client'

import React, { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FileText, UploadCloud, Trash2, FileCheck, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Worker, WorkerDocument } from '../types'

import { getWorkerDocuments, addWorkerDocument, deleteWorkerDocument } from '../actions/document-actions'
import { uploadDocumentToStorage } from '@/features/sst/actions/record-actions'

interface WorkerDocumentsModalProps {
  worker: Worker | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WorkerDocumentsModal({ worker, open, onOpenChange }: WorkerDocumentsModalProps) {
  const [documents, setDocuments] = useState<WorkerDocument[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch docs when modal opens
  React.useEffect(() => {
    if (open && worker?.id) {
      setIsLoading(true)
      getWorkerDocuments(worker.id).then(docs => {
        setDocuments(docs)
        setIsLoading(false)
      })
    }
  }, [open, worker])

  if (!worker || !worker.id) return null

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      // 1. Upload to storage
      const uploaded = await uploadDocumentToStorage(file, `worker_documents/${worker.id}`)
      
      // 2. Save in DB
      const newDoc = await addWorkerDocument({
        worker_id: worker.id,
        name: uploaded.name,
        file_path: uploaded.path,
        size_bytes: uploaded.size,
        document_date: new Date().toISOString().split('T')[0]
      })
      
      setDocuments(prev => [newDoc, ...prev])
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      toast.error('Error al subir el documento')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: string, filePath: string) => {
    if (confirm('¿Eliminar este documento?')) {
      try {
        await deleteWorkerDocument(id, filePath)
        setDocuments(prev => prev.filter(d => d.id !== id))
        toast.success('Documento eliminado')
      } catch (err) {
        toast.error('Error al eliminar el documento')
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white rounded-xl shadow-lg border border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-xl">Documentos del Trabajador</DialogTitle>
          <DialogDescription>
            Gestiona los archivos PDF (Contratos, EMOs, etc.) de <span className="font-semibold text-gray-900">{worker.first_name} {worker.last_name}</span>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          {/* Upload Area */}
          <div 
            onClick={handleUploadClick}
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 hover:border-blue-400 transition-colors"
          >
            <input 
              type="file" 
              accept=".pdf" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            {isUploading ? (
              <div className="flex flex-col items-center text-blue-600">
                <Loader2 className="w-10 h-10 mb-3 animate-spin" />
                <p className="font-medium">Subiendo documento...</p>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-gray-900">Haz clic para subir un PDF</p>
                <p className="text-xs text-gray-500 mt-1">Solo archivos .pdf hasta 10MB</p>
              </>
            )}
          </div>

          {/* Documents List */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-gray-500" />
              Archivos Subidos ({documents.length})
            </h4>
            
            {documents.length === 0 ? (
              <p className="text-sm text-gray-500 italic text-center py-4 bg-gray-50 rounded-lg border border-gray-100">
                No hay documentos registrados para este trabajador.
              </p>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-gray-300 transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 bg-red-50 rounded-lg text-red-600 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate" title={doc.name}>
                          {doc.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{doc.document_date || doc.date}</span>
                          <span>•</span>
                          <span>{doc.size_bytes ? `${(doc.size_bytes / (1024 * 1024)).toFixed(2)} MB` : doc.size}</span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(doc.id, doc.file_path)}
                      className="text-gray-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
