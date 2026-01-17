'use client'

import React from "react"
import ProtectedRoute from "@/components/auth/protected-route"
import Header from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell } from "lucide-react"

function NotificationsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header title="Notifications" subtitle="Stay updated" />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
             <Card className="text-center py-12 border-dashed">
                <CardHeader>
                    <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 ring-8 ring-primary/5">
                        <Bell className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">No Notifications</CardTitle>
                    <CardDescription className="max-w-sm mx-auto mt-2">
                        You're all caught up! Use this space to track important updates and announcements from the ZeroUp Initiative.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  )
}

export default function ProtectedNotifications() {
  return (
    <ProtectedRoute>
      <NotificationsPage />
    </ProtectedRoute>
  )
}
