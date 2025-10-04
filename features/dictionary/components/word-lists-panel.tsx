'use client'

import { useState } from 'react'
import { useWordLists } from '../hooks/use-word-lists'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface WordListsPanelProps {
  onManageClick: () => void
  compact?: boolean
}

export function WordListsPanel({ onManageClick, compact = false }: WordListsPanelProps) {
  const {
    autoLists,
    customLists,
    activeListId,
    setActiveListId,
    isLoading
  } = useWordLists()

  const [isCollapsed, setIsCollapsed] = useState(false)

  const handleListClick = (listId: string | null) => {
    if (activeListId === listId) {
      // Если кликнули на уже активный список - снимаем фильтр
      setActiveListId(null)
    } else {
      setActiveListId(listId)
    }
  }

  if (isCollapsed) {
    return (
      <div className="bg-surface-muted border border-subtle backdrop-blur rounded-lg px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-muted">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span>Списки скрыты</span>
          {activeListId && (
            <span className="inline-flex h-2 w-2 rounded-full bg-cyan-400" aria-hidden="true" />
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(false)}
          className="text-accent hover:text-accent"
        >
          Развернуть
        </Button>
      </div>
    )
  }

  if (compact) {
    // Компактный режим для мобильных устройств
    return (
      <div className="bg-surface-muted border border-subtle backdrop-blur rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-primary">Мои списки</h3>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onManageClick}
              className="text-accent hover:text-accent"
            >
              Управление
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(true)}
              className="text-muted hover:text-accent"
            >
              Свернуть
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Button
            type="button"
            variant={!activeListId ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleListClick(null)}
            className={cn('w-full justify-start px-3', activeListId ? 'text-secondary hover:text-accent' : '')}
          >
            Все слова
          </Button>

          {/* Авто-списки */}
          {autoLists.map((list) => (
            <Button
              key={list.id}
              type="button"
              variant={activeListId === list.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleListClick(list.id)}
              className={cn('w-full justify-between px-3', activeListId !== list.id && 'text-secondary hover:text-accent')}
            >
              <span className="truncate">{list.name}</span>
              <span className="text-xs opacity-70">
                {list.wordCount || 0}
              </span>
            </Button>
          ))}

          {/* Кастомные списки */}
          {customLists.length > 0 && (
            <>
              <div className="border-t border-subtle my-2 pt-2">
                <p className="text-xs text-muted uppercase tracking-wider mb-2">
                  Мои списки
                </p>
              </div>

              {customLists.map((list) => (
                <Button
                  key={list.id}
                  type="button"
                  variant={activeListId === list.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleListClick(list.id)}
                  className={cn('w-full justify-between px-3', activeListId !== list.id && 'text-secondary hover:text-accent')}
                  style={
                    list.color && activeListId !== list.id
                      ? {
                          borderLeftColor: list.color,
                          borderLeftWidth: '3px',
                          borderLeftStyle: 'solid'
                        }
                      : undefined
                  }
                >
                  <span className="flex items-center gap-2 truncate">
                    {list.color && (
                      <span
                        className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: list.color }}
                        aria-hidden="true"
                      />
                    )}
                    <span className="truncate">{list.name}</span>
                  </span>
                  <span className="ml-2 shrink-0 text-xs opacity-70">
                    {list.wordCount || 0}
                  </span>
                </Button>
              ))}
            </>
          )}
        </div>

        {isLoading && (
          <div className="text-xs text-muted text-center py-2">
            Загрузка...
          </div>
        )}
      </div>
    )
  }

  // Обычный режим (Card)
  return (
    <Card className="bg-surface-muted border-subtle backdrop-blur">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-primary text-base font-semibold">
            Мои списки
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onManageClick}
              className="text-accent hover:text-accent"
            >
              Управление
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(true)}
              className="text-muted hover:text-accent"
            >
              Свернуть
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          type="button"
          variant={!activeListId ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleListClick(null)}
          className={cn('w-full justify-start px-3', activeListId ? 'text-secondary hover:text-accent' : '')}
        >
          Все слова
        </Button>

        {/* Авто-списки */}
        {autoLists.map((list) => (
          <Button
            key={list.id}
            type="button"
            variant={activeListId === list.id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleListClick(list.id)}
            className={cn('w-full justify-between px-3', activeListId !== list.id && 'text-secondary hover:text-accent')}
          >
            <span className="truncate">{list.name}</span>
            <span className="text-xs opacity-70">
              {list.wordCount || 0}
            </span>
          </Button>
        ))}

        {/* Кастомные списки */}
        {customLists.length > 0 && (
          <>
            <div className="border-t border-subtle my-2 pt-2">
              <p className="text-xs text-muted uppercase tracking-wider mb-2">
                Мои списки
              </p>
            </div>

            {customLists.map((list) => (
              <Button
                key={list.id}
                type="button"
                variant={activeListId === list.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleListClick(list.id)}
                className={cn('w-full justify-between px-3', activeListId !== list.id && 'text-secondary hover:text-accent')}
                style={
                  list.color && activeListId !== list.id
                    ? {
                        borderLeftColor: list.color,
                        borderLeftWidth: '3px',
                        borderLeftStyle: 'solid'
                      }
                    : undefined
                }
              >
                <span className="flex items-center gap-2 truncate">
                  {list.color && (
                    <span
                      className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: list.color }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="truncate">{list.name}</span>
                </span>
                <span className="ml-2 shrink-0 text-xs opacity-70">
                  {list.wordCount || 0}
                </span>
              </Button>
            ))}
          </>
        )}

        {isLoading && (
          <div className="text-xs text-muted text-center py-2">
            Загрузка...
          </div>
        )}
      </CardContent>
    </Card>
  )
}
