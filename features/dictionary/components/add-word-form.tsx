'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createDictionaryEntrySchema, CreateDictionaryEntryInput } from '../utils/validation'
import { useDictionary } from '../hooks/use-dictionary'
import { Language, DictionaryEntry } from '../types'
import { LanguageSelector } from './language-selector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'

interface AddWordFormProps {
  mode?: 'create' | 'edit'
  entry?: DictionaryEntry
  userId?: string
  onSuccess?: () => void
  onCancel?: () => void
  isModal?: boolean
}

type FormPreferences = {
  sourceLanguage: Language
  targetLanguage: Language
}

const FORM_PREFERENCES_KEY = 'dictionary-form-preferences-v1'

const isLanguage = (value: unknown): value is Language =>
  Object.values(Language).includes(value as Language)

const loadPreferences = (userId?: string): FormPreferences | null => {
  if (typeof window === 'undefined' || !userId) {
    return null
  }

  try {
    const raw = window.localStorage.getItem(FORM_PREFERENCES_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    const stored = parsed?.[userId]
    if (!stored) return null

    if (!isLanguage(stored.sourceLanguage) || !isLanguage(stored.targetLanguage)) {
      return null
    }

    return {
      sourceLanguage: stored.sourceLanguage,
      targetLanguage: stored.targetLanguage,
    }
  } catch (error) {
    console.warn('Failed to load dictionary preferences', error)
    return null
  }
}

const savePreferences = (userId: string, preferences: FormPreferences) => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const raw = window.localStorage.getItem(FORM_PREFERENCES_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    parsed[userId] = preferences
    window.localStorage.setItem(FORM_PREFERENCES_KEY, JSON.stringify(parsed))
  } catch (error) {
    console.warn('Failed to save dictionary preferences', error)
  }
}

export function AddWordForm({
  mode = 'create',
  entry,
  userId,
  onSuccess,
  onCancel,
  isModal = false,
}: AddWordFormProps) {
  const isEditMode = mode === 'edit'

  const { createEntry, updateEntry, isLoading, error, clearError } = useDictionary()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [preferences, setPreferences] = useState<FormPreferences | null>(null)
  const [preferencesReady, setPreferencesReady] = useState(isEditMode)
  const clearErrorRef = useRef(clearError)

  useEffect(() => {
    clearErrorRef.current = clearError
  }, [clearError])

  useEffect(() => {
    clearErrorRef.current?.()

    if (isEditMode) {
      setPreferencesReady(true)
      return
    }

    if (!userId) {
      setPreferencesReady(true)
      return
    }

    const loaded = loadPreferences(userId)
    if (loaded) {
      setPreferences(loaded)
    }

    setPreferencesReady(true)
  }, [isEditMode, entry?.id, userId])

  if (isEditMode && !entry) {
    console.warn('AddWordForm: entry is required when mode="edit"')
    return null
  }
  
  const defaultValues = useMemo<Partial<CreateDictionaryEntryInput>>(() => {
    if (isEditMode && entry) {
      return {
        word: entry.word,
        translation: entry.translation,
        notes: entry.notes ?? '',
        sourceLanguage: entry.sourceLanguage,
        targetLanguage: entry.targetLanguage,
      }
    }

    const fallbackSource = preferences?.sourceLanguage ?? Language.ENGLISH
    let fallbackTarget = preferences?.targetLanguage ?? Language.RUSSIAN
    if (fallbackTarget === fallbackSource) {
      fallbackTarget = fallbackSource === Language.ENGLISH ? Language.RUSSIAN : Language.ENGLISH
    }

    return {
      word: '',
      translation: '',
      notes: '',
      sourceLanguage: fallbackSource,
      targetLanguage: fallbackTarget,
    }
  }, [isEditMode, entry, preferences])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<CreateDictionaryEntryInput>({
    resolver: zodResolver(createDictionaryEntrySchema),
    defaultValues: defaultValues as CreateDictionaryEntryInput
  })

  useEffect(() => {
    if (preferencesReady) {
      reset(defaultValues as CreateDictionaryEntryInput)
    }
  }, [preferencesReady, defaultValues, reset])

  useEffect(() => {
    setIsSubmitting(false)
  }, [isEditMode, entry?.id])

  const sourceLanguage = watch('sourceLanguage')
  const targetLanguage = watch('targetLanguage')

  useEffect(() => {
    if (isEditMode || !userId || !preferencesReady) {
      return
    }

    if (!sourceLanguage || !targetLanguage) {
      return
    }

    savePreferences(userId, {
      sourceLanguage,
      targetLanguage,
    })
  }, [isEditMode, userId, preferencesReady, sourceLanguage, targetLanguage])

  const handleCancel = () => {
    clearErrorRef.current?.()
    onCancel?.()
  }

  const onSubmit = async (data: CreateDictionaryEntryInput) => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    clearErrorRef.current?.()
    
    try {
      if (isEditMode && entry) {
        await updateEntry(entry.id, data)
        reset({
          ...data,
          notes: data.notes ?? '',
        })
      } else {
        await createEntry(data)
        reset({
          word: '',
          translation: '',
          notes: '',
          sourceLanguage: data.sourceLanguage,
          targetLanguage: data.targetLanguage,
        })
      }

      onSuccess?.()
    } catch (err) {
      // Ошибка уже обрабатывается в store
    } finally {
      setIsSubmitting(false)
    }
  }

  const formContent = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert className="bg-red-950/50 border-red-900/50 text-red-200">
          {error}
        </Alert>
      )}

      {/* Языки */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Язык слова *
          </label>
          <LanguageSelector
            value={sourceLanguage}
            onChange={(language) => setValue('sourceLanguage', language, { shouldDirty: true, shouldValidate: true })}
            placeholder="Язык изучаемого слова"
          />
          {errors.sourceLanguage && (
            <p className="mt-1 text-sm text-red-400">{errors.sourceLanguage.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Язык перевода *
          </label>
          <LanguageSelector
            value={targetLanguage}
            onChange={(language) => setValue('targetLanguage', language, { shouldDirty: true, shouldValidate: true })}
            placeholder="Язык перевода"
          />
          {errors.targetLanguage && (
            <p className="mt-1 text-sm text-red-400">{errors.targetLanguage.message}</p>
          )}
        </div>
      </div>

      {/* Слово и перевод */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Слово *
          </label>
          <Input
            {...register('word')}
            placeholder="Введите слово..."
            error={!!errors.word}
          />
          {errors.word && (
            <p className="mt-1 text-sm text-red-400">{errors.word.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Перевод *
          </label>
          <Input
            {...register('translation')}
            placeholder="Введите перевод..."
            error={!!errors.translation}
          />
          {errors.translation && (
            <p className="mt-1 text-sm text-red-400">{errors.translation.message}</p>
          )}
        </div>
      </div>

      {/* Заметки */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Заметки (необязательно)
        </label>
        <textarea
          {...register('notes')}
          placeholder="Добавьте заметки, примеры использования..."
          className="flex w-full rounded-md bg-zinc-950/50 backdrop-blur-md border border-white/20 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px] resize-none"
        />
        {errors.notes && (
          <p className="mt-1 text-sm text-red-400">{errors.notes.message}</p>
        )}
      </div>
      {/* Кнопки */}
      <div className="flex items-center justify-end space-x-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Отмена
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting || isLoading}
          className="bg-cyan-600 hover:bg-cyan-700 text-white"
        >
          {isSubmitting
            ? isEditMode ? 'Сохраняем...' : 'Добавляем...'
            : isEditMode ? 'Сохранить изменения' : 'Добавить слово'}
        </Button>
      </div>
    </form>
  )

  if (isModal) {
    return formContent
  }

  return (
    <Card className={`bg-zinc-950/50 border-zinc-800/50 backdrop-blur ${isEditMode ? 'border-cyan-600/40 shadow-[0_0_20px_rgba(8,145,178,0.25)]' : ''}`}>
      <CardHeader>
        <CardTitle className="text-white">
          {isEditMode ? 'Редактировать слово' : 'Добавить слово (вручную)'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {formContent}
      </CardContent>
    </Card>
  )
}
