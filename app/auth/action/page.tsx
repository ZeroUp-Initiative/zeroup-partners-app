'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { auth } from '@/lib/firebase/client'
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function AuthActionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'signIn'>('loading')
  const [message, setMessage] = useState('Checking your link...')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!searchParams) return

    const mode = searchParams.get('mode')
    const code = searchParams.get('oobCode')
    const params = searchParams.toString()

    if (!mode || !code) {
      setStatus('error')
      setError('Invalid or missing Firebase action link parameters.')
      setMessage('Unable to process this link.')
      return
    }

    if (mode === 'verifyEmail') {
      router.replace(`/auth/verify-email?${params}`)
      return
    }

    if (mode === 'resetPassword') {
      router.replace(`/auth/reset-password?${params}`)
      return
    }

    if (mode === 'signIn') {
      setStatus('signIn')
      setMessage('Finish signing in with your email link.')
      return
    }

    setStatus('error')
    setError('This Firebase action type is not supported by this page.')
    setMessage('Please contact support if you believe this is in error.')
  }, [router, searchParams])

  const handleEmailLinkSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsProcessing(true)
    setError('')
    setSuccess(false)

    if (!auth) {
      setError('Firebase is not initialized yet. Please reload this page.')
      setIsProcessing(false)
      return
    }

    if (!isSignInWithEmailLink(auth, window.location.href)) {
      setError('This is not a valid email sign-in link.')
      setIsProcessing(false)
      return
    }

    try {
      await signInWithEmailLink(auth, email, window.location.href)
      setSuccess(true)
      setMessage('Signed in successfully. Redirecting...')
      setTimeout(() => router.push('/dashboard'), 1200)
    } catch (err: any) {
      setError(err.message || 'Unable to complete sign-in with this link.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Firebase Action Handler</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">Your branded auth flow is handling the action link on zeroup-partners-app.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === 'loading' && (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
                <p className="text-sm text-slate-600">{message}</p>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <p className="text-sm text-red-600">{message}</p>
                <p className="text-sm text-muted-foreground">{error}</p>
                <div className="flex flex-col gap-2">
                  <Link href="/login" className="text-primary underline">Return to login</Link>
                  <Link href="/forgot-password" className="text-primary underline">Request a new reset link</Link>
                </div>
              </div>
            )}

            {status === 'signIn' && (
              <form onSubmit={handleEmailLinkSignIn} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email used for sign-in</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm focus:border-primary focus:outline-none"
                  />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}
                {success && <p className="text-sm text-green-600">Email sign-in completed. Redirecting...</p>}

                <Button type="submit" className="w-full" disabled={isProcessing}>
                  {isProcessing ? 'Completing sign-in...' : 'Continue with email link'}
                </Button>

                <div className="text-sm text-muted-foreground">
                  If you did not request an email sign-in link, please discard this message.
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
