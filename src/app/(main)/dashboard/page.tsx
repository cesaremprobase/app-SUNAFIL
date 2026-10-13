import { SunafilRiskDashboard } from "@/features/dashboard/components/SunafilRiskDashboard"
import { SstRecordsList } from "@/features/sst/components/SstRecordsList"
import { getSstRecords } from "@/features/sst/actions/record-actions"
import { getCommitteeMembers } from "@/features/sst/actions/committee-actions"

export default async function DashboardPage() {
  const [records, committeeMembers] = await Promise.all([
    getSstRecords(),
    getCommitteeMembers()
  ])

  // Calculate metrics
  const pendingRecordsCount = records.filter((r: any) => r.status === 'pending').length
  
  const getRecordProgress = (type: string) => {
    const record = records.find((r: any) => r.record_type === type)
    return record?.status === 'valid' ? 100 : 0
  }

  const emoProgress = getRecordProgress('emos')
  const risstProgress = getRecordProgress('risst')
  const capacitacionesProgress = getRecordProgress('capacitaciones')

  // Calculate committee days
  const activeMembers = committeeMembers.filter((m: any) => m.is_active && m.end_date)
  let daysUntilCommitteeExpiration: number | string = 'N/A'
  
  if (activeMembers.length > 0) {
    const dates = activeMembers.map((m: any) => new Date(m.end_date).getTime())
    const closestDate = Math.min(...dates)
    const diffTime = closestDate - new Date().getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    daysUntilCommitteeExpiration = diffDays > 0 ? diffDays : 0
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard General SUNAFIL</h1>
            <p className="text-sm text-gray-500 mt-1">Supervisión en tiempo real de cumplimiento SGSST</p>
          </div>
          <a
            href="/expediente"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all self-start sm:self-auto"
          >
            📁 Ver Expediente de Inspección
          </a>
        </div>
        <SunafilRiskDashboard 
          pendingRecordsCount={pendingRecordsCount}
          daysUntilCommitteeExpiration={daysUntilCommitteeExpiration}
          emoProgress={emoProgress}
          risstProgress={risstProgress}
          capacitacionesProgress={capacitacionesProgress}
        />
        <div className="mt-8">
          <SstRecordsList records={records} />
        </div>
      </div>
    </div>
  )
}
