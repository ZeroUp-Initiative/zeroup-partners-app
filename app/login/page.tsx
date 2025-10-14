'use client'

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase/client"
import toast from "react-hot-toast"

// UI Components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Eye, EyeOff, ArrowLeft, TriangleAlert } from "lucide-react"
import Link from "next/link"

function FullPageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
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

    const toastId = toast.loading("Signing in...");

    try {
      await signInWithEmailAndPassword(auth, email, password)
      toast.success("Login successful! Redirecting...", { id: toastId });
      // The useEffect will handle the redirect automatically.
    } catch (err: any) {
      let errorTitle = "Login Failed"
      let errorMessage = "An unexpected error occurred. Please try again."

      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorTitle = "Invalid Credentials"
          errorMessage = "The email or password you entered is incorrect. Please check your details and try again."
          break
        case 'auth/invalid-email':
          errorTitle = "Invalid Email Format"
          errorMessage = "Please enter a valid email address."
          break
        case 'auth/user-disabled':
          errorTitle = "Account Disabled"
          errorMessage = "Your account has been disabled. Please contact support for assistance."
          break
        case 'auth/too-many-requests':
            errorTitle = "Too Many Attempts"
            errorMessage = "Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later."
            break
        default:
          console.error("Firebase Auth Error:", err)
          break
      }
      toast.error(errorTitle, { id: toastId });
      setError({ title: errorTitle, message: errorMessage })
      setIsLoading(false)
    }
  }

  if (isAuthLoading) {
    return <FullPageLoader />
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
         <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Link>
           <div className="flex items-center justify-center gap-3 mb-6">
            <div className="relative w-12 h-12">
                <img src="/images/zeroup-partners-logo.png" alt="ZeroUp Partners" className="object-contain" />
            </div>
            <div className="text-left">
              <h1 className="text-lg font-bold text-foreground">ZeroUp Initiative</h1>
              <p className="text-sm text-muted-foreground">Partners Hub</p>
            </div>
          </div>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Sign in to your partner account to continue your impact.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error.message && (
                <Alert variant="destructive">
                  <TriangleAlert className="h-4 w-4" />
                  <AlertTitle>{error.title}</AlertTitle>
                  <AlertDescription>{error.message}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="partner@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="text-right">
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don\'t have an account?{" "}
                <Link href="/signup" className="text-primary hover:underline font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
