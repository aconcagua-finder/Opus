'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createDictionaryEntrySchema, CreateDictionaryEntryInput } from '../utils/validation'
import { useDictionary } from '../hooks/use-dictionary'
import { Language } from '../types'
import { LanguageSelector } from './language-selector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'

interface AddWordFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  isModal?: boolean
}

export function AddWordForm({ onSuccess, onCancel, isModal = false }: AddWordFormProps) {
  const { createEntry, isLoading, error, clearError } = useDictionary()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<CreateDictionaryEntryInput>({
    resolver: zodResolver(createDictionaryEntrySchema),
    defaultValues: {
      difficulty: 0
    }
  })

  const sourceLanguage = watch('sourceLanguage')
  const targetLanguage = watch('targetLanguage')

  const onSubmit = async (data: CreateDictionaryEntryInput) => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    clearError()
    
    try {
      await createEntry(data)
      reset()
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
            onChange={(language) => setValue('sourceLanguage', language)}
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
            onChange={(language) => setValue('targetLanguage', language)}
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

      {/* Сложность */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Сложность (0-5)
        </label>
        <select
          {...register('difficulty', { 
            setValueAs: (value) => value ? parseInt(value) : 0 
          })}
          className="flex h-10 w-full rounded-md bg-zinc-950/50 backdrop-blur-md border border-white/20 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50"
        >
          <option value={0} className="bg-zinc-900">0 - Легкое</option>
          <option value={1} className="bg-zinc-900">1 - Простое</option>
          <option value={2} className="bg-zinc-900">2 - Среднее</option>
          <option value={3} className="bg-zinc-900">3 - Сложное</option>
          <option value={4} className="bg-zinc-900">4 - Очень сложное</option>
          <option value={5} className="bg-zinc-900">5 - Экстремальное</option>
        </select>
        {errors.difficulty && (
          <p className="mt-1 text-sm text-red-400">{errors.difficulty.message}</p>
        )}
      </div>

      {/* Кнопки */}
      <div className="flex items-center justify-end space-x-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
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
          {isSubmitting ? 'Добавляем...' : 'Добавить слово'}
        </Button>
      </div>
    </form>
  )

  if (isModal) {
    return formContent
  }

  return (
    <Card className="bg-zinc-950/50 border-zinc-800/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-white">Добавить новое слово</CardTitle>
      </CardHeader>
      <CardContent>
        {formContent}
      </CardContent>
    </Card>
  )
}