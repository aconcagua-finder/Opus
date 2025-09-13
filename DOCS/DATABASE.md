# Схема базы данных

## Технологии
- **PostgreSQL 16** - основная база данных
- **Prisma ORM** - управление схемой и миграциями
- **Docker** - контейнер для БД

## Модуль: Авторизация (auth)

### Модель: User
Основная таблица пользователей системы

```prisma
model User {
  id                        String     @id @default(uuid())
  email                     String     @unique
  passwordHash              String     @map("password_hash")
  emailVerified             Boolean    @default(false)
  emailVerificationToken    String?
  emailVerificationExpiresAt DateTime?
  
  // Профиль
  username                  String?    @unique
  displayName               String?
  avatarUrl                 String?
  
  // Статусы
  isActive                  Boolean    @default(true)
  isBanned                  Boolean    @default(false)
  banReason                 String?
  bannedUntil               DateTime?
  
  // Метаданные для расширения
  metadata                  Json       @default("{}")
  
  // Временные метки
  createdAt                 DateTime   @default(now())
  updatedAt                 DateTime   @updatedAt
  deletedAt                 DateTime?
  lastLoginAt               DateTime?
  
  // Связи
  sessions                  Session[]
  passwordResetTokens       PasswordResetToken[]
  authAttempts              AuthAttempt[]
}
```

**Индексы**:
- email (unique)
- username (unique) 
- deletedAt

**Использование**:
- Хранение учетных данных пользователей
- Профильная информация
- Управление статусами (активный/заблокирован)
- Soft delete через deletedAt
- metadata для расширения без миграций

### Модель: Session
Сессии пользователей для JWT refresh токенов

```prisma
model Session {
  id              String    @id @default(uuid())
  userId          String
  refreshToken    String    @unique
  
  // Информация о сессии
  ipAddress       String?
  userAgent       String?
  deviceInfo      Json      @default("{}")
  
  // Время жизни
  expiresAt       DateTime
  lastActivityAt  DateTime  @default(now())
  
  // Временные метки
  createdAt       DateTime  @default(now())
  revokedAt       DateTime?
  revokedReason   String?
  
  // Связи
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Индексы**:
- userId
- refreshToken (unique)
- expiresAt

**Использование**:
- Хранение refresh токенов
- Трекинг активных сессий
- Возможность отзыва токенов
- Логирование устройств и IP

### Модель: PasswordResetToken
Токены для восстановления пароля

```prisma
model PasswordResetToken {
  id         String    @id @default(uuid())
  userId     String
  token      String    @unique
  expiresAt  DateTime
  usedAt     DateTime?
  createdAt  DateTime  @default(now())
  
  // Связи
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Индексы**:
- token (unique)
- userId

**Использование**:
- Безопасное восстановление паролей
- Одноразовые токены с истечением
- Трекинг использования

### Модель: AuthAttempt
Логирование попыток входа для безопасности

```prisma
model AuthAttempt {
  id            String    @id @default(uuid())
  email         String
  userId        String?
  ipAddress     String?
  userAgent     String?
  success       Boolean
  failureReason String?
  createdAt     DateTime  @default(now())
  
  // Связи
  user          User?     @relation(fields: [userId], references: [id], onDelete: SetNull)
}
```

**Индексы**:
- email
- ipAddress
- createdAt

**Использование**:
- Защита от брутфорса (макс 15 попыток за 15 минут)
- Аудит безопасности
- Анализ подозрительной активности

## Модуль: NextAuth.js

### Модель: Account
Связывание пользователей с OAuth провайдерами

```prisma
model Account {
  id                String  @id @default(uuid())
  userId            String  @map("user_id")
  type              String
  provider          String
  providerAccountId String  @map("provider_account_id")
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}
```

**Индексы**:
- `[provider, providerAccountId]` (unique)
- userId

**Использование**:
- Связывание Google аккаунтов с пользователями
- Хранение OAuth токенов провайдеров
- Поддержка multiple OAuth провайдеров на пользователя

### Модель: VerificationToken
Токены для верификации email и других операций

```prisma
model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}
```

**Индексы**:
- `[identifier, token]` (unique)

**Использование**:
- Email верификация
- Magic link авторизация (в будущем)
- Другие верификационные процессы

## Конфигурация БД

### Docker Compose
```yaml
services:
  postgres:
    image: postgres:16
    container_name: opus-postgres-dev
    restart: always
    environment:
      POSTGRES_DB: opus_language
      POSTGRES_USER: postgres
      POSTGRES_HOST_AUTH_METHOD: trust
    ports:
      - "5432:5432"
    volumes:
      - postgres-data-dev:/var/lib/postgresql/data
```

### Connection String
```env
DATABASE_URL="postgresql://postgres@localhost:5432/opus_language?schema=public"
```

## Миграции

### Создание новой миграции
```bash
npx prisma migrate dev --name migration_name
```

### Применение миграций
```bash
npx prisma migrate deploy
```

### Сброс БД (dev only)
```bash
npx prisma migrate reset
```

## Работа с данными

### Prisma Client
```typescript
import { PrismaClient } from '@prisma/client'

// Singleton pattern для production
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error']
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

### Примеры запросов

**Создание пользователя**:
```typescript
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    passwordHash: hashedPassword,
    displayName: 'John Doe'
  }
})
```

**Поиск с фильтрацией**:
```typescript
const activeUsers = await prisma.user.findMany({
  where: {
    isActive: true,
    deletedAt: null
  },
  include: {
    sessions: {
      where: {
        revokedAt: null,
        expiresAt: { gt: new Date() }
      }
    }
  }
})
```

**Транзакции**:
```typescript
const result = await prisma.$transaction(async (tx) => {
  // Создаем пользователя
  const user = await tx.user.create({ data: userData })
  
  // Создаем сессию
  const session = await tx.session.create({
    data: {
      userId: user.id,
      refreshToken: token,
      expiresAt: getRefreshTokenExpiry()
    }
  })
  
  return { user, session }
})
```

## Безопасность

### Принципы
1. **Хеширование паролей**: bcrypt с salt rounds = 10
2. **UUID для ID**: Непредсказуемые идентификаторы
3. **Soft delete**: Данные не удаляются физически
4. **Rate limiting**: Защита от брутфорса
5. **Каскадное удаление**: Автоматическая очистка связанных данных

### JWT токены
- **Access Token**: 15 минут
- **Refresh Token**: 30 дней
- **HttpOnly Cookies**: Защита от XSS
- **Secure flag**: HTTPS only в production

### Защита от атак
- SQL инъекции: Prisma использует подготовленные запросы
- Брутфорс: Ограничение попыток входа
- XSS: HttpOnly cookies + санитизация данных
- CSRF: SameSite cookies

## Мониторинг

### Prisma Studio
```bash
npx prisma studio
```
Откроет GUI для просмотра и редактирования данных на http://localhost:5555

### Логирование запросов
В development режиме все SQL запросы логируются в консоль

### Метрики производительности
- Индексы на часто используемых полях
- Оптимизация N+1 запросов через include
- Использование select для выборки только нужных полей

## Расширение схемы

### Добавление новых полей
1. Обновить schema.prisma
2. Создать миграцию: `npx prisma migrate dev`
3. Обновить TypeScript типы
4. Обновить этот документ

### Использование metadata
Для быстрого прототипирования можно использовать поле metadata типа Json:

```typescript
await prisma.user.update({
  where: { id: userId },
  data: {
    metadata: {
      preferences: { theme: 'dark' },
      customFields: { level: 5 }
    }
  }
})
```

## Backup и восстановление

### Создание backup
```bash
docker exec opus_postgres pg_dump -U opus_user opus_db > backup.sql
```

### Восстановление из backup
```bash
docker exec -i opus_postgres psql -U opus_user opus_db < backup.sql
```