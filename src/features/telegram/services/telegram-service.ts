import { createClient } from '@/lib/supabase/server'
import { ingestDocument } from '@/features/sst/services/dossier-service'

const TELEGRAM_API_URL = 'https://api.telegram.org'

export async function sendTelegramMessage(chatId: number | string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    console.warn('TELEGRAM_BOT_TOKEN no configurado')
    return
  }

  try {
    await fetch(`${TELEGRAM_API_URL}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown'
      })
    })
  } catch (error) {
    console.error('Error enviando mensaje a Telegram:', error)
  }
}

export async function downloadTelegramFile(fileId: string): Promise<{ buffer: Buffer; fileName: string } | null> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return null

  try {
    // 1. Obtener file_path
    const res = await fetch(`${TELEGRAM_API_URL}/bot${token}/getFile?file_id=${fileId}`)
    const data = await res.json()
    if (!data.ok || !data.result.file_path) {
      console.error('Error obteniendo file_path de Telegram:', data)
      return null
    }

    const filePath = data.result.file_path
    const fileUrl = `${TELEGRAM_API_URL}/file/bot${token}/${filePath}`

    // 2. Descargar contenido binario
    const fileRes = await fetch(fileUrl)
    const arrayBuffer = await fileRes.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const rawFileName = filePath.split('/').pop() || `telegram_${Date.now()}`
    return { buffer, fileName: rawFileName }
  } catch (err) {
    console.error('Error descargando archivo de Telegram:', err)
    return null
  }
}

export interface ParseCaptionResult {
  target: 'worker' | 'company' | 'unknown'
  identifier: string // DNI o Código (ej. 'SST-POL-01')
  docType: string // 'risst', 'emo', 'epp', 'capacitaciones'
}

export function parseCaptionOrText(input: string): ParseCaptionResult {
  const clean = input.trim().toLowerCase()
  const parts = clean.split(/\s+/)

  // 1. Detección de documentos de empresa
  if (clean.includes('empresa') || clean.includes('politica') || clean.includes('iperc') || clean.includes('mapa')) {
    let code = 'SST-POL-01'
    let docType = 'politica'

    if (clean.includes('risst') || clean.includes('reglamento')) {
      code = 'SST-RIS-01'
      docType = 'risst'
    } else if (clean.includes('iperc')) {
      code = 'SST-IPE-01'
      docType = 'iperc'
    } else if (clean.includes('mapa')) {
      code = 'SST-MAP-01'
      docType = 'mapa'
    } else if (clean.includes('comite') || clean.includes('acta')) {
      code = 'SST-COM-01'
      docType = 'comite'
    } else if (clean.includes('plan')) {
      code = 'SST-PLA-01'
      docType = 'plan'
    }

    return { target: 'company', identifier: code, docType }
  }

  // 2. Detección por DNI (8 dígitos)
  const dniMatch = clean.match(/\b\d{8}\b/)
  if (dniMatch) {
    const dni = dniMatch[0]
    let docType = 'risst' // default

    if (clean.includes('emo') || clean.includes('medico') || clean.includes('salud')) {
      docType = 'emos'
    } else if (clean.includes('epp') || clean.includes('equipo') || clean.includes('casco') || clean.includes('bota')) {
      docType = 'epps'
    } else if (clean.includes('capa') || clean.includes('induc') || clean.includes('curso')) {
      docType = 'capacitaciones'
    } else if (clean.includes('risst') || clean.includes('reglamento')) {
      docType = 'risst'
    }

    return { target: 'worker', identifier: dni, docType }
  }

  return { target: 'unknown', identifier: '', docType: '' }
}

export async function processTelegramUpload(
  chatId: number | string,
  fileId: string,
  caption: string = '',
  originalFileName?: string
) {
  const parsed = parseCaptionOrText(caption)

  if (parsed.target === 'unknown') {
    await sendTelegramMessage(
      chatId,
      `⚠️ *No se pudo identificar a qué corresponde el documento.*\n\n` +
      `Por favor, envía la foto o PDF agregando un texto (pie de foto) con el formato:\n` +
      `• *DNI + Tipo:* \`42788318 risst\` o \`42788318 emo\` o \`42788318 epp\`\n` +
      `• *Empresa:* \`empresa risst\` o \`empresa iperc\` o \`empresa politica\``
    )
    return
  }

  const supabase = await createClient()

  // Si es trabajador, buscarlo por DNI
  if (parsed.target === 'worker') {
    const { data: worker } = await supabase
      .from('workers')
      .select('id, first_name, last_name, document_number')
      .eq('document_number', parsed.identifier)
      .maybeSingle()

    if (!worker) {
      await sendTelegramMessage(
        chatId,
        `❌ *Trabajador no encontrado:* No existe ningún trabajador activo con el DNI \`${parsed.identifier}\` en la base de datos.`
      )
      return
    }

    await sendTelegramMessage(
      chatId,
      `⏳ Descargando y guardando documento para *${worker.first_name} ${worker.last_name}*...`
    )

    const file = await downloadTelegramFile(fileId)
    if (!file) {
      await sendTelegramMessage(chatId, `❌ Error descargando archivo desde los servidores de Telegram.`)
      return
    }

    const ext = originalFileName?.split('.').pop() || file.fileName.split('.').pop() || 'jpg'
    const storagePath = `legajos/${worker.id}/${parsed.docType}_tg_${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('sst-documents')
      .upload(storagePath, file.buffer, {
        contentType: ext === 'pdf' ? 'application/pdf' : 'image/jpeg',
        upsert: true
      })

    if (uploadError) {
      await sendTelegramMessage(chatId, `❌ Error guardando en almacenamiento: ${uploadError.message}`)
      return
    }

    // Ingestar en la base de datos
    await ingestDocument({
      source: 'telegram',
      targetType: 'worker',
      codeOrWorkerId: worker.id,
      documentType: parsed.docType,
      filePath: storagePath,
      fileName: originalFileName || `telegram_${parsed.docType}_${worker.document_number}.${ext}`,
      fileSize: file.buffer.length
    })

    const docNames: Record<string, string> = {
      risst: 'Cargo firmado de RISST',
      emos: 'Certificado de Aptitud Médica (EMO)',
      epps: 'Cargo de Entrega de EPP',
      capacitaciones: 'Constancia de Capacitación'
    }

    await sendTelegramMessage(
      chatId,
      `✅ *¡Documento Digitalizado con Éxito!*\n\n` +
      `👤 *Trabajador:* ${worker.first_name} ${worker.last_name}\n` +
      `🆔 *DNI:* ${worker.document_number}\n` +
      `📄 *Tipo:* ${docNames[parsed.docType] || parsed.docType.toUpperCase()}\n` +
      `🛡️ *Expediente SUNAFIL actualizado.*`
    )
  } else {
    // Documento de empresa
    await sendTelegramMessage(
      chatId,
      `⏳ Guardando documento institucional de empresa (*${parsed.identifier}*)...`
    )

    const file = await downloadTelegramFile(fileId)
    if (!file) {
      await sendTelegramMessage(chatId, `❌ Error descargando archivo desde Telegram.`)
      return
    }

    const ext = originalFileName?.split('.').pop() || 'pdf'
    const storagePath = `empresa/${parsed.identifier}/tg_${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('sst-documents')
      .upload(storagePath, file.buffer, {
        contentType: ext === 'pdf' ? 'application/pdf' : 'image/jpeg',
        upsert: true
      })

    if (uploadError) {
      await sendTelegramMessage(chatId, `❌ Error guardando en Supabase Storage: ${uploadError.message}`)
      return
    }

    await ingestDocument({
      source: 'telegram',
      targetType: 'company',
      codeOrWorkerId: parsed.identifier,
      filePath: storagePath,
      fileName: originalFileName || `doc_empresa_${parsed.identifier}.${ext}`,
      fileSize: file.buffer.length
    })

    await sendTelegramMessage(
      chatId,
      `✅ *¡Documento Institucional Guardado con Éxito!*\n\n` +
      `🏢 *Requisito:* ${parsed.identifier}\n` +
      `🛡️ *Expediente SUNAFIL actualizado.*`
    )
  }
}
