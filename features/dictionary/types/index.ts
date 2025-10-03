export enum Language {
  SPANISH = 'SPANISH',
  ENGLISH = 'ENGLISH', 
  RUSSIAN = 'RUSSIAN'
}

export interface DictionaryEntry {
  id: string
  userId: string
  
  // Основное слово
  word: string
  sourceLanguage: Language
  
  // Перевод
  translation: string
  targetLanguage: Language
  
  // Дополнительные поля
  notes?: string
  difficulty?: number | null // legacy field, not used by current UI
  
  // Статистика изучения
  timesViewed: number
  timesCorrect: number
  lastReviewed?: Date
  
  // Временные метки
  createdAt: Date
  updatedAt: Date
}

export interface CreateDictionaryEntryData {
  word: string
  sourceLanguage: Language
  translation: string
  targetLanguage: Language
  notes?: string
}

export interface UpdateDictionaryEntryData {
  word?: string
  sourceLanguage?: Language
  translation?: string
  targetLanguage?: Language
  notes?: string
}

export interface DictionaryFilters {
  sourceLanguage?: Language
  targetLanguage?: Language
  search?: string
}

export interface DictionaryStats {
  totalEntries: number
  entriesByLanguage: Record<Language, number>
  recentlyAdded: number
  needsReview: number
}

export const LANGUAGE_NAMES: Record<Language, string> = {
  [Language.SPANISH]: 'Испанский',
  [Language.ENGLISH]: 'Английский',
  [Language.RUSSIAN]: 'Русский'
}

export const LANGUAGE_FLAGS: Record<Language, string> = {
  [Language.SPANISH]: '🇪🇸',
  [Language.ENGLISH]: '🇺🇸',
  [Language.RUSSIAN]: '🇷🇺'
}
