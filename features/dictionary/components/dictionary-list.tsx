'use client'

import { useState } from 'react'
import { useDictionary, useDictionaryPagination, useDictionaryFilters } from '../hooks/use-dictionary'
import { Language } from '../types'
import { WordCard } from './word-card'
import { LanguageSelector } from './language-selector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface DictionaryListProps {
  onEditWord?: (wordId: string) => void
}

export function DictionaryList({ onEditWord }: DictionaryListProps) {
  const { entries, isLoading, error, deleteEntry, hasEntries, isEmpty } = useDictionary()
  const { pagination, goToPage, nextPage, prevPage, canGoNext, canGoPrev } = useDictionaryPagination()
  const { filters, updateFilter, clearFilters, hasActiveFilters } = useDictionaryFilters()
  
  const [searchInput, setSearchInput] = useState(filters.search || '')

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

  return (
    <div className="space-y-6">
      {/* Фильтры и поиск */}
      <Card className="bg-zinc-950/50 border-zinc-800/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            Фильтры
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-cyan-400 hover:text-cyan-300"
              >
                Сбросить
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Поиск */}
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

          {/* Фильтры по языкам */}
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
        </CardContent>
      </Card>

      {/* Список слов */}
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
                : 'Начните изучение, добавив первое слово в свой словарь'
              }
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
          {/* Сетка карточек */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {entries.map((entry) => (
              <WordCard
                key={entry.id}
                entry={entry}
                onEdit={() => onEditWord?.(entry.id)}
                onDelete={async (entry) => {
                  try {
                    await deleteEntry(entry.id)
                  } catch (err) {
                    console.error('Failed to delete entry', err)
                  }
                }}
              />
            ))}
          </div>

          {/* Пагинация */}
          {pagination && pagination.pages > 1 && (
            <Card className="bg-zinc-950/50 border-zinc-800/50 backdrop-blur">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-zinc-400">
                    Страница {pagination.page} из {pagination.pages} 
                    ({pagination.total} слов)
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={prevPage}
                      disabled={!canGoPrev || isLoading}
                    >
                      ← Назад
                    </Button>
                    
                    {/* Номера страниц */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                        const pageNum = i + 1
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === pagination.page ? "default" : "ghost"}
                            size="sm"
                            onClick={() => goToPage(pageNum)}
                            disabled={isLoading}
                            className={pageNum === pagination.page ? "bg-cyan-600" : ""}
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={nextPage}
                      disabled={!canGoNext || isLoading}
                    >
                      Вперед →
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Загрузка при обновлении */}
      {isLoading && hasEntries && (
        <div className="fixed bottom-4 right-4 bg-zinc-900 border border-zinc-700 rounded-lg p-3 flex items-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-cyan-500"></div>
          <span className="text-sm text-white">Загрузка...</span>
        </div>
      )}
    </div>
  )
}
