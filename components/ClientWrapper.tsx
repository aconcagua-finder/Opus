'use client'

import { useEffect } from 'react'

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Убираем ошибки гидратации от расширений браузера
    const originalError = console.error
    console.error = (...args) => {
      if (
        args[0]?.includes?.('hydration') || 
        args[0]?.includes?.('bis_skin_checked') ||
        args[0]?.includes?.('Hydration failed')
      ) {
        return
      }
      originalError.apply(console, args)
    }
    
    return () => {
      console.error = originalError
    }
  }, [])

  return <>{children}</>
}