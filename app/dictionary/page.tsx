'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth'
import { useSession } from 'next-auth/react'
import { DictionaryList, AddWordForm, useDictionary, getLanguageFlag, Language, AiImportPanel } from '@/features/dictionary'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProtectedNav } from '@/components/navigation/protected-nav'

export default function DictionaryPage() {
  const router = useRouter()
  const { user: jwtUser, isLoading: jwtLoading } = useAuth()
  const { data: nextAuthSession, status: nextAuthStatus } = useSession()
  const { stats, entries } = useDictionary()
  
  const [mounted, setMounted] = useState(false)
  const [showManualForm, setShowManualForm] = useState(false)
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Determine which authentication system is active
  const isNextAuthLoading = nextAuthStatus === 'loading'
  const isJwtLoading = jwtLoading
  const isLoading = isNextAuthLoading || isJwtLoading
  
  const nextAuthUser = nextAuthSession?.user
  const user = nextAuthUser || jwtUser
  const userId = (user as { id?: string } | null | undefined)?.id || undefined

  const editingEntry = useMemo(() => {
    if (!editingEntryId) return null
    return entries.find((item) => item.id === editingEntryId) ?? null
  }, [entries, editingEntryId])

  const topLanguageEntry = useMemo(() => {
    if (!stats) return null
    const sorted = Object.entries(stats.entriesByLanguage).sort(([, a], [, b]) => b - a)
    return sorted[0] ?? null
  }, [stats])

  useEffect(() => {
    if (!isLoading && !user && mounted) {
      router.push('/login')
    }
  }, [user, isLoading, router, mounted])

  useEffect(() => {
    if (editingEntryId && !editingEntry) {
      setEditingEntryId(null)
    }
  }, [editingEntryId, editingEntry])

  const handleEditWord = (id: string) => {
    setEditingEntryId(id)
    setShowManualForm(false)
    setShowAiPanel(false)
  }

  const handleEditComplete = () => {
    setEditingEntryId(null)
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
      <ProtectedNav />

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
                  {topLanguageEntry ? getLanguageFlag(topLanguageEntry[0] as Language) : '🌐'}
                </div>
                <p className="text-xs text-zinc-500">
                  {topLanguageEntry ? topLanguageEntry[1] : 0} слов
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {editingEntry && (
          <div className="mb-8">
            <AddWordForm
              mode="edit"
              entry={editingEntry}
              userId={userId}
              onSuccess={handleEditComplete}
              onCancel={handleEditComplete}
            />
          </div>
        )}

        {/* Add Word Button */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-between">
          <div></div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => {
                setShowManualForm((prev) => {
                  const next = !prev
                  if (next) setShowAiPanel(false)
                  return next
                })
              }}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              {showManualForm ? 'Скрыть форму' : '+ Добавить слово (вручную)'}
            </Button>
            <Button
              variant={showAiPanel ? 'default' : 'outline'}
              onClick={() => {
                setShowAiPanel((prev) => {
                  const next = !prev
                  if (next) setShowManualForm(false)
                  return next
                })
              }}
              className={showAiPanel ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}
            >
              {showAiPanel ? 'Скрыть окно' : 'Добавить список слов (ИИ)'}
            </Button>
          </div>
        </div>

        {/* Add Word Form */}
        {showManualForm && (
          <div className="mb-8">
            <AddWordForm 
              userId={userId}
              onSuccess={() => setShowManualForm(false)}
              onCancel={() => setShowManualForm(false)}
            />
          </div>
        )}

        {showAiPanel && (
          <div className="mb-8">
            <AiImportPanel onClose={() => setShowAiPanel(false)} />
          </div>
        )}

        {/* Dictionary List */}
        <DictionaryList onEditWord={handleEditWord} />
      </main>
    </div>
  )
}
