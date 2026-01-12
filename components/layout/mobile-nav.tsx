"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, LayoutGrid, PlusCircle, Users, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { LogContributionModal } from "@/components/contributions/log-contribution-modal"

export function MobileNav() {
  const pathname = usePathname()

  const navItems = [
    {
      name: "Home",
      href: "/dashboard",
      icon: Home,
    },
    {
      name: "Projects",
      href: "/projects",
      icon: LayoutGrid,
    },
    {
      name: "Log",
      href: "", // No href since we're using modal
      icon: () => (
        <LogContributionModal>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform active:scale-95">
            <PlusCircle className="h-7 w-7" />
          </div>
        </LogContributionModal>
      ),
      isPrimary: true,
      isModal: true,
    },
    {
      name: "Contributions",
      href: "/contributions",
      icon: Users,
    },
    {
      name: "Transactions",
      href: "/dashboard/transactions",
      icon: User,
    },
  ]

return (
  <div className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-border/40 bg-background/95 backdrop-blur-lg md:hidden px-4">
    
    {/* Left side */}
    <div className="flex items-center justify-center">
      <Link
        href="/dashboard"
        className={cn(
          "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-all duration-200 font-medium",
          pathname === "/dashboard"
            ? "text-primary font-bold"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        <Home className="h-5 w-5" />
        <span className="text-xs font-medium">Home</span>
      </Link>

      <Link
        href="/projects"
        className={cn(
          "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-all duration-200 font-medium",
          pathname === "/projects"
            ? "text-primary font-bold"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        <LayoutGrid className="h-5 w-5" />
        <span className="text-xs font-medium">Projects</span>
      </Link>
    </div>

    {/* Center plus */}
    <div className="flex items-center justify-center">
      <LogContributionModal>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform active:scale-95">
          <PlusCircle className="h-6 w-6" />
        </div>
      </LogContributionModal>
    </div>

    {/* Right side */}
    <div className="flex items-center justify-center">
      <Link
        href="/contributions"
        className={cn(
          "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-all duration-200 font-medium",
          pathname === "/contributions"
            ? "text-primary font-bold"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        <Users className="h-5 w-5" />
        <span className="text-xs font-medium">Contributions</span>
      </Link>

      <Link
        href="/dashboard/transactions"
        className={cn(
          "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-all duration-200 font-medium",
          pathname === "/dashboard/transactions"
            ? "text-primary font-bold"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
      >
        <User className="h-5 w-5" />
        <span className="text-xs font-medium">Transactions</span>
      </Link>
    </div>

  </div>
)

}
