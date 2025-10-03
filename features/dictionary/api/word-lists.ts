import {
  WordList,
  CreateWordListData,
  UpdateWordListData,
  DictionaryEntry
} from '../types'

const API_BASE = '/api/word-lists'

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
      const error = await response.json()
      throw new Error(error.error || 'Failed to create word list')
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
      const error = await response.json()
      throw new Error(error.error || 'Failed to update word list')
    }

    return response.json()
  },

  async deleteList(listId: string) {
    const response = await fetch(`${API_BASE}/${listId}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete word list')
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
      const error = await response.json()
      throw new Error(error.error || 'Failed to add entry to list')
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
      const error = await response.json()
      throw new Error(error.error || 'Failed to remove entry from list')
    }
  },

  async getListsForEntry(entryId: string) {
    // Получаем все списки и фильтруем те, в которых есть это слово
    const allLists = await this.getLists()

    // Для каждого кастомного списка проверяем наличие слова
    const listsWithEntry: WordList[] = []

    for (const list of allLists) {
      // Авто-списки пропускаем, т.к. они динамические
      if (list.id.startsWith('auto-')) continue

      try {
        const { entries } = await this.getList(list.id)
        if (entries.some(e => e.id === entryId)) {
          listsWithEntry.push(list)
        }
      } catch (err) {
        console.error(`Failed to check list ${list.id}`, err)
      }
    }

    return listsWithEntry
  }
}
