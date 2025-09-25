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
import { dictionaryAPI, PaginatedResponse } from '../api/dictionary'

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
        set({ filters })
        // Автоматически перезагружаем данные при смене фильтров
        get().fetchEntries(1)
      },

      setLoading: (isLoading: boolean) => set({ isLoading }),

      setError: (error: string | null) => set({ error }),

      // API actions
      fetchEntries: async (page = 1, limit = 20) => {
        const { filters } = get()
        
        set({ isLoading: true, error: null })
        
        try {
          const response = await dictionaryAPI.getEntries({
            filters,
            page,
            limit
          })
          
          set({
            entries: response.entries,
            pagination: response.pagination,
            isLoading: false
          })
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
        const { pagination } = get()
        const currentPage = pagination?.page || 1
        const currentLimit = pagination?.limit || 20
        
        await get().fetchEntries(currentPage, currentLimit)
      }
    }),
    {
      name: 'dictionary-store',
    }
  )
)