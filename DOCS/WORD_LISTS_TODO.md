# Инструкция по завершению реализации пользовательских списков слов

## Статус: 60% выполнено ✅

### ✅ Что уже реализовано:

1. **База данных** - схема Prisma с моделями `WordList`, `WordListItem`, `WordListType`
2. **Миграция БД** применена успешно
3. **TypeScript типы** для всех сущностей списков
4. **Backend API** - все эндпоинты работают:
   - `/api/word-lists` - GET/POST
   - `/api/word-lists/[id]` - GET/PUT/DELETE
   - `/api/word-lists/[id]/items` - POST/DELETE
   - Поддержка авто-списков (7/14/28 дней)
5. **Frontend API клиент** - `wordListsAPI`
6. **Zustand store** - `useWordListsStore`
7. **React хуки** - `useWordLists`
8. **UI компонент** - `WordListsPanel` (панель выбора списков)

---

## 🚧 Что нужно доделать:

### 1. Создать `word-list-manager.tsx` (модальное окно управления списками)

**Путь:** `/features/dictionary/components/word-list-manager.tsx`

**Функционал:**
- Форма создания нового списка (название, описание, цвет)
- Список всех кастомных списков с кнопками редактирования и удаления
- Возможность архивировать/разархивировать списки
- Подтверждение удаления списка

**Пример структуры:**
```tsx
'use client'

import { useState } from 'react'
import { useWordLists } from '../hooks/use-word-lists'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

interface WordListManagerProps {
  onClose: () => void
}

export function WordListManager({ onClose }: WordListManagerProps) {
  const { customLists, createList, updateList, deleteList } = useWordLists()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#06b6d4')

  // Реализовать:
  // 1. Форму создания списка
  // 2. Список существующих списков с кнопками
  // 3. Подтверждение удаления
  // 4. Обработку ошибок

  return (
    // UI компонента
  )
}
```

---

### 2. Создать `add-to-list-button.tsx` (кнопка добавления слова в списки)

**Путь:** `/features/dictionary/components/add-to-list-button.tsx`

**Функционал:**
- Кнопка с иконкой "добавить в список"
- Выпадающее меню с чекбоксами всех кастомных списков
- Показывать галочки на списках, в которых уже есть это слово
- Быстрое добавление/удаление слова из списков

**Пример структуры:**
```tsx
'use client'

import { useState, useEffect } from 'react'
import { useWordLists } from '../hooks/use-word-lists'
import { Button } from '@/components/ui/button'

interface AddToListButtonProps {
  entryId: string
}

export function AddToListButton({ entryId }: AddToListButtonProps) {
  const { customLists, addEntryToList, removeEntryFromList, getListsForEntry } = useWordLists()
  const [listsWithEntry, setListsWithEntry] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Загрузить списки, в которых есть это слово
    getListsForEntry(entryId).then(setListsWithEntry)
  }, [entryId])

  // Реализовать:
  // 1. Выпадающее меню с чекбоксами
  // 2. Обработку клика по чекбоксу (добавить/удалить)
  // 3. Визуальную индикацию списков со словом

  return (
    // UI компонента с dropdown
  )
}
```

---

### 3. Интегрировать кнопку в `word-card.tsx` и `word-list-item.tsx`

**Что сделать:**

В `/features/dictionary/components/word-card.tsx`:
```tsx
import { AddToListButton } from './add-to-list-button'

// Добавить в JSX рядом с кнопками Edit/Delete:
<AddToListButton entryId={entry.id} />
```

В `/features/dictionary/components/word-list-item.tsx`:
```tsx
import { AddToListButton } from './add-to-list-button'

// Добавить в JSX рядом с кнопками действий:
<AddToListButton entryId={entry.id} />
```

---

### 4. Обновить `dictionary-list.tsx` - добавить панель списков

**Путь:** `/features/dictionary/components/dictionary-list.tsx`

**Что изменить:**

1. Импортировать компоненты:
```tsx
import { WordListsPanel } from './word-lists-panel'
import { WordListManager } from './word-list-manager'
import { useWordLists } from '../hooks/use-word-lists'
```

2. Добавить состояние:
```tsx
const [showListManager, setShowListManager] = useState(false)
const { activeListId } = useWordLists()
```

3. Обновить фильтры при изменении активного списка:
```tsx
useEffect(() => {
  updateFilter('listId', activeListId || undefined)
}, [activeListId])
```

4. Добавить панель списков в JSX (перед фильтрами):
```tsx
<WordListsPanel
  onManageClick={() => setShowListManager(true)}
/>

{showListManager && (
  <Modal open onClose={() => setShowListManager(false)}>
    <WordListManager onClose={() => setShowListManager(false)} />
  </Modal>
)}
```

---

### 5. Обновить API словаря для поддержки фильтрации по `listId`

**Путь:** `/app/api/dictionary/route.ts`

**Что добавить в функцию GET:**

```tsx
// После строки 53 (после search фильтра)
if (validatedFilters.listId) {
  if (validatedFilters.listId.startsWith('auto-')) {
    // Для авто-списков - фильтруем по дате
    const now = new Date()
    let dateFilter: Date

    if (validatedFilters.listId === 'auto-7-days') {
      dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (validatedFilters.listId === 'auto-14-days') {
      dateFilter = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    } else if (validatedFilters.listId === 'auto-28-days') {
      dateFilter = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000)
    }

    where.createdAt = { gte: dateFilter }
  } else {
    // Для кастомных списков - используем связь wordListItems
    where.wordListItems = {
      some: {
        listId: validatedFilters.listId
      }
    }
  }
}
```

---

### 6. Обновить экспорты в `features/dictionary/index.ts`

**Что добавить:**

```tsx
// Components
export { WordListsPanel } from './components/word-lists-panel'
export { WordListManager } from './components/word-list-manager'
export { AddToListButton } from './components/add-to-list-button'
```

---

### 7. Тестирование

**Чек-лист тестирования:**

- [ ] Создание нового кастомного списка
- [ ] Редактирование списка (название, описание, цвет)
- [ ] Удаление списка
- [ ] Добавление слова в список через кнопку
- [ ] Удаление слова из списка
- [ ] Фильтрация словаря по списку (клик на список)
- [ ] Авто-списки показывают правильное количество слов
- [ ] Авто-списки фильтруют по дате корректно
- [ ] Мобильная адаптация всех компонентов
- [ ] Обработка ошибок (сеть, валидация)
- [ ] Множественное добавление слова в разные списки
- [ ] Счетчики слов обновляются корректно

---

## Дополнительные улучшения (опционально):

### Bulk операции
- Множественный выбор слов для добавления в список
- Массовое удаление слов из списка

### Drag & Drop
- Перетаскивание слов в списки
- Сортировка списков

### Экспорт/Импорт
- Экспорт списка в файл
- Импорт списка из файла

### Шаринг
- Поделиться списком с другими пользователями
- Публичные vs приватные списки

---

## Примечания:

1. **Цвета списков** - используй встроенный `<input type="color">` или библиотеку цветов
2. **Модальные окна** - используй существующий компонент `Modal` из `/components/ui/modal`
3. **Стиль** - следуй существующему дизайну (темная тема, cyan акценты)
4. **Обработка ошибок** - всегда показывай понятные сообщения пользователю
5. **Оптимистичные обновления** - UI должен обновляться мгновенно, не дожидаясь ответа сервера

---

## Файлы для справки:

- **Пример формы:** `/features/dictionary/components/add-word-form.tsx`
- **Пример модального окна:** `/features/dictionary/components/ai-import-panel.tsx`
- **Стили кнопок:** `/components/ui/button.tsx`
- **Стили карточек:** `/components/ui/card.tsx`

---

Удачи! После завершения протестируй все сценарии на desktop и mobile.
