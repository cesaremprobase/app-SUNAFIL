import { AlertTriangle, CheckCircle, FileWarning, ShieldAlert, TrendingDown } from 'lucide-react'

export interface SunafilRiskDashboardProps {
  pendingRecordsCount?: number
  daysUntilCommitteeExpiration?: number | string
  emoProgress?: number
  risstProgress?: number
  capacitacionesProgress?: number
}

export function SunafilRiskDashboard({
  pendingRecordsCount = 2,
  daysUntilCommitteeExpiration = 15,
  emoProgress = 100,
  risstProgress = 0,
  capacitacionesProgress = 100
}: SunafilRiskDashboardProps = {}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard Preventivo SUNAFIL</h2>
        <div className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-medium text-gray-600">
          Última actualización: Hoy, 10:00 AM
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-2xl border border-red-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
            <AlertTriangle className="w-24 h-24 text-red-500" />
          </div>
          <div className="relative z-10">
            <h3 className="text-sm text-gray-500 font-semibold mb-2 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Riesgo de Multa
            </h3>
            <p className="text-4xl font-black text-gray-900 mb-2">
              {pendingRecordsCount > 0 ? 'Alta Expo' : 'Baja Expo'}
            </p>
            <div className={`flex items-center gap-1 text-sm font-medium ${pendingRecordsCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              <TrendingDown className="w-4 h-4" />
              <span>{pendingRecordsCount > 0 ? `Faltan ${pendingRecordsCount} registros obligatorios` : 'Todos los registros al día'}</span>
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-white rounded-2xl border border-amber-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
            <ShieldAlert className="w-24 h-24 text-amber-500" />
          </div>
          <div className="relative z-10">
            <h3 className="text-sm text-gray-500 font-semibold mb-2 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Comité SST
            </h3>
            <p className="text-4xl font-black text-gray-900 mb-2">{daysUntilCommitteeExpiration} <span className="text-xl text-gray-500 font-medium">días</span></p>
            <div className="flex items-center gap-1 text-sm font-medium text-amber-600">
              <FileWarning className="w-4 h-4" />
              <span>Para renovación de actas</span>
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-white rounded-2xl border border-green-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
            <CheckCircle className="w-24 h-24 text-green-500" />
          </div>
          <div className="relative z-10">
            <h3 className="text-sm text-gray-500 font-semibold mb-2 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Estado EMOs
            </h3>
            <p className="text-4xl font-black text-gray-900 mb-2">{emoProgress}%</p>
            <div className="flex items-center gap-1 text-sm font-medium text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>{emoProgress === 100 ? 'Al día' : 'Requiere atención'}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Semáforo de Vencimientos</h3>
        
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-end mb-2">
              <span className="font-semibold text-gray-700">Reglamento Interno de SST (RISST)</span>
              <span className="text-sm font-bold text-red-600">{risstProgress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${risstProgress}%` }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Documento crítico pendiente de elaboración y aprobación.</p>
          </div>

          <div>
            <div className="flex justify-between items-end mb-2">
              <span className="font-semibold text-gray-700">Registro de Capacitaciones</span>
              <span className="text-sm font-bold text-green-600">{capacitacionesProgress}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${capacitacionesProgress}%` }}></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">4 capacitaciones obligatorias al año completadas.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
