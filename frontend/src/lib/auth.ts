import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from './db'
import { users } from './db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null
          }

          // Find user in database
          const user = await db
            .select()
            .from(users)
            .where(eq(users.email, credentials.email))
            .limit(1)

          if (!user || user.length === 0) {
            return null
          }

          const foundUser = user[0]

          // Verify password
          const isPasswordValid = await bcrypt.compare(credentials.password, foundUser.passwordHash)

          if (!isPasswordValid) {
            return null
          }

          // Return user data
          return {
            id: foundUser.id,
            email: foundUser.email,
            name: `${foundUser.firstName} ${foundUser.lastName}`,
            role: foundUser.role,
            isFirstLogin: foundUser.isFirstLogin,
          }
        } catch (error) {
          console.error('Authorization error:', error)
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
        token.role = user.role
        token.isFirstLogin = user.isFirstLogin
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.isFirstLogin = token.isFirstLogin as boolean
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.NEXTAUTH_SECRET || '/718xs8+W5ttWrpQFoPMGpgXGTdXH0Hq4LHHZwpkr1U=',
}