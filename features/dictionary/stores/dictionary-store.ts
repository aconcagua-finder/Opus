'use client'

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { 
  DictionaryEntry, 
  DictionaryFilters, 
  DictionaryStats,
  CreateDictionaryEntryData,
  UpdateDictionaryEntryData 
} from '../types'
import { dictionaryAPI } from '../api/dictionary'

const DEFAULT_PAGE_SIZE = 50

const mergeEntries = (
  current: DictionaryEntry[],
  incoming: DictionaryEntry[]
): DictionaryEntry[] => {
  if (current.length === 0) {
    return incoming
  }

  const order: string[] = []
  const existingMap = new Map<string, DictionaryEntry>()

  const orderSet = new Set<string>()

  current.forEach((entry) => {
    order.push(entry.id)
    orderSet.add(entry.id)
    existingMap.set(entry.id, entry)
  })

  incoming.forEach((entry) => {
    if (!orderSet.has(entry.id)) {
      order.push(entry.id)
      orderSet.add(entry.id)
    }
    existingMap.set(entry.id, entry)
  })

  return order
    .map((id) => existingMap.get(id))
    .filter((entry): entry is DictionaryEntry => Boolean(entry))
}

interface DictionaryStore {
  // State
  entries: DictionaryEntry[]
  stats: DictionaryStats | null
  isLoading: boolean
  error: string | null
  filters: DictionaryFilters
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  } | null

  // Actions
  setFilters: (filters: DictionaryFilters) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // API Actions
  fetchEntries: (page?: number, limit?: number) => Promise<void>
  fetchStats: () => Promise<void>
  createEntry: (data: CreateDictionaryEntryData) => Promise<DictionaryEntry>
  updateEntry: (id: string, data: UpdateDictionaryEntryData) => Promise<DictionaryEntry>
  deleteEntry: (id: string) => Promise<void>
  refreshEntries: () => Promise<void>
  importEntries: (entries: CreateDictionaryEntryData[]) => Promise<{ created: number; skipped: number }>
}

export const useDictionaryStore = create<DictionaryStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      entries: [],
      stats: null,
      isLoading: false,
      error: null,
      filters: {},
      pagination: null,

      // Basic actions
      setFilters: (filters: DictionaryFilters) => {
        set({ filters, entries: [], pagination: null })
        // Автоматически перезагружаем данные при смене фильтров
        get().fetchEntries(1)
      },

      setLoading: (isLoading: boolean) => set({ isLoading }),

      setError: (error: string | null) => set({ error }),

      // API actions
      fetchEntries: async (page = 1, limit = DEFAULT_PAGE_SIZE) => {
        const { filters } = get()

        const effectiveLimit = limit ?? DEFAULT_PAGE_SIZE
        
        set({ isLoading: true, error: null })
        
        try {
          const response = await dictionaryAPI.getEntries({
            filters,
            page,
            limit: effectiveLimit
          })

          set((state) => ({
            entries: page > 1
              ? mergeEntries(state.entries, response.entries)
              : response.entries,
            pagination: response.pagination,
            isLoading: false
          }))
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch entries',
            isLoading: false
          })
        }
      },

      fetchStats: async () => {
        try {
          const stats = await dictionaryAPI.getStats()
          set({ stats })
        } catch (error) {
          console.error('Failed to fetch dictionary stats:', error)
        }
      },

      createEntry: async (data: CreateDictionaryEntryData) => {
        set({ isLoading: true, error: null })
        
        try {
          const newEntry = await dictionaryAPI.createEntry(data)
          
          // Добавляем новую запись в начало списка
          set((state) => ({
            entries: [newEntry, ...state.entries],
            isLoading: false
          }))
          
          // Обновляем статистику
          get().fetchStats()
          
          return newEntry
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create entry'
          set({ error: errorMessage, isLoading: false })
          throw error
        }
      },

      updateEntry: async (id: string, data: UpdateDictionaryEntryData) => {
        set({ isLoading: true, error: null })
        
        try {
          const updatedEntry = await dictionaryAPI.updateEntry(id, data)
          
          // Обновляем запись в списке
          set((state) => ({
            entries: state.entries.map(entry => 
              entry.id === id ? updatedEntry : entry
            ),
            isLoading: false
          }))
          
          return updatedEntry
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update entry'
          set({ error: errorMessage, isLoading: false })
          throw error
        }
      },

      deleteEntry: async (id: string) => {
        set({ isLoading: true, error: null })
        
        try {
          await dictionaryAPI.deleteEntry(id)
          
          // Удаляем запись из списка
          set((state) => ({
            entries: state.entries.filter(entry => entry.id !== id),
            isLoading: false
          }))
          
          // Обновляем статистику
          get().fetchStats()
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete entry'
          set({ error: errorMessage, isLoading: false })
          throw error
        }
      },

      refreshEntries: async () => {
        const { pagination, entries } = get()
        const effectiveLimit = pagination?.limit ?? DEFAULT_PAGE_SIZE
        const loadedPages = entries.length > 0
          ? Math.ceil(entries.length / effectiveLimit)
          : 1

        await get().fetchEntries(1, effectiveLimit)

        const totalPages = get().pagination?.pages ?? 1
        const pagesToFetch = Math.min(totalPages, loadedPages)

        for (let page = 2; page <= pagesToFetch; page++) {
          await get().fetchEntries(page, effectiveLimit)
        }
      },

      importEntries: async (entries: CreateDictionaryEntryData[]) => {
        set({ isLoading: true, error: null })

        try {
          const result = await dictionaryAPI.importEntries(entries)

          await Promise.all([
            get().refreshEntries(),
            get().fetchStats(),
          ])

          return result
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to import entries'
          set({ error: message })
          throw error
        } finally {
          set({ isLoading: false })
        }
      }
    }),
    {
      name: 'dictionary-store',
    }
  )
)
