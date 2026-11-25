'use client'

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { sendPasswordResetEmail } from "firebase/auth"
import { auth } from "@/lib/firebase/client"
import { resetPasswordActionCodeSettings } from "@/lib/firebase/action-code-settings"

// UI Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"

function FullPageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-editorial-cream">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-editorial-navy border-t-transparent"></div>
    </div>
  )
}

const inputClass = "bg-white border-editorial-border text-editorial-navy placeholder:text-editorial-muted/60 focus:border-editorial-navy/60 transition-colors h-11"

export default function ForgotPasswordPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!isAuthLoading && user) {
      router.push("/dashboard")
    }
  }, [user, isAuthLoading, router])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess(false)

    try {
      await sendPasswordResetEmail(auth, email, resetPasswordActionCodeSettings)
      setSuccess(true)
    } catch (err: any) {
      let errorMessage = "Failed to send password reset email. Please try again."
      if (err.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address."
      }
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (isAuthLoading || user) {
    return <FullPageLoader />
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-editorial-cream">
      <div className="w-full max-w-md relative z-10">
        <Link
          href="/login"
          className="inline-flex items-center min-h-[44px] py-2 text-sm text-editorial-muted hover:text-editorial-navy transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to login
        </Link>

        <div className="rounded-2xl border border-editorial-border bg-white shadow-sm p-5 sm:p-8">
          <div className="mb-6">
            <h2 className="font-display text-2xl font-bold text-editorial-navy">Forgot Password</h2>
            <p className="text-sm text-editorial-muted mt-1">Enter your email and we&apos;ll send you a link to reset your password.</p>
          </div>

          {success ? (
            <div className="flex gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-emerald-600" />
              <div>
                <p className="text-sm font-medium">Check Your Email</p>
                <p className="text-xs text-emerald-700/80 mt-0.5">
                  A password reset link has been sent to your email address. Please check your inbox (and spam folder).
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5">
              {error && (
                <div className="flex gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
                  <p className="text-sm">{error}</p>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-editorial-ink text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className={inputClass}
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 text-base font-semibold rounded-full bg-editorial-navy hover:bg-editorial-navy-deep text-editorial-cream border-0 transition-colors"
              >
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
