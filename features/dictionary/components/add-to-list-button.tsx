'use client'

import { useState, useEffect, useRef, useLayoutEffect } from 'react'
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

  const updateMenuPosition = () => {
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
  }

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
  }, [isOpen])

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

      {isOpen && menuPosition && typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed w-64 bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg max-h-80 overflow-y-auto"
            style={{
              top: `${menuPosition.top}px`,
              left: `${menuPosition.left}px`,
              zIndex: PORTAL_Z_INDEX
            }}
          >
            <div className="p-3 border-b border-zinc-800">
              <h4 className="text-sm font-semibold text-white">Добавить в список</h4>
            </div>

            {isLoading ? (
              <div className="p-4 text-center text-sm text-zinc-400">
                Загрузка...
              </div>
            ) : customLists.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-sm text-зinc-400 mb-2">Нет доступных списков</p>
                <p className="text-xs text-зinc-500">
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
          </div>,
          document.body
        )}
    </div>
  )
}
