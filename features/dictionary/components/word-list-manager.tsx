'use client'

import { useState } from 'react'
import { useWordLists } from '../hooks/use-word-lists'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface WordListManagerProps {
  onClose: () => void
}

export function WordListManager({ onClose }: WordListManagerProps) {
  const {
    customLists,
    createList,
    updateList,
    deleteList,
    isLoading,
    error
  } = useWordLists()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#06b6d4')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

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
      setColor('#06b6d4')
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Не удалось создать список')
    }
  }

  const handleEdit = (listId: string) => {
    const list = customLists.find(l => l.id === listId)
    if (list) {
      setName(list.name)
      setDescription(list.description || '')
      setColor(list.color || '#06b6d4')
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
      setColor('#06b6d4')
      setEditingId(null)
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Не удалось обновить список')
    }
  }

  const handleCancelEdit = () => {
    setName('')
    setDescription('')
    setColor('#06b6d4')
    setEditingId(null)
  }

  const handleDelete = async (listId: string) => {
    try {
      await deleteList(listId)
      setDeletingId(null)
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Не удалось удалить список')
    }
  }

  const handleArchive = async (listId: string, isArchived: boolean) => {
    try {
      await updateList(listId, { isArchived: !isArchived })
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Не удалось архивировать список')
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-white">
          {editingId ? 'Редактирование списка' : 'Управление списками'}
        </h2>
        <p className="text-sm text-zinc-400">
          {editingId
            ? 'Измените название, описание или цвет списка'
            : 'Создавайте и управляйте своими списками слов'}
        </p>
      </div>

      {/* Форма создания/редактирования */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-base">
            {editingId ? 'Редактировать список' : 'Создать новый список'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
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
              <label className="block text-sm font-medium text-zinc-300 mb-2">
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
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Цвет метки
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-20 rounded border border-zinc-700 bg-zinc-800 cursor-pointer"
                  disabled={isLoading}
                />
                <span className="text-sm text-zinc-400">{color}</span>
              </div>
            </div>

            {(localError || error) && (
              <div className="text-sm text-red-400 bg-red-950/50 border border-red-900/50 rounded p-3">
                {localError || error}
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
                  className="text-zinc-300 hover:text-white"
                >
                  Отмена
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Список существующих списков */}
      {customLists.length > 0 && (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-base">
              Мои списки ({customLists.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {customLists.map((list) => (
              <div
                key={list.id}
                className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/50 border border-zinc-800 hover:border-zinc-700 transition-colors"
                style={{ borderLeftColor: list.color, borderLeftWidth: '4px' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-white font-medium truncate">
                      {list.name}
                    </h4>
                    <span className="text-xs text-zinc-500 shrink-0">
                      {list.wordCount || 0} слов
                    </span>
                  </div>
                  {list.description && (
                    <p className="text-sm text-zinc-400 truncate mt-1">
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
                    className="text-cyan-400 hover:text-cyan-300"
                  >
                    Изменить
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleArchive(list.id, list.isArchived)}
                    disabled={isLoading}
                    className="text-zinc-400 hover:text-zinc-300"
                  >
                    {list.isArchived ? 'Восстановить' : 'Архивировать'}
                  </Button>

                  {deletingId === list.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-400">Удалить?</span>
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
                        className="text-zinc-400 hover:text-zinc-300"
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
            ))}
          </CardContent>
        </Card>
      )}

      {customLists.length === 0 && !editingId && (
        <div className="text-center py-8">
          <p className="text-zinc-400 mb-2">У вас пока нет пользовательских списков</p>
          <p className="text-sm text-zinc-500">
            Создайте первый список, чтобы начать организовывать свои слова
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
        >
          Закрыть
        </Button>
      </div>
    </div>
  )
}
