'use client'

import { useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../stores/auth-store'
import type { 
  LoginCredentials, 
  RegisterCredentials, 
  SafeUser,
  AuthError 
} from '../types'

interface UseAuthReturn {
  // Состояние
  user: SafeUser | null
  isAuthenticated: boolean
  isLoading: boolean
  isRefreshing: boolean
  error: AuthError | null
  errorMessage: string | null
  
  // Методы
  login: (credentials: LoginCredentials) => Promise<void>
  register: (credentials: RegisterCredentials) => Promise<void>
  logout: () => Promise<void>
  updateUser: (userData: Partial<SafeUser>) => void
  clearError: () => void
  
  // Утилиты
  isAuthorized: (requiredRoles?: string[]) => boolean
  hasPermission: (permission: string) => boolean
}

interface UseAuthOptions {
  redirectTo?: string
  redirectIfFound?: boolean
  requiredRoles?: string[]
}

export function useAuth(options: UseAuthOptions = {}): UseAuthReturn {
  const router = useRouter()
  const {
    redirectTo,
    redirectIfFound = false,
    requiredRoles = [],
  } = options

  const {
    user,
    tokens,
    isAuthenticated,
    isLoading,
    isRefreshing,
    error,
    errorMessage,
    login: storeLogin,
    register: storeRegister,
    logout: storeLogout,
    updateUser,
    clearError,
    checkAuth,
  } = useAuthStore()

  // Проверка авторизации при монтировании
  useEffect(() => {
    // Проверяем только если есть токены
    if (tokens?.accessToken && !user) {
      checkAuth()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Обработка редиректов
  useEffect(() => {
    if (!isLoading && redirectTo) {
      if (
        // Редирект если пользователь не найден
        (!isAuthenticated && !redirectIfFound) ||
        // Редирект если пользователь найден
        (isAuthenticated && redirectIfFound)
      ) {
        router.push(redirectTo)
      }
    }
  }, [isAuthenticated, isLoading, redirectIfFound, redirectTo, router])

  // Проверка ролей
  useEffect(() => {
    if (!isLoading && isAuthenticated && requiredRoles.length > 0) {
      const hasRequiredRole = requiredRoles.some(role => 
        user?.role === role || user?.roles?.includes(role)
      )
      
      if (!hasRequiredRole) {
        router.push('/unauthorized')
      }
    }
  }, [isAuthenticated, isLoading, requiredRoles, user, router])

  // Методы с обработкой ошибок и редиректами
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      await storeLogin(credentials)
      
      // Редирект после успешного входа
      if (redirectIfFound && redirectTo) {
        router.push(redirectTo)
      }
    } catch (error) {
      // Ошибка уже обработана в сторе
      console.error('Login failed:', error)
      throw error
    }
  }, [storeLogin, redirectIfFound, redirectTo, router])

  const register = useCallback(async (credentials: RegisterCredentials) => {
    try {
      await storeRegister(credentials)
      
      // Редирект после успешной регистрации
      if (redirectIfFound && redirectTo) {
        router.push(redirectTo)
      }
    } catch (error) {
      // Ошибка уже обработана в сторе
      console.error('Registration failed:', error)
      throw error
    }
  }, [storeRegister, redirectIfFound, redirectTo, router])

  const logout = useCallback(async () => {
    try {
      await storeLogout()
      
      // Редирект после выхода
      if (!redirectIfFound && redirectTo) {
        router.push(redirectTo)
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }, [storeLogout, redirectIfFound, redirectTo, router])

  // Проверка авторизации по ролям
  const isAuthorized = useCallback((roles?: string[]) => {
    if (!isAuthenticated || !user) return false
    if (!roles || roles.length === 0) return true
    
    return roles.some(role => 
      user.role === role || user.roles?.includes(role)
    )
  }, [isAuthenticated, user])

  // Проверка разрешений
  const hasPermission = useCallback((permission: string) => {
    if (!isAuthenticated || !user) return false
    
    // Проверка разрешений в зависимости от структуры данных пользователя
    if (user.permissions) {
      return user.permissions.includes(permission)
    }
    
    // Фоллбэк на проверку ролей для базовых разрешений
    const rolePermissions: Record<string, string[]> = {
      admin: ['*'], // Админ имеет все разрешения
      moderator: ['read', 'write', 'moderate'],
      user: ['read', 'write'],
    }
    
    const userRole = user.role || 'user'
    const permissions = rolePermissions[userRole] || []
    
    return permissions.includes('*') || permissions.includes(permission)
  }, [isAuthenticated, user])

  // Мемоизация возвращаемого объекта
  return useMemo(() => ({
    // Состояние
    user,
    isAuthenticated,
    isLoading,
    isRefreshing,
    error,
    errorMessage,
    
    // Методы
    login,
    register,
    logout,
    updateUser,
    clearError,
    
    // Утилиты
    isAuthorized,
    hasPermission,
  }), [
    user,
    isAuthenticated,
    isLoading,
    isRefreshing,
    error,
    errorMessage,
    login,
    register,
    logout,
    updateUser,
    clearError,
    isAuthorized,
    hasPermission,
  ])
}

// Хук для защищенных страниц
export function useRequireAuth(options: UseAuthOptions = {}) {
  const defaultOptions: UseAuthOptions = {
    redirectTo: '/login',
    redirectIfFound: false,
    ...options,
  }
  
  return useAuth(defaultOptions)
}

// Хук для гостевых страниц (логин, регистрация)
export function useGuestOnly(options: UseAuthOptions = {}) {
  const defaultOptions: UseAuthOptions = {
    redirectTo: '/dictionary',
    redirectIfFound: true,
    ...options,
  }
  
  return useAuth(defaultOptions)
}

// Хук для проверки ролей
export function useRequireRole(
  roles: string[], 
  options: Omit<UseAuthOptions, 'requiredRoles'> = {}
) {
  const defaultOptions: UseAuthOptions = {
    redirectTo: '/login',
    redirectIfFound: false,
    requiredRoles: roles,
    ...options,
  }
  
  return useAuth(defaultOptions)
}
