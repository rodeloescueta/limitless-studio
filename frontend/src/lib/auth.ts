import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

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
          if (
            credentials?.email === 'admin@contentreach.local' &&
            credentials?.password === '7ba42eee'
          ) {
            return {
              id: '1',
              email: 'admin@contentreach.local',
              name: 'Admin User',
              role: 'admin',
              isFirstLogin: false,
            }
          }
          return null
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
        token.role = user.role
        token.isFirstLogin = user.isFirstLogin
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub || '1'
        session.user.role = token.role as string || 'admin'
        session.user.isFirstLogin = token.isFirstLogin as boolean || false
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