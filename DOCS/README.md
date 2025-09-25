# Opus - Образовательная платформа

Версия: 0.1.0  
Последнее обновление: 13.09.2025

## Технологический стек

### Frontend Core
- **Next.js 15.5** - Фреймворк с App Router
- **React 19** - UI библиотека
- **TypeScript** - Типизация
- **Tailwind CSS v4** - Стилизация
- **Inter Font** - Шрифт с поддержкой кириллицы

### База данных
- **PostgreSQL 16** - Основная БД (в Docker контейнере)
- **Prisma ORM** - Работа с базой данных
- **Docker** - Контейнеризация БД

### Аутентификация
- **NextAuth.js** - OAuth провайдеры (Google)
- **JWT токены** - Access (15 мин) + Refresh (30 дней)
- **bcryptjs** - Хеширование паролей
- **HttpOnly Cookies** - Безопасное хранение токенов
- **jose** - Работа с JWT
- **Dual Auth System** - NextAuth + Custom JWT

### Стейт менеджмент
- **Zustand** - Глобальный стейт
- **React Query** - Серверный стейт и кеширование

### Формы и валидация
- **React Hook Form** - Управление формами
- **Zod** - Схемы валидации

### Инфраструктура
- **Docker Compose** - Локальная разработка
- **Node.js 20+** - Окружение выполнения

## Архитектура проекта

### Структура папок

```
/app                    # Next.js App Router
  /(auth)              # Группа авторизации (login, register)
  /api                 # API роуты
    /auth              # Эндпоинты авторизации
  /dashboard           # Защищенные страницы
  
/features              # Feature-based модули
  /auth               # Модуль авторизации
    /api              # Серверная логика
    /components       # UI компоненты
    /hooks            # React хуки
    /stores           # Zustand хранилища
    /types            # TypeScript типы
    /utils            # Утилиты (jwt, password)
  /dictionary         # Модуль словаря (CRUD + статистика)
    
/components            # Общие компоненты
  /ui                 # Базовые UI компоненты

/lib                  # Общие утилиты
  /prisma.ts         # Клиент Prisma

/prisma               # Конфигурация БД
  /schema.prisma     # Схема данных
  /migrations        # Миграции БД
```

### Модульная архитектура

Каждый функциональный модуль изолирован в папке `/features`:

1. **Структура модуля**:
   - `api/` - серверные функции
   - `components/` - React компоненты
   - `hooks/` - бизнес логика
   - `stores/` - локальный стейт
   - `types/` - типы TypeScript
   - `utils/` - вспомогательные функции
   - `index.ts` - публичный API

2. **Правила**:
   - Модули независимы друг от друга
   - Импорты между модулями только через index.ts
   - Общий код только в /lib или /components/ui

### Работа с данными

1. **База данных**:
   - PostgreSQL в Docker контейнере
   - Prisma ORM для работы с БД
   - Миграции через `prisma migrate`

2. **Аутентификация**:
   - JWT токены (access + refresh)
   - HttpOnly cookies для безопасности
   - Middleware для защиты роутов

3. **Стейт менеджмент**:
   - Zustand для клиентского стейта
   - React Query для серверного стейта
   - Автоматическое обновление токенов

4. **Персональный словарь**:
   - CRUD API `/api/dictionary`, `/api/dictionary/[id]`, `/api/dictionary/stats`
   - Валидация через Zod и защита middleware
   - Индексы для фильтрации по языкам, сложности и дате

## Запуск проекта

### Предварительные требования
- Node.js 20+
- Docker Desktop
- Git

### Установка

```bash
# Клонирование репозитория
git clone [repo-url]
cd opus

# Запуск стека разработки в Docker (рекомендуется)
docker compose -f docker-compose.dev.yml up --build

# Контейнер приложения автоматически выполняет `npx prisma migrate deploy`

# Локальный запуск без Docker (опционально)
npm install
npm run dev
```

### Переменные окружения

Создайте файл `.env.local`:

```env
DATABASE_URL="postgresql://postgres@localhost:5432/opus_language?schema=public"
JWT_SECRET="your-secret-key-here"
NEXT_PUBLIC_API_URL="/api"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## Реализованный функционал

### Модуль авторизации ✅

**Страницы**:
- `/login` - вход в систему
- `/register` - регистрация
- `/dashboard` - защищенная страница

**API endpoints**:
- `POST /api/auth/login` - вход
- `POST /api/auth/register` - регистрация  
- `POST /api/auth/logout` - выход
- `POST /api/auth/refresh` - обновление токенов
- `GET /api/auth/me` - текущий пользователь
- `/api/auth/[...nextauth]` - NextAuth endpoints

**Функции**:
- **Dual Auth System**: NextAuth.js + Custom JWT
- **Google OAuth**: Быстрая авторизация через Google
- **Email/Password**: Классическая регистрация
- JWT токены (access + refresh)
- Автоматическое обновление токенов
- Защита от брутфорса (15 попыток)
- Middleware для защиты роутов
- Правильное отображение имен пользователей

**OAuth Провайдеры**:
- ✅ Google OAuth 2.0

### Модуль словаря ✅

**Страницы**:
- `/dictionary` - управление персональным словарём

**API endpoints**:
- `GET/POST /api/dictionary` - список и добавление слов
- `GET/PUT/DELETE /api/dictionary/:id` - операции над конкретной записью
- `GET /api/dictionary/stats` - агрегированная статистика

**Функции**:
- Пагинация, фильтрация по языкам и поиск по тексту
- Форма добавления с валидацией Zod и выбором языков
- Карточка слова с переключением слово/перевод и счётчиками
- Автоматические индикаторы сложности и метрики просмотров

### UI компоненты ✅

**Базовые**:
- Button - кнопки с вариантами стилей
- Input - поля ввода с иконками
- Card - карточки контента
- Alert - уведомления об ошибках

**Стилизация**:
- Темная тема (черный фон)
- Cyan акценты
- Адаптивный дизайн
- Русская локализация

## Команды разработки

```bash
docker compose -f docker-compose.dev.yml up --build   # Запуск dev-стека в Docker
docker compose -f docker-compose.dev.yml down         # Остановка контейнеров

npm run dev          # Локальный dev-сервер без Docker
npm run build        # Production сборка
npm run start        # Запуск production
npx prisma studio    # GUI для БД
npx prisma migrate dev  # Создание миграций (локально)
```

## Принципы разработки

### Паттерны кода

```typescript
// Базовая сущность
interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
  metadata?: Record<string, any>
}

// Store паттерн
interface BaseStore<T> {
  items: T[]
  isLoading: boolean
  error: Error | null
  fetch: () => Promise<void>
  create: (item: T) => Promise<void>
  update: (id: string, data: Partial<T>) => Promise<void>
  delete: (id: string) => Promise<void>
}
```

### Правила именования
- Компоненты: `PascalCase` (Button, LoginForm)
- Хуки: `camelCase` с префиксом use (useAuth)
- Типы: `PascalCase` (User, AuthTokens)
- API роуты: `kebab-case` (/api/auth/login)
- Файлы компонентов: `kebab-case.tsx`

### Безопасность
- Пароли хешируются через bcrypt
- Токены подписываются JWT_SECRET
- HttpOnly cookies для токенов
- CORS настройки для production
- Rate limiting для API

## Текущий статус

### Выполнено:
- ✅ Настройка проекта Next.js 15.5
- ✅ Подключение PostgreSQL через Docker
- ✅ Настройка Prisma ORM
- ✅ **Полная докеризация приложения**
- ✅ Docker-compose для dev и prod режимов
- ✅ Модуль авторизации (login/register/logout)
- ✅ **Google OAuth авторизация**
- ✅ **Dual Auth System** (NextAuth + Custom JWT)
- ✅ JWT аутентификация
- ✅ Middleware для защиты роутов
- ✅ Модуль словаря (личный словарь с CRUD и статистикой)
- ✅ Базовые UI компоненты
- ✅ Темная тема с cyan акцентами
- ✅ Русская локализация
- ✅ Адаптивный дизайн

### В планах:
- 🚧 Модуль курсов
- 🚧 Модуль уроков
- 🚧 Система упражнений
- 🚧 Прогресс и статистика
- 🚧 Геймификация

## Правила для AI

1. **Архитектура**: Следуй модульной структуре из `/features`
2. **База данных**: Используй Prisma для всех операций с БД
3. **Безопасность**: Все токены в HttpOnly cookies
4. **Стилизация**: Только Tailwind CSS, никакого inline CSS
5. **Типизация**: Строгая типизация, избегай any
6. **Обновление доков**: При изменениях обновляй соответствующие .md файлы
