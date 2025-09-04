import { PrismaClient } from '@prisma/client'

// Для Windows нужно использовать host.docker.internal или 127.0.0.1
// Переопределяем DATABASE_URL для Prisma если она не работает
if (process.platform === 'win32' && process.env.DATABASE_URL?.includes('localhost')) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace('localhost', '127.0.0.1')
}

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma