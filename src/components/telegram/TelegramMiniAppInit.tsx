'use client'

import { useEffect } from 'react'
import Script from 'next/script'

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void
        expand: () => void
        close: () => void
        isExpanded: boolean
        viewportHeight: number
        viewportStableHeight: number
        headerColor: string
        backgroundColor: string
        setHeaderColor: (color: string) => void
        setBackgroundColor: (color: string) => void
        MainButton: {
          text: string
          show: () => void
          hide: () => void
          onClick: (fn: () => void) => void
        }
      }
    }
  }
}

export function TelegramMiniAppInit() {
  const handleScriptLoad = () => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      try {
        const tg = window.Telegram.WebApp
        tg.ready()
        tg.expand()
        // Ajustar color de cabecera a azul corporativo o blanco
        tg.setHeaderColor('#ffffff')
        tg.setBackgroundColor('#f9fafb')
      } catch (err) {
        console.warn('Telegram WebApp init warning:', err)
      }
    }
  }

  useEffect(() => {
    handleScriptLoad()
  }, [])

  return (
    <Script
      src="https://telegram.org/js/telegram-web-app.js"
      strategy="afterInteractive"
      onLoad={handleScriptLoad}
    />
  )
}
