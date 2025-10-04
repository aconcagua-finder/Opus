# Troubleshooting Guide

Последнее обновление: 13.09.2025

## Обзор

Руководство по диагностике и решению частых проблем в Opus.

## 🚨 Критичные проблемы

### Prisma Client не видит таблицы

**Симптомы:**
- `TypeError: Cannot read properties of undefined (reading 'findMany')`
- `Error: PrismaClientKnownRequestError: P2021`
- После изменения `schema.prisma` API возвращает 500

**Диагностика:**
```bash
# Проверить дату генерации клиента
ls -al node_modules/@prisma/client

# Проверить, выполнялась ли генерация внутри контейнера
docker exec opus-app-dev ls -al node_modules/@prisma/client
```

**Решения:**
1. **Сгенерировать клиент локально и в контейнере:**
   ```bash
   npx prisma generate
   docker exec opus-app-dev npx prisma generate
   ```
2. **Перезапустить dev-контейнер, чтобы Next.js подхватил обновления:**
   ```bash
   docker restart opus-app-dev
   ```
3. **Повторно запустить запрос и убедиться, что проблема ушла.**

### База данных недоступна

**Симптомы:**
- `Error: P1001: Can't reach database server`
- `Connection refused` в логах
- 500 ошибки на всех endpoints

**Диагностика:**
```bash
# Проверка статуса PostgreSQL контейнера
docker-compose ps postgres

# Проверка логов БД
docker-compose logs postgres

# Проверка подключения
docker-compose exec postgres psql -U postgres -d opus_language -c "SELECT 1;"
```

**Решения:**
1. **Перезапуск БД:**
   ```bash
   docker-compose restart postgres
   ```

2. **Проверка конфликта портов:**
   ```bash
   sudo lsof -i :5432
   sudo service postgresql stop  # Если локальный PostgreSQL запущен
   ```

3. **Пересоздание контейнера:**
   ```bash
   docker-compose down
   docker-compose up postgres -d
   ```

### Google OAuth не работает

**Симптомы:**
- `Error: redirect_uri_mismatch`
- `Access blocked: This app's request is invalid`
- Пользователи не могут войти через Google

**Диагностика:**
```bash
# Проверка переменных окружения
docker-compose exec app env | grep GOOGLE
docker-compose exec app env | grep NEXTAUTH
```

**Решения:**
1. **Проверить Redirect URI в Google Console:**
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`

2. **Проверить NEXTAUTH_URL:**
   ```bash
   # Должен точно соответствовать вашему домену
   NEXTAUTH_URL="https://yourdomain.com"  # БЕЗ слэша в конце
   ```

3. **Проверить статус OAuth App в Google Console**

## ⚡ Проблемы производительности

### Медленная загрузка страниц

**Диагностика:**
```bash
# Проверка использования ресурсов
docker stats

# Проверка логов приложения
docker-compose logs app | grep -i slow

# Проверка запросов к БД
docker-compose logs postgres | grep -i "duration"
```

**Решения:**
1. **Увеличить ресурсы Docker:**
   ```yaml
   # docker-compose.yml
   services:
     app:
       deploy:
         resources:
           limits:
             memory: 1G
             cpus: '0.5'
   ```

2. **Оптимизация PostgreSQL:**
   ```sql
   -- Проверка медленных запросов
   SELECT query, mean_exec_time, calls 
   FROM pg_stat_statements 
   ORDER BY mean_exec_time DESC 
   LIMIT 10;
   ```

### Высокое использование памяти

**Диагностика:**
```bash
# Мониторинг памяти
docker stats --no-stream

# Проверка процессов Node.js
docker-compose exec app ps aux
```

**Решения:**
1. **Ограничение памяти для Node.js:**
   ```dockerfile
   # В Dockerfile
   CMD ["node", "--max-old-space-size=512", "server.js"]
   ```

2. **Перезапуск при превышении лимита:**
   ```bash
   # Добавить в crontab
   0 */6 * * * docker-compose restart app
   ```

## 🔐 Проблемы авторизации

### JWT токены не работают

**Симптомы:**
- `Invalid token` ошибки
- Автоматический logout пользователей
- `Unauthorized` на защищенных роутах

**Диагностика:**
```bash
# Проверка JWT секрета
docker-compose exec app env | grep JWT_SECRET

# Проверка логов middleware
docker-compose logs app | grep -i "middleware"
```

**Решения:**
1. **Проверить JWT_SECRET:**
   ```bash
   # Должен быть одинаковым во всех инстансах
   # Минимум 32 символа
   JWT_SECRET="your-very-secure-secret-key-here"
   ```

2. **Очистить кэшированные токены:**
   ```bash
   # Очистка браузера или
   # Restart приложения для сброса всех токенов
   docker-compose restart app
   ```

### Пользователи показываются как "Пользователь"

**Симптомы:**
- Google OAuth работает, но имя не отображается
- `displayName` пустое в БД

**Диагностика:**
```sql
-- Проверка данных пользователей
SELECT id, email, display_name, username FROM users WHERE email LIKE '%gmail.com';

-- Проверка аккаунтов OAuth
SELECT provider, provider_account_id, user_id FROM accounts;
```

**Решения:**
1. **Проверить NextAuth callback:**
   ```typescript
   // В lib/auth.ts должны быть правильные callbacks
   callbacks: {
     jwt: async ({ token, user }) => {
       // Логика добавления displayName
     },
     session: async ({ session, token }) => {
       // Логика передачи displayName в session
     }
   }
   ```

2. **Пересоздать проблемные аккаунты:**
   ```sql
   -- ОСТОРОЖНО: Удалить проблемный аккаунт
   DELETE FROM accounts WHERE user_id = 'user-id';
   DELETE FROM users WHERE id = 'user-id';
   ```

## 🐳 Docker проблемы

### Контейнеры не запускаются

**Симптомы:**
- `docker-compose up` падает с ошибкой
- Контейнеры в статусе `Exited`

**Диагностика:**
```bash
# Проверка статуса
docker-compose ps

# Подробные логи
docker-compose logs --tail=50

# Проверка ресурсов Docker
docker system df
docker system prune  # Очистка неиспользуемых ресурсов
```

**Решения:**
1. **Пересборка образов:**
   ```bash
   docker-compose build --no-cache
   docker-compose up -d
   ```

2. **Проверка портов:**
   ```bash
   # Найти процессы занимающие порты
   sudo lsof -i :3000
   sudo lsof -i :5432
   ```

3. **Очистка Docker:**
   ```bash
   docker system prune -a
   docker volume prune
   ```

### Проблемы с volumes

**Симптомы:**
- Данные БД теряются при перезапуске
- `node_modules` не обновляются

**Диагностика:**
```bash
# Проверка volumes
docker volume ls
docker volume inspect opus_postgres-data-dev
```

**Решения:**
1. **Пересоздание volumes:**
   ```bash
   docker-compose down -v  # ОСТОРОЖНО: Удалит все данные
   docker-compose up -d
   ```

2. **Backup перед пересозданием:**
   ```bash
   docker-compose exec postgres pg_dump -U postgres opus_language > backup.sql
   ```

## 🌐 Проблемы сети

### CORS ошибки

**Симптомы:**
- `Access-Control-Allow-Origin` ошибки
- API не доступно с frontend

**Решения:**
```typescript
// В API routes добавить CORS headers
export async function POST(request: NextRequest) {
  const response = NextResponse.json(data)
  
  if (process.env.NODE_ENV === 'development') {
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
  }
  
  return response
}
```

### SSL проблемы в production

**Симптомы:**
- `Mixed content` warnings
- Google OAuth перенаправляет на HTTP

**Решения:**
1. **Проверить HTTPS редиректы:**
   ```nginx
   # В nginx config
   server {
       listen 80;
       server_name yourdomain.com;
       return 301 https://$server_name$request_uri;
   }
   ```

2. **Проверить NEXTAUTH_URL:**
   ```bash
   NEXTAUTH_URL="https://yourdomain.com"  # Должен быть HTTPS
   ```

## 📱 Проблемы UI

### Hydration warnings

**Симптомы:**
- Console warnings о hydration mismatch
- Компоненты дёргаются при загрузке

**Решения:**
1. **Добавить suppressHydrationWarning:**
   ```tsx
   <div suppressHydrationWarning>
     {/* Контент который может отличаться */}
   </div>
   ```

2. **Условный рендеринг для клиента:**
   ```tsx
   const [mounted, setMounted] = useState(false)
   
   useEffect(() => {
     setMounted(true)
   }, [])
   
   if (!mounted) {
     return null
   }
   ```

### Tailwind CSS не применяется

**Симптомы:**
- Стили не загружаются
- Компоненты без styling

**Решения:**
1. **Проверить tailwind.config.js:**
   ```javascript
   module.exports = {
     content: [
       './app/**/*.{js,ts,jsx,tsx}',
       './components/**/*.{js,ts,jsx,tsx}',
     ],
     // ...
   }
   ```

2. **Пересборка CSS:**
   ```bash
   npm run build
   ```

## 🔧 Debug команды

### Общая диагностика

```bash
# === SYSTEM STATUS ===
docker-compose ps
docker system df
df -h
free -h

# === APPLICATION LOGS ===
docker-compose logs app --tail=100
docker-compose logs postgres --tail=50

# === DATABASE CHECK ===
docker-compose exec postgres psql -U postgres -d opus_language -c "
  SELECT 
    schemaname,
    tablename,
    attname,
    typename
  FROM pg_tables t
  JOIN pg_attribute a ON a.attrelid = t.tablename::regclass
  JOIN pg_type ty ON ty.oid = a.atttypid
  WHERE schemaname = 'public'
  ORDER BY tablename, attname;
"

# === NETWORK CHECK ===
curl -I http://localhost:3000/api/health
curl -I http://localhost:3000/api/auth/session

# === ENVIRONMENT ===
docker-compose exec app env | sort
```

### Database queries для debug

```sql
-- Активные подключения
SELECT pid, usename, application_name, state, query_start 
FROM pg_stat_activity 
WHERE state = 'active';

-- Размер таблиц
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(tablename::text)) as size
FROM pg_tables 
WHERE schemaname = 'public';

-- Последние пользователи
SELECT id, email, display_name, created_at, last_login_at
FROM users 
ORDER BY created_at DESC 
LIMIT 10;

-- OAuth аккаунты
SELECT u.email, a.provider, a.provider_account_id
FROM users u
JOIN accounts a ON u.id = a.user_id
ORDER BY u.created_at DESC;
```

## 📞 Получение помощи

### Логи для отправки в поддержку

```bash
# Создать полный debug report
echo "=== SYSTEM INFO ===" > debug-report.txt
uname -a >> debug-report.txt
docker --version >> debug-report.txt
docker-compose --version >> debug-report.txt

echo -e "\n=== DOCKER STATUS ===" >> debug-report.txt
docker-compose ps >> debug-report.txt

echo -e "\n=== APP LOGS ===" >> debug-report.txt
docker-compose logs app --tail=100 >> debug-report.txt

echo -e "\n=== DB LOGS ===" >> debug-report.txt
docker-compose logs postgres --tail=50 >> debug-report.txt
```

### Контакты для поддержки

- **GitHub Issues**: [Создать issue](https://github.com/your-repo/opus/issues)
- **Documentation**: [Все гайды](/DOCS/)
- **Community**: [Discord/Telegram ссылки]

---

**💡 Совет**: Всегда делайте backup перед применением исправлений!