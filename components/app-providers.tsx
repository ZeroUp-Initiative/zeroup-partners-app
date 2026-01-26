'use client'
import { useEffect } from "react"
import { AuthProvider } from "@/contexts/auth-context"
import { PageTransition } from "@/components/page-transition"
import { Toaster } from "react-hot-toast"
import toast from "react-hot-toast"
import { onForegroundMessage } from "@/lib/push-notifications"

export function AppProviders({ children }: { children: React.ReactNode }) {
  // Register service worker and set up foreground message handler
  useEffect(() => {
    // Register the Firebase messaging service worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('Firebase messaging SW registered:', registration.scope)
        })
        .catch((error) => {
          console.error('Firebase messaging SW registration failed:', error)
        })
    }

    // Set up foreground message handler
    const unsubscribe = onForegroundMessage((payload: unknown) => {
      const data = payload as { notification?: { title?: string; body?: string } }
      const title = data.notification?.title || 'New Notification'
      const body = data.notification?.body || 'You have a new notification'
      
      // Show toast notification when app is in foreground
      toast(body, {
        icon: '🔔',
        duration: 6000,
      })
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return (
    <AuthProvider>
      <PageTransition>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 5000,
          }}
        />
      </PageTransition>
    </AuthProvider>
  )
}