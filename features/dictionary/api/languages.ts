import { Language, LANGUAGE_NAMES, LANGUAGE_FLAGS } from '../types'

export interface LanguageOption {
  value: Language
  label: string
  flag: string
}

export const AVAILABLE_LANGUAGES: LanguageOption[] = [
  {
    value: Language.SPANISH,
    label: LANGUAGE_NAMES[Language.SPANISH],
    flag: LANGUAGE_FLAGS[Language.SPANISH]
  },
  {
    value: Language.ENGLISH,
    label: LANGUAGE_NAMES[Language.ENGLISH],
    flag: LANGUAGE_FLAGS[Language.ENGLISH]
  },
  {
    value: Language.RUSSIAN,
    label: LANGUAGE_NAMES[Language.RUSSIAN],
    flag: LANGUAGE_FLAGS[Language.RUSSIAN]
  }
]

export const getLanguageLabel = (language: Language): string => {
  return LANGUAGE_NAMES[language] || language
}

export const getLanguageFlag = (language: Language): string => {
  return LANGUAGE_FLAGS[language] || '🌐'
}

export const getLanguageOption = (language: Language): LanguageOption => {
  return AVAILABLE_LANGUAGES.find(option => option.value === language) || {
    value: language,
    label: getLanguageLabel(language),
    flag: getLanguageFlag(language)
  }
}