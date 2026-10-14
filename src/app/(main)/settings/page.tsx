import { Building, Bot, Shield, Bell, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getUserProfiles, getCurrentUserProfile } from '@/features/auth/actions/user-management-actions'
import { UserAccessManager } from '@/features/auth/components/UserAccessManager'

export default async function SettingsPage() {
  const [users, currentProfile] = await Promise.all([
    getUserProfiles(),
    getCurrentUserProfile()
  ])

  const isAdmin = currentProfile?.role === 'admin' || currentProfile?.email === 'cesarestebandelao@gmail.com'

  return (
    <div className="min-h-screen p-6 md:p-8 bg-gray-50/50">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-950 tracking-tight">Configuración del Sistema SGSST</h1>
          <p className="text-sm text-gray-500 mt-1">
            Control de accesos corporativos, parámetros de la empresa e integraciones SUNAFIL
          </p>
        </div>

        {/* Panel de Control de Accesos y Aprobación de Usuarios (Solo Admin) */}
        {isAdmin && (
          <UserAccessManager 
            users={users} 
            currentUserEmail={currentProfile?.email} 
          />
        )}

        {/* Datos de la Empresa */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <Building className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-gray-900">Datos de la Razón Social</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Razón Social</label>
              <input 
                type="text" 
                defaultValue="Mi Empresa S.A.C." 
                className="w-full border border-gray-200 rounded-lg p-2.5 text-gray-800 bg-gray-50/50" 
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">RUC</label>
              <input 
                type="text" 
                defaultValue="20600000001" 
                maxLength={11}
                className="w-full border border-gray-200 rounded-lg p-2.5 text-gray-800 bg-gray-50/50" 
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Régimen Laboral</label>
              <select className="w-full border border-gray-200 rounded-lg p-2.5 text-gray-800 bg-white">
                <option>No MYPE (Régimen General - 25 a 30 trabajadores)</option>
                <option>Pequeña Empresa</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Actividad de Alto Riesgo (SCTR)</label>
              <select className="w-full border border-gray-200 rounded-lg p-2.5 text-gray-800 bg-white">
                <option>No aplica SCTR Salud/Pensión</option>
                <option>Aplica SCTR (Construcción, Minería, Manufactura)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Integración con Telegram */}
        <div className="bg-white border border-blue-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-600" />
              <div>
                <h2 className="text-base font-bold text-gray-900">Bot de Telegram para Digitalización</h2>
                <p className="text-xs text-gray-500">Carga rápida de fotos de documentos físicos desde el celular</p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 font-semibold rounded-full border border-blue-200">
              Canal Activo
            </span>
          </div>

          <div className="space-y-3 text-xs text-gray-600">
            <p>
              El bot permite enviar fotos legibles o PDFs directo a los legajos de los trabajadores:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              <li><strong>Cargos de RISST firmados</strong> (ejemplo: <code>42788318 risst</code>)</li>
              <li><strong>Certificados de Aptitud Médica (EMO)</strong> (ejemplo: <code>42788318 emo</code>)</li>
              <li><strong>Constancias de Entrega de EPPs</strong> (ejemplo: <code>42788318 epp</code>)</li>
              <li><strong>Capacitaciones y Actas del Comité</strong></li>
            </ul>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-[11px] text-gray-600">
              Webhook Endpoint: <code>https://app-sunafil.vercel.app/api/telegram/webhook</code>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-2">
            <Save className="w-4 h-4" /> Guardar Cambios
          </Button>
        </div>
      </div>
    </div>
  )
}
