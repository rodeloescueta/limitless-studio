'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { ReactNode } from 'react'
import { QueryProvider } from './providers/query-provider'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>
        <ThemeProvider attribute='class'>
          {children}
        </ThemeProvider>
      </QueryProvider>
    </SessionProvider>
  )
}