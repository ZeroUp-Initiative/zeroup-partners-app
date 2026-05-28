'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { auth } from '@/lib/firebase/client'
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export default function AuthResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [oobCode, setOobCode] = useState('')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [status, setStatus] = useState<'loading' | 'ready' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Verifying your reset link...')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!searchParams) return

    const mode = searchParams.get('mode')
    const code = searchParams.get('oobCode')

    if (mode !== 'resetPassword' || !code) {
      setStatus('error')
      setMessage('This reset link is missing required parameters.')
      setError('Please use the password reset email that was sent to you.')
      return
    }

    if (!auth) {
      setStatus('error')
      setMessage('Firebase has not initialized in this browser session.')
      setError('Reload the page and try again.')
      return
    }

    verifyPasswordResetCode(auth, code)
      .then((emailFromCode) => {
        setEmail(emailFromCode)
        setOobCode(code)
        setStatus('ready')
        setMessage(`Reset password for ${emailFromCode}`)
      })
      .catch((err: any) => {
        setStatus('error')
        if (err.code === 'auth/expired-action-code' || err.code === 'auth/invalid-action-code') {
          setMessage('This reset link is no longer valid.')
          setError('Request a new password reset email from the login page.')
        } else {
          setMessage('Unable to validate this password reset link.')
          setError(err.message || 'Please try again later.')
        }
      })
  }, [searchParams])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')

    if (!auth || !oobCode) {
      setError('Unable to complete reset. Please reload and try again.')
      setIsSubmitting(false)
      return
    }

    try {
      await confirmPasswordReset(auth, oobCode, newPassword)
      setStatus('success')
      setMessage('Your password has been updated successfully.')
    } catch (err: any) {
      if (err.code === 'auth/weak-password') {
        setError('Choose a stronger password with at least 6 characters.')
      } else if (err.code === 'auth/expired-action-code' || err.code === 'auth/invalid-action-code') {
        setError('This reset link is invalid or has expired.')
      } else {
        setError(err.message || 'Unable to update your password. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Reset Password</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">Complete your branded password reset flow on ZeroUp Partners.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm text-slate-700">{message}</p>
              {status === 'error' && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>

            {status === 'ready' ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    required
                    minLength={6}
                    placeholder="Enter a secure password"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Updating password…' : 'Reset password'}
                </Button>
              </form>
            ) : status === 'success' ? (
              <div className="space-y-3">
                <p className="text-sm text-green-700">Your password was updated successfully. You may now sign in with your new password.</p>
                <Button className="w-full" onClick={() => router.push('/login')}>
                  Go to login
                </Button>
              </div>
            ) : status === 'error' ? (
              <div className="space-y-3">
                <Link href="/forgot-password" className="text-primary underline">Request a new reset link</Link>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
