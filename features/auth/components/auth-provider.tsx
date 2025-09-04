'use client'

import { useEffect, ReactNode } from 'react'
import { useAuthStore } from '../stores/auth-store'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { checkAuth, tokens, isAuthenticated } = useAuthStore()

  useEffect(() => {
    // Инициализация авторизации при монтировании приложения
    const initAuth = async () => {
      // Проверяем авторизацию только если есть сохраненные токены
      if (tokens?.accessToken && !isAuthenticated) {
        try {
          await checkAuth()
        } catch (error) {
          console.error('Auth initialization failed:', error)
        }
      }
    }

    initAuth()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Установка интервала для периодического обновления токена
  useEffect(() => {
    if (!isAuthenticated || !tokens?.accessToken) {
      return
    }

    // Парсим время жизни токена из переменной окружения
    const tokenLifetime = process.env.NEXT_PUBLIC_JWT_EXPIRE || '15m'
    const refreshInterval = parseRefreshInterval(tokenLifetime)
    
    // Обновляем токен за 1 минуту до истечения
    const interval = setInterval(() => {
      useAuthStore.getState().refreshToken().catch(error => {
        console.error('Token refresh failed:', error)
      })
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [isAuthenticated, tokens])

  // Обработка событий видимости страницы
  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Проверяем авторизацию при возвращении на вкладку
        useAuthStore.getState().checkAuth().catch(error => {
          console.error('Auth check failed:', error)
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isAuthenticated])

  // Обработка событий storage для синхронизации между вкладками
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth-storage') {
        if (!e.newValue) {
          // Пользователь вышел в другой вкладке
          useAuthStore.getState()._clearAuth()
        } else {
          // Обновление данных авторизации
          try {
            const newState = JSON.parse(e.newValue)
            if (newState?.state) {
              const { user, tokens, isAuthenticated } = newState.state
              
              // Обновляем состояние если оно изменилось
              const currentState = useAuthStore.getState()
              if (
                currentState.user?.id !== user?.id ||
                currentState.tokens?.accessToken !== tokens?.accessToken
              ) {
                useAuthStore.setState({
                  user,
                  tokens,
                  isAuthenticated,
                })
              }
            }
          } catch (error) {
            console.error('Failed to parse storage event:', error)
          }
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  return <>{children}</>
}

// Вспомогательная функция для парсинга интервала обновления
function parseRefreshInterval(tokenLifetime: string): number {
  const match = tokenLifetime.match(/(\d+)([dhms])/)
  
  if (!match) {
    // По умолчанию 14 минут (на минуту раньше стандартных 15 минут)
    return 14 * 60 * 1000
  }

  const [, value, unit] = match
  const numValue = parseInt(value, 10)
  
  let milliseconds = 0
  
  switch (unit) {
    case 'd':
      milliseconds = numValue * 24 * 60 * 60 * 1000
      break
    case 'h':
      milliseconds = numValue * 60 * 60 * 1000
      break
    case 'm':
      milliseconds = numValue * 60 * 1000
      break
    case 's':
      milliseconds = numValue * 1000
      break
    default:
      milliseconds = 14 * 60 * 1000 // По умолчанию 14 минут
  }
  
  // Обновляем за 1 минуту до истечения токена
  return Math.max(milliseconds - 60000, 60000) // Минимум 1 минута
}

// Компонент для защиты страниц на уровне layout
interface AuthGuardProps {
  children: ReactNode
  requiredRoles?: string[]
  fallback?: ReactNode
}

export function AuthGuard({ 
  children, 
  requiredRoles = [],
  fallback = <LoadingScreen />
}: AuthGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuthStore()

  // Показываем загрузку при инициализации
  if (isLoading) {
    return <>{fallback}</>
  }

  // Проверка авторизации
  if (!isAuthenticated) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    return null
  }

  // Проверка ролей
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => 
      user?.role === role || user?.roles?.includes(role as any)
    )
    
    if (!hasRequiredRole) {
      if (typeof window !== 'undefined') {
        window.location.href = '/unauthorized'
      }
      return null
    }
  }

  return <>{children}</>
}

// Компонент загрузки по умолчанию
function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
}

// HOC для защиты страниц
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requiredRoles?: string[]
    fallback?: ReactNode
  }
) {
  return function ProtectedComponent(props: P) {
    return (
      <AuthGuard 
        requiredRoles={options?.requiredRoles}
        fallback={options?.fallback}
      >
        <Component {...props} />
      </AuthGuard>
    )
  }
}