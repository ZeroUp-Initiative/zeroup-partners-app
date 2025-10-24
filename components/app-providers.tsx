'use client'
import { AuthProvider } from "@/contexts/auth-context"
import { GamificationProvider } from "@/components/gamification-provider"
import { PageTransition } from "@/components/page-transition"
import { Toaster } from "react-hot-toast"

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <GamificationProvider>
        <PageTransition>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 5000,
            }}
          />
        </PageTransition>
      </GamificationProvider>
    </AuthProvider>
  )
}