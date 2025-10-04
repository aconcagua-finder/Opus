'use client'

import { useEffect, useRef, useState } from 'react'
import { DictionaryEntry, DictionaryListContentMode } from '../types'
import { Button } from '@/components/ui/button'
import { AddToListButton } from './add-to-list-button'

interface WordListItemProps {
  entry: DictionaryEntry
  mode: DictionaryListContentMode
  showNotes: boolean
  onEdit?: (entry: DictionaryEntry) => void
  onDelete?: (entry: DictionaryEntry) => void
  showActions?: boolean
}

export function WordListItem({ entry, mode, showNotes, onEdit, onDelete, showActions = true }: WordListItemProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [sourceVisible, setSourceVisible] = useState(mode !== DictionaryListContentMode.TRANSLATION_ONLY)
  const [translationVisible, setTranslationVisible] = useState(mode !== DictionaryListContentMode.SOURCE_ONLY)
  const [notesVisible, setNotesVisible] = useState(showNotes && mode === DictionaryListContentMode.FULL)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setSourceVisible(mode !== DictionaryListContentMode.TRANSLATION_ONLY)
    setTranslationVisible(mode !== DictionaryListContentMode.SOURCE_ONLY)
    setNotesVisible(showNotes && mode === DictionaryListContentMode.FULL)
  }, [mode, showNotes, entry.id])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleDelete = () => {
    if (!onDelete) return

    if (confirmDelete) {
      onDelete(entry)
      setConfirmDelete(false)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      return
    }

    setConfirmDelete(true)
    timeoutRef.current = setTimeout(() => {
      setConfirmDelete(false)
    }, 3000)
  }

  const canToggleSource = mode === DictionaryListContentMode.TRANSLATION_ONLY
  const canToggleTranslation = mode === DictionaryListContentMode.SOURCE_ONLY
  const canToggleNotes = showNotes && !!entry.notes && mode !== DictionaryListContentMode.FULL

  const toggleButtonBase = 'max-w-full text-left transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60'

  return (
    <div className="rounded-xl border border-soft bg-surface-muted p-4 shadow-sm transition-colors hover:border-subtle">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            {canToggleSource ? (
              <button
                type="button"
                onClick={() => setSourceVisible((prev) => !prev)}
                className={`${toggleButtonBase} ${
                  sourceVisible
                    ? 'cursor-pointer text-lg font-semibold text-primary'
                    : 'cursor-pointer text-sm text-muted italic underline underline-offset-2'
                }`}
              >
                {sourceVisible ? entry.word : 'Показать оригинал'}
              </button>
            ) : (
              <span className="text-lg font-semibold text-primary break-words">
                {entry.word}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {canToggleTranslation ? (
              <button
                type="button"
                onClick={() => setTranslationVisible((prev) => !prev)}
                className={`${toggleButtonBase} ${
                  translationVisible
                    ? 'cursor-pointer text-lg font-medium text-accent'
                    : 'cursor-pointer text-sm text-muted italic underline underline-offset-2'
                }`}
              >
                {translationVisible ? entry.translation : 'Показать перевод'}
              </button>
            ) : (
              <span className="text-lg font-medium text-accent break-words">
                {entry.translation}
              </span>
            )}
          </div>

          {showNotes && entry.notes && (
            mode === DictionaryListContentMode.FULL ? (
              <div className="text-sm text-muted italic">
                {entry.notes}
              </div>
            ) : (
              <div className="space-y-2">
                {canToggleNotes ? (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setNotesVisible((prev) => !prev)}
                      className="h-7 px-2 text-muted hover:text-accent"
                    >
                      {notesVisible ? 'Скрыть подсказку' : 'Показать подсказку'}
                    </Button>
                    {notesVisible && (
                      <div className="text-sm text-muted italic">
                        {entry.notes}
                      </div>
                    )}
                  </>
                ) : (
                  notesVisible && (
                    <div className="text-sm text-muted italic">
                      {entry.notes}
                    </div>
                  )
                )}
              </div>
            )
          )}
        </div>

        <div className="flex w-full flex-col gap-3 text-sm text-muted sm:w-auto sm:items-end">
          {showActions && (onEdit || onDelete) && (
            <div className="flex items-center justify-start gap-2 sm:justify-end">
              <AddToListButton entryId={entry.id} compact />

              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation()
                    onEdit?.(entry)
                  }}
                  className="h-8 px-2 text-muted hover:text-accent"
                >
                  <span className="sr-only">Редактировать</span>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </Button>
              )}

              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation()
                    handleDelete()
                  }}
                  className={`h-8 px-2 transition-colors ${
                    confirmDelete
                      ? 'text-red-400 hover:text-red-300'
                      : 'text-muted hover:text-red-400'
                  }`}
                >
                  <span className="sr-only">Удалить</span>
                  {confirmDelete ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
