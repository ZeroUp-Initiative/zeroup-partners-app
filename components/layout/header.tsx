'use client'

import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { auth } from "@/lib/firebase/client"
import { LogOut, Menu } from "lucide-react"
import { useState } from "react"
import Image from "next/image"
import { EmailVerificationBanner } from "@/components/email-verification-banner"
import { NotificationBell } from "@/components/notification-bell"
import { ThemeToggle } from "@/components/theme-toggle"

interface HeaderProps {
  title: string;
  subtitle: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const logout = async () => {
    await auth.signOut()
  }

  return (
    <>
      <EmailVerificationBanner />
      <header className="header-glass sticky top-0 z-50 transition-all duration-300">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg group-hover:shadow-primary/25 transition-all duration-300 md:w-11 md:h-11">
                <Image
                  src="/zeroup-partners-logo-light-mode.png"
                  alt="ZeroUp Partners Logo"
                  fill
                  className="object-contain dark:hidden"
                />
                <Image
                  src="/zeroup-partners-logo-dark-mode.png"
                  alt="ZeroUp Partners Logo"
                  fill
                  className="object-contain hidden dark:block"
                />
              </div>
              <div className="hidden md:block">
                <h1 className="text-lg font-bold text-foreground leading-tight">{title}</h1>
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-6">
            {/* Desktop Navigation */}
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

            {/* Mobile Notification Bell */}
            <div className="md:hidden">
              <NotificationBell />
            </div>

            {/* Mobile Menu Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="w-5 h-5" />
              <span className="sr-only">Toggle mobile menu</span>
            </Button>

            {/* User Menu - Desktop */}
            <div className="hidden md:flex items-center gap-4">
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {/* Notification Bell */}
              <NotificationBell />
              
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
                    {user?.photoURL && (
                      <AvatarImage src={user.photoURL} alt={`${user.firstName}'s profile`} />
                    )}
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

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-lg border-b border-border/40 shadow-lg">
          <nav className="container mx-auto px-4 py-4 space-y-3">
            <Link 
              href="/contributions" 
              className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Contributions
            </Link>
            <Link 
              href="/projects" 
              className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Projects
            </Link>
            <Link 
              href="/analytics" 
              className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Analytics
            </Link>
            <Link 
              href="/community" 
              className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Community
            </Link>
            
            {/* Theme Toggle in Mobile */}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground">Theme</span>
              <ThemeToggle />
            </div>
            
            {/* Mobile User Info */}
            <div className="border-t border-border/40 pt-4 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Link href="/dashboard/profile" onClick={() => setIsMobileMenuOpen(false)}>
                    <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                      {user?.photoURL && (
                        <AvatarImage src={user.photoURL} alt={`${user.firstName}'s profile`} />
                      )}
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-bold text-sm">
                        {user?.firstName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div>
                    <p className="text-sm font-medium">
                      {user?.firstName && user?.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user?.displayName 
                        ? user.displayName 
                        : user?.email?.split('@')[0]}
                    </p>
                    <p className="text-xs text-muted-foreground">Individual Partner</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={logout} 
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="sr-only">Logout</span>
                </Button>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
    </>
  )
}
