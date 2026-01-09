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
  <div className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-t border-border/40 bg-background/80 px-2 backdrop-blur-lg md:hidden">
    
    {/* Left side */}
    <div className="flex flex-1 justify-start">
      <div className="flex items-center">
        <Link
          href="/dashboard"
          className={cn(
            "flex flex-col items-center justify-center gap-1 px-3",
            pathname === "/dashboard"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Home className="h-6 w-6" />
          <span className="text-[10px]">Home</span>
        </Link>

        <Link
          href="/projects"
          className={cn(
            "flex flex-col items-center justify-center gap-1 px-3",
            pathname === "/projects"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <LayoutGrid className="h-6 w-6" />
          <span className="text-[10px]">Projects</span>
        </Link>
      </div>
    </div>

    {/* Center plus */}
    <div className="flex flex-1 justify-center">
      <LogContributionModal>
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform active:scale-95">
          <PlusCircle className="h-7 w-7" />
        </div>
      </LogContributionModal>
    </div>

    {/* Right side */}
    <div className="flex flex-1 justify-end">
      <div className="flex items-center">
        <Link
          href="/contributions"
          className={cn(
            "flex flex-col items-center justify-center gap-1 px-3",
            pathname === "/contributions"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Users className="h-6 w-6" />
          <span className="text-[10px]">Contributions</span>
        </Link>

        <Link
          href="/dashboard/transactions"
          className={cn(
            "flex flex-col items-center justify-center gap-1 px-3",
            pathname === "/dashboard/transactions"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <User className="h-6 w-6" />
          <span className="text-[10px]">Transactions</span>
        </Link>
      </div>
    </div>

  </div>
)

}
