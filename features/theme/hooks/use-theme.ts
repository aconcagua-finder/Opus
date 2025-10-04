'use client'

import { useThemeContext } from '../providers/theme-provider'
import type { ThemeMode } from '../types/theme'

export function useTheme() {
  const { mode, theme, setMode, isSystem, isReady } = useThemeContext()

  const toggleMode = (nextMode: ThemeMode) => {
    setMode(nextMode)
  }

  return {
    mode,
    theme,
    isSystem,
    isReady,
    setMode: toggleMode,
  }
}
