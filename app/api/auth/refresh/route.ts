import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { 
  createAccessToken, 
  createRefreshToken, 
  verifyRefreshToken,
  getRefreshTokenExpiry 
} from '@/features/auth/utils/jwt'
import { AuthError, type AuthResponse, type SafeUser } from '@/features/auth/types'
import { cookies } from 'next/headers'

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token required'),
})

export async function POST(request: NextRequest) {
  try {
    // Получаем refresh token из cookies или body
    const cookieStore = await cookies()
    const refreshTokenFromCookie = cookieStore.get('refreshToken')?.value
    
    let refreshToken: string | undefined
    
    // Пытаемся получить из body
    try {
      const body = await request.json()
      const validationResult = refreshSchema.safeParse(body)
      if (validationResult.success) {
        refreshToken = validationResult.data.refreshToken
      }
    } catch {
      // Body пустое или невалидное, используем cookie
    }
    
    // Если нет в body, используем из cookies
    if (!refreshToken && refreshTokenFromCookie) {
      refreshToken = refreshTokenFromCookie
    }
    
    if (!refreshToken) {
      return NextResponse.json(
        { error: AuthError.INVALID_TOKEN },
        { status: 401 }
      )
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Refresh: Processing token refresh for token:', refreshToken.substring(0, 10) + '...')
    }

    // Верифицируем refresh token
    let tokenPayload
    try {
      tokenPayload = await verifyRefreshToken(refreshToken)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Refresh: Token verification failed:', error)
      }
      return NextResponse.json(
        { error: AuthError.INVALID_TOKEN },
        { status: 401 }
      )
    }

    // Ищем сессию в БД
    const session = await prisma.session.findFirst({
      where: {
        refreshToken,
        userId: tokenPayload.userId,
        revokedAt: null,
        expiresAt: { gt: new Date() }
      },
      include: {
        user: true
      }
    })

    if (!session || !session.user) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Refresh: Session not found or expired')
      }
      return NextResponse.json(
        { error: AuthError.SESSION_NOT_FOUND },
        { status: 401 }
      )
    }

    // Проверяем статус пользователя
    if (session.user.isBanned) {
      return NextResponse.json(
        { error: AuthError.USER_BANNED },
        { status: 403 }
      )
    }

    if (!session.user.isActive || session.user.deletedAt) {
      return NextResponse.json(
        { error: AuthError.USER_INACTIVE },
        { status: 403 }
      )
    }

    // Создаем новые токены
    const newAccessToken = await createAccessToken({
      userId: session.user.id,
      email: session.user.email
    })

    const newRefreshToken = await createRefreshToken({
      userId: session.user.id,
      email: session.user.email,
      sessionId: session.id
    })

    // Обновляем сессию в транзакции
    await prisma.$transaction(async (tx) => {
      // Обновляем refresh token в сессии
      await tx.session.update({
        where: { id: session.id },
        data: {
          refreshToken: newRefreshToken,
          expiresAt: getRefreshTokenExpiry(),
          lastActivityAt: new Date()
        }
      })

      // Обновляем время последней активности пользователя
      await tx.user.update({
        where: { id: session.user.id },
        data: { lastLoginAt: new Date() }
      })
    })

    if (process.env.NODE_ENV === 'development') {
      console.log('Refresh: Tokens refreshed successfully for user:', session.user.email)
    }

    // Подготовка безопасного пользователя
    const {
      passwordHash: _passwordHash,
      deletedAt: _deletedAt,
      ...safeUser
    } = session.user
    void _passwordHash
    void _deletedAt

    // Установка новых cookies
    cookieStore.set('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 минут
      path: '/'
    })

    cookieStore.set('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 дней
      path: '/'
    })

    // Ответ с новыми токенами
    const response: AuthResponse = {
      user: safeUser as SafeUser,
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Refresh token error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
