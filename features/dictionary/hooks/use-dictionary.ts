'use client'

import { useCallback, useEffect } from 'react'
import { useDictionaryStore } from '../stores/dictionary-store'
import { useDictionaryPreferencesStore } from '../stores/dictionary-preferences-store'
import {
  DictionaryFilters,
  CreateDictionaryEntryData,
  UpdateDictionaryEntryData
} from '../types'

export const useDictionary = () => {
  const store = useDictionaryStore()

  // Автоматическая загрузка данных при первом использовании
  useEffect(() => {
    if (store.entries.length === 0 && !store.isLoading) {
      store.fetchEntries()
      store.fetchStats()
    }
  }, [])

  return {
    // State
    entries: store.entries,
    stats: store.stats,
    isLoading: store.isLoading,
    error: store.error,
    filters: store.filters,
    pagination: store.pagination,

    // Actions
    setFilters: store.setFilters,
    createEntry: store.createEntry,
    updateEntry: store.updateEntry,
    deleteEntry: store.deleteEntry,
    importEntries: store.importEntries,
    refreshEntries: store.refreshEntries,
    fetchEntries: store.fetchEntries,
    shuffleEntries: store.shuffleEntries,
    clearError: () => store.setError(null),

    // Computed values
    hasEntries: store.entries.length > 0,
    isEmpty: store.entries.length === 0 && !store.isLoading,
  }
}

// Хук для работы с пагинацией
export const useDictionaryPagination = () => {
  const { pagination, fetchEntries, isLoading, entries } = useDictionary()

  const canLoadMore = Boolean(
    pagination && entries.length < pagination.total && pagination.page < pagination.pages
  )

  const loadMore = useCallback(async () => {
    if (!pagination || isLoading || !canLoadMore) return

    const nextPage = pagination.page + 1
    await fetchEntries(nextPage, pagination.limit)
  }, [pagination, isLoading, canLoadMore, fetchEntries])

  const resetToStart = useCallback(async () => {
    if (!pagination || isLoading) return
    await fetchEntries(1, pagination.limit)
  }, [pagination, isLoading, fetchEntries])

  return {
    pagination,
    loadMore,
    resetToStart,
    canLoadMore,
    isLoading,
  }
}

// Хук для работы с фильтрами
export const useDictionaryFilters = () => {
  const { filters, setFilters } = useDictionary()

  const updateFilter = (key: keyof DictionaryFilters, value: any) => {
    setFilters({
      ...filters,
      [key]: value,
    })
  }

  const clearFilters = () => {
    setFilters({})
  }

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== null && value !== ''
  )

  return {
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
  }
}

// Хук для управления одной записью
export const useDictionaryEntry = (entryId?: string) => {
  const { entries, createEntry, updateEntry, deleteEntry, isLoading, error } = useDictionary()

  const entry = entryId ? entries.find(e => e.id === entryId) : null

  const handleCreate = async (data: CreateDictionaryEntryData) => {
    return await createEntry(data)
  }

  const handleUpdate = async (data: UpdateDictionaryEntryData) => {
    if (!entryId) throw new Error('Entry ID is required for update')
    return await updateEntry(entryId, data)
  }

  const handleDelete = async () => {
    if (!entryId) throw new Error('Entry ID is required for delete')
    await deleteEntry(entryId)
  }

  return {
    entry,
    isLoading,
    error,
    create: handleCreate,
    update: handleUpdate,
    delete: handleDelete,
    exists: !!entry,
  }
}

export const useDictionaryPreferences = () => {
  return useDictionaryPreferencesStore()
}
