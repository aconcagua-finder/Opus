import { z } from 'zod'
import { Language } from '../types'

export const createDictionaryEntrySchema = z.object({
  word: z.string()
    .min(1, 'Слово не может быть пустым')
    .max(100, 'Слово не может быть длиннее 100 символов')
    .trim(),
  sourceLanguage: z.nativeEnum(Language, {
    message: 'Выберите язык изучаемого слова'
  }),
  translation: z.string()
    .min(1, 'Перевод не может быть пустым')
    .max(200, 'Перевод не может быть длиннее 200 символов')
    .trim(),
  targetLanguage: z.nativeEnum(Language, {
    message: 'Выберите язык перевода'
  }),
  notes: z.string()
    .max(500, 'Заметки не могут быть длиннее 500 символов')
    .trim()
    .optional(),
  difficulty: z.number()
    .min(0, 'Сложность не может быть меньше 0')
    .max(5, 'Сложность не может быть больше 5')
    .optional()
}).refine(
  (data) => data.sourceLanguage !== data.targetLanguage,
  {
    message: 'Языки слова и перевода должны отличаться',
    path: ['targetLanguage']
  }
)

export const updateDictionaryEntrySchema = z.object({
  word: z.string()
    .min(1, 'Слово не может быть пустым')
    .max(100, 'Слово не может быть длиннее 100 символов')
    .trim()
    .optional(),
  sourceLanguage: z.nativeEnum(Language).optional(),
  translation: z.string()
    .min(1, 'Перевод не может быть пустым')
    .max(200, 'Перевод не может быть длиннее 200 символов')
    .trim()
    .optional(),
  targetLanguage: z.nativeEnum(Language).optional(),
  notes: z.string()
    .max(500, 'Заметки не могут быть длиннее 500 символов')
    .trim()
    .optional(),
  difficulty: z.number()
    .min(0, 'Сложность не может быть меньше 0')
    .max(5, 'Сложность не может быть больше 5')
    .optional()
})

export const dictionaryFiltersSchema = z.object({
  sourceLanguage: z.nativeEnum(Language).optional(),
  targetLanguage: z.nativeEnum(Language).optional(),
  search: z.string().trim().optional()
})

export type CreateDictionaryEntryInput = z.infer<typeof createDictionaryEntrySchema>
export type UpdateDictionaryEntryInput = z.infer<typeof updateDictionaryEntrySchema>
export type DictionaryFiltersInput = z.infer<typeof dictionaryFiltersSchema>