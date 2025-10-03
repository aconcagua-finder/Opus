'use client'

import { useState } from 'react'
import { DictionaryEntry } from '../types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface WordCardProps {
  entry: DictionaryEntry
  onEdit?: (entry: DictionaryEntry) => void
  onDelete?: (entry: DictionaryEntry) => void
  showActions?: boolean
  showNotes?: boolean
}

export function WordCard({ entry, onEdit, onDelete, showActions = true, showNotes = true }: WordCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDeleteClick = () => {
    if (showDeleteConfirm) {
      onDelete?.(entry)
      setShowDeleteConfirm(false)
    } else {
      setShowDeleteConfirm(true)
      // Автоматически скрываем подтверждение через 3 секунды
      setTimeout(() => setShowDeleteConfirm(false), 3000)
    }
  }

  return (
    <Card 
      className="bg-zinc-950/50 border-zinc-800/50 backdrop-blur hover:border-cyan-900/50 transition-all duration-200 cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <CardContent className="p-4">
        <div className="min-h-[120px] flex flex-col justify-between">
          {!isFlipped ? (
            // Front side - показываем слово
            <div className="text-center">
              <div className="mb-2 text-2xl font-semibold text-white break-words">
                {entry.word}
              </div>
              <div className="text-xs text-zinc-400">
                Нажмите для перевода
              </div>
            </div>
          ) : (
            // Back side - показываем перевод
            <div className="text-center">
              <div className="mb-2 text-xl font-medium text-cyan-300 break-words">
                {entry.translation}
              </div>
              {showNotes && entry.notes && (
                <div className="text-sm text-zinc-400 italic">
                  {entry.notes}
                </div>
              )}
              <div className="text-xs text-zinc-500 mt-2">
                Просмотров: {entry.timesViewed}
              </div>
            </div>
          )}

          {showActions && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-zinc-500">
                  {new Date(entry.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation()
                      onEdit?.(entry)
                    }}
                    className="h-7 w-7 p-0 text-zinc-400 hover:text-cyan-400"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className={`h-7 w-7 p-0 transition-colors ${
                      showDeleteConfirm 
                        ? 'text-red-400 hover:text-red-300' 
                        : 'text-zinc-400 hover:text-red-400'
                    }`}
                  >
                    {showDeleteConfirm ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
