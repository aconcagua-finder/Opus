'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  useDictionary,
  useDictionaryPagination,
  useDictionaryFilters,
  useDictionaryPreferences
} from '../hooks/use-dictionary'
import { useWordLists } from '../hooks/use-word-lists'
import {
  DictionaryEntry,
  DictionaryListContentMode,
  DictionaryViewMode
} from '../types'
import { WordCard } from './word-card'
import { LanguageSelector } from './language-selector'
import { WordListItem } from './word-list-item'
import { WordListsPanel } from './word-lists-panel'
import { WordListManager } from './word-list-manager'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Modal } from '@/components/ui/modal'

interface DictionaryListProps {
  onEditWord?: (entry: DictionaryEntry) => void
}

export function DictionaryList({ onEditWord }: DictionaryListProps) {
  const { entries, isLoading, error, deleteEntry, hasEntries, isEmpty } = useDictionary()
  const { pagination, loadMore, canLoadMore } = useDictionaryPagination()
  const { filters, updateFilter, clearFilters, hasActiveFilters } = useDictionaryFilters()
  const {
    viewMode,
    listContentMode,
    setViewMode,
    setListContentMode,
    showNotes,
    setShowNotes,
    filtersPanelCollapsed,
    setFiltersPanelCollapsed,
    resetDefaults
  } = useDictionaryPreferences()
  const { activeListId } = useWordLists()

  const [searchInput, setSearchInput] = useState(filters.search || '')
  const [showListManager, setShowListManager] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const isListView = viewMode === DictionaryViewMode.LIST

  // Синхронизируем активный список с фильтрами
  useEffect(() => {
    updateFilter('listId', activeListId || undefined)
  }, [activeListId, updateFilter])

  const remainingCount = useMemo(() => {
    if (!pagination) return 0
    return Math.max(pagination.total - entries.length, 0)
  }, [pagination, entries.length])

  const nextBatchCount = useMemo(() => {
    if (!pagination) return 0
    return Math.min(remainingCount, pagination.limit)
  }, [pagination, remainingCount])

  useEffect(() => {
    if (!loadMoreRef.current || !canLoadMore) {
      return
    }

    const observer = new IntersectionObserver((observerEntries) => {
      observerEntries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadMore()
        }
      })
    }, {
      rootMargin: '200px 0px'
    })

    const current = loadMoreRef.current
    observer.observe(current)

    return () => {
      observer.unobserve(current)
      observer.disconnect()
    }
  }, [loadMore, canLoadMore])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilter('search', searchInput.trim() || undefined)
  }

  const handleClearSearch = () => {
    setSearchInput('')
    updateFilter('search', undefined)
  }

  if (isLoading && !hasEntries) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="bg-red-950/50 border-red-900/50">
        <CardContent className="p-6 text-center">
          <p className="text-red-200 mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700"
          >
            Перезагрузить
          </Button>
        </CardContent>
      </Card>
    )
  }

  const filtersPanel = (
    <Card className="bg-zinc-950/50 border-zinc-800/50 backdrop-blur">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-white text-base font-semibold">
            Фильтры
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-cyan-400 hover:text-cyan-300"
              >
                Сбросить
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFiltersPanelCollapsed(true)}
              className="text-zinc-400 hover:text-cyan-300"
            >
              Свернуть
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex space-x-2">
          <div className="flex-1 relative">
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Поиск по словам и переводам..."
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700">
            Найти
          </Button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Язык слова
            </label>
            <LanguageSelector
              value={filters.sourceLanguage}
              onChange={(language) => updateFilter('sourceLanguage', language)}
              placeholder="Все языки"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Язык перевода
            </label>
            <LanguageSelector
              value={filters.targetLanguage}
              onChange={(language) => updateFilter('targetLanguage', language)}
              placeholder="Все языки"
            />
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-zinc-900/60">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-zinc-300">
                Формат отображения
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={viewMode === DictionaryViewMode.CARDS ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode(DictionaryViewMode.CARDS)}
                  aria-pressed={viewMode === DictionaryViewMode.CARDS}
                  className={
                    viewMode === DictionaryViewMode.CARDS
                      ? 'bg-cyan-600 hover:bg-cyan-700'
                      : 'text-zinc-300 hover:text-cyan-300'
                  }
                >
                  Карточки
                </Button>
                <Button
                  type="button"
                  variant={viewMode === DictionaryViewMode.LIST ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode(DictionaryViewMode.LIST)}
                  aria-pressed={viewMode === DictionaryViewMode.LIST}
                  className={
                    viewMode === DictionaryViewMode.LIST
                      ? 'bg-cyan-600 hover:bg-cyan-700'
                      : 'text-zinc-300 hover:text-cyan-300'
                  }
                >
                  Список
                </Button>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetDefaults}
              className="self-start text-cyan-400 hover:text-cyan-300"
            >
              Сбросить формат
            </Button>
          </div>

          {isListView && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-zinc-300">
                Вид списка
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={listContentMode === DictionaryListContentMode.FULL ? 'default' : 'ghost'}
                  onClick={() => setListContentMode(DictionaryListContentMode.FULL)}
                  aria-pressed={listContentMode === DictionaryListContentMode.FULL}
                  className={
                    listContentMode === DictionaryListContentMode.FULL
                      ? 'bg-cyan-600 hover:bg-cyan-700'
                      : 'text-zinc-300 hover:text-cyan-300'
                  }
                >
                  С переводом
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={listContentMode === DictionaryListContentMode.SOURCE_ONLY ? 'default' : 'ghost'}
                  onClick={() => setListContentMode(DictionaryListContentMode.SOURCE_ONLY)}
                  aria-pressed={listContentMode === DictionaryListContentMode.SOURCE_ONLY}
                  className={
                    listContentMode === DictionaryListContentMode.SOURCE_ONLY
                      ? 'bg-cyan-600 hover:bg-cyan-700'
                      : 'text-zinc-300 hover:text-cyan-300'
                  }
                >
                  Без перевода
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={listContentMode === DictionaryListContentMode.TRANSLATION_ONLY ? 'default' : 'ghost'}
                  onClick={() => setListContentMode(DictionaryListContentMode.TRANSLATION_ONLY)}
                  aria-pressed={listContentMode === DictionaryListContentMode.TRANSLATION_ONLY}
                  className={
                    listContentMode === DictionaryListContentMode.TRANSLATION_ONLY
                      ? 'bg-cyan-600 hover:bg-cyan-700'
                      : 'text-зinc-300 hover:text-cyan-300'
                  }
                >
                  Только перевод
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium text-zinc-300">
              Подсказки
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={showNotes ? 'default' : 'ghost'}
                onClick={() => setShowNotes(true)}
                aria-pressed={showNotes}
                className={
                  showNotes
                    ? 'bg-cyan-600 hover:bg-cyan-700'
                    : 'text-zinc-300 hover:text-cyan-300'
                }
              >
                Показывать
              </Button>
              <Button
                type="button"
                size="sm"
                variant={!showNotes ? 'default' : 'ghost'}
                onClick={() => setShowNotes(false)}
                aria-pressed={!showNotes}
                className={
                  !showNotes
                    ? 'bg-cyan-600 hover:bg-cyan-700'
                    : 'text-zinc-300 hover:text-cyan-300'
                }
              >
                Скрывать
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const collapsedFiltersPanel = (
    <div className="bg-zinc-950/50 border border-zinc-800/50 backdrop-blur rounded-lg px-4 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 01.894 1.447L16 12.118V19a1 1 0 01-1.447.894l-4-2A1 1 0 0110 17v-4.882L3.106 4.447A1 1 0 013 4z" />
        </svg>
        <span className="flex items-center gap-2">
          Фильтры скрыты
          {hasActiveFilters && (
            <span className="inline-flex h-2 w-2 rounded-full bg-cyan-400" aria-hidden="true" />
          )}
        </span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setFiltersPanelCollapsed(false)}
        className="text-cyan-400 hover:text-cyan-300"
      >
        Развернуть
      </Button>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Модальное окно управления списками */}
      {showListManager && (
        <Modal open onClose={() => setShowListManager(false)}>
          <WordListManager onClose={() => setShowListManager(false)} />
        </Modal>
      )}

      {/* Панель списков */}
      <WordListsPanel
        onManageClick={() => setShowListManager(true)}
      />

      {filtersPanelCollapsed ? collapsedFiltersPanel : filtersPanel}

      {isEmpty ? (
        <Card className="bg-zinc-950/50 border-zinc-800/50 backdrop-blur">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {hasActiveFilters ? 'Слова не найдены' : 'Словарь пуст'}
            </h3>
            <p className="text-zinc-400 mb-4">
              {hasActiveFilters
                ? 'Попробуйте изменить фильтры или добавить новые слова'
                : 'Начните изучение, добавив первое слово в свой словарь'}
            </p>
            {hasActiveFilters && (
              <Button
                onClick={clearFilters}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                Сбросить фильтры
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {isListView ? (
            <div className="space-y-3">
              {entries.map((entry) => (
                <WordListItem
                  key={entry.id}
                  entry={entry}
                  mode={listContentMode}
                  showNotes={showNotes}
                  onEdit={onEditWord}
                  onDelete={async (selected) => {
                    try {
                      await deleteEntry(selected.id)
                    } catch (err) {
                      console.error('Failed to delete entry', err)
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {entries.map((entry) => (
                <WordCard
                  key={entry.id}
                  entry={entry}
                  showNotes={showNotes}
                  onEdit={onEditWord}
                  onDelete={async (selected) => {
                    try {
                      await deleteEntry(selected.id)
                    } catch (err) {
                      console.error('Failed to delete entry', err)
                    }
                  }}
                />
              ))}
            </div>
          )}

          {pagination && (
            <div className="flex flex-col items-center gap-4 pt-6">
              <div className="text-sm text-zinc-400">
                Показано {entries.length} из {pagination.total} слов
              </div>
              {canLoadMore && (
                <>
                  <div ref={loadMoreRef} className="h-1 w-full" aria-hidden="true" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadMore}
                    disabled={isLoading}
                    className="border-cyan-700 text-cyan-300 hover:bg-cyan-950"
                  >
                    Загрузить ещё {nextBatchCount || pagination.limit} слов
                  </Button>
                </>
              )}
            </div>
          )}
        </>
      )}

      {isLoading && hasEntries && (
        <div className="fixed bottom-4 right-4 bg-zinc-900 border border-zinc-700 rounded-lg p-3 flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-cyan-500"></div>
          <span className="text-sm text-white">Загрузка...</span>
        </div>
      )}
    </div>
  )
}
