import React from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-muted/20">
      <AdminSidebar />
      <div className="md:ml-64 min-h-screen transition-all duration-300">
        <main className="p-4 md:p-8 pt-16 md:pt-8 max-w-7xl mx-auto">
            {children}
        </main>
      </div>
    </div>
  )
}
