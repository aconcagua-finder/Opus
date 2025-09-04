import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAccessToken } from '@/features/auth/utils/jwt'

// Публичные роуты, не требующие авторизации
const publicPaths = [
  '/',
  '/login',
  '/register',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/logout',
]

// Защищенные API роуты
const protectedApiPaths = [
  '/api/user',
  '/api/courses',
  '/api/lessons',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  
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
  
  // Получаем токен из заголовка Authorization или из cookie
  const authHeader = request.headers.get('authorization')
  const tokenFromHeader = authHeader?.replace('Bearer ', '')
  
  // Для страниц проверяем cookie, для API - заголовки
  const tokenFromCookie = request.cookies.get('accessToken')?.value
  const token = tokenFromHeader || tokenFromCookie
  
  console.log('Middleware: Processing path:', pathname)
  console.log('Middleware: Token from cookie:', tokenFromCookie ? 'exists' : 'missing')
  console.log('Middleware: Cookies:', request.cookies.getAll().map(c => c.name))
  
  if (!token) {
    // Для API возвращаем 401
    if (isProtectedApi) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Для страниц редиректим на логин
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }
  
  try {
    // Верифицируем токен
    const payload = await verifyAccessToken(token)
    
    // Добавляем userId в заголовки для использования в API роутах
    const response = NextResponse.next()
    response.headers.set('x-user-id', payload.userId)
    response.headers.set('x-user-email', payload.email)
    
    return response
    
  } catch (error) {
    // Токен невалидный или истек
    if (isProtectedApi) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }
    
    // Для страниц редиректим на логин
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('from', pathname)
    return NextResponse.redirect(url)
  }
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