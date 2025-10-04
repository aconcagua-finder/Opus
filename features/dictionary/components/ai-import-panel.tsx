'use client'

import { useEffect, useMemo, useState } from 'react'
import { CreateDictionaryEntryData, Language } from '../types'
import { LanguageSelector } from './language-selector'
import { dictionaryAPI } from '../api/dictionary'
import { useDictionary } from '../hooks/use-dictionary'
import { useDictionaryAiSettings } from '../hooks/use-ai-settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

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
  const {
    modelConfig,
    promptTemplates,
    detectPhrasesDefault,
    setDetectPhrasesDefault,
  } = useDictionaryAiSettings()

  const [sourceLanguage, setSourceLanguage] = useState(Language.ENGLISH)
  const [targetLanguage, setTargetLanguage] = useState(Language.RUSSIAN)
  const [text, setText] = useState('')
  const [generated, setGenerated] = useState<EditableEntry[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [detectPhrases, setDetectPhrases] = useState<boolean>(detectPhrasesDefault)

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
        aiConfig: {
          model: modelConfig.model,
          maxCompletionTokens: modelConfig.maxCompletionTokens,
          reasoningEffort: modelConfig.reasoningEffort,
          promptTemplates: {
            systemTemplate: promptTemplates.systemTemplate,
            singleWordFocus: promptTemplates.singleWordFocus,
            includePhrasesFocus: promptTemplates.includePhrasesFocus,
            notesRule: promptTemplates.notesRule,
          },
        },
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
    setDetectPhrases(detectPhrasesDefault)
  }, [detectPhrasesDefault])

  const handleDetectPhrasesChange = (value: boolean) => {
    setDetectPhrases(value)
    setDetectPhrasesDefault(value)
  }

  return (
    <Card className="shadow-soft transition-colors">
      <CardHeader>
        <CardTitle className="text-primary">Добавить список слов (ИИ)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="error">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert variant="success">
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-muted">
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
            <label className="mb-2 block text-sm font-medium text-muted">
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
          <label className="mb-2 block text-sm font-medium text-muted">
            Текст для анализа
          </label>
          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            disabled={disabled}
            placeholder="Вставьте сюда статью, диалог или список слов..."
            className="min-h-[160px]"
          />
          <div className="mt-1 text-xs text-muted">
            Размер: {(textByteLength / 1024).toFixed(1)} КБ из 2048 КБ
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-subtle bg-surface-muted px-3 py-3">
          <input
            id="dictionary-ai-detect-phrases"
            type="checkbox"
            checked={detectPhrases}
            disabled={disabled}
            onChange={(event) => handleDetectPhrasesChange(event.target.checked)}
            className="mt-1 h-4 w-4 cursor-pointer rounded border-subtle bg-surface-muted text-accent focus:ring focus:ring-[var(--accent-primary)] focus:ring-opacity-40"
          />
          <label
            htmlFor="dictionary-ai-detect-phrases"
            className="flex flex-col select-none text-sm text-muted cursor-pointer"
          >
            <span className="font-medium text-primary">Определять фразы</span>
            <span className="text-xs text-muted">
              При включении ИИ ищет устойчивые выражения и коллокации, а «Подсказка» будет содержать короткий пример употребления.
            </span>
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={disabled}
            isLoading={isGenerating}
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
              <h3 className="text-sm font-semibold text-primary">
                Предварительный список ({generated.length})
              </h3>
              <Button
                type="button"
                variant="ghost"
                className="text-xs text-muted hover:text-red-500"
                onClick={() => setGenerated([])}
                disabled={disabled}
              >
                Очистить
              </Button>
            </div>

            <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
              {generated.map((entry) => (
                <div
                  key={entry.id}
                  className="grid grid-cols-1 gap-3 rounded-lg border border-subtle bg-surface-muted p-3 backdrop-blur-xl md:grid-cols-12"
                >
                  <div className="md:col-span-3">
                    <label className="mb-1 block text-xs text-muted">Слово</label>
                    <Input
                      value={entry.word}
                      onChange={(event) => handleEntryChange(entry.id, 'word', event.target.value)}
                      className="h-9"
                      disabled={disabled}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="mb-1 block text-xs text-muted">Перевод</label>
                    <Input
                      value={entry.translation}
                      onChange={(event) => handleEntryChange(entry.id, 'translation', event.target.value)}
                      className="h-9"
                      disabled={disabled}
                    />
                  </div>
                  <div className="md:col-span-5">
                    <label className="mb-1 block text-xs text-muted">Подсказка</label>
                    <Input
                      value={entry.notes || ''}
                      onChange={(event) => handleEntryChange(entry.id, 'notes', event.target.value)}
                      className="h-9"
                      disabled={disabled}
                    />
                  </div>
                  <div className="flex items-end justify-end md:col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-xs text-muted hover:text-red-500"
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
                isLoading={isSaving}
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
