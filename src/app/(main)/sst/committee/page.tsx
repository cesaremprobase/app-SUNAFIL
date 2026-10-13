import { getWorkers } from '@/features/workers/actions/worker-actions'
import { getCommitteeMembers } from '@/features/sst/actions/committee-actions'
import { CommitteeManager } from '@/features/sst/components/CommitteeManager'

export default async function CommitteePage() {
  const [workers, committeeMembers] = await Promise.all([
    getWorkers(),
    getCommitteeMembers()
  ])

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Comité SST</h1>
            <p className="text-gray-500 mt-1">Gestión de miembros y mandatos (Requisito legal: 25-30 trabajadores)</p>
          </div>
        </div>

        <CommitteeManager 
          workers={workers || []} 
          committeeMembers={committeeMembers || []} 
        />
      </div>
    </div>
  )
}
