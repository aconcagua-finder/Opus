import {
  WordList,
  CreateWordListData,
  UpdateWordListData,
  DictionaryEntry
} from '../types'

const API_BASE = '/api/word-lists'

const extractErrorMessage = async (
  response: Response,
  options: {
    unauthorized: string
    fallback: string
  }
): Promise<string> => {
  const { unauthorized, fallback } = options

  const body = await response.json().catch(() => ({})) as {
    error?: unknown
    details?: Array<{ message?: string }>
  }

  if (Array.isArray(body?.details) && body.details.length > 0) {
    const detailMessage = body.details.find((item) => typeof item?.message === 'string')?.message
    if (detailMessage) {
      return detailMessage
    }
  }

  if (typeof body?.error === 'string' && body.error.trim().length > 0) {
    return body.error.trim()
  }

  if (response.status === 401) {
    return unauthorized
  }

  return fallback
}

export interface WordListsAPI {
  // Получение всех списков (кастомных + авто)
  getLists: (includeArchived?: boolean) => Promise<WordList[]>

  // Получение конкретного списка с записями
  getList: (listId: string) => Promise<{
    list: WordList
    entries: DictionaryEntry[]
  }>

  // Создание нового кастомного списка
  createList: (data: CreateWordListData) => Promise<WordList>

  // Обновление списка
  updateList: (listId: string, data: UpdateWordListData) => Promise<WordList>

  // Удаление списка
  deleteList: (listId: string) => Promise<void>

  // Добавление слова в список
  addEntryToList: (listId: string, entryId: string) => Promise<void>

  // Удаление слова из списка
  removeEntryFromList: (listId: string, entryId: string) => Promise<void>

  // Получение списков, в которых есть конкретное слово
  getListsForEntry: (entryId: string) => Promise<WordList[]>
}

export const wordListsAPI: WordListsAPI = {
  async getLists(includeArchived = false) {
    const url = includeArchived
      ? `${API_BASE}?includeArchived=true`
      : API_BASE

    const response = await fetch(url)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch word lists')
    }

    const data = await response.json()
    return data.lists
  },

  async getList(listId: string) {
    const response = await fetch(`${API_BASE}/${listId}`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch word list')
    }

    return response.json()
  },

  async createList(data: CreateWordListData) {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(
        await extractErrorMessage(response, {
          unauthorized: 'Не удалось создать список: требуется авторизация',
          fallback: 'Не удалось создать список. Попробуйте позже.'
        })
      )
    }

    return response.json()
  },

  async updateList(listId: string, data: UpdateWordListData) {
    const response = await fetch(`${API_BASE}/${listId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(
        await extractErrorMessage(response, {
          unauthorized: 'Не удалось обновить список: требуется авторизация',
          fallback: 'Не удалось обновить список. Попробуйте позже.'
        })
      )
    }

    return response.json()
  },

  async deleteList(listId: string) {
    const response = await fetch(`${API_BASE}/${listId}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      throw new Error(
        await extractErrorMessage(response, {
          unauthorized: 'Не удалось удалить список: требуется авторизация',
          fallback: 'Не удалось удалить список. Попробуйте позже.'
        })
      )
    }
  },

  async addEntryToList(listId: string, entryId: string) {
    const response = await fetch(`${API_BASE}/${listId}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ entryId })
    })

    if (!response.ok) {
      throw new Error(
        await extractErrorMessage(response, {
          unauthorized: 'Не удалось добавить слово: требуется авторизация',
          fallback: 'Не удалось добавить слово в список. Попробуйте позже.'
        })
      )
    }
  },

  async removeEntryFromList(listId: string, entryId: string) {
    const response = await fetch(
      `${API_BASE}/${listId}/items?entryId=${entryId}`,
      {
        method: 'DELETE'
      }
    )

    if (!response.ok) {
      throw new Error(
        await extractErrorMessage(response, {
          unauthorized: 'Не удалось удалить слово: требуется авторизация',
          fallback: 'Не удалось удалить слово из списка. Попробуйте позже.'
        })
      )
    }
  },

  async getListsForEntry(entryId: string) {
    const response = await fetch(`${API_BASE}/entries/${entryId}`)

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || 'Failed to fetch lists for entry')
    }

    const data = await response.json()
    return data.lists as WordList[]
  }
}
