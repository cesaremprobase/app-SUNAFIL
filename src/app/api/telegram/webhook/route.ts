import { NextRequest, NextResponse } from 'next/server'
import { 
  sendTelegramMessage, 
  answerTelegramCallback,
  processTelegramUpload,
  getMainReplyKeyboard,
  getMainInlineKeyboard,
  getPendingUpload,
  setPendingUpload,
  removePendingUpload,
  downloadTelegramFile,
  saveWorkerDocumentFile,
  extractGoogleDriveId,
  downloadGoogleDriveFile,
  getAppUrl
} from '@/features/telegram/services/telegram-service'
import { getDossierSummary, ingestDocument } from '@/features/sst/services/dossier-service'
import { createAdminClient } from '@/lib/supabase/admin'
import { seedOfficialWorkers } from '@/features/workers/actions/worker-actions'

export async function GET() {
  return NextResponse.json({
    status: 'online',
    service: 'SUNAFIL Compliance Telegram Bot & Mini App Webhook',
    timestamp: new Date().toISOString()
  })
}

export async function POST(req: NextRequest) {
  try {
    const update = await req.json()

    // 1. MANEJO DE BOTONES INTERACTIVOS (Callback Queries)
    if (update.callback_query) {
      const cb = update.callback_query
      const chatId = cb.message.chat.id
      const data = cb.data as string
      await answerTelegramCallback(cb.id)

      if (data === 'action:estado') {
        const summary = await getDossierSummary()
        await sendTelegramMessage(
          chatId,
          `📊 *Estado Actual del Expediente SUNAFIL*\n\n` +
          `🎯 *Preparación Global:* ${summary.overallReadiness}%\n` +
          `📁 *Archivos Digitalizados:* ${summary.totalDigitalizedDocuments} / ${summary.totalRequiredDocuments}\n` +
          `⏳ *Documentos Físicos Pendientes:* ${summary.totalPendingPhysicalDocuments}\n\n` +
          `👥 *Legajos Completos:* ${summary.workerLegajosCount.completeLegajos} de ${summary.workerLegajosCount.totalWorkers} trabajadores.`,
          getMainInlineKeyboard()
        )
        return NextResponse.json({ ok: true })
      }

      if (data === 'action:trabajadores') {
        const supabase = await createClient()
        let { data: workers } = await supabase
          .from('workers')
          .select('document_number, first_name, last_name, job_title')
          .order('last_name', { ascending: true })
          .limit(25)

        if (!workers || workers.length === 0) {
          await seedOfficialWorkers()
          const res = await supabase
            .from('workers')
            .select('document_number, first_name, last_name, job_title')
            .order('last_name', { ascending: true })
            .limit(25)
          workers = res.data || []
        }

        const list = (workers || []).map((w, i) => `${i + 1}. \`${w.document_number}\` - ${w.last_name}, ${w.first_name} _(${w.job_title})_`).join('\n')
        
        await sendTelegramMessage(
          chatId,
          `👥 *Nómina Oficial (33 Trabajadores SUNAFIL):*\n\n` +
          (list || 'No hay trabajadores cargados aún.') +
          `\n\n💡 *Para subir un documento:* Envía la foto o PDF agregando el DNI en el mensaje (ej: \`42788318 emo\`).`,
          getMainInlineKeyboard()
        )
        return NextResponse.json({ ok: true })
      }

      if (data === 'action:drive_help') {
        await sendTelegramMessage(
          chatId,
          `📁 *¿Cómo subir desde Google Drive con Máxima Calidad?*\n\n` +
          `Tienes 2 opciones muy rápidas:\n\n` +
          `1️⃣ *Compartir directo al Bot (Recomendado):*\n` +
          `   • En tu celular, abre la app *Google Drive*.\n` +
          `   • Toca los 3 puntos \`...\` del documento escaneado y dale a *Enviar una copia* o *Compartir*.\n` +
          `   • Elige *Telegram* y selecciona este bot.\n` +
          `   • En el pie de foto, pon el DNI y tipo (ej: \`42788318 emo\`). ¡Llega como PDF sin perder nada de calidad!\n\n` +
          `2️⃣ *Enviar enlace público de Drive:*\n` +
          `   • Si tienes un archivo en Google Drive, copia su enlace compartido y pégalo aquí en el chat indicando el DNI.`,
          getMainInlineKeyboard()
        )
        return NextResponse.json({ ok: true })
      }

      if (data === 'action:scan_help') {
        await sendTelegramMessage(
          chatId,
          `📸 *Guía para Escanear Documentos con Calidad SUNAFIL*\n\n` +
          `Para evitar que SUNAFIL observe firmas o sellos borrosos:\n\n` +
          `1. *Usa Google Drive / Lens:* En la app de Google Drive pulsa el botón flotante con ícono de cámara \`+\` (*Escanear*). Corrige la perspectiva y quita sombras automáticamente.\n` +
          `2. *Buena Iluminación:* Evita sombras directas de tu mano o celular sobre las firmas.\n` +
          `3. *Papel Plano:* Coloca la hoja sobre una superficie plana y oscura para que el escáner recorte los bordes solos.\n` +
          `4. *Guardar como PDF:* Siempre que puedas, comparte el escaneo como PDF para legibilidad profesional.`,
          getMainInlineKeyboard()
        )
        return NextResponse.json({ ok: true })
      }

      if (data.startsWith('set_doc:')) {
        const chosenType = data.replace('set_doc:', '')
        const pending = await getPendingUpload(chatId)
        if (!pending) {
          await sendTelegramMessage(
            chatId, 
            '⚠️ No hay ninguna foto o documento pendiente. Por favor, envía primero la foto o el PDF.'
          )
          return NextResponse.json({ ok: true })
        }

        pending.docType = chosenType
        await setPendingUpload(chatId, pending)

        if (chosenType === 'empresa') {
          await sendTelegramMessage(
            chatId,
            `🏢 Has seleccionado *Documento de Empresa*.\n\n` +
            `Por favor, escribe el código o nombre del requisito (ej: \`empresa iperc\`, \`empresa risst\`, \`empresa politica\`, o \`empresa plan\`):`
          )
        } else {
          const typeNames: Record<string, string> = {
            emos: 'Certificado de Aptitud Médica (EMO)',
            risst: 'Cargo firmado de Entrega de RISST',
            epps: 'Cargo de Entrega de EPP',
            capacitaciones: 'Constancia de Capacitación SST'
          }
          await sendTelegramMessage(
            chatId,
            `📄 Tipo seleccionado: *${typeNames[chosenType] || chosenType}*.\n\n` +
            `👉 *Ahora escribe el DNI del trabajador* (8 dígitos) para guardarlo en su legajo:`
          )
        }
        return NextResponse.json({ ok: true })
      }

      return NextResponse.json({ ok: true })
    }

    const message = update.message || update.edited_message
    if (!message) {
      return NextResponse.json({ ok: true })
    }

    const chatId = message.chat.id
    const text = message.text?.trim()
    const caption = message.caption?.trim() || ''

    // 2. MANEJO DE COMANDOS DE TEXTO
    if (text) {
      if (text.startsWith('/start') || text.startsWith('/help') || text.startsWith('/ayuda')) {
        await sendTelegramMessage(
          chatId,
          `📸 *Carga Rápida de Documentos Físicos SGSST*\n\n` +
          `Selecciona el área que deseas cargar. Se abrirá la **Mini App** directamente en esa sección para que tomes la foto con tu cámara o la subas desde Google Drive:`,
          getMainReplyKeyboard()
        )
        await sendTelegramMessage(
          chatId,
          `👇 *Toca el área exacta donde quieres subir el documento:*`,
          getMainInlineKeyboard()
        )
        return NextResponse.json({ ok: true })
      }

      if (text === '📊 Estado del Expediente' || text.startsWith('/estado')) {
        const summary = await getDossierSummary()
        await sendTelegramMessage(
          chatId,
          `📊 *Estado Actual del Expediente SUNAFIL*\n\n` +
          `🎯 *Preparación Global:* ${summary.overallReadiness}%\n` +
          `📁 *Archivos Digitalizados:* ${summary.totalDigitalizedDocuments} / ${summary.totalRequiredDocuments}\n` +
          `⏳ *Documentos Físicos Pendientes:* ${summary.totalPendingPhysicalDocuments}\n\n` +
          `👥 *Legajos Completos:* ${summary.workerLegajosCount.completeLegajos} de ${summary.workerLegajosCount.totalWorkers} trabajadores.`,
          getMainInlineKeyboard()
        )
        return NextResponse.json({ ok: true })
      }

      if (text === '👥 Nómina (33 Trabajadores)' || text.startsWith('/trabajadores') || text === '/nomina') {
        const supabase = await createClient()
        let { data: workers } = await supabase
          .from('workers')
          .select('document_number, first_name, last_name, job_title')
          .order('last_name', { ascending: true })
          .limit(25)

        if (!workers || workers.length === 0) {
          await seedOfficialWorkers()
          const res = await supabase
            .from('workers')
            .select('document_number, first_name, last_name, job_title')
            .order('last_name', { ascending: true })
            .limit(25)
          workers = res.data || []
        }

        const list = (workers || []).map((w, i) => `${i + 1}. \`${w.document_number}\` - ${w.last_name}, ${w.first_name}`).join('\n')
        
        await sendTelegramMessage(
          chatId,
          `👥 *Nómina Oficial (33 Trabajadores SUNAFIL):*\n\n` +
          (list || 'No hay trabajadores registrados en la base de datos.') +
          `\n\n📌 Para subir su documento, envía la foto con su DNI (ej: \`42788318 emo\`).`,
          getMainInlineKeyboard()
        )
        return NextResponse.json({ ok: true })
      }

      if (text === '📁 Subir desde Google Drive') {
        await sendTelegramMessage(
          chatId,
          `📁 *Integración con Google Drive*\n\n` +
          `Puedes compartir cualquier escaneo desde Google Drive:\n\n` +
          `• *Desde la app de Drive:* Abre el archivo escaneado > toca los 3 puntos > *Compartir* o *Enviar copia* > Selecciona este bot.\n` +
          `• *O pega el enlace de Drive aquí:* Si tienes un link de Google Drive, escríbelo con el DNI del trabajador (ej: \`https://drive.google.com/file/d/... 42788318 emo\`).`,
          getMainInlineKeyboard()
        )
        return NextResponse.json({ ok: true })
      }

      if (text === '📸 Guía de Escáner HD') {
        await sendTelegramMessage(
          chatId,
          `📸 *Recomendaciones para Escaneo de Alta Calidad*\n\n` +
          `1. Utiliza la función **Escanear** de Google Drive (ícono de cámara) o Google Lens.\n` +
          `2. Coloca el documento en un fondo contrastante (mesa oscura).\n` +
          `3. Verifica que la firma del trabajador y la fecha sean 100% legibles.\n` +
          `4. Envía el archivo como documento/PDF a este chat.`,
          getMainInlineKeyboard()
        )
        return NextResponse.json({ ok: true })
      }

      // Detección de enlace de Google Drive
      const driveId = extractGoogleDriveId(text)
      if (driveId) {
        await sendTelegramMessage(chatId, `⏳ Detectado enlace de Google Drive. Descargando archivo...`)
        const driveFile = await downloadGoogleDriveFile(driveId)
        if (!driveFile) {
          await sendTelegramMessage(
            chatId, 
            `❌ No se pudo descargar el archivo de Google Drive. Asegúrate de que el enlace tenga permiso de lectura: *"Cualquier persona con el enlace puede leer"*.\n\n` +
            `💡 *Tip más fácil:* En tu celular, abre el archivo en Google Drive y dale a *Compartir / Enviar copia* directo a Telegram.`
          )
          return NextResponse.json({ ok: true })
        }

        // Buscar si el texto contiene DNI
        const dniMatch = text.match(/\b\d{8}\b/)
        if (dniMatch) {
          const dni = dniMatch[0]
          const supabase = createAdminClient()
          const { data: worker } = await supabase
            .from('workers')
            .select('id, first_name, last_name, document_number')
            .eq('document_number', dni)
            .maybeSingle()

          if (worker) {
            let docType = 'risst'
            if (text.includes('emo') || text.includes('medico')) docType = 'emos'
            else if (text.includes('epp')) docType = 'epps'
            else if (text.includes('capa') || text.includes('curso')) docType = 'capacitaciones'

            await saveWorkerDocumentFile({
              chatId,
              worker,
              docType,
              buffer: driveFile.buffer,
              fileName: driveFile.fileName,
              source: 'drive'
            })
            return NextResponse.json({ ok: true })
          }
        }

        // Si no hay DNI en el texto, guardarlo como pendiente
        await setPendingUpload(chatId, {
          fileId: `drive_${driveId}`,
          fileName: driveFile.fileName,
          isPdf: true,
          timestamp: Date.now()
        })
        await sendTelegramMessage(
          chatId,
          `✅ Documento descargado desde Google Drive con éxito.\n\n¿A qué corresponde este archivo?`,
          getMainInlineKeyboard()
        )
        return NextResponse.json({ ok: true })
      }

      // Si el usuario responde (reply) directamente a una foto o documento anterior
      const replyFileId = 
        message.reply_to_message?.photo?.[message.reply_to_message.photo.length - 1]?.file_id ||
        message.reply_to_message?.document?.file_id
      const replyFileName = message.reply_to_message?.document?.file_name

      if (replyFileId) {
        await processTelegramUpload(chatId, replyFileId, text, replyFileName)
        return NextResponse.json({ ok: true })
      }

      // Si el texto es un DNI de 8 dígitos y hay una subida pendiente esperando DNI
      const dniMatch = text.match(/^\b\d{8}\b$/)
      const pending = await getPendingUpload(chatId)

      if (dniMatch && pending && pending.docType) {
        const dni = dniMatch[0]
        const supabase = createAdminClient()
        let { data: worker } = await supabase
          .from('workers')
          .select('id, first_name, last_name, document_number')
          .eq('document_number', dni)
          .maybeSingle()

        if (!worker) {
          await seedOfficialWorkers()
          const retry = await supabase
            .from('workers')
            .select('id, first_name, last_name, document_number')
            .eq('document_number', dni)
            .maybeSingle()
          worker = retry.data
        }

        if (!worker) {
          await sendTelegramMessage(
            chatId,
            `❌ *Trabajador no encontrado:* No existe ningún trabajador con el DNI \`${dni}\`.\n\n` +
            `Por favor verifica el número o consulta la lista con el botón *👥 Nómina (33 Trabajadores)*.`
          )
          return NextResponse.json({ ok: true })
        }

        await sendTelegramMessage(
          chatId, 
          `⏳ Asignando documento a *${worker.first_name} ${worker.last_name}*...`
        )

        const file = await downloadTelegramFile(pending.fileId)
        if (!file) {
          await sendTelegramMessage(chatId, `❌ Error descargando archivo desde Telegram.`)
          await removePendingUpload(chatId)
          return NextResponse.json({ ok: true })
        }

        const ext = pending.fileName?.split('.').pop() || file.fileName.split('.').pop() || 'jpg'
        const fileName = pending.fileName || `telegram_${pending.docType}_${worker.document_number}.${ext}`

        await saveWorkerDocumentFile({
          chatId,
          worker,
          docType: pending.docType,
          buffer: file.buffer,
          fileName,
          source: 'telegram'
        })

        await removePendingUpload(chatId)
        return NextResponse.json({ ok: true })
      }
    }

    // 3. MANEJO DE FOTOS (Cámara del celular / Escaneo)
    if (message.photo && message.photo.length > 0) {
      const bestPhoto = message.photo[message.photo.length - 1]
      await processTelegramUpload(chatId, bestPhoto.file_id, caption)
      return NextResponse.json({ ok: true })
    }

    // 4. MANEJO DE DOCUMENTOS (PDFs o archivos adjuntos sin compresión)
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
    return NextResponse.json({ ok: true, error: error.message })
  }
}
