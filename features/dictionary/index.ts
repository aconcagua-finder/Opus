// Types
export type {
  DictionaryEntry,
  CreateDictionaryEntryData,
  UpdateDictionaryEntryData,
  DictionaryFilters,
  DictionaryStats,
  DictionaryDisplayPreferences
} from './types'

export { 
  Language, 
  LANGUAGE_NAMES, 
  LANGUAGE_FLAGS,
  DictionaryViewMode,
  DictionaryListContentMode
} from './types'

// API
export { AVAILABLE_LANGUAGES, getLanguageLabel, getLanguageFlag, getLanguageOption } from './api/languages'

// Validation
export {
  createDictionaryEntrySchema,
  updateDictionaryEntrySchema,
  dictionaryFiltersSchema
} from './utils/validation'

export type {
  CreateDictionaryEntryInput,
  UpdateDictionaryEntryInput,
  DictionaryFiltersInput
} from './utils/validation'

// Hooks
export { 
  useDictionary, 
  useDictionaryPagination, 
  useDictionaryFilters, 
  useDictionaryEntry,
  useDictionaryPreferences
} from './hooks/use-dictionary'

// Components
export { DictionaryList } from './components/dictionary-list'
export { AddWordForm } from './components/add-word-form'
export { WordCard } from './components/word-card'
export { LanguageSelector } from './components/language-selector'
export { AiImportPanel } from './components/ai-import-panel'
