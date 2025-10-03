import { 
  DictionaryEntry, 
  CreateDictionaryEntryData, 
  UpdateDictionaryEntryData,
  DictionaryFilters,
  DictionaryStats,
  Language
} from '../types'

const API_BASE = '/api/dictionary'

export interface PaginatedResponse<T> {
  entries: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface DictionaryAPI {
  // Получение списка записей с фильтрацией и пагинацией
  getEntries: (params?: {
    filters?: DictionaryFilters
    page?: number
    limit?: number
  }) => Promise<PaginatedResponse<DictionaryEntry>>

  // Получение одной записи
  getEntry: (id: string) => Promise<DictionaryEntry>

  // Создание новой записи
  createEntry: (data: CreateDictionaryEntryData) => Promise<DictionaryEntry>

  // Обновление записи
  updateEntry: (id: string, data: UpdateDictionaryEntryData) => Promise<DictionaryEntry>

  // Удаление записи
  deleteEntry: (id: string) => Promise<void>

  // Получение статистики
  getStats: () => Promise<DictionaryStats>

  // Генерация слов с помощью ИИ
  generateEntries: (payload: {
    text: string
    sourceLanguage: Language
    targetLanguage: Language
  }) => Promise<CreateDictionaryEntryData[]>

  // Массовое сохранение записей
  importEntries: (entries: CreateDictionaryEntryData[]) => Promise<{
    created: number
    skipped: number
  }>
}

const buildQueryParams = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value))
    }
  })
  
  return searchParams.toString()
}

export const dictionaryAPI: DictionaryAPI = {
  async getEntries(params = {}) {
    const { filters = {}, page = 1, limit = 50 } = params
    
    const queryParams = buildQueryParams({
      ...filters,
      page,
      limit
    })
    
    const url = queryParams ? `${API_BASE}?${queryParams}` : API_BASE
    
    const response = await fetch(url)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch dictionary entries')
    }
    
    return response.json()
  },

  async getEntry(id: string) {
    const response = await fetch(`${API_BASE}/${id}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch dictionary entry')
    }
    
    return response.json()
  },

  async createEntry(data: CreateDictionaryEntryData) {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create dictionary entry')
    }
    
    return response.json()
  },

  async updateEntry(id: string, data: UpdateDictionaryEntryData) {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update dictionary entry')
    }
    
    return response.json()
  },

  async deleteEntry(id: string) {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete dictionary entry')
    }
    
    // DELETE endpoint возвращает только сообщение об успехе
  },

  async getStats() {
    const response = await fetch(`${API_BASE}/stats`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch dictionary stats')
    }
    
    return response.json()
  },

  async generateEntries(payload) {
    const response = await fetch(`${API_BASE}/ai/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || 'Не удалось сгенерировать список слов')
    }

    const data = await response.json()
    return (data.entries ?? []) as CreateDictionaryEntryData[]
  },

  async importEntries(entries) {
    const response = await fetch(`${API_BASE}/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ entries }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || 'Не удалось сохранить список слов')
    }

    return response.json()
  }
}
