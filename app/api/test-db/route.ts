import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createErrorResponse } from '@/lib/http'

export async function GET() {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return createErrorResponse({
        code: 'NOT_FOUND',
        message: 'Not Found',
        status: 404,
      })
    }

    // Попробуем подключиться к базе данных
    await prisma.$connect()
    
    // Попробуем получить количество пользователей
    const userCount = await prisma.user.count()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connected successfully',
      userCount,
      databaseUrl: process.env.DATABASE_URL?.replace(/postgres:.*@/, 'postgres:***@')
    })
  } catch (error) {
    console.error('Database connection error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'

    if (process.env.NODE_ENV !== 'development') {
      return createErrorResponse({
        code: 'NOT_FOUND',
        message: 'Not Found',
        status: 404,
      })
    }

    return createErrorResponse({
      code: 'DATABASE_CONNECTION_FAILED',
      message,
      status: 500,
      details: {
        databaseUrl: process.env.DATABASE_URL?.replace(/postgres:.*@/, 'postgres:***@')
      }
    })
  }
}
