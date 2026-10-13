'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'
import { WorkerForm } from './WorkerForm'

export function AddWorkerModal() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <PlusCircle className="w-4 h-4" /> Añadir Trabajador
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white rounded-xl shadow-lg border border-gray-200">
        <DialogHeader>
          <DialogTitle>Registrar Nuevo Trabajador</DialogTitle>
          <DialogDescription>
            Ingrese los datos del trabajador manualmente para registrarlo en el sistema.
          </DialogDescription>
        </DialogHeader>
        <div className="pt-4">
          <WorkerForm onSuccess={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
