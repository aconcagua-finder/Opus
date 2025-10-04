'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn } from 'next-auth/react'
import { useAuth } from '@/features/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { login } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setError(null)
    setIsLoading(true)

    try {
      await login({ email: data.email, password: data.password })
      // Полная перезагрузка страницы чтобы middleware увидел cookies
      window.location.href = '/dictionary'
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Произошла ошибка. Попробуйте снова.')
      }
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setIsLoading(true)

    try {
      const result = await signIn('google', { 
        callbackUrl: '/dictionary',
        redirect: false 
      })
      
      if (result?.error) {
        setError('Ошибка входа через Google')
        setIsLoading(false)
      } else if (result?.url) {
        window.location.href = result.url
      }
    } catch (error) {
      console.error('Google sign-in failed:', error)
      setError('Ошибка входа через Google')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" suppressHydrationWarning>
      <div className="w-full max-w-md" suppressHydrationWarning>
        {/* Logo */}
        <div className="mb-8 text-center" suppressHydrationWarning>
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-bold gradient-text-cyan">Opus</h1>
          </Link>
          <p className="mt-2 text-muted">С возвращением</p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Вход</CardTitle>
            <CardDescription className="text-center">
              Введите email и пароль для входа в аккаунт
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="error">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-muted">
                  Электронная почта
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ваш@почта.ru"
                  {...register('email')}
                  error={!!errors.email}
                  disabled={isLoading}
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  }
                />
                {errors.email && (
                  <p className="text-xs text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-muted">
                    Пароль
                  </label>
                  <Link href="/forgot-password" className="text-xs text-accent hover:opacity-80">
                    Забыли пароль?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Введите пароль"
                  {...register('password')}
                  error={!!errors.password}
                  disabled={isLoading}
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  }
                />
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password.message}</p>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full"
                variant="gradient"
                size="lg"
                isLoading={isLoading}
              >
                Войти
              </Button>

              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-subtle" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-app px-2 text-xs text-muted">Или продолжить через</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                onClick={handleGoogleSignIn}
                className="w-full text-muted"
              >
                <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.907 8.907 0 0 0 8.934 8.934c4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z"/>
                </svg>
                Продолжить с Google
              </Button>

              <p className="text-center text-sm text-muted">
                Нет аккаунта?{' '}
                <Link href="/register" className="text-accent hover:opacity-80">
                  Регистрация
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
