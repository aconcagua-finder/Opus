'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn } from 'next-auth/react'
import { useAuth } from '@/features/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const { register: registerUser } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const password = watch('password', '')

  // Calculate password strength
  const calculatePasswordStrength = (pass: string) => {
    let strength = 0
    if (pass.length >= 8) strength++
    if (pass.match(/[a-z]/) && pass.match(/[A-Z]/)) strength++
    if (pass.match(/[0-9]/)) strength++
    if (pass.match(/[^a-zA-Z0-9]/)) strength++
    return strength
  }

  const onPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pass = e.target.value
    setPasswordStrength(calculatePasswordStrength(pass))
  }

  const onSubmit = async (data: RegisterFormData) => {
    setError(null)
    setIsLoading(true)

    try {
      await registerUser({
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        displayName: data.name
      })
      // Полная перезагрузка страницы чтобы middleware увидел cookies
      window.location.href = '/dashboard'
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
        callbackUrl: '/dashboard',
        redirect: false 
      })
      
      if (result?.error) {
        setError('Ошибка входа через Google')
        setIsLoading(false)
      } else if (result?.url) {
        window.location.href = result.url
      }
    } catch (err) {
      setError('Ошибка входа через Google')
      setIsLoading(false)
    }
  }

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 0: return 'bg-gray-400'
      case 1: return 'bg-red-500'
      case 2: return 'bg-yellow-500'
      case 3: return 'bg-cyan-500'
      case 4: return 'bg-cyan-600'
      default: return 'bg-gray-400'
    }
  }

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 0: return ''
      case 1: return 'Слабый'
      case 2: return 'Средний'
      case 3: return 'Хороший'
      case 4: return 'Надёжный'
      default: return ''
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 sm:py-12" suppressHydrationWarning>
      <div className="w-full max-w-md" suppressHydrationWarning>
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8" suppressHydrationWarning>
          <Link href="/" className="inline-block">
            <h1 className="text-3xl sm:text-4xl font-bold gradient-text-cyan">Opus</h1>
          </Link>
          <p className="text-zinc-500 mt-2 text-sm sm:text-base">Создайте аккаунт</p>
        </div>

        {/* Register Card */}
        <Card className="bg-zinc-950/50 border-zinc-800/50 backdrop-blur">
          <CardHeader className="space-y-1 px-4 sm:px-6">
            <CardTitle className="text-xl sm:text-2xl text-center">Регистрация</CardTitle>
            <CardDescription className="text-center text-sm sm:text-base">
              Введите данные для создания аккаунта
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4 px-4 sm:px-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-zinc-400">
                  Полное имя
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Иван Иванов"
                  {...register('name')}
                  error={!!errors.name}
                  disabled={isLoading}
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  }
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-zinc-400">
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
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-zinc-400">
                  Пароль
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Создайте надёжный пароль"
                  {...register('password', {
                    onChange: onPasswordChange,
                  })}
                  error={!!errors.password}
                  disabled={isLoading}
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  }
                />
                {password && (
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            level <= passwordStrength ? getPasswordStrengthColor() : 'bg-zinc-800'
                          }`}
                        />
                      ))}
                    </div>
                    {passwordStrength > 0 && (
                      <p className={`text-xs ${passwordStrength >= 3 ? 'text-cyan-500' : passwordStrength === 2 ? 'text-yellow-500' : 'text-red-500'}`}>
                        Надёжность пароля: {getPasswordStrengthText()}
                      </p>
                    )}
                  </div>
                )}
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-zinc-400">
                  Подтвердите пароль
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Повторите пароль"
                  {...register('confirmPassword')}
                  error={!!errors.confirmPassword}
                  disabled={isLoading}
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  }
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  className="mt-1 rounded border-gray-600 bg-transparent"
                  disabled={isLoading}
                />
                <label htmlFor="terms" className="text-xs sm:text-sm text-zinc-500">
                  Я согласен с{' '}
                  <Link href="/terms" className="text-cyan-500 hover:underline">
                    Условиями использования
                  </Link>{' '}
                  и{' '}
                  <Link href="/privacy" className="text-cyan-500 hover:underline">
                    Политикой конфиденциальности
                  </Link>
                </label>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 px-4 sm:px-6">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400 font-semibold shadow-lg shadow-cyan-500/20 transition-all"
                size="lg"
                isLoading={isLoading}
              >
                Создать аккаунт
              </Button>

              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-black px-2 text-zinc-500 text-xs">Или продолжить через</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                onClick={handleGoogleSignIn}
                className="w-full bg-transparent text-zinc-300 border border-zinc-800 hover:bg-zinc-900 transition-all"
              >
                <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.907 8.907 0 0 0 8.934 8.934c4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z"/>
                </svg>
                Продолжить с Google
              </Button>

              <p className="text-center text-sm text-zinc-500">
                Уже есть аккаунт?{' '}
                <Link href="/login" className="text-cyan-500 hover:text-cyan-400">
                  Войти
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}