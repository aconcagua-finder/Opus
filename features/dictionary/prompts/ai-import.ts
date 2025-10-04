import { Language } from '@prisma/client'

type PromptLanguage = Language | `${Language}`

export type DictionaryAiReasoningEffort = 'low' | 'medium' | 'high'

export interface DictionaryAiModelParameters {
  model: string
  maxCompletionTokens: number
  reasoningEffort: DictionaryAiReasoningEffort
}

export interface DictionaryAiPromptTemplates {
  systemTemplate: string
  singleWordFocus: string
  includePhrasesFocus: string
  notesRule: string
}

export interface DictionaryAiClientConfiguration extends DictionaryAiModelParameters {
  promptTemplates: DictionaryAiPromptTemplates
}

export interface DictionaryAiPromptParams {
  sourceLanguage: PromptLanguage
  targetLanguage: PromptLanguage
  text: string
  detectPhrases: boolean
}

export type DictionaryAiSystemPromptParams = Pick<
  DictionaryAiPromptParams,
  'sourceLanguage' | 'targetLanguage' | 'detectPhrases'
>

export const DICTIONARY_AI_IMPORT_MAX_ITEMS = 50

const DEFAULT_SYSTEM_PROMPT_TEMPLATE = `Ты — ассистент, который извлекает пары слов иностранного языка.
Всегда отвечай JSON-массивом объектов, строго соответствующих следующему типу TypeScript:

type VocabularyItem = {
  word: string // уникальное слово на исходном языке
  translation: string // естественный перевод на целевой язык
  notes: string // краткий пример употребления (<= 120 символов)
}

Правила:
- Работай только с исходным языком ({{sourceLanguage}}) и целевым языком ({{targetLanguage}}).
- Извлекай до {{maxItems}} наиболее полезных уникальных словарных единиц.
{{vocabularyFocus}}
- Игнорируй числа, URL, e-mail, бессмысленные фрагменты и дубликаты.
- Сохраняй правильное написание собственных имён и топонимов.
{{notesRule}}
- Если подходящих элементов нет, верни пустой массив [] без дополнительных комментариев.
- НИКОГДА не обрамляй JSON в markdown-код и не добавляй пояснения.`

const SINGLE_WORDS_FOCUS = `- Сосредоточься исключительно на отдельных словах словаря.
- Нормализуй каждое слово до базовой словарной формы, если это уместно.
- Полностью игнорируй многословные выражения.`

const INCLUDE_PHRASES_FOCUS = `- Извлекай сбалансированный набор отдельных слов и полезных устойчивых выражений (не более 5 токенов).
- Сохраняй целостность выражений и обеспечивай перевод всей фразы.
- Добавляй только такие выражения, которые стоит выучить как устойчивые конструкции или коллокации.`

const NOTES_RULE = `- Поле "notes" заполняй коротким примером употребления (<= 360 символов) на естественном языке.
- Делай пример сразу полезным для запоминания словарной единицы.
- Отдавай предпочтение предложениям на исходном языке; при необходимости добавляй перевод на целевой язык после " — " и следи, чтобы он полно передавал смысл без обрыва.
- Любой перевод после " — " должен быть целиком на целевом языке, не повторять исходный текст и полностью передавать значение исходного примера.`

export const DEFAULT_DICTIONARY_AI_MODEL: DictionaryAiModelParameters = {
  model: process.env.OPENAI_DICTIONARY_MODEL || 'gpt-5-mini',
  maxCompletionTokens: 4000,
  reasoningEffort: 'low',
}

export const DEFAULT_DICTIONARY_AI_PROMPT_TEMPLATES: DictionaryAiPromptTemplates = {
  systemTemplate: DEFAULT_SYSTEM_PROMPT_TEMPLATE,
  singleWordFocus: SINGLE_WORDS_FOCUS,
  includePhrasesFocus: INCLUDE_PHRASES_FOCUS,
  notesRule: NOTES_RULE,
}

export const DEFAULT_DICTIONARY_AI_CLIENT_CONFIGURATION: DictionaryAiClientConfiguration = {
  ...DEFAULT_DICTIONARY_AI_MODEL,
  promptTemplates: DEFAULT_DICTIONARY_AI_PROMPT_TEMPLATES,
}

const applyTemplate = (template: string, context: Record<string, string>): string =>
  template.replace(/\{\{(\w+)\}\}/g, (match, key) => context[key] ?? match)

export const buildDictionaryAiSystemPrompt = (
  {
    sourceLanguage,
    targetLanguage,
    detectPhrases,
  }: DictionaryAiSystemPromptParams,
  templates: DictionaryAiPromptTemplates = DEFAULT_DICTIONARY_AI_PROMPT_TEMPLATES
): string => {
  const vocabularyFocus = detectPhrases ? templates.includePhrasesFocus : templates.singleWordFocus

  return applyTemplate(templates.systemTemplate, {
    sourceLanguage: String(sourceLanguage),
    targetLanguage: String(targetLanguage),
    maxItems: String(DICTIONARY_AI_IMPORT_MAX_ITEMS),
    vocabularyFocus,
    notesRule: templates.notesRule,
  })
}

export const buildDictionaryAiUserPrompt = ({
  sourceLanguage,
  targetLanguage,
  text,
  detectPhrases,
}: DictionaryAiPromptParams): string => {
  const detectionNote = detectPhrases
    ? 'Извлекай полезные отдельные слова и устойчивые выражения, если они несут уникальный смысл.'
    : 'Извлекай только отдельные слова и пропускай любые многословные выражения.'

  return `Исходный язык: ${sourceLanguage}
Целевой язык: ${targetLanguage}
Режим извлечения: ${detectPhrases ? 'phrases+words' : 'single-words-only'}
Пояснения: ${detectionNote}

Текст для анализа:
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

export const DICTIONARY_AI_MODEL = DEFAULT_DICTIONARY_AI_MODEL.model
