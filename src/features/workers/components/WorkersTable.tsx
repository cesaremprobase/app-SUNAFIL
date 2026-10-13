'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit2, Trash2, UserCircle2, FolderOpen } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { WorkerForm } from './WorkerForm'
import { WorkerDocumentsModal } from './WorkerDocumentsModal'
import { deleteWorker } from '../actions/worker-actions'
import type { Worker } from '../types'

function WorkerActions({ worker }: { worker: Worker }) {
  const [openEdit, setOpenEdit] = useState(false)
  const [openDocs, setOpenDocs] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (worker.id && confirm('¿Está seguro de eliminar a este trabajador?')) {
      setIsDeleting(true)
      await deleteWorker(worker.id)
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex justify-end gap-1">
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
        onClick={() => setOpenDocs(true)}
        title="Ver documentos"
      >
        <FolderOpen className="h-4 w-4" />
      </Button>
      
      <WorkerDocumentsModal 
        worker={worker} 
        open={openDocs} 
        onOpenChange={setOpenDocs} 
      />

      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50">
            <Edit2 className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] bg-white rounded-xl shadow-lg border border-gray-200">
          <DialogHeader>
            <DialogTitle>Editar Trabajador</DialogTitle>
          </DialogHeader>
          <WorkerForm initialData={worker} onSuccess={() => setOpenEdit(false)} />
        </DialogContent>
      </Dialog>
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

export function WorkersTable({ workers }: { workers: Worker[] }) {
  if (!workers || workers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-500">
        <UserCircle2 className="w-12 h-12 mb-4 text-gray-300" />
        <p className="text-lg font-medium">No hay trabajadores registrados</p>
        <p className="text-sm">Haga clic en Añadir Trabajador para comenzar.</p>
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="font-semibold text-gray-900">DNI</TableHead>
            <TableHead className="font-semibold text-gray-900">Trabajador</TableHead>
            <TableHead className="font-semibold text-gray-900">Cargo</TableHead>
            <TableHead className="font-semibold text-gray-900">Ingreso</TableHead>
            <TableHead className="font-semibold text-gray-900">Estado</TableHead>
            <TableHead className="text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workers.map((worker) => (
            <TableRow key={worker.id} className="hover:bg-gray-50 transition-colors">
              <TableCell className="font-medium text-gray-900">{worker.document_number}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">{worker.first_name} {worker.last_name}</span>
                  <span className="text-xs text-gray-500">Empleado</span>
                </div>
              </TableCell>
              <TableCell className="text-gray-600">{worker.job_title}</TableCell>
              <TableCell className="text-gray-600">
                {new Date(worker.hire_date).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  worker.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {worker.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <WorkerActions worker={worker} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
