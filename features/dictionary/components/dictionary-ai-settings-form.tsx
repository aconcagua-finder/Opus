'use client'

import { useEffect, useMemo, useState } from 'react'
import { useDictionaryAiSettings } from '../hooks/use-ai-settings'
import { buildDictionaryAiSystemPrompt } from '../prompts/ai-import'
import { Language } from '../types'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

const PREVIEW_SOURCE_LANGUAGE = Language.ENGLISH
const PREVIEW_TARGET_LANGUAGE = Language.RUSSIAN
const MIN_COMPLETION_TOKENS = 16
const MAX_COMPLETION_TOKENS = 16000

const clampTokens = (value: number) => {
  if (!Number.isFinite(value)) {
    return MIN_COMPLETION_TOKENS
  }

  return Math.min(MAX_COMPLETION_TOKENS, Math.max(MIN_COMPLETION_TOKENS, Math.round(value)))
}

const isSame = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

export function DictionaryAiSettingsForm() {
  const {
    modelConfig,
    promptTemplates,
    detectPhrasesDefault,
    updateModelConfig,
    updatePromptTemplates,
    setDetectPhrasesDefault,
    reset,
  } = useDictionaryAiSettings()

  const [draftModelConfig, setDraftModelConfig] = useState(modelConfig)
  const [draftPromptTemplates, setDraftPromptTemplates] = useState(promptTemplates)
  const [draftDetectPhrasesDefault, setDraftDetectPhrasesDefault] = useState(detectPhrasesDefault)
  const [previewDetectPhrases, setPreviewDetectPhrases] = useState(detectPhrasesDefault)
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setDraftModelConfig(modelConfig)
  }, [modelConfig])

  useEffect(() => {
    setDraftPromptTemplates(promptTemplates)
  }, [promptTemplates])

  useEffect(() => {
    setDraftDetectPhrasesDefault(detectPhrasesDefault)
    setPreviewDetectPhrases(detectPhrasesDefault)
  }, [detectPhrasesDefault])

  const systemPromptPreview = useMemo(
    () =>
      buildDictionaryAiSystemPrompt(
        {
          sourceLanguage: PREVIEW_SOURCE_LANGUAGE,
          targetLanguage: PREVIEW_TARGET_LANGUAGE,
          detectPhrases: previewDetectPhrases,
        },
        draftPromptTemplates
      ),
    [previewDetectPhrases, draftPromptTemplates]
  )

  useEffect(() => {
    if (!copied) {
      return
    }

    const timeoutId = window.setTimeout(() => setCopied(false), 2500)
    return () => window.clearTimeout(timeoutId)
  }, [copied])

  useEffect(() => {
    if (!saved) {
      return
    }

    const timeoutId = window.setTimeout(() => setSaved(false), 2500)
    return () => window.clearTimeout(timeoutId)
  }, [saved])

  const handleCopySystemPrompt = async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        return
      }

      await navigator.clipboard.writeText(systemPromptPreview)
      setCopied(true)
    } catch (error) {
      console.error('Failed to copy system prompt', error)
    }
  }

  const handleMaxTokensChange = (value: string) => {
    const numeric = Number(value)

    if (!Number.isNaN(numeric)) {
      setDraftModelConfig((prev) => ({
        ...prev,
        maxCompletionTokens: clampTokens(numeric),
      }))
    }
  }

  const handleSave = () => {
    updateModelConfig(draftModelConfig)
    updatePromptTemplates(draftPromptTemplates)
    setDetectPhrasesDefault(draftDetectPhrasesDefault)
    setSaved(true)
  }

  const handleReset = () => {
    reset()
    setSaved(false)
  }

  const isDirty = useMemo(
    () =>
      !isSame(draftModelConfig, modelConfig) ||
      !isSame(draftPromptTemplates, promptTemplates) ||
      draftDetectPhrasesDefault !== detectPhrasesDefault,
    [draftModelConfig, modelConfig, draftPromptTemplates, promptTemplates, draftDetectPhrasesDefault, detectPhrasesDefault]
  )

  return (
    <Card className="bg-surface-muted border-subtle backdrop-blur">
      <CardHeader>
        <CardTitle className="text-primary text-2xl">Настройки ИИ для обработки слов</CardTitle>
        <CardDescription>
          Текущая конфигурация используется при автогенерации слов из текста. Измените модель, параметры
          и подсказки, чтобы тонко настроить поведение помощника.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary">ID модели</label>
            <Input
              value={draftModelConfig.model}
              onChange={(event) =>
                setDraftModelConfig((prev) => ({
                  ...prev,
                  model: event.target.value,
                }))
              }
              placeholder="gpt-5-mini"
            />
            <p className="text-xs text-muted">
              Должно совпадать с доступным именем модели в вашей подписке OpenAI.
            </p>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary">Максимум токенов на ответ</label>
            <Input
              type="number"
              min={MIN_COMPLETION_TOKENS}
              max={MAX_COMPLETION_TOKENS}
              value={draftModelConfig.maxCompletionTokens}
              onChange={(event) => handleMaxTokensChange(event.target.value)}
            />
            <p className="text-xs text-muted">Управляет длиной ответа модели. Значение ограничено 16–16000.</p>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary">Режим рассуждений</label>
            <select
              value={draftModelConfig.reasoningEffort}
              onChange={(event) =>
                setDraftModelConfig((prev) => ({
                  ...prev,
                  reasoningEffort: event.target.value as typeof prev.reasoningEffort,
                }))
              }
              className="h-11 rounded-lg border border-subtle bg-surface-muted px-3 text-sm text-primary transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background-primary)]"
            >
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
            </select>
            <p className="text-xs text-muted">
              Чем выше значение, тем больше времени модель тратит на структурирование ответа.
            </p>
          </div>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-secondary">Режим по умолчанию</label>
            <div className="flex items-start gap-3 rounded-lg border border-subtle bg-surface-muted px-3 py-3">
              <input
                id="ai-settings-detect-phrases-default"
                type="checkbox"
                checked={draftDetectPhrasesDefault}
                onChange={(event) => {
                  const nextValue = event.target.checked
                  setDraftDetectPhrasesDefault(nextValue)
                  setPreviewDetectPhrases(nextValue)
                }}
                className="mt-1 h-4 w-4 cursor-pointer rounded border-subtle bg-surface-muted text-accent focus:ring focus:ring-[var(--accent-primary)] focus:ring-opacity-40"
              />
              <label
                htmlFor="ai-settings-detect-phrases-default"
                className="flex flex-col text-sm text-secondary cursor-pointer select-none"
              >
                <span className="font-medium">Определять фразы автоматически</span>
                <span className="text-xs text-muted">
                  Включает поиск устойчивых выражений при генерации слов. Можно менять в панели импорта.
                </span>
              </label>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-primary">Системный промпт</h3>
              <p className="text-xs text-muted">
                Используйте плейсхолдеры{' '}
                <span className="font-mono text-secondary">{'{{sourceLanguage}}'}</span>,{' '}
                <span className="font-mono text-secondary">{'{{targetLanguage}}'}</span>,{' '}
                <span className="font-mono text-secondary">{'{{maxItems}}'}</span>,{' '}
                <span className="font-mono text-secondary">{'{{vocabularyFocus}}'}</span> и{' '}
                <span className="font-mono text-secondary">{'{{notesRule}}'}</span>.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleCopySystemPrompt}>
              {copied ? 'Скопировано' : 'Скопировать'}
            </Button>
          </div>
          <Textarea
            value={draftPromptTemplates.systemTemplate}
            onChange={(event) =>
              setDraftPromptTemplates((prev) => ({
                ...prev,
                systemTemplate: event.target.value,
              }))
            }
            className="min-h-[220px]"
          />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary">Фокус: только слова</label>
            <Textarea
              value={draftPromptTemplates.singleWordFocus}
              onChange={(event) =>
                setDraftPromptTemplates((prev) => ({
                  ...prev,
                  singleWordFocus: event.target.value,
                }))
              }
              className="min-h-[140px]"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary">Фокус: слова и фразы</label>
            <Textarea
              value={draftPromptTemplates.includePhrasesFocus}
              onChange={(event) =>
                setDraftPromptTemplates((prev) => ({
                  ...prev,
                  includePhrasesFocus: event.target.value,
                }))
              }
              className="min-h-[140px]"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-secondary">Правила заметок</label>
            <Textarea
              value={draftPromptTemplates.notesRule}
              onChange={(event) =>
                setDraftPromptTemplates((prev) => ({
                  ...prev,
                  notesRule: event.target.value,
                }))
              }
              className="min-h-[140px]"
            />
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-primary">Предпросмотр системного промпта</h3>
              <p className="text-xs text-muted">
                Пример рассчитывается для пары EN → RU. Режим: {previewDetectPhrases ? 'слова и фразы' : 'только слова'}.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreviewDetectPhrases((prev) => !prev)}
              >
                {previewDetectPhrases ? 'Показать без фраз' : 'Показать с фразами'}
              </Button>
            </div>
          </div>
          <div className="rounded-lg border border-subtle bg-surface-muted p-4 text-sm text-primary max-h-[260px] overflow-y-auto whitespace-pre-wrap">
            {systemPromptPreview}
          </div>
        </section>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted">
            Нажмите «Сбросить настройки», чтобы вернуть значения по умолчанию, заданные системой.
          </p>
          {saved && <span className="text-xs text-emerald-400">Настройки сохранены</span>}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleReset}>
            Сбросить настройки
          </Button>
          <Button onClick={handleSave} disabled={!isDirty}>
            Сохранить
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
