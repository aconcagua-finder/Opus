'use client'

import { useEffect, useMemo, useState } from 'react'
import { CreateDictionaryEntryData, Language } from '../types'
import { LanguageSelector } from './language-selector'
import { dictionaryAPI } from '../api/dictionary'
import { useDictionary } from '../hooks/use-dictionary'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'

const MAX_TEXT_BYTES = 2 * 1024 * 1024

interface AiImportPanelProps {
  onClose?: () => void
}

interface EditableEntry extends CreateDictionaryEntryData {
  id: string
}

const createEditableEntry = (
  entry: CreateDictionaryEntryData,
  index: number
): EditableEntry => ({
  ...entry,
  id: `${entry.word}-${index}-${Math.random().toString(36).slice(2, 6)}`,
})

export function AiImportPanel({ onClose }: AiImportPanelProps) {
  const { importEntries } = useDictionary()

  const [sourceLanguage, setSourceLanguage] = useState(Language.ENGLISH)
  const [targetLanguage, setTargetLanguage] = useState(Language.RUSSIAN)
  const [text, setText] = useState('')
  const [generated, setGenerated] = useState<EditableEntry[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [detectPhrases, setDetectPhrases] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false
    }

    const stored = window.localStorage.getItem('opus.dictionary.ai.detectPhrases')
    return stored === 'true'
  })

  const textByteLength = useMemo(() => {
    if (!text) return 0
    return new TextEncoder().encode(text).length
  }, [text])

  const handleGenerate = async () => {
    setError(null)
    setSuccessMessage(null)

    if (!text.trim()) {
      setError('Введите текст для анализа')
      return
    }

    if (textByteLength > MAX_TEXT_BYTES) {
      setError('Размер текста превышает 2 МБ, укоротите ввод')
      return
    }

    if (sourceLanguage === targetLanguage) {
      setError('Языки слова и перевода должны отличаться')
      return
    }

    try {
      setIsGenerating(true)
      const entries = await dictionaryAPI.generateEntries({
        text,
        sourceLanguage,
        targetLanguage,
        detectPhrases,
      })

      if (!entries.length) {
        setError('Модель не нашла подходящие слова в тексте')
        setGenerated([])
        return
      }

      setGenerated(entries.map(createEditableEntry))
      setSuccessMessage(`Сгенерировано вариантов: ${entries.length}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось сгенерировать список'
      setError(message)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleEntryChange = <K extends keyof CreateDictionaryEntryData>(
    id: string,
    field: K,
    value: CreateDictionaryEntryData[K]
  ) => {
    setGenerated((prev) =>
      prev.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              [field]: value as CreateDictionaryEntryData[K],
            }
          : entry
      )
    )
  }

  const handleRemoveEntry = (id: string) => {
    setGenerated((prev) => prev.filter((entry) => entry.id !== id))
  }

  const handleAddManualEntry = () => {
    setGenerated((prev) => [
      ...prev,
      createEditableEntry(
        {
          word: '',
          translation: '',
          notes: '',
          sourceLanguage,
          targetLanguage,
        },
        prev.length + 1
      ),
    ])
  }

  const handleSave = async () => {
    setError(null)
    setSuccessMessage(null)

    if (!generated.length) {
      setError('Нет слов для сохранения')
      return
    }

    const cleaned = generated
      .map((entry) => {
        const { id: _omitted, ...rest } = entry
        void _omitted
        return {
          ...rest,
          word: rest.word.trim(),
          translation: rest.translation.trim(),
          notes: rest.notes?.trim() || undefined,
          sourceLanguage,
          targetLanguage,
        }
      })
      .filter((entry) => entry.word && entry.translation)

    if (!cleaned.length) {
      setError('Убедитесь, что слова и переводы заполнены')
      return
    }

    try {
      setIsSaving(true)
      const result = await importEntries(cleaned)
      setSuccessMessage(`Сохранено: ${result.created}. Пропущено: ${result.skipped}.`)
      setGenerated([])
      setText('')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось сохранить слова'
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  const disabled = isGenerating || isSaving

  useEffect(() => {
    setGenerated((prev) =>
      prev.map((entry) => ({
        ...entry,
        sourceLanguage,
        targetLanguage,
      }))
    )
  }, [sourceLanguage, targetLanguage])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(
      'opus.dictionary.ai.detectPhrases',
      detectPhrases ? 'true' : 'false'
    )
  }, [detectPhrases])

  return (
    <Card className="bg-zinc-950/50 border-zinc-800/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-white">Добавить список слов (ИИ)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert className="bg-red-950/50 border-red-900/50 text-red-200">
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert className="bg-emerald-950/50 border-emerald-900/50 text-emerald-200">
            {successMessage}
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Язык исходного текста
            </label>
            <LanguageSelector
              value={sourceLanguage}
              onChange={(value) => {
                if (value === targetLanguage) {
                  setTargetLanguage(sourceLanguage)
                }
                setSourceLanguage(value)
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Язык перевода
            </label>
            <LanguageSelector
              value={targetLanguage}
              onChange={(value) => {
                if (value === sourceLanguage) {
                  setSourceLanguage(targetLanguage)
                }
                setTargetLanguage(value)
              }}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Текст для анализа
          </label>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            disabled={disabled}
            placeholder="Вставьте сюда статью, диалог или список слов..."
            className="flex w-full rounded-md bg-zinc-950/50 backdrop-blur-md border border-white/20 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-50 min-h-[160px]"
          />
          <div className="mt-1 text-xs text-zinc-500">
            Размер: {(textByteLength / 1024).toFixed(1)} КБ из 2048 КБ
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-zinc-950/40 px-3 py-3">
          <input
            id="dictionary-ai-detect-phrases"
            type="checkbox"
            checked={detectPhrases}
            disabled={disabled}
            onChange={(event) => setDetectPhrases(event.target.checked)}
            className="mt-1 h-4 w-4 cursor-pointer accent-cyan-500"
          />
          <label
            htmlFor="dictionary-ai-detect-phrases"
            className="flex flex-col text-sm text-zinc-300 cursor-pointer select-none"
          >
            <span className="font-medium">Определять фразы</span>
            <span className="text-xs text-zinc-500">
              При включении ИИ ищет устойчивые выражения и коллокации, а «Подсказка» будет содержать короткий пример употребления.
            </span>
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={disabled}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            {isGenerating ? 'Генерируем...' : 'Сгенерировать список'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleAddManualEntry}
            disabled={disabled}
          >
            Добавить строку вручную
          </Button>
        </div>

        {generated.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-200">
                Предварительный список ({generated.length})
              </h3>
              <Button
                type="button"
                variant="ghost"
                className="text-xs text-zinc-400 hover:text-red-400"
                onClick={() => setGenerated([])}
                disabled={disabled}
              >
                Очистить
              </Button>
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {generated.map((entry) => (
                <div
                  key={entry.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/60"
                >
                  <div className="md:col-span-3">
                    <label className="block text-xs text-zinc-500 mb-1">Слово</label>
                    <input
                      value={entry.word}
                      onChange={(event) => handleEntryChange(entry.id, 'word', event.target.value)}
                      className="w-full rounded-md bg-zinc-950/60 border border-white/10 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50"
                      disabled={disabled}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs text-zinc-500 mb-1">Перевод</label>
                    <input
                      value={entry.translation}
                      onChange={(event) => handleEntryChange(entry.id, 'translation', event.target.value)}
                      className="w-full rounded-md bg-zinc-950/60 border border-white/10 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50"
                      disabled={disabled}
                    />
                  </div>
                  <div className="md:col-span-5">
                    <label className="block text-xs text-zinc-500 mb-1">Подсказка</label>
                    <input
                      value={entry.notes || ''}
                      onChange={(event) => handleEntryChange(entry.id, 'notes', event.target.value)}
                      className="w-full rounded-md bg-zinc-950/60 border border-white/10 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50"
                      disabled={disabled}
                    />
                  </div>
                  <div className="md:col-span-1 flex items-end justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-xs text-zinc-400 hover:text-red-400"
                      onClick={() => handleRemoveEntry(entry.id)}
                      disabled={disabled}
                    >
                      Удалить
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={disabled}
              >
                Закрыть
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={disabled}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSaving ? 'Сохраняем...' : 'Сохранить в словарь'}
              </Button>
            </div>
          </div>
        )}

        {generated.length === 0 && (
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={disabled}
            >
              Закрыть
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
