'use client'

import { useEffect, useMemo } from 'react'
import { useWordListsStore } from '../stores/word-lists-store'
import { WordListType } from '../types'

export function useWordLists() {
  const {
    lists,
    activeListId,
    isLoading,
    error,
    setActiveListId,
    fetchLists,
    createList,
    updateList,
    deleteList,
    addEntryToList,
    removeEntryFromList,
    getListsForEntry
  } = useWordListsStore()

  // Автоматически загружаем списки при монтировании
  useEffect(() => {
    if (lists.length === 0 && !isLoading) {
      fetchLists()
    }
  }, [])

  // Разделяем списки на авто и кастомные
  const autoLists = useMemo(
    () => lists.filter(list => list.type !== WordListType.CUSTOM),
    [lists]
  )

  const customLists = useMemo(
    () => lists.filter(list => list.type === WordListType.CUSTOM && !list.isArchived),
    [lists]
  )

  const archivedLists = useMemo(
    () => lists.filter(list => list.type === WordListType.CUSTOM && list.isArchived),
    [lists]
  )

  const activeList = useMemo(
    () => lists.find(list => list.id === activeListId) || null,
    [lists, activeListId]
  )

  return {
    // State
    lists,
    autoLists,
    customLists,
    archivedLists,
    activeList,
    activeListId,
    isLoading,
    error,

    // Actions
    setActiveListId,
    fetchLists,
    createList,
    updateList,
    deleteList,
    addEntryToList,
    removeEntryFromList,
    getListsForEntry,

    // Computed
    hasLists: lists.length > 0,
    hasCustomLists: customLists.length > 0
  }
}
