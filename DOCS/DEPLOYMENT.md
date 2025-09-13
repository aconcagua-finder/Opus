# Production Deployment Guide

Последнее обновление: 13.09.2025

## Обзор

Это руководство описывает развертывание Opus в production среде с использованием Docker, PostgreSQL 16, и настройкой Google OAuth.

## Предварительные требования

### Инфраструктура
- **Сервер**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **RAM**: Минимум 2GB, рекомендуется 4GB+
- **Диск**: Минимум 20GB SSD
- **Docker**: v24.0+
- **Docker Compose**: v2.20+

### Домен и SSL
- Зарегистрированный домен
- SSL сертификат (Let's Encrypt рекомендуется)
- Настроенная A-запись на ваш сервер

### Google OAuth Setup
- Google Cloud Console проект
- OAuth 2.0 credentials для production

## Пошаговое развертывание

### 1. Подготовка сервера

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Перелогиньтесь для применения группы docker
```

### 2. Клонирование и настройка

```bash
# Клонирование репозитория
git clone https://github.com/your-username/opus.git
cd opus

# Создание production переменных окружения
cp .env.example .env.production
```

### 3. Настройка переменных окружения

Создайте файл `.env.production`:

```bash
# === ОСНОВНЫЕ НАСТРОЙКИ ===
NODE_ENV=production
PORT=3000

# === БАЗА ДАННЫХ ===
DATABASE_URL="postgresql://opus_user:SECURE_DB_PASSWORD@postgres:5432/opus_language?schema=public"
POSTGRES_USER=opus_user
POSTGRES_PASSWORD=SECURE_DB_PASSWORD
POSTGRES_DB=opus_language

# === NEXTAUTH КОНФИГУРАЦИЯ ===
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="VERY_SECURE_SECRET_KEY_32_CHARS_MINIMUM"

# === GOOGLE OAUTH ===
GOOGLE_CLIENT_ID="your-production-google-client-id.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-production-google-client-secret"

# === JWT ДЛЯ CUSTOM AUTH ===
JWT_SECRET="ANOTHER_SECURE_SECRET_KEY_32_CHARS_MINIMUM"

# === БЕЗОПАСНОСТЬ ===
SECURE_COOKIES=true
CORS_ORIGIN="https://yourdomain.com"
```

**⚠️ ВАЖНО**: Замените все placeholder значения на реальные secure secrets!

### 4. Google OAuth Console Setup

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com)
2. Создайте новый проект или выберите существующий
3. Включите **Google+ API**
4. Создайте **OAuth 2.0 Client ID**:
   - Application type: Web application
   - Authorized redirect URIs: `https://yourdomain.com/api/auth/callback/google`
5. Скопируйте Client ID и Client Secret в `.env.production`

### 5. SSL Certificate (Let's Encrypt)

```bash
# Установка Certbot
sudo apt install snapd
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# Получение сертификата (замените yourdomain.com)
sudo certbot certonly --standalone -d yourdomain.com

# Сертификаты будут в /etc/letsencrypt/live/yourdomain.com/
```

### 6. Production Docker Compose

Создайте `docker-compose.production.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16
    container_name: opus-postgres
    restart: always
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - opus-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 30s
      timeout: 10s
      retries: 5

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: opus-app
    restart: always
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - opus-network
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.opus.rule=Host(`yourdomain.com`)"
      - "traefik.http.routers.opus.tls=true"
      - "traefik.http.routers.opus.tls.certresolver=letsencrypt"

  # Опциональный reverse proxy (Traefik)
  traefik:
    image: traefik:v3.0
    container_name: opus-traefik
    restart: always
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
      - "--certificatesresolvers.letsencrypt.acme.email=your-email@domain.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
      - "letsencrypt:/letsencrypt"
    networks:
      - opus-network

networks:
  opus-network:
    driver: bridge

volumes:
  postgres-data:
  letsencrypt:
```

### 7. Production Dockerfile

Создайте оптимизированный `Dockerfile`:

```dockerfile
# Multi-stage build для минимального размера образа
FROM node:20-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app

# Создание non-root пользователя
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Копирование необходимых файлов
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Настройка прав доступа
USER nextjs

# Открытие порта
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Запуск приложения
CMD ["npm", "start"]
```

### 8. Развертывание

```bash
# Загрузка переменных окружения
export $(cat .env.production | xargs)

# Сборка и запуск
docker-compose -f docker-compose.production.yml up -d --build

# Применение миграций БД
docker-compose -f docker-compose.production.yml exec app npx prisma migrate deploy

# Проверка статуса
docker-compose -f docker-compose.production.yml ps
docker-compose -f docker-compose.production.yml logs app
```

## Мониторинг и обслуживание

### Логирование

```bash
# Просмотр логов приложения
docker-compose -f docker-compose.production.yml logs -f app

# Логи PostgreSQL
docker-compose -f docker-compose.production.yml logs -f postgres

# Логи всех сервисов
docker-compose -f docker-compose.production.yml logs -f
```

### Backup базы данных

Создайте скрипт `backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="opus_backup_$DATE.sql"

# Создание backup
docker-compose -f docker-compose.production.yml exec -T postgres pg_dump -U opus_user opus_language > "$BACKUP_DIR/$FILENAME"

# Сжатие
gzip "$BACKUP_DIR/$FILENAME"

# Удаление старых backup (старше 30 дней)
find "$BACKUP_DIR" -name "opus_backup_*.sql.gz" -mtime +30 -delete

echo "Backup создан: $FILENAME.gz"
```

```bash
# Сделать скрипт исполняемым
chmod +x backup.sh

# Добавить в crontab для автоматического backup
echo "0 2 * * * /path/to/backup.sh" | crontab -
```

### Обновление приложения

```bash
# Получение обновлений
git pull origin main

# Пересборка и перезапуск
docker-compose -f docker-compose.production.yml up -d --build

# Применение новых миграций
docker-compose -f docker-compose.production.yml exec app npx prisma migrate deploy

# Проверка здоровья
curl -f https://yourdomain.com/api/health
```

### SSL Certificate Renewal

```bash
# Добавить в crontab для автоматического обновления
echo "0 0 1 * * certbot renew && docker-compose -f docker-compose.production.yml restart traefik" | crontab -
```

## Безопасность

### Firewall

```bash
# Настройка UFW
sudo ufw enable
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS

# Закрытие прямого доступа к БД
sudo ufw deny 5432
```

### System Updates

```bash
# Автоматические обновления безопасности
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### Мониторинг ресурсов

Установите базовый мониторинг:

```bash
# Htop для мониторинга процессов
sudo apt install htop

# Проверка использования диска
df -h

# Проверка использования памяти
free -h

# Проверка Docker контейнеров
docker stats
```

## Troubleshooting

### Проверка здоровья сервисов

```bash
# Статус всех контейнеров
docker-compose -f docker-compose.production.yml ps

# Health check API
curl https://yourdomain.com/api/health

# Проверка подключения к БД
docker-compose -f docker-compose.production.yml exec postgres psql -U opus_user -d opus_language -c "SELECT 1;"
```

### Частые проблемы

1. **503 Service Unavailable**: Проверьте логи приложения и убедитесь что БД доступна
2. **SSL ошибки**: Проверьте сертификаты Let's Encrypt
3. **Google OAuth не работает**: Проверьте правильность redirect URI в Google Console
4. **Медленная работа**: Проверьте использование ресурсов и настройте PostgreSQL

## Масштабирование

### Horizontal Scaling

Для масштабирования добавьте load balancer и несколько инстансов приложения:

```yaml
# В docker-compose.production.yml
services:
  app:
    # ... существующая конфигурация
    deploy:
      replicas: 3
```

### Database Optimization

```sql
-- Настройки PostgreSQL для production
-- Добавить в postgresql.conf

shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
```

---

**🎯 Production Checklist:**

- [ ] SSL сертификат настроен
- [ ] Google OAuth credentials добавлены
- [ ] Переменные окружения настроены
- [ ] Firewall сконфигурирован
- [ ] Backup система работает
- [ ] Мониторинг настроен
- [ ] Health checks проходят
- [ ] DNS правильно настроен