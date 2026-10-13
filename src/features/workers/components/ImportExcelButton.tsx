'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'
import { importWorkers } from '../actions/worker-actions'

export function ImportExcelButton() {
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)

    const res = await importWorkers(formData)
    setLoading(false)

    if (res.success) {
      toast.success(`Se importaron ${res.count} trabajadores correctamente.`)
    } else {
      toast.error(`Error al importar: ${res.error}`)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <>
      <input 
        type="file" 
        accept=".xlsx,.xls" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <Button 
        variant="outline" 
        className="gap-2"
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
      >
        <Upload className="w-4 h-4" /> 
        {loading ? 'Importando...' : 'Importar Excel'}
      </Button>
    </>
  )
}
