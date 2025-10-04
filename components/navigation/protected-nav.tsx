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
  { href: '/dictionary', label: '📚 Словарь' },
  { href: '/settings', label: 'Настройки' },
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
                <div className="relative group">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-zinc-400 transition-all cursor-pointer group-hover:bg-zinc-900 group-hover:text-white">
                    <span className="max-w-[220px] truncate">
                      {currentUser.email}
                    </span>
                    <svg
                      className="h-4 w-4 text-zinc-500 transition-transform duration-200 group-hover:text-cyan-400 group-hover:rotate-180"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <div className="absolute right-0 mt-2 hidden min-w-[200px] rounded-lg border border-zinc-800 bg-zinc-950/90 shadow-xl backdrop-blur-md p-2 group-hover:flex group-hover:flex-col">
                    <Button
                      onClick={handleLogout}
                      variant="ghost"
                      size="sm"
                      disabled={isAuthLoading}
                      className="w-full justify-between text-zinc-200 hover:text-red-400 hover:bg-red-400/10"
                    >
                      Выйти
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" />
                      </svg>
                    </Button>
                  </div>
                </div>
              )}
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
