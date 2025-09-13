import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAccessToken } from '@/features/auth/utils/jwt'
import { getToken } from 'next-auth/jwt'

// Публичные роуты, не требующие авторизации
const publicPaths = [
  '/',
  '/login',
  '/register',
]

// Защищенные API роуты
const protectedApiPaths = [
  '/api/user',
  '/api/courses',
  '/api/lessons',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Пропускаем API routes авторизации
  if (pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }
  
  // Проверяем, является ли путь публичным
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  )
  
  // Проверяем, является ли путь защищенным API
  const isProtectedApi = protectedApiPaths.some(path =>
    pathname.startsWith(path)
  )
  
  // Для публичных путей пропускаем
  if (isPublicPath) {
    return NextResponse.next()
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Middleware: Processing protected path:', pathname)
  }
  
  // Попробуем найти действующий токен авторизации
  let userId: string | null = null
  let userEmail: string | null = null
  
  // Проверяем NextAuth JWT токен
  try {
    const nextAuthToken = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (nextAuthToken?.sub && nextAuthToken?.email) {
      userId = nextAuthToken.sub
      userEmail = nextAuthToken.email
      if (process.env.NODE_ENV === 'development') {
        console.log('Middleware: NextAuth token valid for:', userEmail)
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log('Middleware: NextAuth token check failed:', error)
    }
  }
  
  // Если NextAuth не сработал, проверяем кастомный JWT
  if (!userId) {
    const authHeader = request.headers.get('authorization')
    const tokenFromHeader = authHeader?.replace('Bearer ', '')
    const tokenFromCookie = request.cookies.get('accessToken')?.value
    const jwtToken = tokenFromHeader || tokenFromCookie
    
    if (jwtToken) {
      try {
        const payload = await verifyAccessToken(jwtToken)
        userId = payload.userId
        userEmail = payload.email
        if (process.env.NODE_ENV === 'development') {
          console.log('Middleware: Custom JWT token valid for:', userEmail)
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Middleware: Custom JWT token verification failed:', error)
        }
      }
    }
  }
  
  // Если токен найден, пропускаем запрос с заголовками
  if (userId && userEmail) {
    const response = NextResponse.next()
    response.headers.set('x-user-id', userId)
    response.headers.set('x-user-email', userEmail)
    return response
  }
  
  // Если никакой авторизации не найдено
  if (process.env.NODE_ENV === 'development') {
    console.log('Middleware: No valid authentication found')
  }
  
  // Для защищенных API возвращаем 401
  if (isProtectedApi) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  // Для защищенных страниц редиректим на логин
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  url.searchParams.set('from', pathname)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}