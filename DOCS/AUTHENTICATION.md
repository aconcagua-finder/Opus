# Система авторизации

Последнее обновление: 13.09.2025

## Обзор

Opus использует **Dual Auth System** - гибридную систему авторизации, которая поддерживает:
- **OAuth провайдеры** через NextAuth.js (Google)
- **Классическую авторизацию** Email/Password через JWT

## Архитектура

### 1. NextAuth.js (OAuth)
- **Google OAuth 2.0** - основной OAuth провайдер
- **JWT Strategy** - сессии через JWT токены
- **Prisma Adapter** - интеграция с БД

### 2. Custom JWT System
- **Access токены** - 15 минут жизни
- **Refresh токены** - 30 дней жизни
- **HttpOnly Cookies** - безопасное хранение

### 3. Middleware
- **Unified Protection** - защищает роуты от обеих систем
- **Automatic Fallback** - NextAuth → Custom JWT
- **Route Protection** - `/dashboard`, `/profile`, etc.

## Компоненты системы

### Backend

#### 1. NextAuth Configuration (`/lib/auth.ts`)
```typescript
export const authOptions: NextAuthOptions = {
  adapter: customPrismaAdapter,
  providers: [GoogleProvider(...)],
  callbacks: {
    signIn: async ({ user, account, profile }) => {
      // Проверка banned/inactive пользователей
    },
    jwt: async ({ token, user, account }) => {
      // Добавление данных пользователя в JWT
    },
    session: async ({ session, token }) => {
      // Формирование session из JWT токена
    }
  },
  session: { strategy: "jwt" }
}
```

#### 2. Custom Prisma Adapter
- **Кастомный createUser** - маппинг Google данных
- **Database Fields Mapping**:
  - `user.name` → `displayName`
  - `user.image` → `avatarUrl`
  - `user.email` → `email`

#### 3. API Routes
- `/api/auth/[...nextauth]` - NextAuth endpoints
- `/api/auth/login` - Custom JWT login
- `/api/auth/register` - Custom JWT register
- `/api/auth/refresh` - Token refresh
- `/api/auth/me` - Current user data

### Frontend

#### 1. Dual Hook System (`app/dashboard/page.tsx`)
```typescript
const { user: jwtUser, logout: jwtLogout } = useAuth()
const { data: nextAuthSession } = useSession()

// Priority: NextAuth → Custom JWT
const user = nextAuthSession?.user || jwtUser
```

#### 2. UI Components
- **Login Page** - Email/Password + Google OAuth
- **Register Page** - Email/Password + Google OAuth  
- **Dashboard** - Unified user display

## Настройка Google OAuth

### 1. Google Cloud Console
1. Создайте проект в [Google Cloud Console](https://console.cloud.google.com)
2. Включите Google+ API
3. Создайте OAuth 2.0 Client ID
4. Добавьте Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://yourdomain.com/api/auth/callback/google` (prod)

### 2. Environment Variables
```env
# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 3. Database Schema
NextAuth создает автоматически:
- `users` - пользователи
- `accounts` - OAuth связки
- `sessions` - активные сессии (в JWT mode не используется)
- `verification_tokens` - токены верификации

## Middleware Protection

### Configuration (`middleware.ts`)
```typescript
// Публичные роуты
const publicPaths = ['/', '/login', '/register']

// Защищенные API роуты  
const protectedApiPaths = ['/api/user', '/api/courses', '/api/lessons']

export async function middleware(request: NextRequest) {
  // Пропускаем API routes авторизации
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }
  
  // Проверяем, является ли путь публичным
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  )
  
  if (isPublicPath) {
    return NextResponse.next()
  }

  // 1. Проверка NextAuth JWT токена
  const nextAuthToken = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  })
  
  if (nextAuthToken?.sub && nextAuthToken?.email) {
    // NextAuth токен валиден
    const response = NextResponse.next()
    response.headers.set('x-user-id', nextAuthToken.sub)
    response.headers.set('x-user-email', nextAuthToken.email)
    return response
  }
  
  // 2. Fallback на Custom JWT
  const authHeader = request.headers.get('authorization')
  const tokenFromHeader = authHeader?.replace('Bearer ', '')
  const tokenFromCookie = request.cookies.get('accessToken')?.value
  const jwtToken = tokenFromHeader || tokenFromCookie
  
  if (jwtToken) {
    try {
      const payload = await verifyAccessToken(jwtToken)
      const response = NextResponse.next()
      response.headers.set('x-user-id', payload.userId)
      response.headers.set('x-user-email', payload.email)
      return response
    } catch (error) {
      // Token invalid
    }
  }
  
  // 3. Redirect или 401 если не авторизован
  if (isProtectedApi) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Для страниц - редирект на login
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  url.searchParams.set('from', pathname)
  return NextResponse.redirect(url)
}
```

## Пользовательский Flow

### Google OAuth Flow
1. Пользователь нажимает "Продолжить с Google"
2. Редирект на Google OAuth consent screen
3. Google callback → `/api/auth/callback/google`
4. NextAuth `signIn` callback проверяет banned/inactive
5. NextAuth `createUser` создает пользователя (если новый)
6. NextAuth `jwt` callback добавляет данные в токен
7. NextAuth `session` callback формирует session
8. Редирект на `/dashboard` с правильным именем

### Email/Password Flow
1. Пользователь заполняет форму регистрации/входа
2. Запрос к `/api/auth/register` или `/api/auth/login`
3. Создание/проверка пользователя в БД
4. Генерация JWT токенов (access + refresh)
5. Установка HttpOnly cookies
6. Редирект на `/dashboard`

## Безопасность

### 1. JWT Security
- **Access Token**: 15 минут жизни, в HttpOnly cookie
- **Refresh Token**: 30 дней жизни, в HttpOnly cookie
- **JWT_SECRET**: Сложный секретный ключ
- **NEXTAUTH_SECRET**: Отдельный секрет для NextAuth

### 2. OAuth Security
- **State Parameter** - защита от CSRF
- **PKCE** - защита от authorization code interception
- **Scope Limitation** - только email и profile

### 3. Database Security
- **Password Hashing** - bcrypt с солью
- **Banned Users** - блокировка на уровне signIn callback
- **Inactive Users** - деактивация аккаунтов

### 4. Rate Limiting
- **Login Attempts** - 15 попыток на IP
- **Registration** - защита от спама

## Troubleshooting

### Типичные проблемы

#### 1. "Пользователь" вместо имени
**Причина**: Данные не передаются через JWT callback
**Решение**: Проверить jwt callback в auth.ts

#### 2. Google OAuth не работает на register
**Причина**: Отсутствует signIn import
**Решение**: Добавить `import { signIn } from 'next-auth/react'`

#### 3. Session возвращает пустой объект
**Причина**: JWT strategy требует session callback с token
**Решение**: Использовать `session({ session, token })` вместо `user`

#### 4. Middleware показывает старый email
**Причина**: Кэшированные cookies/tokens
**Решение**: Очистить браузер или использовать инкогнито

### Debug Commands
```bash
# Просмотр логов NextAuth (только в development режиме)
docker-compose -f docker-compose.dev.yml logs -f app | grep NextAuth

# Проверка данных в БД
docker exec opus-postgres-dev psql -U postgres -d opus_language -c "SELECT email, display_name FROM users;"

# Проверка session API
curl -s http://localhost:3000/api/auth/session

# Проверка переменных окружения в контейнере
docker exec opus-app-dev env | grep NODE_ENV
```

**Примечание**: Все debug логи в production отключены. Логирование работает только при `NODE_ENV=development`.

## Production Deployment

### Environment Variables для Production
```bash
# Основные настройки
NODE_ENV=production
DATABASE_URL="postgresql://username:password@host:5432/database?schema=public"

# NextAuth требует HTTPS в production
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="secure-random-secret-key-32chars+"

# Google OAuth production credentials
GOOGLE_CLIENT_ID="your-production-google-client-id"
GOOGLE_CLIENT_SECRET="your-production-google-client-secret"

# JWT для custom auth
JWT_SECRET="another-secure-secret-key-32chars+"
```

### SSL/HTTPS Requirements
- **Google OAuth требует HTTPS** в production
- Настройте SSL-сертификат (Let's Encrypt рекомендуется)
- Обновите callback URL в Google Console: `https://yourdomain.com/api/auth/callback/google`

### Google OAuth Console Setup
1. Перейдите в [Google Cloud Console](https://console.cloud.google.com)
2. Создайте новый проект или выберите существующий
3. Включите Google+ API
4. Создайте OAuth 2.0 credentials
5. Добавьте authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`

## Performance Considerations

### JWT vs Session Strategy
**Текущая конфигурация**: JWT Strategy
- ✅ **Плюсы**: Stateless, масштабируемый, не требует хранения сессий
- ❌ **Минусы**: Нельзя отозвать токен до истечения, больший размер

**Альтернатива**: Database Session Strategy
- ✅ **Плюсы**: Можно отзывать сессии, меньше данных в токене
- ❌ **Минусы**: Требует запросы к БД, сложнее масштабирование

### Redis Session Storage (рекомендуется для production)
```typescript
// lib/auth.ts
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import Redis from "ioredis"

const redis = new Redis(process.env.REDIS_URL)

export const authOptions: NextAuthOptions = {
  // ... остальная конфигурация
  session: {
    strategy: "database", // Переключиться на database strategy
    maxAge: 30 * 24 * 60 * 60, // 30 дней
  },
  // Опциональный Redis adapter для sessions
  adapter: {
    ...PrismaAdapter(prisma),
    getSession: async (sessionToken) => {
      const cached = await redis.get(`session:${sessionToken}`)
      if (cached) return JSON.parse(cached)
      // Fallback к БД
      return await prisma.session.findUnique({...})
    }
  }
}
```

### Rate Limiting
Добавить в middleware для защиты от брутфорса:
```typescript
// middleware.ts - дополнение
const rateLimiter = new Map()

export async function middleware(request: NextRequest) {
  // Rate limiting для auth endpoints
  if (request.nextUrl.pathname.startsWith('/api/auth/')) {
    const ip = request.ip || 'unknown'
    const now = Date.now()
    const windowStart = now - (15 * 60 * 1000) // 15 минут
    
    const requests = rateLimiter.get(ip) || []
    const recentRequests = requests.filter(time => time > windowStart)
    
    if (recentRequests.length >= 10) { // 10 попыток за 15 минут
      return new Response('Too Many Requests', { status: 429 })
    }
    
    rateLimiter.set(ip, [...recentRequests, now])
  }
  
  // Остальная логика middleware...
}
```

## Следующие шаги

### Запланированные улучшения
- 🚧 Пользовательские словари
- 🚧 Two-Factor Authentication
- 🚧 Email verification
- 🚧 Password reset flow

### Производительность и масштабирование
- 🚧 Redis session storage
- 🚧 Database session strategy для production
- 🚧 Advanced rate limiting
- 🚧 Session analytics и monitoring