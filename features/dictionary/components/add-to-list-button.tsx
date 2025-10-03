'use client'

import { useState, useEffect, useRef } from 'react'
import { useWordLists } from '../hooks/use-word-lists'
import { Button } from '@/components/ui/button'

interface AddToListButtonProps {
  entryId: string
  compact?: boolean
}

export function AddToListButton({ entryId, compact = false }: AddToListButtonProps) {
  const {
    customLists,
    addEntryToList,
    removeEntryFromList,
    getListsForEntry
  } = useWordLists()

  const [listsWithEntry, setListsWithEntry] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Загрузить списки, в которых есть это слово
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      getListsForEntry(entryId)
        .then(setListsWithEntry)
        .finally(() => setIsLoading(false))
    }
  }, [entryId, isOpen, getListsForEntry])

  // Закрытие по клику вне элемента
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleToggleList = async (listId: string) => {
    const isInList = listsWithEntry.includes(listId)

    try {
      if (isInList) {
        await removeEntryFromList(listId, entryId)
        setListsWithEntry(prev => prev.filter(id => id !== listId))
      } else {
        await addEntryToList(listId, entryId)
        setListsWithEntry(prev => [...prev, listId])
      }
    } catch (err) {
      console.error('Failed to toggle list:', err)
    }
  }

  if (customLists.length === 0) {
    return null
  }

  const listsCount = listsWithEntry.length

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        type="button"
        variant="ghost"
        size={compact ? 'sm' : 'default'}
        onClick={() => setIsOpen(!isOpen)}
        className="text-zinc-400 hover:text-cyan-300 relative"
        title="Добавить в список"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        {!compact && <span className="ml-2">В список</span>}
        {listsCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-cyan-500 text-white text-[10px] flex items-center justify-center">
            {listsCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          <div className="p-3 border-b border-zinc-800">
            <h4 className="text-sm font-semibold text-white">Добавить в список</h4>
          </div>

          {isLoading ? (
            <div className="p-4 text-center text-sm text-zinc-400">
              Загрузка...
            </div>
          ) : customLists.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-zinc-400 mb-2">Нет доступных списков</p>
              <p className="text-xs text-zinc-500">
                Создайте список в управлении списками
              </p>
            </div>
          ) : (
            <div className="py-2">
              {customLists.map((list) => {
                const isInList = listsWithEntry.includes(list.id)

                return (
                  <button
                    key={list.id}
                    type="button"
                    onClick={() => handleToggleList(list.id)}
                    className="w-full px-4 py-2 flex items-center gap-3 hover:bg-zinc-800 transition-colors text-left"
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        isInList
                          ? 'bg-cyan-600 border-cyan-600'
                          : 'border-zinc-600'
                      }`}
                    >
                      {isInList && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {list.color && (
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: list.color }}
                          />
                        )}
                        <span className="text-sm text-white truncate">
                          {list.name}
                        </span>
                      </div>
                      {list.description && (
                        <p className="text-xs text-zinc-500 truncate mt-0.5">
                          {list.description}
                        </p>
                      )}
                    </div>

                    <span className="text-xs text-zinc-500 shrink-0">
                      {list.wordCount || 0}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
