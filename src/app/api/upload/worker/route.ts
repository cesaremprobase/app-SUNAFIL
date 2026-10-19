import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ingestDocument } from '@/features/sst/services/dossier-service'

// Allow up to 50 MB for high-res photos and scanned PDFs
export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()

    const workerId = formData.get('workerId') as string
    const documentType = formData.get('documentType') as string
    const documentDate = formData.get('documentDate') as string | null
    const year = formData.get('year') ? String(formData.get('year')) : (documentDate ? documentDate.slice(0, 4) : '2026')
    const file = formData.get('file') as File

    if (!workerId || !file || !documentType) {
      return NextResponse.json(
        { ok: false, error: 'Faltan campos obligatorios (workerId, documentType, file).' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const fileExt = file.name.split('.').pop() || 'jpg'
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const storagePath = `legajos/${year}/${workerId}/${documentType}_${Date.now()}.${fileExt}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from('sst-documents')
      .upload(storagePath, buffer, {
        contentType: file.type || (fileExt === 'pdf' ? 'application/pdf' : 'image/jpeg'),
        upsert: true,
      })

    if (uploadError) {
      console.error('Error subiendo a Supabase Storage:', uploadError)
      return NextResponse.json(
        { ok: false, error: `Error en storage: ${uploadError.message}` },
        { status: 500 }
      )
    }

    await ingestDocument({
      source: 'web',
      targetType: 'worker',
      codeOrWorkerId: workerId,
      documentType,
      filePath: storagePath,
      fileName: sanitizedName,
      fileSize: file.size,
      documentDate: documentDate || undefined,
    })

    return NextResponse.json({ ok: true, filePath: storagePath })
  } catch (err: any) {
    console.error('Error en /api/upload/worker:', err)
    return NextResponse.json(
      { ok: false, error: err.message || 'Error interno del servidor.' },
      { status: 500 }
    )
  }
}
