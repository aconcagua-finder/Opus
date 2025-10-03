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
  listId?: string // Фильтрация по списку
}

export interface DictionaryStats {
  totalEntries: number
  entriesByLanguage: Record<Language, number>
  recentlyAdded: number
  needsReview: number
}

export enum DictionaryViewMode {
  CARDS = 'CARDS',
  LIST = 'LIST'
}

export enum DictionaryListContentMode {
  FULL = 'FULL',
  SOURCE_ONLY = 'SOURCE_ONLY',
  TRANSLATION_ONLY = 'TRANSLATION_ONLY'
}

export interface DictionaryDisplayPreferences {
  viewMode: DictionaryViewMode
  listContentMode: DictionaryListContentMode
  showNotes: boolean
  filtersPanelCollapsed: boolean
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

// Word Lists Types
export enum WordListType {
  CUSTOM = 'CUSTOM',
  AUTO_7_DAYS = 'AUTO_7_DAYS',
  AUTO_14_DAYS = 'AUTO_14_DAYS',
  AUTO_28_DAYS = 'AUTO_28_DAYS'
}

export interface WordList {
  id: string
  userId: string
  name: string
  type: WordListType
  description?: string
  color?: string
  isArchived: boolean
  createdAt: Date
  updatedAt: Date
  wordCount?: number // Виртуальное поле - количество слов в списке
}

export interface WordListItem {
  id: string
  listId: string
  entryId: string
  addedAt: Date
}

export interface CreateWordListData {
  name: string
  description?: string
  color?: string
}

export interface UpdateWordListData {
  name?: string
  description?: string
  color?: string
  isArchived?: boolean
}

export const WORD_LIST_TYPE_NAMES: Record<WordListType, string> = {
  [WordListType.CUSTOM]: 'Пользовательский',
  [WordListType.AUTO_7_DAYS]: 'Последние 7 дней',
  [WordListType.AUTO_14_DAYS]: 'Последние 14 дней',
  [WordListType.AUTO_28_DAYS]: 'Последние 28 дней'
}

export const WORD_LIST_TYPE_ICONS: Record<WordListType, string> = {
  [WordListType.CUSTOM]: '📋',
  [WordListType.AUTO_7_DAYS]: '🔥',
  [WordListType.AUTO_14_DAYS]: '⭐',
  [WordListType.AUTO_28_DAYS]: '📅'
}
