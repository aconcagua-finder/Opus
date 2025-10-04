import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/features/auth'
import { ThemeProvider } from '@/features/theme'
import { NextAuthProvider } from '@/components/providers/session-provider'
import ClientWrapper from '@/components/ClientWrapper'

const inter = Inter({ 
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Opus - Игровое обучение',
  description: 'Геймифицированная платформа для изучения всего на свете',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(() => {
              const storageKey = 'opus-theme'
              try {
                const stored = localStorage.getItem(storageKey)
                const media = window.matchMedia('(prefers-color-scheme: dark)')
                const systemTheme = media.matches ? 'dark' : 'light'
                const mode = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
                const theme = mode === 'system' ? systemTheme : mode
                document.documentElement.dataset.theme = theme
                document.documentElement.classList.remove('theme-dark', 'theme-light')
                document.documentElement.classList.add(theme === 'dark' ? 'theme-dark' : 'theme-light')
                document.documentElement.style.colorScheme = theme
              } catch (error) {
                document.documentElement.dataset.theme = 'dark'
                document.documentElement.classList.add('theme-dark')
                document.documentElement.style.colorScheme = 'dark'
              }
            })();`,
          }}
        />
        <ClientWrapper>
          <ThemeProvider>
            <NextAuthProvider>
              <AuthProvider>
                <div className="fixed inset-0 bg-app transition-colors duration-300" suppressHydrationWarning>
                  <div className="pointer-events-none absolute inset-0 gradient-bg-subtle" suppressHydrationWarning></div>
                  <div className="pointer-events-none accent-orb absolute top-0 left-1/4 h-96 w-96 rounded-full blur-3xl" suppressHydrationWarning></div>
                  <div className="pointer-events-none accent-orb absolute bottom-0 right-1/4 h-96 w-96 rounded-full blur-3xl" suppressHydrationWarning></div>
                </div>
                <div className="relative min-h-screen text-primary transition-colors duration-300" suppressHydrationWarning>
                  {children}
                </div>
              </AuthProvider>
            </NextAuthProvider>
          </ThemeProvider>
        </ClientWrapper>
      </body>
    </html>
  )
}
