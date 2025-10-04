'use client'

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { WordList, CreateWordListData, UpdateWordListData, DictionaryEntry } from '../types'
import { wordListsAPI } from '../api/word-lists'

interface WordListsStore {
  // State
  lists: WordList[]
  activeListId: string | null
  isLoading: boolean
  error: string | null
  hasLoadedBase: boolean
  hasLoadedWithArchived: boolean
  currentFetch: Promise<void> | null

  // Actions
  setActiveListId: (listId: string | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // API Actions
  fetchLists: (options?: { includeArchived?: boolean; force?: boolean }) => Promise<void>
  ensureLists: (includeArchived?: boolean) => Promise<void>
  refreshLists: (options?: { includeArchived?: boolean }) => Promise<void>
  createList: (data: CreateWordListData) => Promise<WordList>
  updateList: (listId: string, data: UpdateWordListData) => Promise<WordList>
  deleteList: (listId: string) => Promise<void>
  addEntryToList: (listId: string, entryId: string) => Promise<void>
  removeEntryFromList: (listId: string, entryId: string) => Promise<void>
  getListsForEntry: (entryId: string) => Promise<string[]> // Возвращает ID списков

  // Derived updates
  applyEntryAdded: (entry: DictionaryEntry) => void
  applyEntryRemoved: (entry: DictionaryEntry) => void
}

const MS_IN_DAY = 24 * 60 * 60 * 1000

const shouldIncludeEntryInAutoList = (listId: string, createdAt: Date) => {
  if (Number.isNaN(createdAt.getTime())) {
    return false
  }

  const elapsed = Date.now() - createdAt.getTime()

  if (listId === 'auto-7-days') {
    return elapsed <= 7 * MS_IN_DAY
  }

  if (listId === 'auto-14-days') {
    return elapsed <= 14 * MS_IN_DAY
  }

  if (listId === 'auto-28-days') {
    return elapsed <= 28 * MS_IN_DAY
  }

  return false
}

const adjustAutoListCounts = (lists: WordList[], entry: DictionaryEntry, delta: number): WordList[] => {
  if (!lists.length) {
    return lists
  }

  const createdAt = new Date(entry.createdAt)
  let changed = false

  const nextLists = lists.map((list) => {
    if (!list.id.startsWith('auto-')) {
      return list
    }

    if (!shouldIncludeEntryInAutoList(list.id, createdAt)) {
      return list
    }

    const currentCount = list.wordCount ?? 0
    const nextCount = Math.max(currentCount + delta, 0)

    if (nextCount === currentCount) {
      return list
    }

    changed = true
    return {
      ...list,
      wordCount: nextCount
    }
  })

  return changed ? nextLists : lists
}

export const useWordListsStore = create<WordListsStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      lists: [],
      activeListId: null,
      isLoading: false,
      error: null,
      hasLoadedBase: false,
      hasLoadedWithArchived: false,
      currentFetch: null,

      // Basic actions
      setActiveListId: (listId) => set({ activeListId: listId }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      // API actions
      fetchLists: async (options = {}) => {
        const { includeArchived = false, force = false } = options
        const { currentFetch, hasLoadedBase, hasLoadedWithArchived } = get()

        const alreadyLoaded = includeArchived ? hasLoadedWithArchived : hasLoadedBase

        if (!force && alreadyLoaded) {
          return
        }

        if (!force && currentFetch) {
          return currentFetch
        }

        const pending = (async () => {
          set({ isLoading: true, error: null })

          try {
            const lists = await wordListsAPI.getLists(includeArchived)

            set((state) => ({
              lists,
              isLoading: false,
              error: null,
              hasLoadedBase: true,
              hasLoadedWithArchived: includeArchived ? true : state.hasLoadedWithArchived,
              currentFetch: null
            }))
          } catch (error) {
            const rawMessage = error instanceof Error ? error.message : 'Failed to fetch word lists'
            const friendlyMessage = rawMessage === 'Failed to fetch word lists'
              ? 'Не удалось загрузить списки слов'
              : rawMessage

            set({ error: friendlyMessage, isLoading: false, currentFetch: null })
          }
        })()

        set({ currentFetch: pending })
        await pending
      },

      ensureLists: async (includeArchived = false) => {
        const { hasLoadedBase, hasLoadedWithArchived } = get()
        const needsArchived = includeArchived && !hasLoadedWithArchived
        const needsBase = !includeArchived && !hasLoadedBase

        if (!needsArchived && !needsBase) {
          return
        }

        await get().fetchLists({ includeArchived })
      },

      refreshLists: async (options = {}) => {
        const { hasLoadedWithArchived } = get()
        const includeArchived = options.includeArchived ?? hasLoadedWithArchived

        await get().fetchLists({ includeArchived, force: true })
      },

      createList: async (data: CreateWordListData) => {
        set({ isLoading: true, error: null })

        try {
          const newList = await wordListsAPI.createList(data)

          // Добавляем новый список в начало кастомных (после авто-списков)
          set((state) => {
            const autoLists = state.lists.filter(l => l.id.startsWith('auto-'))
            const customLists = state.lists.filter(l => !l.id.startsWith('auto-'))

            return {
              lists: [...autoLists, newList, ...customLists],
              isLoading: false
            }
          })

          return newList
        } catch (error) {
          const errorMessage = error instanceof Error
            ? error.message
            : 'Не удалось создать список'
          set({ error: errorMessage, isLoading: false })
          throw error
        }
      },

      updateList: async (listId: string, data: UpdateWordListData) => {
        set({ isLoading: true, error: null })

        try {
          const updatedList = await wordListsAPI.updateList(listId, data)

          set((state) => ({
            lists: state.lists.map(list =>
              list.id === listId ? updatedList : list
            ),
            isLoading: false
          }))

          return updatedList
        } catch (error) {
          const errorMessage = error instanceof Error
            ? error.message
            : 'Не удалось обновить список'
          set({ error: errorMessage, isLoading: false })
          throw error
        }
      },

      deleteList: async (listId: string) => {
        set({ isLoading: true, error: null })

        try {
          await wordListsAPI.deleteList(listId)

          set((state) => ({
            lists: state.lists.filter(list => list.id !== listId),
            activeListId: state.activeListId === listId ? null : state.activeListId,
            isLoading: false
          }))
        } catch (error) {
          const errorMessage = error instanceof Error
            ? error.message
            : 'Не удалось удалить список'
          set({ error: errorMessage, isLoading: false })
          throw error
        }
      },

      addEntryToList: async (listId: string, entryId: string) => {
        try {
          await wordListsAPI.addEntryToList(listId, entryId)

          // Обновляем счетчик слов в списке
          set((state) => ({
            lists: state.lists.map(list =>
              list.id === listId
                ? { ...list, wordCount: (list.wordCount || 0) + 1 }
                : list
            )
          }))
        } catch (error) {
          const errorMessage = error instanceof Error
            ? error.message
            : 'Не удалось добавить слово в список'
          set({ error: errorMessage })
          throw error
        }
      },

      removeEntryFromList: async (listId: string, entryId: string) => {
        try {
          await wordListsAPI.removeEntryFromList(listId, entryId)

          // Обновляем счетчик слов в списке
          set((state) => ({
            lists: state.lists.map(list =>
              list.id === listId
                ? { ...list, wordCount: Math.max((list.wordCount || 0) - 1, 0) }
                : list
            )
          }))
        } catch (error) {
          const errorMessage = error instanceof Error
            ? error.message
            : 'Не удалось удалить слово из списка'
          set({ error: errorMessage })
          throw error
        }
      },

      getListsForEntry: async (entryId: string) => {
        try {
          const listsWithEntry = await wordListsAPI.getListsForEntry(entryId)
          return listsWithEntry.map(list => list.id)
        } catch (error) {
          console.error('Failed to get lists for entry:', error)
          return []
        }
      },

      applyEntryAdded: (entry: DictionaryEntry) => {
        set((state) => ({
          lists: adjustAutoListCounts(state.lists, entry, 1)
        }))
      },

      applyEntryRemoved: (entry: DictionaryEntry) => {
        set((state) => ({
          lists: adjustAutoListCounts(state.lists, entry, -1)
        }))
      }
    }),
    {
      name: 'word-lists-store'
    }
  )
)
