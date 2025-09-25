'use client'

import { Language } from '../types'
import { AVAILABLE_LANGUAGES } from '../api/languages'

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
      className={`
        flex h-10 w-full rounded-md bg-zinc-950/50 backdrop-blur-md border border-white/20 
        px-3 py-2 text-sm text-white placeholder:text-zinc-500 
        focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50 
        disabled:cursor-not-allowed disabled:opacity-50
        ${className}
      `}
    >
      <option value="" disabled className="bg-zinc-900 text-zinc-400">
        {placeholder}
      </option>
      {AVAILABLE_LANGUAGES.map((language) => (
        <option 
          key={language.value} 
          value={language.value}
          className="bg-zinc-900 text-white"
        >
          {language.flag} {language.label}
        </option>
      ))}
    </select>
  )
}