'use client'

import { Language } from '../types'
import { AVAILABLE_LANGUAGES } from '../api/languages'
import { cn } from '@/lib/utils'

interface LanguageSelectorProps {
  value?: Language
  onChange: (language: Language) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function LanguageSelector({ 
  value, 
  onChange, 
  placeholder = "Выберите язык",
  disabled = false,
  className = "" 
}: LanguageSelectorProps) {
  return (
    <select
      value={value || ''}
      onChange={(e) => e.target.value && onChange(e.target.value as Language)}
      disabled={disabled}
      className={cn(
        'flex h-10 w-full rounded-lg border border-subtle bg-surface-muted px-3 py-2 text-sm text-primary transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background-primary)] disabled:cursor-not-allowed disabled:opacity-60 backdrop-blur-xl',
        className
      )}
    >
      <option value="" disabled className="bg-surface text-muted">
        {placeholder}
      </option>
      {AVAILABLE_LANGUAGES.map((language) => (
        <option 
          key={language.value} 
          value={language.value}
          className="bg-surface text-primary"
        >
          {language.flag} {language.label}
        </option>
      ))}
    </select>
  )
}
