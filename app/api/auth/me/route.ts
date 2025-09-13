import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyAccessToken } from '@/features/auth/utils/jwt'
import { AuthError, type SafeUser } from '@/features/auth/types'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    // Получаем access token из заголовка или cookies
    const authHeader = request.headers.get('authorization')
    const tokenFromHeader = authHeader?.replace('Bearer ', '')
    
    const cookieStore = await cookies()
    const tokenFromCookie = cookieStore.get('accessToken')?.value
    
    const accessToken = tokenFromHeader || tokenFromCookie

    if (!accessToken) {
      return NextResponse.json(
        { error: AuthError.INVALID_TOKEN },
        { status: 401 }
      )
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Me: Processing request for token:', accessToken.substring(0, 10) + '...')
    }

    // Верифицируем access token
    let tokenPayload
    try {
      tokenPayload = await verifyAccessToken(accessToken)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Me: Token verification failed:', error)
      }
      return NextResponse.json(
        { error: AuthError.INVALID_TOKEN },
        { status: 401 }
      )
    }

    // Получаем пользователя из БД
    const user = await prisma.user.findUnique({
      where: { id: tokenPayload.userId },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        emailVerified: true,
        isActive: true,
        isBanned: true,
        banReason: true,
        bannedUntil: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
      }
    })

    if (!user) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Me: User not found for ID:', tokenPayload.userId)
      }
      return NextResponse.json(
        { error: AuthError.USER_NOT_FOUND },
        { status: 404 }
      )
    }

    // Проверяем статус пользователя
    if (user.isBanned && (!user.bannedUntil || user.bannedUntil > new Date())) {
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
      return NextResponse.json(
        { error: AuthError.USER_INACTIVE },
        { status: 403 }
      )
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Me: Successfully retrieved user data for:', user.email)
    }

    // Возвращаем данные пользователя
    return NextResponse.json({
      user: user as SafeUser
    })

  } catch (error) {
    console.error('Get user info error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}