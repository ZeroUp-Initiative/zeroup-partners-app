'use client'

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase/client"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, ArrowLeft, TriangleAlert } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

function FullPageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center" style={{ backgroundColor: '#130927' }}>
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#8d44d1] border-t-transparent" />
    </div>
  )
}

export default function LoginPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState({ title: "", message: "" })

  useEffect(() => {
    if (!isAuthLoading && user) {
      router.push("/dashboard")
    }
  }, [user, isAuthLoading, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError({ title: "", message: "" })

    try {
      await signInWithEmailAndPassword(auth, email, password)
      toast.success("Login successful! Redirecting...")
    } catch (err: any) {
      let errorTitle = "Login Failed"
      let errorMessage = "An unexpected error occurred. Please try again."

      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorTitle = "Invalid Credentials"
          errorMessage = "The email or password you entered is incorrect."
          break
        case 'auth/invalid-email':
          errorTitle = "Invalid Email"
          errorMessage = "Please enter a valid email address."
          break
        case 'auth/user-disabled':
          errorTitle = "Account Disabled"
          errorMessage = "Your account has been disabled. Contact support."
          break
        case 'auth/too-many-requests':
          errorTitle = "Too Many Attempts"
          errorMessage = "Account temporarily locked. Reset your password or try again later."
          break
        default:
          console.error("Firebase Auth Error:", err)
      }
      toast.error(errorMessage)
      setError({ title: errorTitle, message: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  if (isAuthLoading) return <FullPageLoader />

  return (
    <div
      className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden"
      style={{ backgroundColor: '#130927' }}
    >
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#8d44d1]/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#7030b0]/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#8d44d1]/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center text-sm text-white/40 hover:text-white/70 transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to home
        </Link>

        {/* Logo + brand */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-xl shadow-[#8d44d1]/20 ring-1 ring-white/10">
            <Image
              src="/images/zeroup-partners-logo-light-mode.png"
              alt="ZeroUp Partners"
              fill
              className="object-contain dark:hidden"
            />
            <Image
              src="/images/zeroup-partners-logo-dark-mode.png"
              alt="ZeroUp Partners"
              fill
              className="object-contain hidden dark:block"
            />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white tracking-tight">ZeroUp Partners</h1>
            <p className="text-sm text-white/40">Partners Hub</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/8 bg-[#1e1040]/60 backdrop-blur-xl shadow-2xl shadow-black/40 p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">Welcome back</h2>
            <p className="text-sm text-white/50 mt-1">Sign in to your partner account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error.message && (
              <div className="flex gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                <TriangleAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">{error.title}</p>
                  <p className="text-xs text-red-400/80 mt-0.5">{error.message}</p>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-white/70 text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-[#8d44d1]/60 focus:bg-white/8 transition-colors h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-white/70 text-sm">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-[#8d44d1]/60 focus:bg-white/8 transition-colors h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-sm text-[#a05cd4] hover:text-[#c084f5] transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 text-base font-semibold rounded-xl bg-gradient-to-r from-[#8d44d1] to-[#7030b0] hover:from-[#7030b0] hover:to-[#5e269a] text-white border-0 shadow-lg shadow-[#8d44d1]/25 transition-all hover:shadow-[#8d44d1]/40"
            >
              {isLoading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-white/40">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-[#a05cd4] hover:text-[#c084f5] font-medium transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
