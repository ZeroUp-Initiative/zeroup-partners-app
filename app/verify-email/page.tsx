'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { sendEmailVerification } from "firebase/auth"
import { auth } from "@/lib/firebase/client"
import { verifyEmailActionCodeSettings } from "@/lib/firebase/action-code-settings"

// UI Components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Mail, CheckCircle, RefreshCw, ArrowRight } from "lucide-react"
import Link from "next/link"

function FullPageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
    </div>
  )
}

export default function VerifyEmailPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const router = useRouter()

  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [error, setError] = useState("")
  const [isChecking, setIsChecking] = useState(false)

  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push("/login")
    }
  }, [user, isAuthLoading, router])

  // Check if already verified
  useEffect(() => {
    if (user?.emailVerified) {
      router.push("/dashboard")
    }
  }, [user, router])

  const handleResendEmail = async () => {
    if (!auth.currentUser) return
    
    setIsResending(true)
    setError("")
    setResendSuccess(false)

    try {
      await sendEmailVerification(auth.currentUser, verifyEmailActionCodeSettings)
      setResendSuccess(true)
    } catch (err: any) {
      if (err.code === "auth/too-many-requests") {
        setError("Too many requests. Please wait a few minutes before trying again.")
      } else {
        setError("Failed to send verification email. Please try again.")
      }
    } finally {
      setIsResending(false)
    }
  }

  const handleCheckVerification = async () => {
    if (!auth.currentUser) return
    
    setIsChecking(true)
    try {
      await auth.currentUser.reload()
      if (auth.currentUser.emailVerified) {
        router.push("/dashboard")
      } else {
        setError("Email not verified yet. Please check your inbox and click the verification link.")
      }
    } catch (err) {
      setError("Failed to check verification status. Please try again.")
    } finally {
      setIsChecking(false)
    }
  }

  if (isAuthLoading || !user) {
    return <FullPageLoader />
  }

  if (user.emailVerified) {
    return <FullPageLoader />
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Verify Your Email</CardTitle>
            <CardDescription>
              We&apos;ve sent a verification email to <strong>{user.email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {resendSuccess && (
              <Alert variant="default" className="border-green-500 text-green-700">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertTitle>Email Sent!</AlertTitle>
                <AlertDescription>
                  A new verification email has been sent. Please check your inbox.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Click the link in the email to verify your account. If you don&apos;t see it, check your spam folder.
              </p>

              <Button 
                onClick={handleCheckVerification} 
                className="w-full"
                disabled={isChecking}
              >
                {isChecking ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    I&apos;ve Verified My Email
                  </>
                )}
              </Button>

              <Button 
                variant="outline" 
                onClick={handleResendEmail} 
                className="w-full"
                disabled={isResending}
              >
                {isResending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Resend Verification Email
                  </>
                )}
              </Button>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground text-center">
                Want to continue without verifying?{" "}
                <Link href="/dashboard" className="text-primary hover:underline">
                  Skip for now
                  <ArrowRight className="inline ml-1 h-3 w-3" />
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
