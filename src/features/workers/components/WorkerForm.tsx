'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createWorker, updateWorker } from '../actions/worker-actions'

export function WorkerForm({ onSuccess, initialData }: { onSuccess?: () => void, initialData?: any }) {
  const [dni, setDni] = useState(initialData?.document_number || '')
  const [names, setNames] = useState(initialData?.first_name || '')
  const [lastNames, setLastNames] = useState(initialData?.last_name || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    
    // Convert first_name and last_name since we separated them in UI
    formData.set('first_name', names)
    formData.set('last_name', lastNames)

    const res = initialData 
      ? await updateWorker(initialData.id, formData)
      : await createWorker(formData)
      
    setLoading(false)
    if (res.success) {
      if (onSuccess) onSuccess()
    } else {
      setError(res.error || 'Error al guardar')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Label htmlFor="document_number">DNI</Label>
          <Input 
            id="document_number" 
            name="document_number" 
            value={dni} 
            onChange={(e) => setDni(e.target.value)} 
            maxLength={8}
            required 
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="first_name">Nombres</Label>
          <Input id="first_name" value={names} onChange={(e) => setNames(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="last_name">Apellidos</Label>
          <Input id="last_name" value={lastNames} onChange={(e) => setLastNames(e.target.value)} required />
        </div>
      </div>

      <div>
        <Label htmlFor="job_title">Puesto de Trabajo</Label>
        <Input id="job_title" name="job_title" defaultValue={initialData?.job_title} placeholder="Ej. Operario de Producción" required />
      </div>

      <div>
        <Label htmlFor="hire_date">Fecha de Ingreso</Label>
        <Input id="hire_date" name="hire_date" type="date" defaultValue={initialData?.hire_date ? new Date(initialData.hire_date).toISOString().split('T')[0] : ''} required />
      </div>

      <div className="pt-4 flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : (initialData ? 'Actualizar Trabajador' : 'Registrar Trabajador')}
        </Button>
      </div>
    </form>
  )
}
