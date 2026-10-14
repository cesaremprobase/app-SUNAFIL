import { NextResponse } from 'next/server'
import { seedOfficialWorkers } from '@/features/workers/actions/worker-actions'

export async function GET() {
  try {
    const result = await seedOfficialWorkers()
    if (result.success) {
      return NextResponse.json({
        ok: true,
        message: `Se registraron exitosamente ${result.count} trabajadores en el sistema.`,
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({
        ok: false,
        error: result.error
      }, { status: 500 })
    }
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: err.message
    }, { status: 500 })
  }
}
