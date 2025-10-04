'use client'

import { useEffect, useMemo, useState } from 'react'
import { useWordLists } from '../hooks/use-word-lists'
import { WordList } from '../types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

const COLOR_PRESETS = [
  '#06b6d4', // cyan-500
  '#0ea5e9', // sky-500
  '#22c55e', // green-500
  '#84cc16', // lime-500
  '#facc15', // yellow-400
  '#f97316', // orange-500
  '#ef4444', // red-500
  '#a855f7'  // purple-500
]

const DEFAULT_COLOR = COLOR_PRESETS[0]

interface WordListManagerProps {
  onClose: () => void
}

export function WordListManager({ onClose }: WordListManagerProps) {
  const {
    autoLists,
    customLists,
    archivedLists,
    createList,
    updateList,
    deleteList,
    isLoading,
    error,
    ensureLists
  } = useWordLists()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(DEFAULT_COLOR)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLocalError(null)
      await ensureLists(true)

      if (cancelled) {
        return
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [ensureLists])

  const allCustomLists = useMemo(() => [...customLists, ...archivedLists], [customLists, archivedLists])

  const availableColors = useMemo(() => {
    if (color && !COLOR_PRESETS.includes(color)) {
      return [color, ...COLOR_PRESETS.filter((preset) => preset !== color)]
    }
    return COLOR_PRESETS
  }, [color])

  const remoteError = useMemo(() => {
    if (!error) return null
    return error === 'Failed to fetch word lists' ? 'Не удалось загрузить списки слов' : error
  }, [error])

  const hasAnyLists = (autoLists.length + customLists.length + archivedLists.length) > 0
  const displayedError = localError || (!hasAnyLists ? remoteError : null)

  const renderListRow = (list: WordList) => {
    const isDeleting = deletingId === list.id

    return (
      <div
        key={list.id}
        className={`flex items-center justify-between rounded-lg border border-subtle bg-surface-muted p-3 transition-colors hover:border-[var(--accent-primary)] ${
          list.isArchived ? 'opacity-70 hover:opacity-90' : ''
        }`}
        style={
          list.color
            ? {
                borderLeftColor: list.color,
                borderLeftWidth: '4px',
                borderLeftStyle: 'solid'
              }
            : undefined
        }
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-primary font-medium truncate max-w-[200px] sm:max-w-[280px]">
              {list.name}
            </h4>
            <span className="text-xs text-muted shrink-0">
              {(list.wordCount ?? 0)} слов
            </span>
            {list.isArchived && (
              <span className="inline-flex items-center rounded-full border border-subtle px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted">
                Архив
              </span>
            )}
          </div>
          {list.description && (
            <p className="text-sm text-muted truncate mt-1">
              {list.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 ml-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(list.id)}
            disabled={isLoading}
            className="text-accent hover:text-accent"
          >
            Изменить
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleArchive(list.id, list.isArchived)}
            disabled={isLoading}
            className={
              list.isArchived
                ? 'text-muted hover:text-primary'
                : 'text-muted hover:text-secondary'
            }
          >
            {list.isArchived ? 'Восстановить' : 'Архивировать'}
          </Button>

          {isDeleting ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted">Удалить?</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(list.id)}
                disabled={isLoading}
                className="text-red-400 hover:text-red-300"
              >
                Да
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setDeletingId(null)}
                disabled={isLoading}
                className="text-muted hover:text-secondary"
              >
                Нет
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDeletingId(list.id)}
              disabled={isLoading}
              className="text-red-400 hover:text-red-300"
            >
              Удалить
            </Button>
          )}
        </div>
      </div>
    )
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (!name.trim()) {
      setLocalError('Введите название списка')
      return
    }

    try {
      await createList({
        name: name.trim(),
        description: description.trim() || undefined,
        color
      })

      // Очищаем форму
      setName('')
      setDescription('')
      setColor(DEFAULT_COLOR)
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Не удалось создать список')
    }
  }

  const handleEdit = (listId: string) => {
    const list = allCustomLists.find(l => l.id === listId)
    if (list) {
      setLocalError(null)
      setName(list.name)
      setDescription(list.description || '')
      setColor(list.color || DEFAULT_COLOR)
      setEditingId(listId)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return

    setLocalError(null)

    if (!name.trim()) {
      setLocalError('Введите название списка')
      return
    }

    try {
      await updateList(editingId, {
        name: name.trim(),
        description: description.trim() || undefined,
        color
      })

      // Очищаем форму
      setName('')
      setDescription('')
      setColor(DEFAULT_COLOR)
      setEditingId(null)
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Не удалось обновить список')
    }
  }

  const handleCancelEdit = () => {
    setLocalError(null)
    setName('')
    setDescription('')
    setColor(DEFAULT_COLOR)
    setEditingId(null)
  }

  const handleDelete = async (listId: string) => {
    try {
      setLocalError(null)
      await deleteList(listId)
      setDeletingId(null)
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Не удалось удалить список')
    }
  }

  const handleArchive = async (listId: string, isArchived: boolean) => {
    try {
      setLocalError(null)
      await updateList(listId, { isArchived: !isArchived })
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Не удалось архивировать список')
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-primary">
          {editingId ? 'Редактирование списка' : 'Управление списками'}
        </h2>
        <p className="text-sm text-muted">
          {editingId
            ? 'Измените название, описание или цвет списка'
            : 'Создавайте и управляйте своими списками слов'}
        </p>
      </div>

      {/* Форма создания/редактирования */}
      <Card className="bg-surface-muted border-subtle">
        <CardHeader>
          <CardTitle className="text-primary text-base">
            {editingId ? 'Редактировать список' : 'Создать новый список'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Название списка *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Например: Часто используемые слова"
                maxLength={100}
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Описание (опционально)
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Краткое описание списка"
                maxLength={500}
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Цвет метки
              </label>
              <div className="flex flex-wrap gap-3">
                {availableColors.map((preset) => {
                  const isSelected = color === preset

                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setColor(preset)}
                      disabled={isLoading}
                      aria-pressed={isSelected}
                      aria-label={`Выбрать цвет ${preset}`}
                      className={`h-9 w-9 rounded-full border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                        isSelected
                          ? 'ring-2 ring-cyan-400 border-white shadow-lg'
                          : 'border-transparent hover:ring-2 hover:ring-cyan-300'
                      } ${isLoading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                      style={{ backgroundColor: preset }}
                    >
                      {isSelected && (
                        <span className="sr-only">Текущий цвет</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {displayedError && (
              <div className="text-sm text-red-400 bg-red-950/50 border border-red-900/50 rounded p-3">
                {displayedError}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={isLoading || !name.trim()}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                {isLoading ? 'Сохранение...' : editingId ? 'Обновить' : 'Создать список'}
              </Button>

              {editingId && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCancelEdit}
                  disabled={isLoading}
                  className="text-secondary hover:text-primary"
                >
                  Отмена
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {autoLists.length > 0 && (
        <Card className="bg-surface-muted border-subtle">
          <CardHeader>
            <CardTitle className="text-primary text-base">
              Системные списки ({autoLists.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {autoLists.map((list) => (
              <div
                key={list.id}
                className="flex items-center justify-between rounded-lg border border-subtle bg-surface-muted px-3 py-2"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-primary">{list.name}</span>
                  {list.description && (
                    <span className="text-xs text-muted">{list.description}</span>
                  )}
                </div>
                <span className="text-xs text-muted whitespace-nowrap">
                  {list.wordCount ?? 0} слов
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Список существующих списков */}
      {customLists.length > 0 && (
        <Card className="bg-surface-muted border-subtle">
          <CardHeader>
            <CardTitle className="text-primary text-base">
              Мои списки ({customLists.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {customLists.map(renderListRow)}
          </CardContent>
        </Card>
      )}

      {archivedLists.length > 0 && (
        <Card className="bg-surface-muted border-subtle">
          <CardHeader>
            <CardTitle className="text-primary text-base">
              Архив ({archivedLists.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {archivedLists.map(renderListRow)}
          </CardContent>
        </Card>
      )}

      {customLists.length === 0 && archivedLists.length === 0 && !editingId && (
        <div className="text-center py-8">
          <p className="text-muted mb-2">У вас пока нет пользовательских списков</p>
          <p className="text-sm text-muted">
            Создайте первый список, чтобы начать организовывать свои слова
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="text-secondary hover:bg-surface-muted"
        >
          Закрыть
        </Button>
      </div>
    </div>
  )
}
