'use client'

import { useEffect, useState } from 'react'
import { DictionaryEntry, DictionaryListContentMode } from '../types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AddToListButton } from './add-to-list-button'
import { cn } from '@/lib/utils'

interface WordCardProps {
  entry: DictionaryEntry
  mode: DictionaryListContentMode
  onEdit?: (entry: DictionaryEntry) => void
  onDelete?: (entry: DictionaryEntry) => void
  showActions?: boolean
  showNotes?: boolean
}

export function WordCard({
  entry,
  mode,
  onEdit,
  onDelete,
  showActions = true,
  showNotes = true,
}: WordCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const showWord = mode !== DictionaryListContentMode.TRANSLATION_ONLY
  const showTranslation = mode !== DictionaryListContentMode.SOURCE_ONLY
  const cardFlippable = showWord && showTranslation
  const notesVisible = showNotes && entry.notes && mode !== DictionaryListContentMode.SOURCE_ONLY

  useEffect(() => {
    setIsFlipped(false)
    setShowDeleteConfirm(false)
  }, [mode, entry.id])

  const handleDeleteClick = () => {
    if (!onDelete) {
      return
    }

    if (showDeleteConfirm) {
      onDelete(entry)
      setShowDeleteConfirm(false)
      return
    }

    setShowDeleteConfirm(true)
    setTimeout(() => setShowDeleteConfirm(false), 3000)
  }

  const handleCardClick = () => {
    if (cardFlippable) {
      setIsFlipped((prev) => !prev)
    }
  }

  const showFront = cardFlippable ? !isFlipped : true
  const displayingWord = showFront && showWord
  const displayingTranslation = cardFlippable ? !showFront : showTranslation && !showWord

  const infoLine = cardFlippable
    ? showFront
      ? 'Нажмите для перевода'
      : 'Нажмите, чтобы вернуться к слову'
    : showWord
      ? 'Перевод скрыт настройками'
      : 'Оригинал скрыт настройками'

  return (
    <Card
      className={cn(
        'border border-soft bg-surface-muted transition-colors duration-200',
        cardFlippable ? 'cursor-pointer hover:border-subtle' : 'cursor-default'
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex min-h-[120px] flex-col justify-between">
          <div className="text-center">
            {displayingWord && (
              <div className="mb-2 break-words text-2xl font-semibold text-primary">
                {entry.word}
              </div>
            )}

            {displayingTranslation && (
              <div className="mb-2 break-words text-xl font-medium text-accent">
                {entry.translation}
              </div>
            )}

            {!displayingWord && !displayingTranslation && showWord && (
              <div className="mb-2 break-words text-2xl font-semibold text-primary">
                {entry.word}
              </div>
            )}

            <div className="mt-2 text-xs text-muted">
              {infoLine}
            </div>

            {displayingTranslation && (
              <>
                {notesVisible && (
                  <div className="mt-2 text-sm italic text-muted">
                    {entry.notes}
                  </div>
                )}
                <div className="mt-2 text-xs text-muted">
                  Просмотров: {entry.timesViewed}
                </div>
              </>
            )}
          </div>

          {showActions && (
            <div className="mt-4 flex items-center justify-between border-t border-subtle pt-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-muted">
                  {new Date(entry.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div
                className="flex items-center space-x-2"
                onClick={(event) => {
                  event.stopPropagation()
                }}
              >
                <AddToListButton entryId={entry.id} compact />

                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation()
                      onEdit(entry)
                    }}
                    className="h-7 w-7 p-0 text-muted hover:text-accent"
                  >
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
                      handleDeleteClick()
                    }}
                    className={cn(
                      'h-7 w-7 p-0 transition-colors',
                      showDeleteConfirm ? 'text-red-400 hover:text-red-300' : 'text-muted hover:text-red-400'
                    )}
                  >
                    {showDeleteConfirm ? (
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
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
