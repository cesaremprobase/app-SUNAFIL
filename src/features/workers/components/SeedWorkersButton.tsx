'use client'

import { useState } from 'react'
import { seedOfficialWorkers } from '../actions/worker-actions'
import { Button } from '@/components/ui/button'
import { Users, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function SeedWorkersButton() {
  const [loading, setLoading] = useState(false)

  const handleSeed = async () => {
    try {
      setLoading(true)
      const res = await seedOfficialWorkers()
      if (res.success) {
        toast.success(`Se registraron ${res.count} trabajadores en el sistema con éxito.`)
      } else {
        toast.error(`Error: ${res.error}`)
      }
    } catch (e: any) {
      toast.error(e.message || 'Error cargando la nómina oficial')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      onClick={handleSeed} 
      disabled={loading}
      className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
      Cargar Nómina Oficial (33 Trabajadores)
    </Button>
  )
}
