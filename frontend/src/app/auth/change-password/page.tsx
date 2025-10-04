'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession, signOut, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Loader2, Shield, Check, X } from "lucide-react"
import { toast } from 'sonner'

function ChangePasswordForm() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Password validation states
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    match: false,
  })

  useEffect(() => {
    // Redirect if not first login or not authenticated
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated' && !session?.user?.isFirstLogin) {
      router.push('/dashboard')
    }
  }, [status, session, router])

  useEffect(() => {
    // Update password validation checks
    setPasswordChecks({
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      lowercase: /[a-z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      match: newPassword.length > 0 && newPassword === confirmPassword,
    })
  }, [newPassword, confirmPassword])

  const isPasswordValid = Object.values(passwordChecks).every(check => check)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (!isPasswordValid) {
      setError('Please meet all password requirements')
      setIsLoading(false)

      return
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password')
      }

      toast.success('🎉 Welcome to Content Reach Hub!', {
        description: 'Your password has been changed successfully. Signing you in...',
        duration: 2000,
      })

      // Wait a moment for the toast to show
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Sign in again with new password to refresh JWT token
      // This ensures middleware sees isFirstLogin: false
      const result = await signIn('credentials', {
        email: session?.user?.email,
        password: newPassword,
        redirect: false,
      })

      if (result?.ok) {
        // Redirect to dashboard
        router.push('/dashboard')
        router.refresh()
      } else {
        throw new Error('Failed to sign in with new password')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password')
      toast.error('Password change failed', {
        description: err instanceof Error ? err.message : 'An unexpected error occurred',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="w-full max-w-md">
        {/* Logo and Branding */}
        <div className="flex flex-col items-center space-y-4 mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary to-primary/80 shadow-lg ring-1 ring-primary/20">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Welcome! 👋
            </h1>
            <p className="text-sm text-muted-foreground font-medium">Please change your temporary password</p>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="shadow-xl ring-1 ring-border/50 rounded-lg border bg-card text-card-foreground">
          <div className="space-y-1 p-6 pb-6">
            <h2 className="text-2xl text-center font-bold">Set Your New Password</h2>
            <p className="text-center text-base text-muted-foreground">
              For security, you must change your temporary password before continuing
            </p>
          </div>
          <div className="p-6 pt-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="relative w-full rounded-lg border border-destructive/50 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-semibold">New Password</label>
                <input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  autoComplete="new-password"
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-semibold">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  autoComplete="new-password"
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Password Requirements Checklist */}
              <div className="rounded-lg bg-muted/30 p-4 border border-border/50 space-y-2">
                <p className="text-xs font-semibold text-foreground mb-2">Password Requirements:</p>
                <PasswordCheck met={passwordChecks.length}>At least 8 characters</PasswordCheck>
                <PasswordCheck met={passwordChecks.uppercase}>At least one uppercase letter</PasswordCheck>
                <PasswordCheck met={passwordChecks.lowercase}>At least one lowercase letter</PasswordCheck>
                <PasswordCheck met={passwordChecks.number}>At least one number</PasswordCheck>
                <PasswordCheck met={passwordChecks.match}>Passwords match</PasswordCheck>
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full h-11 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
                disabled={isLoading || !isPasswordValid}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing password...
                  </>
                ) : (
                  'Change Password & Continue'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

function PasswordCheck({ met, children }: { met: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {met ? (
        <Check className="h-4 w-4 text-green-600 dark:text-green-500" />
      ) : (
        <X className="h-4 w-4 text-muted-foreground" />
      )}
      <span className={met ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'}>
        {children}
      </span>
    </div>
  )
}

export default function ChangePasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <ChangePasswordForm />
    </Suspense>
  )
}
