import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/features/auth/utils/password'
import { createAccessToken, createRefreshToken, getRefreshTokenExpiry } from '@/features/auth/utils/jwt'
import { AuthError, type AuthResponse, type SafeUser } from '@/features/auth/types'
import { cookies } from 'next/headers'
import { Prisma } from '@prisma/client'

const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль'),
})

// Проверка количества неудачных попыток
async function checkAuthAttempts(email: string, ip?: string | null): Promise<boolean> {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
  
  const attempts = await prisma.authAttempt.count({
    where: {
      OR: [
        { email },
        ...(ip ? [{ ipAddress: ip }] : [])
      ],
      success: false,
      createdAt: { gte: fifteenMinutesAgo }
    }
  })
  
  // Установка лимита попыток
  const maxAttempts = 15 // 15 попыток для dev и prod
  return attempts < maxAttempts
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent')
    
    // Валидация входных данных
    const validationResult = loginSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: AuthError.VALIDATION_ERROR,
          details: validationResult.error.flatten() 
        },
        { status: 400 }
      )
    }
    
    const { email, password } = validationResult.data
    
    // Проверка попыток входа
    const canAttempt = await checkAuthAttempts(email, ip)
    if (!canAttempt) {
      await prisma.authAttempt.create({
        data: {
          email,
          success: false,
          failureReason: AuthError.TOO_MANY_ATTEMPTS,
          ipAddress: ip,
          userAgent,
        }
      })
      
      return NextResponse.json(
        { error: AuthError.TOO_MANY_ATTEMPTS },
        { status: 429 }
      )
    }
    
    // Поиск пользователя
    const user = await prisma.user.findUnique({
      where: { email },
      include: { sessions: true }
    })
    
    if (!user) {
      await prisma.authAttempt.create({
        data: {
          email,
          success: false,
          failureReason: AuthError.USER_NOT_FOUND,
          ipAddress: ip,
          userAgent,
        }
      })
      
      return NextResponse.json(
        { error: AuthError.INVALID_CREDENTIALS },
        { status: 401 }
      )
    }
    
    // Проверка пароля
    if (!user.passwordHash) {
      await prisma.authAttempt.create({
        data: {
          email,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent'),
          success: false,
          failureReason: 'OAuth user attempted password login',
        }
      })
      
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      )
    }
    
    const isValidPassword = await verifyPassword(password, user.passwordHash)
    if (!isValidPassword) {
      await prisma.authAttempt.create({
        data: {
          email,
          userId: user.id,
          success: false,
          failureReason: AuthError.INVALID_CREDENTIALS,
          ipAddress: ip,
          userAgent,
        }
      })
      
      return NextResponse.json(
        { error: AuthError.INVALID_CREDENTIALS },
        { status: 401 }
      )
    }
    
    // Проверка статусов пользователя
    if (user.isBanned && (!user.bannedUntil || user.bannedUntil > new Date())) {
      await prisma.authAttempt.create({
        data: {
          email,
          userId: user.id,
          success: false,
          failureReason: AuthError.USER_BANNED,
          ipAddress: ip,
          userAgent,
        }
      })
      
      return NextResponse.json(
        { 
          error: AuthError.USER_BANNED,
          bannedUntil: user.bannedUntil,
          reason: user.banReason 
        },
        { status: 403 }
      )
    }
    
    if (!user.isActive) {
      await prisma.authAttempt.create({
        data: {
          email,
          userId: user.id,
          success: false,
          failureReason: AuthError.USER_INACTIVE,
          ipAddress: ip,
          userAgent,
        }
      })
      
      return NextResponse.json(
        { error: AuthError.USER_INACTIVE },
        { status: 403 }
      )
    }
    
    // Создание новой сессии в транзакции
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Инвалидируем старые сессии с этого устройства
      await tx.session.updateMany({
        where: {
          userId: user.id,
          userAgent,
          revokedAt: null
        },
        data: {
          revokedAt: new Date(),
          revokedReason: 'NEW_LOGIN'
        }
      })
      
      // Создаем токены
      const accessToken = await createAccessToken({
        userId: user.id,
        email: user.email
      })
      
      // Создаем новую сессию
      const session = await tx.session.create({
        data: {
          userId: user.id,
          refreshToken: crypto.randomUUID(),
          expiresAt: getRefreshTokenExpiry(),
          ipAddress: ip,
          userAgent,
        }
      })
      
      const refreshToken = await createRefreshToken({
        userId: user.id,
        email: user.email,
        sessionId: session.id
      })
      
      // Обновляем сессию с настоящим refresh токеном
      await tx.session.update({
        where: { id: session.id },
        data: { refreshToken }
      })
      
      // Обновляем время последнего входа
      await tx.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      })
      
      // Логируем успешную попытку
      await tx.authAttempt.create({
        data: {
          email: user.email,
          userId: user.id,
          success: true,
          ipAddress: ip,
          userAgent,
        }
      })
      
      return { accessToken, refreshToken }
    })
    
    // Подготовка безопасного пользователя
    const { passwordHash: _, deletedAt: __, sessions: ___, ...safeUser } = user
    
    // Установка куки с токенами
    const cookieStore = await cookies()
    
    console.log('Login: Setting cookies for user:', user.email)
    
    // Refresh token - httpOnly для безопасности
    cookieStore.set('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 дней
      path: '/'
    })
    
    // Access token - также httpOnly
    cookieStore.set('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 минут
      path: '/'
    })
    
    console.log('Login: Cookies set successfully')
    
    // Ответ
    const response: AuthResponse = {
      user: safeUser as SafeUser,
      tokens: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      }
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}