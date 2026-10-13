import { NextRequest, NextResponse } from 'next/server'
import { 
  sendTelegramMessage, 
  processTelegramUpload 
} from '@/features/telegram/services/telegram-service'
import { getDossierSummary } from '@/features/sst/services/dossier-service'

export async function GET() {
  return NextResponse.json({
    status: 'online',
    service: 'SUNAFIL Compliance Telegram Bot Webhook',
    timestamp: new Date().toISOString()
  })
}

export async function POST(req: NextRequest) {
  try {
    const update = await req.json()
    const message = update.message || update.edited_message

    if (!message) {
      return NextResponse.json({ ok: true })
    }

    const chatId = message.chat.id
    const text = message.text?.trim()
    const caption = message.caption?.trim() || ''

    // Manejo de comandos de texto
    if (text) {
      if (text.startsWith('/start') || text.startsWith('/help') || text.startsWith('/ayuda')) {
        await sendTelegramMessage(
          chatId,
          `🤖 *Bot de Digitalización SGSST - SUNAFIL*\n\n` +
          `Este bot te permite cargar directamente las fotos o PDFs de los documentos físicos firmados.\n\n` +
          `📌 *¿Cómo subir documentos?*\n` +
          `1. Toma una foto clara o adjunta un PDF.\n` +
          `2. En el *pie de foto / mensaje*, indica el DNI y el tipo de documento:\n` +
          `   • \`42788318 risst\` _(Cargo de entrega de RISST)_\n` +
          `   • \`42788318 emo\` _(Certificado médico de aptitud)_\n` +
          `   • \`42788318 epp\` _(Cargo de entrega de EPP)_\n` +
          `   • \`42788318 curso\` _(Capacitación / Inducción)_\n\n` +
          `🏢 *Para documentos de la empresa:*\n` +
          `   • \`empresa risst\`, \`empresa iperc\`, \`empresa politica\`\n\n` +
          `📊 *Comandos de consulta:*\n` +
          `• \`/estado\` - Ver avance del expediente SUNAFIL\n` +
          `• \`/buscar [DNI]\` - Consultar qué documentos le faltan a un trabajador`
        )
        return NextResponse.json({ ok: true })
      }

      if (text.startsWith('/estado')) {
        const summary = await getDossierSummary()
        await sendTelegramMessage(
          chatId,
          `📊 *Estado Actual del Expediente SUNAFIL*\n\n` +
          `🎯 *Preparación Global:* ${summary.overallReadiness}%\n` +
          `📁 *Archivos Digitalizados:* ${summary.totalDigitalizedDocuments} / ${summary.totalRequiredDocuments}\n` +
          `⏳ *Documentos Físicos Pendientes:* ${summary.totalPendingPhysicalDocuments}\n\n` +
          `👥 *Legajos Completos:* ${summary.workerLegajosCount.completeLegajos} de ${summary.workerLegajosCount.totalWorkers} trabajadores.`
        )
        return NextResponse.json({ ok: true })
      }
    }

    // Manejo de Fotos (Escaneos desde la cámara del celular)
    if (message.photo && message.photo.length > 0) {
      // Telegram envía un array con distintas resoluciones; la última es la más nítida
      const bestPhoto = message.photo[message.photo.length - 1]
      await processTelegramUpload(chatId, bestPhoto.file_id, caption)
      return NextResponse.json({ ok: true })
    }

    // Manejo de Documentos (PDFs o archivos adjuntos sin compresión)
    if (message.document) {
      await processTelegramUpload(
        chatId, 
        message.document.file_id, 
        caption, 
        message.document.file_name
      )
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Error procesando webhook de Telegram:', error)
    // Siempre responder 200 a Telegram para evitar reintentos continuos en caso de excepción
    return NextResponse.json({ ok: true, error: error.message })
  }
}
