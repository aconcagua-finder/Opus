import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { verifyRefreshToken } from '@/features/auth/utils/jwt'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get('refreshToken')?.value
    
    if (refreshToken) {
      try {
        // Верифицируем токен чтобы получить sessionId
        const payload = await verifyRefreshToken(refreshToken)
        
        // Инвалидируем сессию в базе
        await prisma.session.update({
          where: { id: payload.sessionId },
          data: {
            revokedAt: new Date(),
            revokedReason: 'LOGOUT'
          }
        })
      } catch {
        // Если токен невалидный, просто удаляем куку
      }
    }
    
    // Удаляем куку с refresh токеном
    cookieStore.delete('refreshToken')
    
    return NextResponse.json({ message: 'Logged out successfully' })
    
  } catch (error) {
    console.error('Logout error:', error)
    // Даже при ошибке удаляем куку
    const cookieStore = await cookies()
    cookieStore.delete('refreshToken')
    
    return NextResponse.json({ message: 'Logged out' })
  }
}