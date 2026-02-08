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
  <div className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-t border-border/40 bg-background/95 backdrop-blur-lg md:hidden px-2 w-full max-w-full overflow-hidden">
    
    {/* Home */}
    <Link
      href="/dashboard"
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg transition-all duration-200 font-medium min-w-0 flex-1",
        pathname === "/dashboard"
          ? "text-primary font-bold"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Home className="h-5 w-5 flex-shrink-0" />
      <span className="text-[10px] font-medium truncate">Home</span>
    </Link>

    {/* Projects */}
    <Link
      href="/projects"
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg transition-all duration-200 font-medium min-w-0 flex-1",
        pathname === "/projects"
          ? "text-primary font-bold"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <LayoutGrid className="h-5 w-5 flex-shrink-0" />
      <span className="text-[10px] font-medium truncate">Projects</span>
    </Link>

    {/* Center plus */}
    <div className="flex items-center justify-center px-1 flex-shrink-0">
      <LogContributionModal>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform active:scale-95">
          <PlusCircle className="h-5 w-5" />
        </div>
      </LogContributionModal>
    </div>

    {/* Logs */}
    <Link
      href="/contributions"
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg transition-all duration-200 font-medium min-w-0 flex-1",
        pathname === "/contributions"
          ? "text-primary font-bold"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Users className="h-5 w-5 flex-shrink-0" />
      <span className="text-[10px] font-medium truncate">Logs</span>
    </Link>

    {/* History */}
    <Link
      href="/dashboard/transactions"
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 rounded-lg transition-all duration-200 font-medium min-w-0 flex-1",
        pathname === "/dashboard/transactions"
          ? "text-primary font-bold"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <User className="h-5 w-5 flex-shrink-0" />
      <span className="text-[10px] font-medium truncate">History</span>
    </Link>

  </div>
)

}
