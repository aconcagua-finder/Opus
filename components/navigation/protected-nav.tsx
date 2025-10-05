'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useAuth } from '@/features/auth'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/features/theme'
import { cn } from '@/lib/utils'

interface NavLink {
  href: string
  label: string
}

const NAV_LINKS: NavLink[] = [
  { href: '/dictionary', label: 'Словарь' },
  { href: '/settings', label: 'Настройки' },
]

export function ProtectedNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: nextAuthSession, status: nextAuthStatus } = useSession()
  const { user: jwtUser, logout: jwtLogout, isLoading: jwtLoading } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement | null>(null)
  const accountTriggerRef = useRef<HTMLButtonElement | null>(null)

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
    setAccountMenuOpen(false)

    if (nextAuthUser) {
      await signOut({ callbackUrl: '/' })
      return
    }

    await jwtLogout()
    router.push('/')
  }

  const navItems = useMemo(() => NAV_LINKS, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const menuNode = accountMenuRef.current
      const triggerNode = accountTriggerRef.current
      const target = event.target as Node | null

      if (!menuNode || !triggerNode || !target) {
        return
      }

      if (menuNode.contains(target) || triggerNode.contains(target)) {
        return
      }

      setAccountMenuOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAccountMenuOpen(false)
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  return (
    <nav className="relative z-40 border-b border-subtle bg-surface-transparent backdrop-blur-xl transition-colors duration-300" suppressHydrationWarning>
      <div className="container mx-auto px-4" suppressHydrationWarning>
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-2xl font-bold sm:text-3xl gradient-text-cyan">
              Opus
            </Link>
            <button
              className="ml-2 rounded-md p-2 text-muted transition-colors hover:bg-surface-muted hover:text-primary md:hidden"
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

          <div className="hidden items-center space-x-8 md:flex">
            <div className="flex items-center space-x-1">
              {navItems.map((link) => {
                const isActive = isActiveLink(link.href)

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-surface-muted text-primary shadow-soft'
                        : 'text-secondary hover:bg-surface-muted hover:text-primary'
                    )}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              {!isAuthLoading && currentUser && (
                <div className="relative">
                  <button
                    type="button"
                    ref={accountTriggerRef}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background-primary)]',
                      accountMenuOpen ? 'bg-surface-muted text-primary shadow-soft' : 'text-secondary hover:bg-surface-muted hover:text-primary'
                    )}
                    onClick={() => setAccountMenuOpen((prev) => !prev)}
                    aria-expanded={accountMenuOpen}
                    aria-haspopup="menu"
                  >
                    <span className="max-w-[220px] truncate">
                      {currentUser.email}
                    </span>
                    <svg
                      className={cn('h-4 w-4 transition-transform duration-200', accountMenuOpen ? 'rotate-180 text-accent' : 'text-muted')}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div
                    ref={accountMenuRef}
                    className={cn(
                      'absolute right-0 top-full z-50 w-56 pt-2 transition-all duration-150',
                      accountMenuOpen ? 'pointer-events-auto opacity-100 translate-y-1' : 'pointer-events-none opacity-0 -translate-y-1'
                    )}
                  >
                    <div className="rounded-xl border border-subtle bg-surface p-2 shadow-soft">
                      <div className="px-3 pb-2 text-xs font-medium uppercase tracking-wide text-muted">
                        Аккаунт
                      </div>
                      <Button
                        onClick={handleLogout}
                        variant="ghost"
                        size="sm"
                        disabled={isAuthLoading}
                        className="w-full justify-between rounded-lg px-3 text-primary transition-colors hover:bg-red-500/10 hover:text-red-500"
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
                </div>
              )}
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="space-y-1 border-t border-subtle py-2 md:hidden">
            {navItems.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  isActiveLink(link.href)
                    ? 'bg-surface-muted text-primary shadow-soft'
                    : 'text-muted hover:bg-surface-muted hover:text-primary'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {!isAuthLoading && currentUser && (
              <div className="mt-2 border-t border-subtle px-3 py-1 text-xs text-muted">
                {currentUser.email}
              </div>
            )}
            <div className="px-3">
              <Button
                onClick={handleLogout}
                className="w-full border border-subtle bg-transparent text-accent transition-colors hover:bg-accent-soft"
                size="sm"
                disabled={isAuthLoading}
              >
                Выйти
              </Button>
            </div>
            <div className="px-3 pb-2 pt-3">
              <ThemeToggle className="w-full justify-center" />
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default ProtectedNav
