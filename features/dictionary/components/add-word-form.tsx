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
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

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
  const entryMissing = isEditMode && !entry

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

  const defaultValues = useMemo<CreateDictionaryEntryInput>(() => {
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
    defaultValues,
  })

  useEffect(() => {
    if (preferencesReady) {
      reset(defaultValues)
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
    } catch (error) {
      console.error('Dictionary entry submission failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (entryMissing) {
    console.warn('AddWordForm: entry is required when mode="edit"')
    return null
  }

  const formContent = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert variant="error">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Языки */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-muted">
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
          <label className="mb-2 block text-sm font-medium text-muted">
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
          <label className="mb-2 block text-sm font-medium text-muted">
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
          <label className="mb-2 block text-sm font-medium text-muted">
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

      {/* Подсказка */}
      <div>
        <label className="mb-2 block text-sm font-medium text-muted">
          Подсказка (необязательно)
        </label>
        <Textarea
          {...register('notes')}
          placeholder="Добавьте короткий пример употребления, например: Yo no veo fútbol — Я не смотрю футбол"
          className="min-h-[80px] resize-none"
        />
        {errors.notes && (
          <p className="mt-1 text-sm text-red-400">{errors.notes.message}</p>
        )}
      </div>
      {/* Кнопки */}
      <div className="flex items-center justify-end gap-3 pt-4">
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
          isLoading={isSubmitting || isLoading}
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
    <Card className={cn('transition-colors', isEditMode && 'ring-1 ring-[var(--accent-primary)] shadow-accent')}>
      <CardHeader>
        <CardTitle className="text-primary">
          {isEditMode ? 'Редактировать слово' : 'Добавить слово (вручную)'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {formContent}
      </CardContent>
    </Card>
  )
}
