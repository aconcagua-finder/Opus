import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/features/auth'
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
        <ClientWrapper>
          <AuthProvider>
            <div className="fixed inset-0 bg-black" suppressHydrationWarning>
              <div className="absolute inset-0 gradient-bg-subtle" suppressHydrationWarning></div>
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" suppressHydrationWarning></div>
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" suppressHydrationWarning></div>
            </div>
            <div className="relative min-h-screen" suppressHydrationWarning>
              {children}
            </div>
          </AuthProvider>
        </ClientWrapper>
      </body>
    </html>
  )
}