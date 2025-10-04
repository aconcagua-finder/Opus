import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { hashPassword, validatePasswordStrength } from '@/features/auth/utils/password'
import { createAccessToken, createRefreshToken, getRefreshTokenExpiry } from '@/features/auth/utils/jwt'
import { AuthError, type AuthResponse, type SafeUser } from '@/features/auth/types'
import { cookies } from 'next/headers'
import { Prisma } from '@prisma/client'

const registerSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(8, 'Пароль должен быть минимум 8 символов'),
  confirmPassword: z.string(),
  username: z.string().min(3).max(30).optional(),
  displayName: z.string().max(100).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent')
    
    // Валидация входных данных
    const validationResult = registerSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: AuthError.VALIDATION_ERROR,
          details: validationResult.error.flatten() 
        },
        { status: 400 }
      )
    }
    
    const { email, password, username, displayName } = validationResult.data
    
    // Проверка силы пароля
    const passwordStrength = validatePasswordStrength(password)
    if (!passwordStrength.isValid) {
      return NextResponse.json(
        { 
          error: AuthError.VALIDATION_ERROR,
          details: { password: passwordStrength.errors }
        },
        { status: 400 }
      )
    }
    
    // Проверка существующего пользователя по email
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUserByEmail) {
      return NextResponse.json(
        { error: AuthError.EMAIL_ALREADY_EXISTS },
        { status: 409 }
      )
    }
    
    // Проверка существующего пользователя по username
    if (username) {
      const existingUserByUsername = await prisma.user.findUnique({
        where: { username }
      })
      
      if (existingUserByUsername) {
        return NextResponse.json(
          { error: AuthError.USERNAME_ALREADY_EXISTS },
          { status: 409 }
        )
      }
    }
    
    // Хеширование пароля
    const passwordHash = await hashPassword(password)
    
    // Создание пользователя и первой сессии в транзакции
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Создаем пользователя
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          username,
          displayName,
        }
      })
      
      // Создаем токены
      const accessToken = await createAccessToken({
        userId: user.id,
        email: user.email
      })
      
      // Создаем сессию
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
      
      // Логируем успешную регистрацию
      await tx.authAttempt.create({
        data: {
          email: user.email,
          userId: user.id,
          success: true,
          ipAddress: ip,
          userAgent,
        }
      })
      
      return { user, accessToken, refreshToken }
    })
    
    // Подготовка безопасного пользователя
    const {
      passwordHash: _passwordHash,
      deletedAt: _deletedAt,
      ...safeUser
    } = result.user
    void _passwordHash
    void _deletedAt
    
    // Установка куки с токенами
    const cookieStore = await cookies()
    
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
    
    // Ответ
    const response: AuthResponse = {
      user: safeUser as SafeUser,
      tokens: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      }
    }
    
    return NextResponse.json(response, { status: 201 })
    
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
