import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import { TelegramMiniAppInit } from '@/components/telegram/TelegramMiniAppInit'
import './globals.css'

export const metadata: Metadata = {
  title: 'SUNAFILPro — Gestión de Seguridad y Salud en el Trabajo',
  description: 'Sistema integral de compliance laboral y registros obligatorios.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>
        <TelegramMiniAppInit />
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
