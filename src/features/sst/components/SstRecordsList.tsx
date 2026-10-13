import type { SstRecord } from '../types'

export function SstRecordsList({ records = [] }: { records?: SstRecord[] }) {
  // If no records passed, show a fallback or empty state, but for now we'll just map what's passed
  const displayRecords: SstRecord[] = records.length > 0 ? records : [
    { id: '1', name: 'Accidentes e Incidentes', status: 'pending' },
    { id: '2', name: 'Exámenes Médicos Ocupacionales (EMOs)', status: 'valid' },
    { id: '3', name: 'Inspecciones Internas', status: 'valid' },
    { id: '4', name: 'Estadísticas SST', status: 'valid' },
    { id: '5', name: 'Equipos de Protección Personal (EPPs)', status: 'pending' },
    { id: '6', name: 'Inducciones y Capacitaciones', status: 'valid' },
    { id: '7', name: 'Auditorías', status: 'pending' },
    { id: '8', name: 'Monitoreos Ocupacionales', status: 'valid' }
  ]

  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm mt-6">
      <h2 className="text-xl font-bold mb-4">Registros Obligatorios (MTPE)</h2>
      <p className="text-sm text-gray-500 mb-6">Administra los 8 registros requeridos por SUNAFIL</p>
      
      <div className="divide-y">
        {displayRecords.map((record: SstRecord) => (
          <div key={record.id} className="py-3 flex items-center justify-between">
            <span className="font-medium text-gray-800">{record.name}</span>
            {record.status === 'valid' ? (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Al día</span>
            ) : (
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">Faltante</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
