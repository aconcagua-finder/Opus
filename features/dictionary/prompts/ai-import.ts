import { Language } from '@prisma/client'

type PromptLanguage = Language | `${Language}`

export interface DictionaryAiSettings {
  detectPhrases: boolean
}

export interface DictionaryAiPromptParams extends DictionaryAiSettings {
  sourceLanguage: PromptLanguage
  targetLanguage: PromptLanguage
  text: string
}

export const DEFAULT_DICTIONARY_AI_SETTINGS: DictionaryAiSettings = {
  detectPhrases: false,
}

export const DICTIONARY_AI_IMPORT_MAX_ITEMS = 50

const SINGLE_WORDS_FOCUS = `- Focus strictly on individual vocabulary words.
- Normalise each word to its base dictionary form when possible.
- Ignore multi-word expressions entirely.`

const INCLUDE_PHRASES_FOCUS = `- Extract a balanced mix of individual words and meaningful multi-word expressions (maximum 5 tokens).
- Keep phrases intact and ensure their translations reflect the complete expression.
- Include only phrases that are useful to learn as set expressions or collocations.`

const NOTES_RULE = `- Provide the "notes" field as a short usage example (<= 360 characters) set in natural language.
- Make the example immediately helpful for remembering the vocabulary item.
- Prefer sentences in the source language; optionally append a translation in the target language after " — " and ensure it fully covers the entire example without truncation.
- Any translation after " — " must be rendered entirely in the target language, must not repeat the source wording, and must convey the full meaning of the preceding example.`

export const buildDictionaryAiSystemPrompt = ({
  sourceLanguage,
  targetLanguage,
  detectPhrases,
}: DictionaryAiSettings & {
  sourceLanguage: PromptLanguage
  targetLanguage: PromptLanguage
}): string => {
  const vocabularyFocus = detectPhrases ? INCLUDE_PHRASES_FOCUS : SINGLE_WORDS_FOCUS

  return `You are an assistant that extracts foreign-language vocabulary pairs.
Always reply with a JSON array of objects that strictly match this TypeScript type:

type VocabularyItem = {
  word: string // unique vocabulary item in the source language
  translation: string // natural translation in the target language
  notes: string // short usage example (<= 120 chars)
}

Rules:
- Work only with the provided source language (${sourceLanguage}) and target language (${targetLanguage}).
- Extract up to ${DICTIONARY_AI_IMPORT_MAX_ITEMS} of the most useful unique vocabulary items.
${vocabularyFocus}
- Ignore numbers, URLs, email addresses, gibberish, or duplicates.
- Preserve proper nouns (names, places) with correct casing.
${NOTES_RULE}
- If nothing suitable is found, return an empty array [] without additional text.
- DO NOT wrap the JSON answer in markdown code fences or add explanations.`
}

export const buildDictionaryAiUserPrompt = ({
  sourceLanguage,
  targetLanguage,
  text,
  detectPhrases,
}: DictionaryAiPromptParams): string => {
  const detectionNote = detectPhrases
    ? 'Extract both useful words and multi-word expressions when they carry unique meaning.'
    : 'Extract only standalone vocabulary words and skip multi-word expressions.'

  return `Source language: ${sourceLanguage}
Target language: ${targetLanguage}
Detection mode: ${detectPhrases ? 'phrases+words' : 'single-words-only'}
Guidelines: ${detectionNote}

Text:
"""
${text}
"""`
}

export const DICTIONARY_AI_RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['entries'],
  properties: {
    entries: {
      type: 'array',
      maxItems: DICTIONARY_AI_IMPORT_MAX_ITEMS,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['word', 'translation', 'notes'],
        properties: {
          word: { type: 'string', minLength: 1, maxLength: 100 },
          translation: { type: 'string', minLength: 1, maxLength: 200 },
          notes: { type: 'string', minLength: 1, maxLength: 1500 },
        },
      },
    },
  },
} as const

export const DICTIONARY_AI_RESPONSE_FORMAT = {
  type: 'json_schema',
  json_schema: {
    name: 'vocabulary_items',
    strict: true,
    schema: DICTIONARY_AI_RESPONSE_SCHEMA,
  },
} as const

export const DICTIONARY_AI_MODEL = process.env.OPENAI_DICTIONARY_MODEL || 'gpt-5-mini'
