'use client'

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { auth, db } from "@/lib/firebase/client"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"

// UI Components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Eye, EyeOff } from "lucide-react"
import Link from "next/link"

function FullPageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
    </div>
  )
}

export default function SignupPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const router = useRouter()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [organization, setOrganization] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isAuthLoading && user) {
      router.push("/dashboard")
    }
  }, [user, isAuthLoading, router])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user

      await setDoc(doc(db, "users", firebaseUser.uid), {
        firstName,
        lastName,
        email,
        organization: organization || "", // Optional field
        createdAt: serverTimestamp(),
      })
      
      // Update Firebase Auth profile for immediate local availability
      await updateProfile(firebaseUser, {
        displayName: `${firstName} ${lastName}`.trim()
      });

      // On success, the useEffect will handle the redirect.
    } catch (err: any) {
      let errorMessage = "Signup failed. Please try again."
      if (err.code === "auth/email-already-in-use") {
        errorMessage = "This email is already in use. Please try logging in."
      } else if (err.code === "auth/weak-password") {
        errorMessage = "Your password must be at least 6 characters long."
      } else if (err.code) {
        errorMessage = err.message
      }
      setError(errorMessage)
      setIsLoading(false) // Re-enable form on error
    }
  }

  if (isAuthLoading || user) {
    return <FullPageLoader />
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-background">
             <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
             <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
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

        <Card className="border-border shadow-lg bg-white dark:border-white/10 dark:shadow-2xl dark:bg-black/50 dark:backdrop-blur-md">
          <CardHeader className="text-center space-y-1 pb-2">
            <CardTitle className="text-2xl font-bold tracking-tight">Create Account</CardTitle>
            <CardDescription className="text-base">Join our network to start making a difference</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSignup} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="flex gap-4">
                <div className="space-y-2 w-1/2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required disabled={isLoading} className="bg-background/50 border-input/50 focus:bg-background transition-colors" />
                </div>
                <div className="space-y-2 w-1/2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required disabled={isLoading} className="bg-background/50 border-input/50 focus:bg-background transition-colors" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} className="bg-background/50 border-input/50 focus:bg-background transition-colors" />
              </div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
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
              <div className="space-y-2">
                <Label htmlFor="organization">Organization (Optional)</Label>
                <Input id="organization" value={organization} onChange={(e) => setOrganization(e.target.value)} disabled={isLoading} className="bg-background/50 border-input/50 focus:bg-background transition-colors" />
              </div>
              <Button type="submit" className="w-full text-base font-medium h-11 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-bold" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:text-primary/80 transition-colors font-bold underline-offset-4 hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
