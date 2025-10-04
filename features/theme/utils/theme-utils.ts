import type { ThemeMode } from '../types/theme'

export type ThemeValue = 'light' | 'dark'

const STORAGE_KEY = 'opus-theme'

export function readStoredMode(): ThemeMode | null {
  if (typeof window === 'undefined') {
    return null
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored
  }

  return null
}

export function writeStoredMode(mode: ThemeMode) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, mode)
}

export function getSystemTheme(): ThemeValue {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'dark'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const STORAGE_THEME_KEY = STORAGE_KEY
