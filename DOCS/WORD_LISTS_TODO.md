# Пользовательские списки слов — шпаргалка

## Статус: 100% ✅

Функциональность готова и включена в production-стек. Документ служит быстрой памяткой по архитектуре, ключевым файлам и сценариям тестирования.

---

## ⚙️ Архитектура и поток данных

1. **Prisma модели** (`prisma/schema.prisma`)
   - `WordList` — кастомные и авто-списки
   - `WordListItem` — связь словаря и списков
   - `WordListType` — `CUSTOM`, `AUTO_7_DAYS`, `AUTO_14_DAYS`, `AUTO_28_DAYS`
2. **API**
   - `GET/POST /api/word-lists` — получение и создание списков
   - `GET/PUT/DELETE /api/word-lists/:id` — управление конкретным списком
   - `POST/DELETE /api/word-lists/:id/items` — добавление/удаление слов
   - Авто-списки не создаются в БД, формируются на лету (последние 7/14/28 дней)
3. **Стор и хуки**
   - `useWordListsStore` — Zustand store с кешем и автосчётчиками
   - `useWordLists` — удобная обёртка для компонентов
4. **Компоненты**
   - `WordListsPanel` — панель переключения
   - `WordListManager` — модалка управления (портал `Modal`)
   - `AddToListButton` — кнопка на карточках, меню рендерится через `createPortal`

---

## 📁 Ключевые файлы

| Раздел | Файл |
| --- | --- |
| API | `app/api/word-lists/route.ts` · `app/api/word-lists/[id]/route.ts` · `app/api/word-lists/[id]/items/route.ts` |
| Клиент | `features/dictionary/api/word-lists.ts` |
| Zustand | `features/dictionary/stores/word-lists-store.ts` |
| Хуки | `features/dictionary/hooks/use-word-lists.ts` |
| UI | `features/dictionary/components/word-lists-panel.tsx` · `word-list-manager.tsx` · `add-to-list-button.tsx` |
| Интеграция | `features/dictionary/components/dictionary-list.tsx` |

---

## 🧭 UX-заметки

- В панели «Системные списки» показываются авто-списки (7/14/28 дней) — они read-only.
- Раскрывающееся меню `AddToListButton` рендерится через портал и позиционируется по кнопке, чтобы не прятаться за карточками.
- Создание/редактирование списка доступно только для кастомных списков; авто-списки защищены на бэке.
- Цвет выбирается из 8 пресетов — единообразие и отсутствие произвольных hex.
- Фильтр словаря синхронизирован с `activeListId`, поэтому переключение списков мгновенно обновляет контент.

---

## 🔄 Работа с Prisma Client

1. После изменения `schema.prisma` обязательно выполняйте:
   ```bash
   npx prisma generate
   docker exec opus-app-dev npx prisma generate
   docker restart opus-app-dev
   ```
2. Ошибка `Cannot read properties of undefined (reading 'findMany')` почти всегда означает, что клиент не сгенерирован или Next.js все еще использует старый бандл.

---

## 🧪 Чек-лист ручного тестирования

- [ ] Создание нового кастомного списка (название + цвет)
- [ ] Редактирование названия/описания/цвета
- [ ] Архивирование и восстановление списка
- [ ] Удаление списка с подтверждением
- [ ] Добавление слова в несколько списков через `AddToListButton`
- [ ] Удаление слова из списка и обновление счетчика
- [ ] Фильтрация словаря при переключении списка (включая авто-списки)
- [ ] Отображение слов в авто-списках соответствует заданным интервалам (7/14/28 дней)
- [ ] Модалка и дропдауны корректно работают на мобильном (порталы + скролл)
- [ ] Ошибки API выводятся в UI (например, дубликат имени списка)

---

## 📝 Полезные команды

```bash
# Ручной перезапуск цепочки обновления клиента
npx prisma generate
docker exec opus-app-dev npx prisma generate
docker restart opus-app-dev

# Просмотр списков в БД (debug)
docker exec opus-postgres-dev psql -U postgres -d opus_language -c "SELECT name, type, is_archived FROM word_lists;"
```

---

## ❗ Известные ограничения

- Авто-списки опираются на `createdAt` записи словаря. Если сделать массовый импорт с искусственными датами, нужно обновить логику под требования.
- Цвет кастомного списка не наследуется на карточки слов (только маркеры и панель).
- Дропдаун добавления слов не закрывается автоматически после выбора нескольких списков — пользователь должен закрыть вручную.

---

## 📚 Связанные документы

- `DOCS/README.md` — обзор архитектуры
- `DOCS/FEATURES.md` — список реализованных модулей
- `DOCS/TROUBLESHOOTING.md` — частые проблемы (см. раздел про Prisma Client)
