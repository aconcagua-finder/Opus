'use client'

import { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useWordLists } from '../hooks/use-word-lists'
import { Button } from '@/components/ui/button'

interface AddToListButtonProps {
  entryId: string
  compact?: boolean
}

const MENU_WIDTH = 256 // w-64
const PORTAL_Z_INDEX = 2000

export function AddToListButton({ entryId, compact = false }: AddToListButtonProps) {
  const {
    customLists,
    addEntryToList,
    removeEntryFromList,
    getListsForEntry,
    ensureLists
  } = useWordLists()

  const [listsWithEntry, setListsWithEntry] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)

  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Загрузить списки, в которых есть это слово
  useEffect(() => {
    if (isOpen) {
      ensureLists()
    }

    if (isOpen) {
      setIsLoading(true)
      getListsForEntry(entryId)
        .then(setListsWithEntry)
        .finally(() => setIsLoading(false))
    }
  }, [entryId, ensureLists, getListsForEntry, isOpen])

  const updateMenuPosition = useCallback(() => {
    if (!isOpen || typeof window === 'undefined') {
      setMenuPosition(null)
      return
    }

    const buttonRect = buttonRef.current?.getBoundingClientRect()

    if (!buttonRect) {
      setMenuPosition(null)
      return
    }

    const margin = 8
    const computedLeft = Math.min(
      Math.max(buttonRect.right - MENU_WIDTH, margin),
      window.innerWidth - MENU_WIDTH - margin
    )
    const computedTop = Math.min(
      buttonRect.bottom + margin,
      window.innerHeight - margin
    )

    setMenuPosition({ top: computedTop, left: computedLeft })
  }, [isOpen])

  useLayoutEffect(() => {
    if (!isOpen) {
      return
    }

    updateMenuPosition()

    const handleResize = () => updateMenuPosition()
    const handleScroll = () => updateMenuPosition()

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleScroll, true)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [isOpen, updateMenuPosition])

  // Закрытие по клику вне элемента
  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleClickOutside = (event: MouseEvent) => {
      const menuNode = menuRef.current
      const buttonNode = buttonRef.current
      const target = event.target as Node | null

      if (menuNode?.contains(target) || buttonNode?.contains(target)) {
        return
      }

      setIsOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)

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

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev)
  }

  return (
    <div className="relative inline-flex">
      <Button
        ref={buttonRef}
        type="button"
        variant="ghost"
        size={compact ? 'sm' : 'default'}
        onClick={toggleDropdown}
        className="relative text-muted transition-colors hover:text-accent"
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
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent-primary)] text-[10px] text-[var(--text-on-accent)]">
            {listsCount}
          </span>
        )}
      </Button>

      {isOpen && menuPosition && typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed w-64 bg-surface-muted border border-subtle rounded-lg shadow-lg max-h-80 overflow-y-auto"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              zIndex: PORTAL_Z_INDEX
            }}
          >
            <div className="border-b border-subtle p-3">
              <h4 className="text-sm font-semibold text-primary">Добавить в список</h4>
            </div>

            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted">
                Загрузка...
              </div>
            ) : customLists.length === 0 ? (
              <div className="p-4 text-center">
                <p className="mb-2 text-sm text-muted">Нет доступных списков</p>
                <p className="text-xs text-muted">
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
                      className="flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-surface-muted"
                    >
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                          isInList
                            ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-[var(--text-on-accent)]'
                            : 'border-subtle'
                        }`}
                      >
                        {isInList && (
                          <svg
                            className="w-3 h-3 text-primary"
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
                          <span className="truncate text-sm text-primary">
                            {list.name}
                          </span>
                        </div>
                        {list.description && (
                          <p className="mt-0.5 truncate text-xs text-muted">
                            {list.description}
                          </p>
                        )}
                      </div>

                      <span className="shrink-0 text-xs text-muted">
                        {list.wordCount || 0}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  )
}
