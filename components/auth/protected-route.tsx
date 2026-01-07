'use client'

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { MobileNav } from "@/components/layout/mobile-nav"

// A full-page loading spinner to prevent layout shifts and provide a good UX
function FullPageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      {/* You can replace this with a more sophisticated SVG spinner component */}
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
    </div>
  )
}

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If authentication is not loading and there is no user, redirect to login.
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [isLoading, user, router])

  // While the auth state is loading, or if there's no user (and the redirect is in progress),
  // show a full-page loader. This provides a stable UI and prevents the component tree
  // from unmounting/remounting, which fixes the "Rendered more hooks" error.
  if (isLoading || !user) {
    return <FullPageLoader />
  }

  // If authentication is finished and there is a user, render the protected content.
  return (
    <div className="pb-16 md:pb-0">
      {children}
      <MobileNav />
    </div>
  )
}

