// Types
export type {
  DictionaryEntry,
  CreateDictionaryEntryData,
  UpdateDictionaryEntryData,
  DictionaryFilters,
  DictionaryStats
} from './types'

export { Language, LANGUAGE_NAMES, LANGUAGE_FLAGS } from './types'

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
  useDictionaryEntry 
} from './hooks/use-dictionary'

// Components
export { DictionaryList } from './components/dictionary-list'
export { AddWordForm } from './components/add-word-form'
export { WordCard } from './components/word-card'
export { LanguageSelector } from './components/language-selector'
export { AiImportPanel } from './components/ai-import-panel'
