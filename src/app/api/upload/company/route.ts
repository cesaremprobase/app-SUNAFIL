import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ingestDocument } from '@/features/sst/services/dossier-service'

// Allow up to 50 MB for high-res photos and scanned PDFs
export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()

    const requirementCode = formData.get('requirementCode') as string
    const file = formData.get('file') as File

    if (!requirementCode || !file) {
      return NextResponse.json(
        { ok: false, error: 'Faltan campos obligatorios (requirementCode, file).' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const fileExt = file.name.split('.').pop() || 'pdf'
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const storagePath = `empresa/${requirementCode}/${Date.now()}.${fileExt}`

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
      targetType: 'company',
      codeOrWorkerId: requirementCode,
      filePath: storagePath,
      fileName: sanitizedName,
      fileSize: file.size,
    })

    return NextResponse.json({ ok: true, filePath: storagePath })
  } catch (err: any) {
    console.error('Error en /api/upload/company:', err)
    return NextResponse.json(
      { ok: false, error: err.message || 'Error interno del servidor.' },
      { status: 500 }
    )
  }
}
