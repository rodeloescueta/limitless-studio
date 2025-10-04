import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // Redirect first-time users to change password page
    if (token?.isFirstLogin && pathname !== '/auth/change-password') {
      return NextResponse.redirect(new URL('/auth/change-password', req.url))
    }

    // Prevent already-initialized users from accessing change password page
    if (!token?.isFirstLogin && pathname === '/auth/change-password') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: ['/dashboard/:path*', '/auth/change-password']
}