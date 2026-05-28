'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { sendEmailVerification } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/client'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Mail, X, RefreshCw, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export function EmailVerificationBanner() {
  const { user } = useAuth()
  const [dismissed, setDismissed] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  // Don't show if no user, already verified, or dismissed
  if (!user || user.emailVerified || dismissed) {
    return null
  }

  const handleResend = async () => {
    if (!auth.currentUser) return
    setIsResending(true)
    try {
      await sendEmailVerification(auth.currentUser)
      setResendSuccess(true)
      setTimeout(() => setResendSuccess(false), 5000)
    } catch {
      // silent fail
    } finally {
      setIsResending(false)
    }
  }

  const handleCheckVerified = async () => {
    if (!auth.currentUser) return
    setIsChecking(true)
    try {
      // Force-refresh the Firebase Auth token to pick up the latest emailVerified status
      await auth.currentUser.reload()
      if (auth.currentUser.emailVerified) {
        // Sync to Firestore and dismiss
        await setDoc(doc(db, 'users', auth.currentUser.uid), { emailVerified: true }, { merge: true })
        setDismissed(true)
        toast.success('Email verified! Welcome aboard.')
      } else {
        toast.error("Not verified yet — please click the link in your email first.")
      }
    } catch {
      toast.error("Couldn't check verification status. Please try again.")
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <Alert className="rounded-none border-x-0 border-t-0 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800">
      <Mail className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-amber-800 dark:text-amber-200">
            Please verify your email address to access all features.
          </span>
          {resendSuccess ? (
            <span className="text-green-600 dark:text-green-400 flex items-center gap-1 text-sm">
              <CheckCircle className="h-3 w-3" /> Email sent!
            </span>
          ) : (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-amber-700 dark:text-amber-300 underline"
              onClick={handleResend}
              disabled={isResending || isChecking}
            >
              {isResending ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Sending...
                </>
              ) : (
                'Resend email'
              )}
            </Button>
          )}
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-amber-700 dark:text-amber-300 underline"
            onClick={handleCheckVerified}
            disabled={isChecking || isResending}
          >
            {isChecking ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Checking...
              </>
            ) : (
              "I've verified my email"
            )}
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Dismiss</span>
        </Button>
      </AlertDescription>
    </Alert>
  )
}
