import { getDossierSummary } from '@/features/sst/services/dossier-service'
import { MobileQuickUploader } from '@/features/sst/components/MobileQuickUploader'

export const dynamic = 'force-dynamic'

export default async function SubirPage() {
  const summary = await getDossierSummary()

  return (
    <div className="min-h-screen bg-gray-50/50">
      <MobileQuickUploader 
        workerLegajos={summary.workerLegajos}
        companyRequirements={summary.companyRequirements}
      />
    </div>
  )
}
