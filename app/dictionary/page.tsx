'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth'
import { useSession } from 'next-auth/react'
import { DictionaryList, AddWordForm, useDictionary, AiImportPanel, DictionaryEntry } from '@/features/dictionary'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { ProtectedNav } from '@/components/navigation/protected-nav'

export default function DictionaryPage() {
  const router = useRouter()
  const { user: jwtUser, isLoading: jwtLoading } = useAuth()
  const { data: nextAuthSession, status: nextAuthStatus } = useSession()
  const { entries, shuffleEntries, hasEntries } = useDictionary()
  
  const [mounted, setMounted] = useState(false)
  const [showManualForm, setShowManualForm] = useState(false)
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [editingEntry, setEditingEntry] = useState<DictionaryEntry | null>(null)

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

  useEffect(() => {
    if (!isLoading && !user && mounted) {
      router.push('/login')
    }
  }, [user, isLoading, router, mounted])

  useEffect(() => {
    if (!editingEntry) return

    const latest = entries.find((item) => item.id === editingEntry.id)

    if (!latest) {
      setEditingEntry(null)
      return
    }

    if (latest !== editingEntry) {
      setEditingEntry(latest)
    }
  }, [entries, editingEntry])

  const handleEditWord = (entry: DictionaryEntry) => {
    setEditingEntry(entry)
    setShowManualForm(false)
    setShowAiPanel(false)
  }

  const handleEditComplete = () => {
    setEditingEntry(null)
  }

  if (!mounted || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-[var(--accent-primary)]"></div>
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
        <Modal
          open={Boolean(editingEntry)}
          onClose={handleEditComplete}
        >
          {editingEntry && (
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-widest text-accent">Редактирование</span>
                <h2 className="text-2xl font-semibold text-primary">
                  {editingEntry.word}
                </h2>
                <p className="text-sm text-muted">
                  Внесите изменения и сохраните, чтобы обновить словарь.
                </p>
              </div>
              <AddWordForm
                key={editingEntry.id}
                mode="edit"
                entry={editingEntry}
                userId={userId}
                isModal
                onSuccess={handleEditComplete}
                onCancel={handleEditComplete}
              />
            </div>
          )}
        </Modal>

        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="bg-gradient-to-r from-[var(--text-primary)] via-[var(--accent-primary)] to-[var(--text-primary)] bg-clip-text text-2xl font-bold text-transparent sm:text-3xl lg:text-4xl">
                Мой словарь
              </h1>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowManualForm((prev) => {
                    const next = !prev
                    if (next) setShowAiPanel(false)
                    return next
                  })
                }}
              >
                {showManualForm ? 'Скрыть форму' : 'Добавить слово (вручную)'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAiPanel((prev) => {
                    const next = !prev
                    if (next) setShowManualForm(false)
                    return next
                  })
                }}
              >
                {showAiPanel ? 'Скрыть окно' : 'Добавить список слов (ИИ)'}
              </Button>
              {hasEntries && entries.length > 1 && (
                <Button
                  variant="outline"
                  onClick={() => shuffleEntries()}
                >
                  Перемешать
                </Button>
              )}
            </div>
          </div>

          {showManualForm && (
            <div>
              <AddWordForm
                userId={userId}
                onSuccess={() => setShowManualForm(false)}
                onCancel={() => setShowManualForm(false)}
              />
            </div>
          )}

          {showAiPanel && (
            <div>
              <AiImportPanel onClose={() => setShowAiPanel(false)} />
            </div>
          )}

          <DictionaryList onEditWord={handleEditWord} />
        </section>

      </main>
    </div>
  )
}
