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
    <Card className="bg-zinc-950/60 border-zinc-800/60 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-white text-2xl">Настройки ИИ для обработки слов</CardTitle>
        <CardDescription>
          Текущая конфигурация используется при автогенерации слов из текста. Измените модель, параметры
          и подсказки, чтобы тонко настроить поведение помощника.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-300">ID модели</label>
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
            <p className="text-xs text-zinc-500">
              Должно совпадать с доступным именем модели в вашей подписке OpenAI.
            </p>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-300">Максимум токенов на ответ</label>
            <Input
              type="number"
              min={MIN_COMPLETION_TOKENS}
              max={MAX_COMPLETION_TOKENS}
              value={draftModelConfig.maxCompletionTokens}
              onChange={(event) => handleMaxTokensChange(event.target.value)}
            />
            <p className="text-xs text-zinc-500">Управляет длиной ответа модели. Значение ограничено 16–16000.</p>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-zinc-300">Режим рассуждений</label>
            <select
              value={draftModelConfig.reasoningEffort}
              onChange={(event) =>
                setDraftModelConfig((prev) => ({
                  ...prev,
                  reasoningEffort: event.target.value as typeof prev.reasoningEffort,
                }))
              }
              className="h-11 rounded-md bg-zinc-950/50 backdrop-blur-md border border-white/20 px-3 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50"
            >
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
            </select>
            <p className="text-xs text-zinc-500">
              Чем выше значение, тем больше времени модель тратит на структурирование ответа.
            </p>
          </div>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-zinc-300">Режим по умолчанию</label>
            <div className="flex items-start gap-3 rounded-lg border border-white/10 bg-zinc-900/40 px-3 py-3">
              <input
                id="ai-settings-detect-phrases-default"
                type="checkbox"
                checked={draftDetectPhrasesDefault}
                onChange={(event) => {
                  const nextValue = event.target.checked
                  setDraftDetectPhrasesDefault(nextValue)
                  setPreviewDetectPhrases(nextValue)
                }}
                className="mt-1 h-4 w-4 cursor-pointer accent-cyan-500"
              />
              <label
                htmlFor="ai-settings-detect-phrases-default"
                className="flex flex-col text-sm text-zinc-300 cursor-pointer select-none"
              >
                <span className="font-medium">Определять фразы автоматически</span>
                <span className="text-xs text-zinc-500">
                  Включает поиск устойчивых выражений при генерации слов. Можно менять в панели импорта.
                </span>
              </label>
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Системный промпт</h3>
              <p className="text-xs text-zinc-500">
                Используйте плейсхолдеры{' '}
                <span className="font-mono text-zinc-300">{'{{sourceLanguage}}'}</span>,{' '}
                <span className="font-mono text-zinc-300">{'{{targetLanguage}}'}</span>,{' '}
                <span className="font-mono text-zinc-300">{'{{maxItems}}'}</span>,{' '}
                <span className="font-mono text-zinc-300">{'{{vocabularyFocus}}'}</span> и{' '}
                <span className="font-mono text-zinc-300">{'{{notesRule}}'}</span>.
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
            <label className="block text-sm font-medium text-zinc-300">Фокус: только слова</label>
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
            <label className="block text-sm font-medium text-zinc-300">Фокус: слова и фразы</label>
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
            <label className="block text-sm font-medium text-zinc-300">Правила заметок</label>
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
              <h3 className="text-lg font-semibold text-white">Предпросмотр системного промпта</h3>
              <p className="text-xs text-zinc-500">
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
          <div className="rounded-lg border border-zinc-800/70 bg-zinc-950/70 p-4 text-sm text-zinc-200 max-h-[260px] overflow-y-auto whitespace-pre-wrap">
            {systemPromptPreview}
          </div>
        </section>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-zinc-500">
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
