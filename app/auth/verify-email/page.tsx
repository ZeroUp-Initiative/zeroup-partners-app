'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { auth } from '@/lib/firebase/client'
import { applyActionCode } from 'firebase/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function AuthVerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Verifying your email...')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!searchParams) return

    const mode = searchParams.get('mode')
    const code = searchParams.get('oobCode')

    if (mode !== 'verifyEmail' || !code) {
      setStatus('error')
      setMessage('This link is missing the correct verification parameters.')
      setError('Open the link from your email again or request a new verification email.')
      return
    }

    if (!auth) {
      setStatus('error')
      setMessage('Firebase is not initialized in this browser session.')
      setError('Reload the page and try again.')
      return
    }

    applyActionCode(auth, code)
      .then(async () => {
        if (auth.currentUser) {
          await auth.currentUser.reload()
        }
        setStatus('success')
        setMessage('Your email address has been verified successfully.')
      })
      .catch((err: any) => {
        setStatus('error')
        if (err.code === 'auth/expired-action-code' || err.code === 'auth/invalid-action-code') {
          setMessage('This verification link is no longer valid.')
          setError('Request a new verification email from your account settings or sign up again.')
        } else {
          setMessage('Unable to verify your email.')
          setError(err.message || 'Please try again later.')
        }
      })
  }, [searchParams])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Verify Email</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">This secure page completes your email verification on ZeroUp Partners.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
              <p className="text-sm text-slate-700">{message}</p>
              {status === 'error' && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>

            {status === 'success' ? (
              <div className="space-y-3">
                <Button className="w-full" onClick={() => router.push('/login')}>
                  Go to login
                </Button>
                <Link href="/dashboard" className="inline-flex w-full justify-center text-center text-sm text-primary underline">
                  Continue to dashboard
                </Link>
              </div>
            ) : status === 'error' ? (
              <div className="space-y-3">
                <Button className="w-full" onClick={() => router.push('/login')}>
                  Return to login
                </Button>
                <Link href="/verify-email" className="inline-flex w-full justify-center text-center text-sm text-primary underline">
                  Request new verification email
                </Link>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
