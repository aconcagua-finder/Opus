'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ThemeMode } from '../types/theme'
import { getSystemTheme, readStoredMode, writeStoredMode, type ThemeValue } from '../utils/theme-utils'

interface ThemeContextValue {
  mode: ThemeMode
  theme: ThemeValue
  isSystem: boolean
  isReady: boolean
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system')
  const [systemTheme, setSystemTheme] = useState<ThemeValue>('dark')
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const stored = readStoredMode()
    if (stored) {
      setModeState(stored)
    }

    const initialSystemTheme = getSystemTheme()
    setSystemTheme(initialSystemTheme)

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleMediaChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light')
    }

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleMediaChange)
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handleMediaChange)
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleMediaChange)
      } else if (typeof mediaQuery.removeListener === 'function') {
        mediaQuery.removeListener(handleMediaChange)
      }
    }
  }, [])

  const applyTheme = (currentMode: ThemeMode, currentSystemTheme: ThemeValue) => {
    if (typeof document === 'undefined') {
      return currentSystemTheme
    }

    const resolved = currentMode === 'system' ? currentSystemTheme : currentMode

    document.documentElement.dataset.theme = resolved
    document.documentElement.classList.remove('theme-dark', 'theme-light')
    document.documentElement.classList.add(resolved === 'dark' ? 'theme-dark' : 'theme-light')
    document.documentElement.style.colorScheme = resolved

    setIsReady(true)
    return resolved
  }

  useEffect(() => {
    const resolved = applyTheme(mode, systemTheme)
    writeStoredMode(mode)

    return () => {
      if (resolved && typeof document !== 'undefined') {
        document.documentElement.style.colorScheme = resolved
      }
    }
  }, [mode, systemTheme])

  const setMode = (nextMode: ThemeMode) => {
    setModeState(nextMode)
  }

  const value = useMemo<ThemeContextValue>(() => {
    const resolved = mode === 'system' ? systemTheme : mode

    return {
      mode,
      theme: resolved,
      isSystem: mode === 'system',
      isReady,
      setMode,
    }
  }, [isReady, mode, systemTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useThemeContext() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider')
  }

  return context
}
