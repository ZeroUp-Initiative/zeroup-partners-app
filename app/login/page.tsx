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

    try {
      await signInWithEmailAndPassword(auth, email, password)
      toast.success("Login successful! Redirecting...");
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
      toast.error(errorMessage);
      setError({ title: errorTitle, message: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  if (isAuthLoading) {
    return <FullPageLoader />
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-background">
             <div className="absolute top-0 -left-4 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
             <div className="absolute bottom-0 -right-4 w-96 h-96 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
              <div className="absolute inset-0 bg-[url('/bg-pattern.svg')] opacity-5"></div>
        </div>

      <div className="w-full max-w-md space-y-8 relative z-10 animate-slide-in-up">
         <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-6 group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to home
          </Link>
           <div className="flex flex-col items-center justify-center gap-4 mb-4">
            <div className="relative w-14 h-14 rounded-xl overflow-hidden shadow-2xl shadow-primary/20">
                 <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" />
                 <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary to-primary/60">
                    <span className="text-primary-foreground font-bold text-2xl">Z</span>
                 </div>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">ZeroUp Initiative</h1>
              <p className="text-sm text-muted-foreground font-medium">Partners Hub</p>
            </div>
          </div>
        </div>

        <Card className="border border-white/10 shadow-2xl bg-white/50 dark:bg-black/50 backdrop-blur-md">
          <CardHeader className="text-center space-y-1 pb-2">
            <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
            <CardDescription className="text-base">Sign in to your partner account</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
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
                   className="bg-background/50 border-input/50 focus:bg-background transition-colors"
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
                    className="bg-background/50 border-input/50 focus:bg-background transition-colors pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="text-right">
                <Link href="/forgot-password" className="text-sm text-primary hover:text-primary/80 transition-colors font-medium">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full text-base font-medium h-11 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/signup" className="text-primary hover:text-primary/80 transition-colors font-bold underline-offset-4 hover:underline">
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
