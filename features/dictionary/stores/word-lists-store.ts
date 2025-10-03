'use client'

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { WordList, CreateWordListData, UpdateWordListData } from '../types'
import { wordListsAPI } from '../api/word-lists'

interface WordListsStore {
  // State
  lists: WordList[]
  activeListId: string | null
  isLoading: boolean
  error: string | null

  // Actions
  setActiveListId: (listId: string | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // API Actions
  fetchLists: (includeArchived?: boolean) => Promise<void>
  createList: (data: CreateWordListData) => Promise<WordList>
  updateList: (listId: string, data: UpdateWordListData) => Promise<WordList>
  deleteList: (listId: string) => Promise<void>
  addEntryToList: (listId: string, entryId: string) => Promise<void>
  removeEntryFromList: (listId: string, entryId: string) => Promise<void>
  getListsForEntry: (entryId: string) => Promise<string[]> // Возвращает ID списков
}

export const useWordListsStore = create<WordListsStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      lists: [],
      activeListId: null,
      isLoading: false,
      error: null,

      // Basic actions
      setActiveListId: (listId) => set({ activeListId: listId }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      // API actions
      fetchLists: async (includeArchived = false) => {
        set({ isLoading: true, error: null })

        try {
          const lists = await wordListsAPI.getLists(includeArchived)
          set({ lists, isLoading: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch lists',
            isLoading: false
          })
        }
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
          const errorMessage = error instanceof Error ? error.message : 'Failed to create list'
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
          const errorMessage = error instanceof Error ? error.message : 'Failed to update list'
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
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete list'
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
          const errorMessage = error instanceof Error ? error.message : 'Failed to add entry to list'
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
          const errorMessage = error instanceof Error ? error.message : 'Failed to remove entry from list'
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
      }
    }),
    {
      name: 'word-lists-store'
    }
  )
)
