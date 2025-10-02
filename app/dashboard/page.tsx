'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProtectedNav } from '@/components/navigation/protected-nav'

export default function DashboardPage() {
  const router = useRouter()
  const { user: jwtUser, isLoading: jwtLoading } = useAuth()
  const { data: nextAuthSession, status: nextAuthStatus } = useSession()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Determine which authentication system is active
  const isNextAuthLoading = nextAuthStatus === 'loading'
  const isJwtLoading = jwtLoading
  const isLoading = isNextAuthLoading || isJwtLoading
  
  const nextAuthUser = nextAuthSession?.user
  const user = nextAuthUser || jwtUser
  
  // Logout function that handles both systems
  useEffect(() => {
    if (!isLoading && !user && mounted) {
      router.push('/login')
    }
  }, [user, isLoading, router, mounted])

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen" suppressHydrationWarning>
      <ProtectedNav />

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-6 sm:py-12">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white via-cyan-300 to-white bg-clip-text text-transparent mb-2">
            Добро пожаловать обратно, {('displayName' in user ? user.displayName : user.name) || ('username' in user ? user.username : undefined) || user.email?.split('@')[0] || 'Пользователь'}!
          </h1>
          <p className="text-zinc-500 text-sm sm:text-base">
            Вот что происходит с вашим аккаунтом сегодня.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <Card className="bg-zinc-950/50 border-zinc-800/50 backdrop-blur hover:border-cyan-900/50 transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">
                Статус аккаунта
              </CardTitle>
              <div className="h-8 w-8 rounded-lg "></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">Активен</div>
              <p className="text-xs text-zinc-500">
                Ваш аккаунт в хорошем состоянии
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-950/50 border-zinc-800/50 backdrop-blur hover:border-cyan-900/50 transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">
                Последний вход
              </CardTitle>
              <div className="h-8 w-8 rounded-lg "></div>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="text-xl sm:text-2xl font-bold text-white">Сегодня</div>
              <p className="text-xs text-zinc-500">
                {new Date().toLocaleTimeString()}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-zinc-950/50 border-zinc-800/50 backdrop-blur hover:border-cyan-900/50 transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">
                Уровень безопасности
              </CardTitle>
              <div className="h-8 w-8 rounded-lg "></div>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="text-xl sm:text-2xl font-bold text-white">Отличный</div>
              <p className="text-xs text-zinc-500">
                Все функции безопасности включены
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-zinc-950/50 border-zinc-800/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Последняя активность</CardTitle>
            <CardDescription>
              Ваша последняя активность и действия в аккаунте
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: 'Вход в систему', time: 'Только что' },
                { action: 'Профиль обновлён', time: '2 часа назад' },
                { action: 'Пароль изменён', time: '3 дня назад' },
                { action: 'Email подтверждён', time: '1 неделю назад' },
              ].map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg bg-zinc-900/30 hover:bg-cyan-950/20 hover:border-l-2 hover:border-l-cyan-500 transition-all duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {activity.action}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Просмотр
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 sm:mt-12">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Быстрые действия</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Link href="/dictionary">
              <Button
                variant="outline"
                className="h-20 sm:h-24 flex flex-col items-center justify-center space-y-1 sm:space-y-2 bg-zinc-950/50 border-zinc-800/50 backdrop-blur hover:bg-zinc-900 text-zinc-300 p-2 sm:p-4 w-full hover:border-cyan-900/50 hover:text-cyan-300 transition-all"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-xs sm:text-sm text-center">📚 Мой словарь</span>
              </Button>
            </Link>

            <Button
              variant="outline"
              className="h-20 sm:h-24 flex flex-col items-center justify-center space-y-1 sm:space-y-2 bg-zinc-950/50 border-zinc-800/50 backdrop-blur hover:bg-zinc-900 text-zinc-300 p-2 sm:p-4"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-xs sm:text-sm text-center">Редактировать профиль</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 sm:h-24 flex flex-col items-center justify-center space-y-1 sm:space-y-2 bg-zinc-950/50 border-zinc-800/50 backdrop-blur hover:bg-zinc-900 text-zinc-300 p-2 sm:p-4"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs sm:text-sm text-center">Настройки</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 sm:h-24 flex flex-col items-center justify-center space-y-1 sm:space-y-2 bg-zinc-950/50 border-zinc-800/50 backdrop-blur hover:bg-zinc-900 text-zinc-300 p-2 sm:p-4"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-xs sm:text-sm text-center">Безопасность</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 sm:h-24 flex flex-col items-center justify-center space-y-1 sm:space-y-2 bg-zinc-950/50 border-zinc-800/50 backdrop-blur hover:bg-zinc-900 text-zinc-300 p-2 sm:p-4"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs sm:text-sm text-center">Помощь</span>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
