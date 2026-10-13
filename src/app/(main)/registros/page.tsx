import { RegistrosManager } from '@/features/sst/components/RegistrosManager'
import { getSstRecords } from '@/features/sst/actions/record-actions'
import { getWorkers } from '@/features/workers/actions/worker-actions'

export default async function RegistrosPage() {
  const records = await getSstRecords()
  const workers = await getWorkers()

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <RegistrosManager initialRecords={records} workers={workers} />
      </div>
    </div>
  )
}
