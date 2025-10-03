'use client'

import { useState } from 'react'
import { useWordLists } from '../hooks/use-word-lists'
import { WordListType, WORD_LIST_TYPE_ICONS } from '../types'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

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
      <div className="bg-zinc-950/50 border border-zinc-800/50 backdrop-blur rounded-lg px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
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
          className="text-cyan-400 hover:text-cyan-300"
        >
          Развернуть
        </Button>
      </div>
    )
  }

  if (compact) {
    // Компактный режим для мобильных устройств
    return (
      <div className="bg-zinc-950/50 border border-zinc-800/50 backdrop-blur rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Мои списки</h3>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onManageClick}
              className="text-cyan-400 hover:text-cyan-300"
            >
              Управление
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(true)}
              className="text-zinc-400 hover:text-cyan-300"
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
            className={
              !activeListId
                ? 'w-full bg-cyan-600 hover:bg-cyan-700 justify-start'
                : 'w-full text-zinc-300 hover:text-cyan-300 justify-start'
            }
          >
            <span className="mr-2">📚</span>
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
              className={
                activeListId === list.id
                  ? 'w-full bg-cyan-600 hover:bg-cyan-700 justify-between'
                  : 'w-full text-zinc-300 hover:text-cyan-300 justify-between'
              }
            >
              <span className="flex items-center gap-2">
                <span>{WORD_LIST_TYPE_ICONS[list.type]}</span>
                <span>{list.name}</span>
              </span>
              <span className="text-xs opacity-70">
                {list.wordCount || 0}
              </span>
            </Button>
          ))}

          {/* Кастомные списки */}
          {customLists.length > 0 && (
            <>
              <div className="border-t border-zinc-800/50 my-2 pt-2">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
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
                  className={
                    activeListId === list.id
                      ? 'w-full bg-cyan-600 hover:bg-cyan-700 justify-between'
                      : 'w-full text-zinc-300 hover:text-cyan-300 justify-between'
                  }
                  style={
                    list.color && activeListId !== list.id
                      ? { borderLeftColor: list.color, borderLeftWidth: '3px' }
                      : undefined
                  }
                >
                  <span className="flex items-center gap-2 truncate">
                    <span>📋</span>
                    <span className="truncate">{list.name}</span>
                  </span>
                  <span className="text-xs opacity-70 ml-2 shrink-0">
                    {list.wordCount || 0}
                  </span>
                </Button>
              ))}
            </>
          )}
        </div>

        {isLoading && (
          <div className="text-xs text-zinc-500 text-center py-2">
            Загрузка...
          </div>
        )}
      </div>
    )
  }

  // Обычный режим (Card)
  return (
    <Card className="bg-zinc-950/50 border-zinc-800/50 backdrop-blur">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-white text-base font-semibold">
            Мои списки
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onManageClick}
              className="text-cyan-400 hover:text-cyan-300"
            >
              Управление
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(true)}
              className="text-zinc-400 hover:text-cyan-300"
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
          className={
            !activeListId
              ? 'w-full bg-cyan-600 hover:bg-cyan-700 justify-start'
              : 'w-full text-zinc-300 hover:text-cyan-300 justify-start'
          }
        >
          <span className="mr-2">📚</span>
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
            className={
              activeListId === list.id
                ? 'w-full bg-cyan-600 hover:bg-cyan-700 justify-between'
                : 'w-full text-zinc-300 hover:text-cyan-300 justify-between'
            }
          >
            <span className="flex items-center gap-2">
              <span>{WORD_LIST_TYPE_ICONS[list.type]}</span>
              <span>{list.name}</span>
            </span>
            <span className="text-xs opacity-70">
              {list.wordCount || 0}
            </span>
          </Button>
        ))}

        {/* Кастомные списки */}
        {customLists.length > 0 && (
          <>
            <div className="border-t border-zinc-800/50 my-2 pt-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
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
                className={
                  activeListId === list.id
                    ? 'w-full bg-cyan-600 hover:bg-cyan-700 justify-between'
                    : 'w-full text-zinc-300 hover:text-cyan-300 justify-between'
                }
                style={
                  list.color && activeListId !== list.id
                    ? { borderLeftColor: list.color, borderLeftWidth: '3px' }
                    : undefined
                }
              >
                <span className="flex items-center gap-2 truncate">
                  <span>📋</span>
                  <span className="truncate">{list.name}</span>
                </span>
                <span className="text-xs opacity-70 ml-2 shrink-0">
                  {list.wordCount || 0}
                </span>
              </Button>
            ))}
          </>
        )}

        {isLoading && (
          <div className="text-xs text-zinc-500 text-center py-2">
            Загрузка...
          </div>
        )}
      </CardContent>
    </Card>
  )
}
