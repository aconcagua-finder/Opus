'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth'
import { useSession } from 'next-auth/react'
import { DictionaryList, AddWordForm, useDictionary } from '@/features/dictionary'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DictionaryPage() {
  const router = useRouter()
  const { user: jwtUser, isLoading: jwtLoading } = useAuth()
  const { data: nextAuthSession, status: nextAuthStatus } = useSession()
  const { stats } = useDictionary()
  
  const [mounted, setMounted] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Determine which authentication system is active
  const isNextAuthLoading = nextAuthStatus === 'loading'
  const isJwtLoading = jwtLoading
  const isLoading = isNextAuthLoading || isJwtLoading
  
  const nextAuthUser = nextAuthSession?.user
  const user = nextAuthUser || jwtUser

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
      {/* Navigation */}
      <nav className="border-b border-zinc-800" suppressHydrationWarning>
        <div className="container mx-auto px-4" suppressHydrationWarning>
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-xl sm:text-2xl font-bold gradient-text-cyan">
                Opus
              </Link>
              
              <div className="hidden md:flex items-center space-x-1">
                <Link
                  href="/dashboard"
                  className="px-3 py-2 rounded-md text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all"
                >
                  Главная
                </Link>
                <div className="px-3 py-2 rounded-md text-sm font-medium text-white bg-zinc-900 flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span>Словарь</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-zinc-500 text-sm hidden sm:block">
                {user.email}
              </span>
              <Link href="/dashboard">
                <Button
                  className="bg-transparent text-cyan-400 border border-cyan-900/50 hover:bg-cyan-950/30 hover:border-cyan-700/50 transition-all"
                  size="sm"
                >
                  ← Назад
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-6 sm:py-12">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white via-cyan-300 to-white bg-clip-text text-transparent mb-2">
            Мой словарь
          </h1>
          <p className="text-zinc-500 text-sm sm:text-base">
            Ваша персональная коллекция изученных слов и переводов
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <Card className="bg-zinc-950/50 border-zinc-800/50 backdrop-blur hover:border-cyan-900/50 transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">
                  Всего слов
                </CardTitle>
                <svg className="h-4 w-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.totalEntries}</div>
                <p className="text-xs text-zinc-500">
                  слов в словаре
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-950/50 border-zinc-800/50 backdrop-blur hover:border-cyan-900/50 transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">
                  Недавно добавлено
                </CardTitle>
                <svg className="h-4 w-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.recentlyAdded}</div>
                <p className="text-xs text-zinc-500">
                  за последнюю неделю
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-950/50 border-zinc-800/50 backdrop-blur hover:border-cyan-900/50 transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">
                  Нужно повторить
                </CardTitle>
                <svg className="h-4 w-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.needsReview}</div>
                <p className="text-xs text-zinc-500">
                  слов для повторения
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-950/50 border-zinc-800/50 backdrop-blur hover:border-cyan-900/50 transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">
                  Самый изучаемый язык
                </CardTitle>
                <svg className="h-4 w-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-white">
                  {Object.entries(stats.entriesByLanguage)
                    .sort(([,a], [,b]) => b - a)[0]?.[0] === 'SPANISH' ? '🇪🇸' :
                   Object.entries(stats.entriesByLanguage)
                    .sort(([,a], [,b]) => b - a)[0]?.[0] === 'ENGLISH' ? '🇺🇸' :
                   Object.entries(stats.entriesByLanguage)
                    .sort(([,a], [,b]) => b - a)[0]?.[0] === 'RUSSIAN' ? '🇷🇺' : '🌐'}
                </div>
                <p className="text-xs text-zinc-500">
                  {Object.entries(stats.entriesByLanguage).sort(([,a], [,b]) => b - a)[0]?.[1] || 0} слов
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add Word Button */}
        <div className="mb-6 flex justify-between items-center">
          <div></div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            {showAddForm ? 'Скрыть форму' : '+ Добавить слово'}
          </Button>
        </div>

        {/* Add Word Form */}
        {showAddForm && (
          <div className="mb-8">
            <AddWordForm 
              onSuccess={() => setShowAddForm(false)}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        )}

        {/* Dictionary List */}
        <DictionaryList />
      </main>
    </div>
  )
}