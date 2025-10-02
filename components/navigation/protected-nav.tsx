'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useAuth } from '@/features/auth'
import { Button } from '@/components/ui/button'

interface NavLink {
  href: string
  label: string
}

const NAV_LINKS: NavLink[] = [
  { href: '/dashboard', label: 'Панель управления' },
  { href: '/dictionary', label: '📚 Словарь' },
  { href: '/settings', label: 'Настройки' },
  { href: '/profile', label: 'Профиль' },
]

export function ProtectedNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: nextAuthSession, status: nextAuthStatus } = useSession()
  const { user: jwtUser, logout: jwtLogout, isLoading: jwtLoading } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isAuthLoading = nextAuthStatus === 'loading' || jwtLoading
  const nextAuthUser = nextAuthSession?.user

  const currentUser = nextAuthUser ?? jwtUser

  const isActiveLink = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }

    if (href === '/dictionary') {
      return pathname === '/dictionary' || pathname.startsWith('/dictionary/')
    }

    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const handleLogout = async () => {
    setMobileMenuOpen(false)

    if (nextAuthUser) {
      await signOut({ callbackUrl: '/' })
      return
    }

    await jwtLogout()
    router.push('/')
  }

  const navItems = useMemo(() => NAV_LINKS, [])

  return (
    <nav className="border-b border-zinc-800" suppressHydrationWarning>
      <div className="container mx-auto px-4" suppressHydrationWarning>
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-xl sm:text-2xl font-bold gradient-text-cyan">
              Opus
            </Link>
            <button
              className="ml-2 md:hidden p-2 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            <div className="flex items-center space-x-1">
              {navItems.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    isActiveLink(link.href)
                      ? 'text-white bg-zinc-900'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="flex items-center space-x-4">
              {!isAuthLoading && currentUser && (
                <span className="text-zinc-500 text-sm max-w-[200px] truncate">
                  {currentUser.email}
                </span>
              )}
              <Button
                onClick={handleLogout}
                className="bg-transparent text-cyan-400 border border-cyan-900/50 hover:bg-cyan-950/30 hover:border-cyan-700/50 transition-all"
                size="sm"
                disabled={isAuthLoading}
              >
                Выйти
              </Button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-800 py-2 space-y-1">
            {navItems.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  isActiveLink(link.href)
                    ? 'text-white bg-zinc-900'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {!isAuthLoading && currentUser && (
              <div className="px-3 py-1 text-xs text-zinc-500 border-t border-zinc-800 mt-2">
                {currentUser.email}
              </div>
            )}
            <div className="px-3">
              <Button
                onClick={handleLogout}
                className="w-full bg-transparent text-cyan-400 border border-cyan-900/50 hover:bg-cyan-950/30 hover:border-cyan-700/50 transition-all"
                size="sm"
                disabled={isAuthLoading}
              >
                Выйти
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default ProtectedNav
