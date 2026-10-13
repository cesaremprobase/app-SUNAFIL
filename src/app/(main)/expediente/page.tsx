import { 
  getDossierSummary, 
  getCompanyDossier, 
  getWorkerLegajosDossier 
} from '@/features/sst/services/dossier-service'
import { DossierTabsContainer } from '@/features/sst/components/dossier/DossierTabsContainer'

export default async function ExpedientePage() {
  const [summary, companyRequirements, workerLegajos] = await Promise.all([
    getDossierSummary(),
    getCompanyDossier(),
    getWorkerLegajosDossier()
  ])

  return (
    <div className="min-h-screen p-6 md:p-8 bg-gray-50/50">
      <div className="max-w-7xl mx-auto">
        <DossierTabsContainer
          summary={summary}
          companyRequirements={companyRequirements}
          workerLegajos={workerLegajos}
        />
      </div>
    </div>
  )
}
