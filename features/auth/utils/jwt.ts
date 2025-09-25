import { SignJWT, jwtVerify } from 'jose'
import { JWTPayload, RefreshTokenPayload } from '../types'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-key'
)
const JWT_REFRESH_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || 'super-refresh-secret-key'
)

const JWT_EXPIRE = process.env.JWT_EXPIRE || '15m'
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '30d'

export async function createAccessToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRE)
    .sign(JWT_SECRET)
}

export async function createRefreshToken(
  payload: RefreshTokenPayload
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_REFRESH_EXPIRE)
    .sign(JWT_REFRESH_SECRET)
}

export async function verifyAccessToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET)
  return payload as unknown as JWTPayload
}

export async function verifyRefreshToken(
  token: string
): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(token, JWT_REFRESH_SECRET)
  return payload as unknown as RefreshTokenPayload
}

export function getRefreshTokenExpiry(): Date {
  const now = new Date()
  const [value, unit] = JWT_REFRESH_EXPIRE.match(/(\d+)([dhms])/)?.slice(1) || ['30', 'd']
  const numValue = parseInt(value, 10)
  
  switch (unit) {
    case 'd':
      now.setDate(now.getDate() + numValue)
      break
    case 'h':
      now.setHours(now.getHours() + numValue)
      break
    case 'm':
      now.setMinutes(now.getMinutes() + numValue)
      break
    case 's':
      now.setSeconds(now.getSeconds() + numValue)
      break
  }
  
  return now
}