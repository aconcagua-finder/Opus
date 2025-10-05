'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useAuth } from '@/features/auth'
import { ProtectedNav } from '@/components/navigation/protected-nav'
import { DictionaryAiSettingsForm } from '@/features/dictionary/components/dictionary-ai-settings-form'

export default function SettingsPage() {
  const router = useRouter()
  const { user: jwtUser, isLoading: jwtLoading } = useAuth()
  const { data: nextAuthSession, status: nextAuthStatus } = useSession()

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isLoading = nextAuthStatus === 'loading' || jwtLoading
  const user = nextAuthSession?.user ?? jwtUser

  useEffect(() => {
    if (!mounted || isLoading) {
      return
    }

    if (!user) {
      router.push('/login')
    }
  }, [user, isLoading, router, mounted])

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen" suppressHydrationWarning>
      <ProtectedNav />
      <main className="relative z-10 container mx-auto px-4 py-6 sm:py-12 max-w-5xl">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-[var(--text-primary)] via-[var(--accent-primary)] to-[var(--text-primary)] bg-clip-text text-transparent mb-2">
            Настройки
          </h1>
          <p className="text-sm text-muted sm:text-base">
            Управляйте параметрами аккаунта и настройками ИИ, который помогает подбирать слова.
          </p>
        </header>

        <section className="space-y-6">
          <DictionaryAiSettingsForm />
        </section>
      </main>
    </div>
  )
}
