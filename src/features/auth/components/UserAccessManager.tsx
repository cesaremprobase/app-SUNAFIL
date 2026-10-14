'use client'

import { useState } from 'react'
import { UserProfile, approveUser, revokeUserAccess } from '../actions/user-management-actions'
import { ShieldCheck, UserX, Clock, UserCheck, ShieldAlert, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface UserAccessManagerProps {
  users: UserProfile[]
  currentUserEmail?: string
}

export function UserAccessManager({ users: initialUsers, currentUserEmail }: UserAccessManagerProps) {
  const [users, setUsers] = useState<UserProfile[]>(initialUsers)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleApprove = async (userId: string, role: 'admin' | 'supervisor_sst') => {
    try {
      setLoadingId(userId)
      await approveUser(userId, role)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_approved: true, role } : u))
      toast.success('Usuario aprobado con éxito')
    } catch (e: any) {
      toast.error(e.message || 'Error al aprobar')
    } finally {
      setLoadingId(null)
    }
  }

  const handleRevoke = async (userId: string) => {
    if (!confirm('¿Seguro que deseas revocar el acceso a este usuario?')) return

    try {
      setLoadingId(userId)
      await revokeUserAccess(userId)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_approved: false, role: 'rejected' } : u))
      toast.success('Acceso revocado')
    } catch (e: any) {
      toast.error(e.message || 'Error al revocar')
    } finally {
      setLoadingId(null)
    }
  }

  const pendingCount = users.filter(u => !u.is_approved && u.role !== 'rejected').length

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-gray-900">Control de Accesos y Seguridad (RBAC)</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Solo los usuarios aprobados por ti pueden ingresar y ver los documentos de seguridad y salud en el trabajo.
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold self-start sm:self-auto">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            {pendingCount} pendiente(s) de aprobación
          </span>
        )}
      </div>

      <div className="divide-y divide-gray-100">
        {users.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-xs">
            No hay otros usuarios registrados en el sistema.
          </div>
        ) : (
          users.map(u => {
            const isMe = u.email === currentUserEmail
            const isSuperAdmin = u.email === 'cesarestebandelao@gmail.com'
            const isLoading = loadingId === u.id

            return (
              <div key={u.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 text-sm">{u.email}</span>
                    {isSuperAdmin && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-bold rounded-full uppercase">
                        Super Admin
                      </span>
                    )}
                    {isMe && !isSuperAdmin && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-medium rounded-full">
                        (Tú)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Registrado: {new Date(u.created_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className={`font-medium ${
                      u.is_approved 
                        ? 'text-emerald-600' 
                        : u.role === 'rejected' 
                        ? 'text-red-600' 
                        : 'text-amber-600'
                    }`}>
                      {u.is_approved 
                        ? `Aprobado (${u.role === 'admin' ? 'Administrador' : 'Supervisor SST'})` 
                        : u.role === 'rejected' 
                        ? 'Acceso Denegado' 
                        : 'Pendiente de Aprobación'}
                    </span>
                  </div>
                </div>

                {!isSuperAdmin && (
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {!u.is_approved ? (
                      <>
                        <Button
                          size="sm"
                          disabled={isLoading}
                          onClick={() => handleApprove(u.id, 'supervisor_sst')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 gap-1.5"
                        >
                          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                          Aprobar Acceso
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isLoading}
                          onClick={() => handleRevoke(u.id)}
                          className="text-red-600 hover:bg-red-50 text-xs h-8 gap-1"
                        >
                          Rechazar
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isLoading}
                          onClick={() => handleRevoke(u.id)}
                          className="text-red-600 hover:bg-red-50 text-xs h-8 gap-1"
                        >
                          <UserX className="w-3.5 h-3.5" /> Revocar Acceso
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
