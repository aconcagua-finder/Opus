'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { devtools } from 'zustand/middleware'
import axios, { AxiosError } from 'axios'
import {
  SafeUser,
  AuthTokens,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  AuthError,
} from '../types'

interface AuthState {
  // Состояние
  user: SafeUser | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  isLoading: boolean
  isRefreshing: boolean
  error: AuthError | null
  errorMessage: string | null

  // Действия
  login: (credentials: LoginCredentials) => Promise<void>
  register: (credentials: RegisterCredentials) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
  updateUser: (user: Partial<SafeUser>) => void
  clearError: () => void
  checkAuth: () => Promise<void>
  
  // Внутренние методы
  _setAuth: (response: AuthResponse) => void
  _clearAuth: () => void
  _setError: (error: AuthError, message?: string) => void
}

// Конфигурация API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

// Axios instance с интерсепторами
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

// Хранилище токена обновления для предотвращения race conditions
let refreshPromise: Promise<void> | null = null

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Начальное состояние
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        isRefreshing: false,
        error: null,
        errorMessage: null,

        // Внутренние методы
        _setAuth: (response: AuthResponse) => {
          const { user, tokens } = response
          
          // Установка токена в заголовки axios
          if (tokens.accessToken) {
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`
          }

          set({
            user,
            tokens,
            isAuthenticated: true,
            error: null,
            errorMessage: null,
          })
        },

        _clearAuth: () => {
          // Удаление токена из заголовков
          delete apiClient.defaults.headers.common['Authorization']
          
          set({
            user: null,
            tokens: null,
            isAuthenticated: false,
            error: null,
            errorMessage: null,
          })
        },

        _setError: (error: AuthError, message?: string) => {
          set({
            error,
            errorMessage: message || getErrorMessage(error),
            isLoading: false,
            isRefreshing: false,
          })
        },

        // Вход в систему
        login: async (credentials: LoginCredentials) => {
          set({ isLoading: true, error: null, errorMessage: null })
          
          try {
            const response = await apiClient.post<AuthResponse>('/auth/login', credentials)
            get()._setAuth(response.data)
          } catch (err) {
            const error = err as AxiosError<{ error: AuthError; message?: string }>
            const authError = error.response?.data?.error || AuthError.INVALID_CREDENTIALS
            const message = error.response?.data?.message
            
            get()._setError(authError, message)
            throw new Error(message || getErrorMessage(authError))
          } finally {
            set({ isLoading: false })
          }
        },

        // Регистрация
        register: async (credentials: RegisterCredentials) => {
          set({ isLoading: true, error: null, errorMessage: null })
          
          try {
            const response = await apiClient.post<AuthResponse>('/auth/register', credentials)
            get()._setAuth(response.data)
          } catch (err) {
            const error = err as AxiosError<{ error: AuthError; message?: string }>
            const authError = error.response?.data?.error || AuthError.VALIDATION_ERROR
            const message = error.response?.data?.message
            
            get()._setError(authError, message)
            throw new Error(message || getErrorMessage(authError))
          } finally {
            set({ isLoading: false })
          }
        },

        // Выход из системы
        logout: async () => {
          set({ isLoading: true })
          
          try {
            await apiClient.post('/auth/logout')
          } catch (err) {
            console.error('Logout error:', err)
          } finally {
            get()._clearAuth()
            set({ isLoading: false })
          }
        },

        // Обновление токена
        refreshToken: async () => {
          // Предотвращение множественных запросов на обновление
          if (refreshPromise) {
            return refreshPromise
          }

          const refresh = async () => {
            const { tokens } = get()
            
            if (!tokens?.refreshToken) {
              get()._clearAuth()
              throw new Error('No refresh token available')
            }

            set({ isRefreshing: true })
            
            try {
              const response = await apiClient.post<AuthResponse>(
                '/auth/refresh',
                { refreshToken: tokens.refreshToken }
              )
              
              get()._setAuth(response.data)
            } catch (err) {
              const error = err as AxiosError<{ error: AuthError }>
              const authError = error.response?.data?.error || AuthError.INVALID_TOKEN
              
              get()._clearAuth()
              get()._setError(authError)
              throw new Error(getErrorMessage(authError))
            } finally {
              set({ isRefreshing: false })
              refreshPromise = null
            }
          }

          refreshPromise = refresh()
          return refreshPromise
        },

        // Обновление данных пользователя
        updateUser: (userData: Partial<SafeUser>) => {
          const { user } = get()
          
          if (!user) {
            console.warn('Cannot update user: no user logged in')
            return
          }

          set({
            user: {
              ...user,
              ...userData,
            },
          })
        },

        // Очистка ошибки
        clearError: () => {
          set({ error: null, errorMessage: null })
        },

        // Проверка авторизации
        checkAuth: async () => {
          const { tokens } = get()
          
          if (!tokens?.accessToken) {
            get()._clearAuth()
            return
          }

          set({ isLoading: true })
          
          try {
            // Установка токена в заголовки
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`
            
            const response = await apiClient.get<{ user: SafeUser }>('/auth/me')
            
            set({
              user: response.data.user,
              isAuthenticated: true,
              error: null,
              errorMessage: null,
            })
          } catch (err) {
            const error = err as AxiosError
            
            // Если токен истек, пробуем обновить
            if (error.response?.status === 401 && tokens.refreshToken) {
              try {
                await get().refreshToken()
              } catch (refreshError) {
                get()._clearAuth()
              }
            } else {
              get()._clearAuth()
            }
          } finally {
            set({ isLoading: false })
          }
        },
      }),
      {
        name: 'auth-storage',
        storage: createJSONStorage(() => {
          // Использование localStorage для клиента
          if (typeof window !== 'undefined') {
            return localStorage
          }
          // Фоллбэк для SSR
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          }
        }),
        partialize: (state) => ({
          user: state.user,
          tokens: state.tokens,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    {
      name: 'auth-store',
    }
  )
)

// Интерсептор для автоматического обновления токена
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any
    
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== '/auth/refresh'
    ) {
      originalRequest._retry = true
      
      try {
        await useAuthStore.getState().refreshToken()
        const { tokens } = useAuthStore.getState()
        
        if (tokens?.accessToken) {
          originalRequest.headers['Authorization'] = `Bearer ${tokens.accessToken}`
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        // Токен обновить не удалось, перенаправление на страницу входа
        useAuthStore.getState()._clearAuth()
        
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }
    }
    
    return Promise.reject(error)
  }
)

// Вспомогательная функция для получения сообщения об ошибке
function getErrorMessage(error: AuthError): string {
  const messages: Record<AuthError, string> = {
    [AuthError.INVALID_CREDENTIALS]: 'Неверный email или пароль',
    [AuthError.USER_NOT_FOUND]: 'Пользователь не найден',
    [AuthError.EMAIL_ALREADY_EXISTS]: 'Email уже зарегистрирован',
    [AuthError.USERNAME_ALREADY_EXISTS]: 'Имя пользователя уже занято',
    [AuthError.INVALID_TOKEN]: 'Недействительный или истекший токен',
    [AuthError.TOKEN_EXPIRED]: 'Токен истек',
    [AuthError.SESSION_NOT_FOUND]: 'Сессия не найдена',
    [AuthError.USER_BANNED]: 'Учетная запись заблокирована',
    [AuthError.USER_INACTIVE]: 'Учетная запись неактивна',
    [AuthError.TOO_MANY_ATTEMPTS]: 'Слишком много попыток. Попробуйте позже',
    [AuthError.VALIDATION_ERROR]: 'Ошибка валидации. Проверьте введенные данные',
  }
  
  return messages[error] || 'Произошла непредвиденная ошибка'
}

// Экспорт API клиента для использования в других модулях
export { apiClient }