import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
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
  } catch (error: any) {
    console.error('Database connection error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      databaseUrl: process.env.DATABASE_URL?.replace(/postgres:.*@/, 'postgres:***@')
    }, { status: 500 })
  }
}