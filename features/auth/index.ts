/**
 * Auth Feature Module
 * 
 * Полноценная система управления состоянием авторизации для Next.js
 * с поддержкой JWT токенов, автоматическим обновлением и синхронизацией между вкладками.
 */

// Экспорт типов
export type {
  SafeUser,
  AuthTokens,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  JWTPayload,
  RefreshTokenPayload,
} from './types'

export { AuthError } from './types'

// Экспорт стора
export { useAuthStore, apiClient } from './stores/auth-store'

// Экспорт хуков
export {
  useAuth,
  useRequireAuth,
  useGuestOnly,
  useRequireRole,
} from './hooks/use-auth'

// Экспорт компонентов
export {
  AuthProvider,
  AuthGuard,
  withAuth,
} from './components/auth-provider'

// Экспорт утилит JWT
export {
  createAccessToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  getRefreshTokenExpiry,
} from './utils/jwt'

// Экспорт утилит для паролей
export {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
} from './utils/password'

/**
 * Примеры использования:
 * 
 * 1. В корневом layout приложения:
 * ```tsx
 * import { AuthProvider } from '@/features/auth'
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <AuthProvider>
 *           {children}
 *         </AuthProvider>
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 * 
 * 2. В компоненте логина:
 * ```tsx
 * import { useGuestOnly } from '@/features/auth'
 * 
 * export default function LoginPage() {
 *   const { login, error, isLoading } = useGuestOnly()
 *   
 *   const handleSubmit = async (data) => {
 *     try {
 *       await login(data)
 *     } catch (error) {
 *       console.error('Login failed:', error)
 *     }
 *   }
 * }
 * ```
 * 
 * 3. В защищенной странице:
 * ```tsx
 * import { useRequireAuth } from '@/features/auth'
 * 
 * export default function DashboardPage() {
 *   const { user, logout } = useRequireAuth()
 *   
 *   return (
 *     <div>
 *       <h1>Welcome, {user?.displayName}</h1>
 *       <button onClick={logout}>Logout</button>
 *     </div>
 *   )
 * }
 * ```
 * 
 * 4. Страница только для админов:
 * ```tsx
 * import { useRequireRole } from '@/features/auth'
 * 
 * export default function AdminPage() {
 *   const { user } = useRequireRole(['admin'])
 *   
 *   return <AdminPanel user={user} />
 * }
 * ```
 * 
 * 5. Использование AuthGuard в layout:
 * ```tsx
 * import { AuthGuard } from '@/features/auth'
 * 
 * export default function ProtectedLayout({ children }) {
 *   return (
 *     <AuthGuard requiredRoles={['admin', 'moderator']}>
 *       <AdminSidebar />
 *       {children}
 *     </AuthGuard>
 *   )
 * }
 * ```
 * 
 * 6. HOC для защиты компонентов:
 * ```tsx
 * import { withAuth } from '@/features/auth'
 * 
 * function PrivateComponent({ user }) {
 *   return <div>Private content for {user.email}</div>
 * }
 * 
 * export default withAuth(PrivateComponent, {
 *   requiredRoles: ['user']
 * })
 * ```
 */