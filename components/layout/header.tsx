'use client'

import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/firebase/client"
import { LogOut } from "lucide-react"

interface HeaderProps {
  title: string;
  subtitle: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuth()

  const logout = async () => {
    await auth.signOut()
  }

  return (
    <header className="header-glass sticky top-0 z-50 transition-all duration-300">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg group-hover:shadow-primary/25 transition-all duration-300 md:w-11 md:h-11">
                <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" />
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary to-primary/60">
                   <span className="text-primary-foreground font-bold text-xl">Z</span>
                </div>
              </div>
              <div className="hidden md:block">
                <h1 className="text-lg font-bold text-foreground leading-tight">{title}</h1>
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link href="/contributions" className="text-muted-foreground hover:text-primary transition-all duration-200 hover:-translate-y-0.5">
                Contributions
              </Link>
              <Link href="/projects" className="text-muted-foreground hover:text-primary transition-all duration-200 hover:-translate-y-0.5">
                Projects
              </Link>
              <Link href="/analytics" className="text-muted-foreground hover:text-primary transition-all duration-200 hover:-translate-y-0.5">
                Analytics
              </Link>
              <Link href="/community" className="text-muted-foreground hover:text-primary transition-all duration-200 hover:-translate-y-0.5">
                Community
              </Link>
            </nav>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col items-end mr-2">
                <Link href="/dashboard/profile" className="hover:opacity-80 transition-opacity">
                <p className="text-sm font-bold leading-none">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user?.displayName 
                    ? user.displayName 
                    : user?.email?.split('@')[0]}
                </p>
              </Link>
                <p className="text-xs text-muted-foreground mt-1">Individual Partner</p>
              </div>
              <Link href="/dashboard/profile">
                <Avatar className="h-9 w-9 ring-2 ring-primary/20 transition-all hover:ring-primary/50 cursor-pointer">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-bold">
                    {user?.firstName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                </Avatar>
              </Link>
              <Button variant="ghost" size="icon" onClick={logout} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                <LogOut className="w-5 h-5" />
                <span className="sr-only">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
