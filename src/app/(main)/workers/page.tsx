import { getWorkers } from '@/features/workers/actions/worker-actions'
import { WorkersTable } from '@/features/workers/components/WorkersTable'
import { WorkerForm } from '@/features/workers/components/WorkerForm'
import { AddWorkerModal } from '@/features/workers/components/AddWorkerModal'
import { ImportExcelButton } from '@/features/workers/components/ImportExcelButton'
import { SeedWorkersButton } from '@/features/workers/components/SeedWorkersButton'
import { Button } from '@/components/ui/button'
import { PlusCircle, Download, AlertCircle } from 'lucide-react'

export default async function WorkersPage() {
  const workers = await getWorkers()

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Directorio de Trabajadores</h1>
            <p className="text-gray-500 mt-1 text-sm">Gestión de nómina centralizada para cumplimiento SUNAFIL ({workers.length} registrados)</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <SeedWorkersButton />
            <ImportExcelButton />
            <AddWorkerModal />
          </div>
        </div>

        {workers.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <p className="text-sm text-amber-800">
                La nómina está vacía. Puedes cargar los <strong>33 trabajadores oficiales</strong> con un solo clic en el botón verde.
              </p>
            </div>
            <SeedWorkersButton />
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <WorkersTable workers={workers} />
        </div>
      </div>
    </div>
  )
}
