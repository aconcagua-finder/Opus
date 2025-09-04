'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  const router = useRouter()
  const { user, logout, isLoading } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isLoading && !user && mounted) {
      router.push('/login')
    }
  }, [user, isLoading, router, mounted])

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

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
      {/* Navigation */}
      <nav className="border-b border-zinc-800" suppressHydrationWarning>
        <div className="container mx-auto px-4" suppressHydrationWarning>
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl sm:text-2xl font-bold gradient-text-cyan">
                Opus
              </Link>
              {/* Mobile Menu Button */}
              <button className="ml-4 md:hidden p-2 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <div className="flex space-x-4">
                <Link
                  href="/dashboard"
                  className="px-3 py-2 rounded-md text-sm font-medium text-white bg-zinc-900"
                >
                  Панель управления
                </Link>
                <Link
                  href="/settings"
                  className="px-3 py-2 rounded-md text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all"
                >
                  Настройки
                </Link>
                <Link
                  href="/profile"
                  className="px-3 py-2 rounded-md text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all"
                >
                  Профиль
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-zinc-500 text-sm">
                  {user.email}
                </span>
                <Button
                  onClick={handleLogout}
                  className="bg-transparent text-cyan-400 border border-cyan-900/50 hover:bg-cyan-950/30 hover:border-cyan-700/50 transition-all"
                  size="sm"
                >
                  Выйти
                </Button>
              </div>
            </div>

            {/* Mobile User Info */}
            <div className="md:hidden flex items-center space-x-2">
              <span className="text-zinc-500 text-xs truncate max-w-[120px]">
                {user.email}
              </span>
              <Button
                onClick={handleLogout}
                className="bg-transparent text-cyan-400 border border-cyan-900/50 hover:bg-cyan-950/30 hover:border-cyan-700/50 transition-all px-2 py-1 text-xs"
                size="sm"
              >
                Выйти
              </Button>
            </div>
          </div>
          
          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-zinc-800 py-2">
              <Link
                href="/dashboard"
                className="block px-3 py-2 rounded-md text-sm font-medium text-white bg-zinc-900"
              >
                Панель управления
              </Link>
              <Link
                href="/settings"
                className="block px-3 py-2 rounded-md text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all mt-1"
              >
                Настройки
              </Link>
              <Link
                href="/profile"
                className="block px-3 py-2 rounded-md text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all mt-1"
              >
                Профиль
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-6 sm:py-12">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white via-cyan-300 to-white bg-clip-text text-transparent mb-2">
            Добро пожаловать обратно, {user.displayName || user.username || 'Пользователь'}!
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