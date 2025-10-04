'use client'

import { useAuth } from '@/features/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/features/theme'

export default function HomePage() {
  const { isAuthenticated, user, logout } = useAuth()

  return (
    <div className="min-h-screen" suppressHydrationWarning>
      {/* Navigation */}
      <nav className="border-b border-subtle bg-surface-transparent backdrop-blur-xl transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" suppressHydrationWarning>
          <div className="flex items-center justify-between h-16" suppressHydrationWarning>
            <div className="flex items-center" suppressHydrationWarning>
              <h1 className="text-xl sm:text-2xl font-bold gradient-text-cyan">Opus</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4" suppressHydrationWarning>
              <ThemeToggle className="hidden sm:flex" />
              {isAuthenticated ? (
                <>
                  <span className="hidden sm:inline text-muted text-sm">Привет, {user?.displayName || user?.email}</span>
                  <Link href="/dictionary">
                    <Button className="border border-subtle bg-transparent text-accent transition-colors hover:bg-accent-soft text-sm sm:text-base px-3 sm:px-4">
                      Словарь
                    </Button>
                  </Link>
                  <Button onClick={logout} className="bg-transparent text-muted transition-colors hover:text-accent text-sm sm:text-base px-3 sm:px-4">
                    Выйти
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button className="bg-transparent text-muted transition-colors hover:text-accent text-sm sm:text-base px-3 sm:px-4">
                      Войти
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 text-white hover:from-cyan-400 hover:to-blue-400 font-semibold transition-all shadow-accent text-sm sm:text-base px-3 sm:px-4">
                      Начать
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      <div className="flex justify-end px-4 py-3 sm:hidden">
        <ThemeToggle />
      </div>

      {/* Hero Section */}
      <section className="relative py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center" suppressHydrationWarning>
          <h1 className="mb-4 text-3xl font-bold sm:text-5xl lg:text-6xl sm:mb-6">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-500 bg-clip-text text-transparent">
              Учиться
            </span>
            {' '}
            <span className="text-primary">интересно</span>
          </h1>
          <p className="mb-6 px-4 text-base text-muted sm:mb-8 sm:px-0 sm:text-lg lg:text-xl">
            Игровое обучение со сценариями, которые никогда не повторяются.
          </p>
          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0" suppressHydrationWarning>
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400 font-semibold text-base sm:text-lg px-6 sm:px-8 py-2.5 sm:py-3 shadow-lg shadow-cyan-500/25 transition-all">
                  Начать бесплатно
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-transparent text-cyan-400 border border-cyan-900/50 hover:bg-cyan-950/30 hover:border-cyan-700/50 text-base sm:text-lg px-6 sm:px-8 py-2.5 sm:py-3 transition-all">
                  Войти
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

    </div>
  )
}
