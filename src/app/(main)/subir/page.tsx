import { 
  getCompanyDossier, 
  getWorkerLegajosDossier 
} from '@/features/sst/services/dossier-service'
import { MobileQuickUploader } from '@/features/sst/components/MobileQuickUploader'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

export default async function SubirPage({
  searchParams,
}: {
  searchParams?: Promise<{ tipo?: string }>
}) {
  const [companyRequirements, workerLegajos, resolvedParams] = await Promise.all([
    getCompanyDossier(),
    getWorkerLegajosDossier(),
    searchParams ? searchParams : Promise.resolve({ tipo: 'emo' })
  ])

  const initialTipo = resolvedParams?.tipo || 'emo'

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Suspense fallback={<div className="p-8 text-center text-xs text-gray-500">Cargando módulo de fotos...</div>}>
        <MobileQuickUploader 
          workerLegajos={workerLegajos || []}
          companyRequirements={companyRequirements || []}
          initialTipo={initialTipo}
        />
      </Suspense>
    </div>
  )
}
