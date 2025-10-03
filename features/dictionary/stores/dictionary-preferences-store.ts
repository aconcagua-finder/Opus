'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  DictionaryDisplayPreferences,
  DictionaryListContentMode,
  DictionaryViewMode
} from '../types'

interface DictionaryPreferencesStore extends DictionaryDisplayPreferences {
  setViewMode: (mode: DictionaryViewMode) => void
  setListContentMode: (mode: DictionaryListContentMode) => void
  setShowNotes: (value: boolean) => void
  setFiltersPanelCollapsed: (value: boolean) => void
  resetDefaults: () => void
}

const DEFAULT_PREFERENCES: DictionaryDisplayPreferences = {
  viewMode: DictionaryViewMode.LIST,
  listContentMode: DictionaryListContentMode.FULL,
  showNotes: true,
  filtersPanelCollapsed: false
}

export const useDictionaryPreferencesStore = create<DictionaryPreferencesStore>()(
  persist(
    (set) => ({
      ...DEFAULT_PREFERENCES,
      setViewMode: (viewMode) => set({ viewMode }),
      setListContentMode: (listContentMode) => set({ listContentMode }),
      setShowNotes: (showNotes) => set({ showNotes }),
      setFiltersPanelCollapsed: (filtersPanelCollapsed) => set({ filtersPanelCollapsed }),
      resetDefaults: () => set({ ...DEFAULT_PREFERENCES })
    }),
    {
      name: 'dictionary-preferences',
      version: 1,
      storage: createJSONStorage(() => localStorage)
    }
  )
)
