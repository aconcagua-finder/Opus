import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      displayName?: string | null
      username?: string | null
      isActive?: boolean
      createdAt?: string
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    displayName?: string | null
    username?: string | null
    isActive?: boolean
    createdAt?: string
  }
}