'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useTheme } from '../hooks/use-theme'
import type { ThemeMode } from '../types/theme'

interface ThemeOption {
  value: ThemeMode
  label: string
  icon: ReactNode
}

function SunIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <path d="M12 4V2M12 22v-2M4.93 4.93 3.51 3.51M20.49 20.49l-1.42-1.42M4 12H2m20 0h-2M4.93 19.07 3.51 20.49M20.49 3.51 19.07 4.93" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="4.5" />
    </svg>
  )
}

function LaptopIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <rect x="3" y="4" width="18" height="12" rx="2" ry="2" />
      <path d="M2 18h20" strokeLinecap="round" />
      <path d="M6 22h12" strokeLinecap="round" />
    </svg>
  )
}

function MoonIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} {...props}>
      <path
        d="M21 12.79A9 9 0 1 1 11.21 3 7.5 7.5 0 0 0 21 12.79z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const OPTIONS: ThemeOption[] = [
  {
    value: 'light',
    label: 'Светлая тема',
    icon: <SunIcon className="h-4 w-4" />,
  },
  {
    value: 'system',
    label: 'Авто (система)',
    icon: <LaptopIcon className="h-4 w-4" />,
  },
  {
    value: 'dark',
    label: 'Тёмная тема',
    icon: <MoonIcon className="h-4 w-4" />,
  },
]

export function ThemeToggle({ className }: { className?: string }) {
  const { mode, theme, setMode, isReady } = useTheme()
  const activeTheme = mode === 'system' ? theme : mode

  return (
    <div className={cn('flex items-center', className)}>
      <div className="flex items-center gap-1 rounded-full border-subtle bg-surface-elevated px-1 py-1 shadow-sm">
        {OPTIONS.map((option) => {
          const isActive = option.value === mode || (option.value === activeTheme && mode === 'system')

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setMode(option.value)}
              aria-label={option.label}
              aria-pressed={isActive}
              disabled={!isReady}
              className={cn(
                'relative flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]',
                isActive && 'bg-accent-soft text-accent shadow-accent'
              )}
              title={option.label}
            >
              <span className="sr-only">{option.label}</span>
              {option.icon}
            </button>
          )
        })}
      </div>
    </div>
  )
}
