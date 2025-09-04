import { User } from '@prisma/client'

export type SafeUser = Omit<User, 'passwordHash' | 'deletedAt'> & {
  role?: string
  roles?: string[]
  permissions?: string[]
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  confirmPassword: string
  username?: string
  displayName?: string
}

export interface AuthResponse {
  user: SafeUser
  tokens: AuthTokens
}

export interface JWTPayload {
  userId: string
  email: string
  iat?: number
  exp?: number
}

export interface RefreshTokenPayload extends JWTPayload {
  sessionId: string
}

export enum AuthError {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  USERNAME_ALREADY_EXISTS = 'USERNAME_ALREADY_EXISTS',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  USER_BANNED = 'USER_BANNED',
  USER_INACTIVE = 'USER_INACTIVE',
  TOO_MANY_ATTEMPTS = 'TOO_MANY_ATTEMPTS',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}