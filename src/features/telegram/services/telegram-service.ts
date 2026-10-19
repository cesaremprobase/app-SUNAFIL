import { createAdminClient } from '@/lib/supabase/admin'
import { ingestDocument } from '@/features/sst/services/dossier-service'
import { seedOfficialWorkers } from '@/features/workers/actions/worker-actions'

const TELEGRAM_API_URL = 'https://api.telegram.org'

export interface PendingUpload {
  fileId: string
  fileName?: string
  isPdf: boolean
  docType?: string
  timestamp: number
}

// Estado temporal en memoria (con persistencia cruzada en Supabase para Serverless en Vercel)
export const pendingUploadsByChat = new Map<number | string, PendingUpload>()

export async function setPendingUpload(chatId: number | string, data: PendingUpload) {
  pendingUploadsByChat.set(chatId, data)
  try {
    const supabase = createAdminClient()
    await supabase.from('telegram_bot_sessions').upsert({
      chat_id: String(chatId),
      file_id: data.fileId,
      file_name: data.fileName || null,
      doc_type: data.docType || null,
      is_pdf: data.isPdf || false,
      updated_at: new Date().toISOString()
    })
  } catch (err) {
    // Si la tabla no existe aún, se preserva en memoria
    console.warn('Persistencia en BD no disponible temporalmente:', err)
  }
}

export async function getPendingUpload(chatId: number | string): Promise<PendingUpload | undefined> {
  const mem = pendingUploadsByChat.get(chatId)
  if (mem) return mem

  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('telegram_bot_sessions')
      .select('*')
      .eq('chat_id', String(chatId))
      .maybeSingle()

    if (data && data.file_id) {
      return {
        fileId: data.file_id,
        fileName: data.file_name || undefined,
        isPdf: data.is_pdf || false,
        docType: data.doc_type || undefined,
        timestamp: new Date(data.updated_at).getTime()
      }
    }
  } catch (err) {
    console.warn('Error leyendo sesión de telegram_bot_sessions:', err)
  }

  return undefined
}

export async function removePendingUpload(chatId: number | string) {
  pendingUploadsByChat.delete(chatId)
  try {
    const supabase = createAdminClient()
    await supabase
      .from('telegram_bot_sessions')
      .delete()
      .eq('chat_id', String(chatId))
  } catch (err) {
    // ignore
  }
}

export async function sendTelegramMessage(
  chatId: number | string, 
  text: string, 
  replyMarkup?: any
) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    console.warn('TELEGRAM_BOT_TOKEN no configurado')
    return
  }

  try {
    const payload: any = {
      chat_id: chatId,
      text,
      parse_mode: 'Markdown'
    }
    if (replyMarkup) {
      payload.reply_markup = replyMarkup
    }

    await fetch(`${TELEGRAM_API_URL}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  } catch (error) {
    console.error('Error enviando mensaje a Telegram:', error)
  }
}

export async function answerTelegramCallback(callbackQueryId: string, text?: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return

  try {
    await fetch(`${TELEGRAM_API_URL}/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: text || undefined
      })
    })
  } catch (error) {
    console.error('Error respondiendo callback de Telegram:', error)
  }
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'https://app-sunafil.vercel.app'
}

// Teclado persistente en el chat (ReplyKeyboardMarkup con accesos directos por área)
export function getMainReplyKeyboard() {
  const appUrl = getAppUrl()
  return {
    keyboard: [
      [
        { text: '📸 Cargar Fotos / Escanear (Todo)', web_app: { url: `${appUrl}/subir` } }
      ],
      [
        { text: '🩺 Subir EMOs', web_app: { url: `${appUrl}/subir?tipo=emo` } },
        { text: '📋 Subir RISST', web_app: { url: `${appUrl}/subir?tipo=risst` } }
      ],
      [
        { text: '🦺 Subir EPPs', web_app: { url: `${appUrl}/subir?tipo=epp` } },
        { text: '🏢 Subir Empresa', web_app: { url: `${appUrl}/subir?tipo=empresa` } }
      ],
      [
        { text: '📊 Estado del Expediente' },
        { text: '👥 Nómina (33 Trabajadores)' }
      ]
    ],
    resize_keyboard: true,
    is_persistent: true
  }
}

// Botones en línea para mensajes con enlaces directos a cada área específica
export function getMainInlineKeyboard() {
  const appUrl = getAppUrl()
  return {
    inline_keyboard: [
      [
        { text: '🩺 Cargar Exámenes Médicos (EMO)', web_app: { url: `${appUrl}/subir?tipo=emo` } }
      ],
      [
        { text: '📋 Cargar Cargos de RISST', web_app: { url: `${appUrl}/subir?tipo=risst` } }
      ],
      [
        { text: '🦺 Cargar Entrega de EPP', web_app: { url: `${appUrl}/subir?tipo=epp` } }
      ],
      [
        { text: '🎓 Cargar 4 Capacitaciones', web_app: { url: `${appUrl}/subir?tipo=capacitaciones` } }
      ],
      [
        { text: '🏢 Cargar Documentos de Empresa (IPERC/Plan)', web_app: { url: `${appUrl}/subir?tipo=empresa` } }
      ],
      [
        { text: '📁 Ver Expediente de Inspección Completo', web_app: { url: `${appUrl}/expediente` } }
      ],
      [
        { text: '📊 Estado Rápido', callback_data: 'action:estado' },
        { text: '👥 Nómina (33)', callback_data: 'action:trabajadores' }
      ]
    ]
  }
}

// Selector interactivo cuando el usuario sube un archivo sin texto
export function getDocumentTypeInlineKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '🩺 Certificado Médico (EMO)', callback_data: 'set_doc:emos' },
        { text: '📋 Cargo de RISST', callback_data: 'set_doc:risst' }
      ],
      [
        { text: '🦺 Entrega de EPP', callback_data: 'set_doc:epps' },
        { text: '🎓 Capacitación / Inducción', callback_data: 'set_doc:capacitaciones' }
      ],
      [
        { text: '🏢 Documento de Empresa (IPERC / Plan / Política)', callback_data: 'set_doc:empresa' }
      ]
    ]
  }
}

export async function downloadTelegramFile(fileId: string): Promise<{ buffer: Buffer; fileName: string } | null> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return null

  try {
    const res = await fetch(`${TELEGRAM_API_URL}/bot${token}/getFile?file_id=${fileId}`)
    const data = await res.json()
    if (!data.ok || !data.result.file_path) {
      console.error('Error obteniendo file_path de Telegram:', data)
      return null
    }

    const filePath = data.result.file_path
    const fileUrl = `${TELEGRAM_API_URL}/file/bot${token}/${filePath}`

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

export function extractGoogleDriveId(url: string): string | null {
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileMatch) return fileMatch[1]
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (idMatch) return idMatch[1]
  return null
}

export async function downloadGoogleDriveFile(driveId: string): Promise<{ buffer: Buffer; fileName: string } | null> {
  try {
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${driveId}`
    const res = await fetch(downloadUrl, { redirect: 'follow' })
    if (!res.ok) return null

    const arrayBuffer = await res.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const disposition = res.headers.get('content-disposition') || ''
    let fileName = `drive_document_${Date.now()}.pdf`
    const match = disposition.match(/filename="?([^";]+)"?/)
    if (match && match[1]) {
      fileName = match[1]
    }
    return { buffer, fileName }
  } catch (err) {
    console.error('Error descargando de Google Drive:', err)
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

  const dniMatch = clean.match(/\b\d{8}\b/)
  if (dniMatch) {
    const dni = dniMatch[0]
    let docType = 'risst'

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

export async function saveWorkerDocumentFile({
  chatId,
  worker,
  docType,
  buffer,
  fileName,
  source = 'telegram'
}: {
  chatId: number | string
  worker: { id: string; first_name: string; last_name: string; document_number: string }
  docType: string
  buffer: Buffer
  fileName: string
  source?: 'telegram' | 'drive'
}) {
  const supabase = createAdminClient()
  const ext = fileName.split('.').pop() || 'jpg'
  const storagePath = `legajos/${worker.id}/${docType}_${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('sst-documents')
    .upload(storagePath, buffer, {
      contentType: ext === 'pdf' ? 'application/pdf' : 'image/jpeg',
      upsert: true
    })

  if (uploadError) {
    await sendTelegramMessage(chatId, `❌ Error guardando en almacenamiento seguro: ${uploadError.message}`)
    return false
  }

  await ingestDocument({
    source,
    targetType: 'worker',
    codeOrWorkerId: worker.id,
    documentType: docType,
    filePath: storagePath,
    fileName,
    fileSize: buffer.length
  })

  const docNames: Record<string, string> = {
    risst: 'Cargo firmado de RISST',
    emos: 'Certificado de Aptitud Médica (EMO)',
    epps: 'Cargo de Entrega de EPP',
    capacitaciones: 'Constancia de Capacitación'
  }

  const appUrl = getAppUrl()

  await sendTelegramMessage(
    chatId,
    `✅ *¡Documento Digitalizado con Éxito!*\n\n` +
    `👤 *Trabajador:* ${worker.first_name} ${worker.last_name}\n` +
    `🆔 *DNI:* \`${worker.document_number}\`\n` +
    `📄 *Tipo:* ${docNames[docType] || docType.toUpperCase()}\n` +
    `📡 *Origen:* ${source === 'drive' ? 'Google Drive Escaneado' : 'Telegram Mobile'}\n\n` +
    `🛡️ *Expediente SUNAFIL actualizado.*`,
    {
      inline_keyboard: [
        [
          { text: '👁️ Ver Legajo en Mini App', web_app: { url: `${appUrl}/expediente` } }
        ]
      ]
    }
  )

  return true
}

export async function processTelegramUpload(
  chatId: number | string,
  fileId: string,
  caption: string = '',
  originalFileName?: string
) {
  const parsed = parseCaptionOrText(caption)

  // Si no se incluyó texto descriptivo, guardar temporalmente (en BD + RAM) y preguntar con botones interactivos
  if (parsed.target === 'unknown') {
    const isPdf = originalFileName?.toLowerCase().endsWith('.pdf') || false
    await setPendingUpload(chatId, {
      fileId,
      fileName: originalFileName,
      isPdf,
      timestamp: Date.now()
    })

    await sendTelegramMessage(
      chatId,
      `📄 *Archivo recibido correctamente.*\n\n` +
      `¿A qué requisito corresponde este documento? *Toca una opción:*`,
      getDocumentTypeInlineKeyboard()
    )
    return
  }

  const supabase = createAdminClient()

  if (parsed.target === 'worker') {
    let { data: worker } = await supabase
      .from('workers')
      .select('id, first_name, last_name, document_number')
      .eq('document_number', parsed.identifier)
      .maybeSingle()

    if (!worker) {
      await seedOfficialWorkers()
      const retry = await supabase
        .from('workers')
        .select('id, first_name, last_name, document_number')
        .eq('document_number', parsed.identifier)
        .maybeSingle()
      worker = retry.data
    }

    if (!worker) {
      await sendTelegramMessage(
        chatId,
        `❌ *Trabajador no encontrado:* No existe trabajador con DNI \`${parsed.identifier}\`.\n\n` +
        `Usa el botón *👥 Nómina (33 Trabajadores)* para ver la lista autorizada.`
      )
      return
    }

    await sendTelegramMessage(
      chatId,
      `⏳ Procesando y guardando documento de *${worker.first_name} ${worker.last_name}*...`
    )

    const file = await downloadTelegramFile(fileId)
    if (!file) {
      await sendTelegramMessage(chatId, `❌ Error al descargar el archivo desde Telegram.`)
      return
    }

    const ext = originalFileName?.split('.').pop() || file.fileName.split('.').pop() || 'jpg'
    const fileName = originalFileName || `telegram_${parsed.docType}_${worker.document_number}.${ext}`

    await saveWorkerDocumentFile({
      chatId,
      worker,
      docType: parsed.docType,
      buffer: file.buffer,
      fileName,
      source: 'telegram'
    })
  } else {
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

    const appUrl = getAppUrl()

    await sendTelegramMessage(
      chatId,
      `✅ *¡Documento Institucional Guardado con Éxito!*\n\n` +
      `🏢 *Requisito:* ${parsed.identifier}\n` +
      `🛡️ *Expediente SUNAFIL actualizado.*`,
      {
        inline_keyboard: [
          [
            { text: '🚀 Ver Expediente en Mini App', web_app: { url: `${appUrl}/expediente` } }
          ]
        ]
      }
    )
  }
}
