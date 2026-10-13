'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signup } from '../actions/auth-actions'
import { toast } from 'sonner'
import Link from 'next/link'

export function SignupForm() {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const result = await signup(formData)
    
    if (result?.error) {
      toast.error(result.error)
      setLoading(false)
    } else if (result?.message) {
      toast.success(result.message, { duration: 6000 })
      setLoading(false)
      // Limpiar formulario
      e.currentTarget.reset()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full">
      <div className="space-y-2">
        <Label htmlFor="email">Email Corporativo</Label>
        <Input id="email" name="email" type="email" required placeholder="tucorreo@empresa.com" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña Fuerte</Label>
        <Input id="password" name="password" type="password" required minLength={6} />
      </div>
      
      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium" disabled={loading}>
        {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
      </Button>
      
      <p className="text-center text-sm text-gray-600 mt-4">
        ¿Ya tienes cuenta? <Link href="/login" className="text-blue-600 font-semibold hover:underline">Inicia Sesión</Link>
      </p>
    </form>
  )
}
