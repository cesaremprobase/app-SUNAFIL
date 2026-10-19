import { 
  getDossierSummary, 
  getCompanyDossier, 
  getWorkerLegajosDossier 
} from '@/features/sst/services/dossier-service'
import { DossierTabsContainer } from '@/features/sst/components/dossier/DossierTabsContainer'

export const dynamic = 'force-dynamic'

export default async function ExpedientePage({
  searchParams,
}: {
  searchParams?: Promise<{ year?: string }>
}) {
  const params = await (searchParams || Promise.resolve({}))
  const selectedYear = params.year ? parseInt(params.year, 10) : 2026

  const [summary, companyRequirements, workerLegajos] = await Promise.all([
    getDossierSummary(selectedYear),
    getCompanyDossier(selectedYear),
    getWorkerLegajosDossier(selectedYear)
  ])

  return (
    <div className="min-h-screen p-6 md:p-8 bg-gray-50/50">
      <div className="max-w-7xl mx-auto">
        <DossierTabsContainer
          summary={summary}
          companyRequirements={companyRequirements}
          workerLegajos={workerLegajos}
          selectedYear={selectedYear}
        />
      </div>
    </div>
  )
}
