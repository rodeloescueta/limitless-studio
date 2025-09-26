import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      isFirstLogin: boolean
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: string
    isFirstLogin: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    isFirstLogin: boolean
  }
}