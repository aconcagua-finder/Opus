'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  DEFAULT_DICTIONARY_AI_CLIENT_CONFIGURATION,
  DictionaryAiModelParameters,
  DictionaryAiPromptTemplates,
} from '../prompts/ai-import'

const STORAGE_KEY = 'dictionary-ai-settings'
const MIN_COMPLETION_TOKENS = 16
const MAX_COMPLETION_TOKENS = 16000

const LEGACY_SYSTEM_PROMPT_TEMPLATE_EN = `You are an assistant that extracts foreign-language vocabulary pairs.
Always reply with a JSON array of objects that strictly match this TypeScript type:

type VocabularyItem = {
  word: string // unique vocabulary item in the source language
  translation: string // natural translation in the target language
  notes: string // short usage example (<= 120 chars)
}

Rules:
- Work only with the provided source language ({{sourceLanguage}}) and target language ({{targetLanguage}}).
- Extract up to {{maxItems}} of the most useful unique vocabulary items.
{{vocabularyFocus}}
- Ignore numbers, URLs, email addresses, gibberish, or duplicates.
- Preserve proper nouns (names, places) with correct casing.
{{notesRule}}
- If nothing suitable is found, return an empty array [] without additional text.
- DO NOT wrap the JSON answer in markdown code fences or add explanations.`

const LEGACY_SINGLE_WORDS_FOCUS_EN = `- Focus strictly on individual vocabulary words.
- Normalise each word to its base dictionary form when possible.
- Ignore multi-word expressions entirely.`

const LEGACY_INCLUDE_PHRASES_FOCUS_EN = `- Extract a balanced mix of individual words and meaningful multi-word expressions (maximum 5 tokens).
- Keep phrases intact and ensure their translations reflect the complete expression.
- Include only phrases that are useful to learn as set expressions or collocations.`

const LEGACY_NOTES_RULE_EN = `- Provide the "notes" field as a short usage example (<= 360 characters) set in natural language.
- Make the example immediately helpful for remembering the vocabulary item.
- Prefer sentences in the source language; optionally append a translation in the target language after " — " and ensure it fully covers the entire example without truncation.
- Any translation after " — " must be rendered entirely in the target language, must not repeat the source wording, and must convey the full meaning of the preceding example.`

const isLegacyTemplate = (value: string | undefined, legacy: string) => value === legacy

const createInitialState = () => {
  const base = DEFAULT_DICTIONARY_AI_CLIENT_CONFIGURATION

  return {
    modelConfig: {
      model: base.model,
      maxCompletionTokens: base.maxCompletionTokens,
      reasoningEffort: base.reasoningEffort,
    } as DictionaryAiModelParameters,
    promptTemplates: {
      systemTemplate: base.promptTemplates.systemTemplate,
      singleWordFocus: base.promptTemplates.singleWordFocus,
      includePhrasesFocus: base.promptTemplates.includePhrasesFocus,
      notesRule: base.promptTemplates.notesRule,
    } as DictionaryAiPromptTemplates,
    detectPhrasesDefault: false,
  }
}

const clampTokens = (value: number) => {
  if (!Number.isFinite(value)) {
    return DEFAULT_DICTIONARY_AI_CLIENT_CONFIGURATION.maxCompletionTokens
  }

  const rounded = Math.round(value)
  return Math.min(MAX_COMPLETION_TOKENS, Math.max(MIN_COMPLETION_TOKENS, rounded))
}

const normalizeModelConfig = (
  update: Partial<DictionaryAiModelParameters>
): Partial<DictionaryAiModelParameters> => {
  const next: Partial<DictionaryAiModelParameters> = {}

  if (typeof update.model === 'string') {
    next.model = update.model.trim()
  }

  if (typeof update.maxCompletionTokens === 'number') {
    next.maxCompletionTokens = clampTokens(update.maxCompletionTokens)
  }

  if (update.reasoningEffort) {
    next.reasoningEffort = update.reasoningEffort
  }

  return next
}

const normalizePromptTemplates = (
  update: Partial<DictionaryAiPromptTemplates>
): Partial<DictionaryAiPromptTemplates> => {
  const next: Partial<DictionaryAiPromptTemplates> = {}

  if (typeof update.systemTemplate === 'string') {
    next.systemTemplate = update.systemTemplate.trim()
  }

  if (typeof update.singleWordFocus === 'string') {
    next.singleWordFocus = update.singleWordFocus.trim()
  }

  if (typeof update.includePhrasesFocus === 'string') {
    next.includePhrasesFocus = update.includePhrasesFocus.trim()
  }

  if (typeof update.notesRule === 'string') {
    next.notesRule = update.notesRule.trim()
  }

  return next
}

interface DictionaryAiSettingsState {
  modelConfig: DictionaryAiModelParameters
  promptTemplates: DictionaryAiPromptTemplates
  detectPhrasesDefault: boolean
  updateModelConfig: (update: Partial<DictionaryAiModelParameters>) => void
  updatePromptTemplates: (update: Partial<DictionaryAiPromptTemplates>) => void
  setDetectPhrasesDefault: (value: boolean) => void
  reset: () => void
}

export const useDictionaryAiSettingsStore = create<DictionaryAiSettingsState>()(
  persist(
    (set) => ({
      ...createInitialState(),
      updateModelConfig: (update) =>
        set((state) => ({
          modelConfig: {
            ...state.modelConfig,
            ...normalizeModelConfig(update),
          },
        })),
      updatePromptTemplates: (update) =>
        set((state) => ({
          promptTemplates: {
            ...state.promptTemplates,
            ...normalizePromptTemplates(update),
          },
        })),
      setDetectPhrasesDefault: (value) =>
        set({ detectPhrasesDefault: Boolean(value) }),
      reset: () => set(createInitialState()),
    }),
    {
      name: STORAGE_KEY,
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (state, version) => {
        if (!state) {
          return state
        }

        if (version < 2 && 'promptTemplates' in state && state.promptTemplates) {
          const base = DEFAULT_DICTIONARY_AI_CLIENT_CONFIGURATION.promptTemplates
          const nextTemplates: DictionaryAiPromptTemplates = {
            systemTemplate: isLegacyTemplate(state.promptTemplates.systemTemplate, LEGACY_SYSTEM_PROMPT_TEMPLATE_EN)
              ? base.systemTemplate
              : state.promptTemplates.systemTemplate ?? base.systemTemplate,
            singleWordFocus: isLegacyTemplate(state.promptTemplates.singleWordFocus, LEGACY_SINGLE_WORDS_FOCUS_EN)
              ? base.singleWordFocus
              : state.promptTemplates.singleWordFocus ?? base.singleWordFocus,
            includePhrasesFocus: isLegacyTemplate(state.promptTemplates.includePhrasesFocus, LEGACY_INCLUDE_PHRASES_FOCUS_EN)
              ? base.includePhrasesFocus
              : state.promptTemplates.includePhrasesFocus ?? base.includePhrasesFocus,
            notesRule: isLegacyTemplate(state.promptTemplates.notesRule, LEGACY_NOTES_RULE_EN)
              ? base.notesRule
              : state.promptTemplates.notesRule ?? base.notesRule,
          }

          return {
            ...state,
            promptTemplates: nextTemplates,
          }
        }

        return state
      },
    }
  )
)
