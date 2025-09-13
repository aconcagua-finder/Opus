import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

const customPrismaAdapter = PrismaAdapter(prisma)

// Переопределяем метод создания пользователя для маппинга полей
const adapter = {
  ...customPrismaAdapter,
  createUser: async (user: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log("NextAuth createUser - Original Google user data:", JSON.stringify(user, null, 2))
    }
    
    const userData = {
      email: user.email,
      emailVerified: user.emailVerified ? true : true, // Google уже верифицировал email
      displayName: user.name || null,
      avatarUrl: user.image || null,
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log("NextAuth createUser - Mapped user data:", JSON.stringify(userData, null, 2))
    }
    
    const createdUser = await prisma.user.create({
      data: userData
    })
    
    if (process.env.NODE_ENV === 'development') {
      console.log("NextAuth createUser - Created user in DB:", JSON.stringify(createdUser, null, 2))
    }
    
    return createdUser
  }
}

export const authOptions: NextAuthOptions = {
  adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && user.email) {
        try {
          // Ищем существующего пользователя
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
          })

          if (existingUser && existingUser.isBanned) {
            // Заблокированный пользователь не может войти
            return false
          }

          if (existingUser && !existingUser.isActive) {
            // Неактивный пользователь не может войти
            return false
          }

          // Если пользователь существует или будет создан - разрешаем вход
          return true
        } catch (error) {
          console.error("Error during signIn:", error)
          return false
        }
      }
      
      return true
    },
    
    async session({ session, token }) {
      if (process.env.NODE_ENV === 'development') {
        console.log("NextAuth session callback - Original session:", JSON.stringify(session, null, 2))
        console.log("NextAuth session callback - Token:", JSON.stringify(token, null, 2))
      }
      
      try {
        if (token && session.user) {
          // В JWT strategy данные приходят из token, а не user
          session.user.id = token.sub
          session.user.email = token.email || session.user.email
          session.user.name = token.name || token.displayName || session.user.name
          session.user.image = token.picture || session.user.image
          session.user.displayName = token.displayName
          session.user.username = token.username
          session.user.isActive = token.isActive
          session.user.createdAt = token.createdAt
          
          if (process.env.NODE_ENV === 'development') {
            console.log("NextAuth session callback - Updated session:", JSON.stringify(session, null, 2))
          }
        }
        
        return session
      } catch (error) {
        console.error("Error during session callback:", error)
        return session
      }
    },
    
    async jwt({ token, user, account }) {
      if (process.env.NODE_ENV === 'development') {
        console.log("NextAuth jwt callback - token:", JSON.stringify(token, null, 2))
        console.log("NextAuth jwt callback - user:", JSON.stringify(user, null, 2))
      }
      
      if (user) {
        // Получаем полные данные пользователя из базы
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            email: true,
            displayName: true,
            username: true,
            avatarUrl: true,
            isActive: true,
            createdAt: true,
          }
        })
        
        if (process.env.NODE_ENV === 'development') {
          console.log("NextAuth jwt callback - dbUser:", JSON.stringify(dbUser, null, 2))
        }
        
        if (dbUser) {
          token.sub = dbUser.id
          token.email = dbUser.email
          token.name = dbUser.displayName || dbUser.email
          token.picture = dbUser.avatarUrl
          token.displayName = dbUser.displayName
          token.username = dbUser.username
          token.isActive = dbUser.isActive
          token.createdAt = dbUser.createdAt
        }
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log("NextAuth jwt callback - final token:", JSON.stringify(token, null, 2))
      }
      return token
    },
  },
  
  
  pages: {
    signIn: '/login',
    error: '/login',
  },
  
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 дней
  },
}