'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { assignCommitteeRole, deactivateCommitteeRole } from '../actions/committee-actions'
import { PlusCircle, Shield, UserX, Award } from 'lucide-react'
import type { CommitteeMember } from '../types'
import type { Worker } from '@/features/workers/types'

export function CommitteeManager({ workers, committeeMembers }: { workers: Worker[], committeeMembers: CommitteeMember[] }) {
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  
  const activeWorkers = workers.filter(w => w.is_active)
  const activeCommittee = committeeMembers.filter(m => m.is_active)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    
    await assignCommitteeRole(formData)
    setLoading(false)
    setIsOpen(false)
  }

  const roleColors: Record<string, string> = {
    'presidente': 'bg-purple-100 text-purple-800 border-purple-200',
    'secretario': 'bg-blue-100 text-blue-800 border-blue-200',
    'miembro_titular': 'bg-green-100 text-green-800 border-green-200',
    'miembro_suplente': 'bg-gray-100 text-gray-800 border-gray-200'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Directorio del Comité</h2>
          <p className="text-sm text-gray-500 mt-1">Miembros vigentes con responsabilidad legal</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <PlusCircle className="w-4 h-4" /> Asignar Cargo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-white rounded-xl shadow-lg border border-gray-200">
            <DialogHeader>
              <DialogTitle>Asignar Rol al Comité</DialogTitle>
              <DialogDescription>
                Seleccione a un trabajador activo para formar parte del Comité de Seguridad.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div>
                <Label htmlFor="worker_id">Trabajador</Label>
                <Select name="worker_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un trabajador" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeWorkers.map(w => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.first_name} {w.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="role">Rol en el Comité</Label>
                <Select name="role" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presidente">Presidente</SelectItem>
                    <SelectItem value="secretario">Secretario</SelectItem>
                    <SelectItem value="miembro_titular">Miembro Titular</SelectItem>
                    <SelectItem value="miembro_suplente">Miembro Suplente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Fecha de Inicio</Label>
                  <Input id="start_date" name="start_date" type="date" required />
                </div>
                <div>
                  <Label htmlFor="end_date">Vencimiento</Label>
                  <Input id="end_date" name="end_date" type="date" required />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Asignando...' : 'Guardar Cargo'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {activeCommittee.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white border border-gray-200 border-dashed rounded-2xl text-gray-500">
          <Shield className="w-12 h-12 mb-4 text-gray-300" />
          <p className="text-lg font-medium text-gray-900">Sin comité activo</p>
          <p className="text-sm">Asigne roles para cumplir con el requisito de SUNAFIL.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeCommittee.map(member => (
            <div key={member.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative group overflow-hidden transition-all hover:shadow-md hover:border-gray-300">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                  <Award className="w-5 h-5 text-gray-600" />
                </div>
                <span className={`px-2.5 py-1 text-xs font-semibold uppercase tracking-wide rounded-full border ${roleColors[member.role] || roleColors['miembro_suplente']}`}>
                  {member.role.replace('_', ' ')}
                </span>
              </div>
              
              <h3 className="font-bold text-lg text-gray-900 mb-1">
                {member.workers?.first_name} {member.workers?.last_name}
              </h3>
              <p className="text-sm text-gray-500 mb-4">{member.workers?.job_title}</p>
              
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Vencimiento</span>
                  <span className="text-sm font-medium text-gray-700">
                    {new Date(member.end_date).toLocaleDateString()}
                  </span>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deactivateCommitteeRole(member.id)}
                  title="Revocar cargo"
                >
                  <UserX className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
