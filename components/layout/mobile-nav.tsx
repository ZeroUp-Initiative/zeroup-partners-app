"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, LayoutGrid, PlusCircle, Users, User } from "lucide-react"
import { cn } from "@/lib/utils"

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
      href: "/contributions", // Direct link to contributions page which now has the modal
      icon: PlusCircle,
      isPrimary: true,
    },
    {
      name: "Community",
      href: "/community",
      icon: Users,
    },
    {
      name: "Profile", // Changed from "Account" to match the user's request context
      href: "/dashboard/profile",
      icon: User,
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex h-16 w-full items-center justify-around border-t border-border/40 bg-background/80 px-2 backdrop-blur-lg md:hidden">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1",
              item.isPrimary ? "-mt-8" : "",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {item.isPrimary ? (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform active:scale-95">
                <Icon className="h-7 w-7" />
              </div>
            ) : (
              <div className={cn("flex flex-col items-center gap-0.5", isActive && "font-medium")}>
                <Icon className={cn("h-6 w-6", isActive && "fill-current/20")} />
                <span className="text-[10px]">{item.name}</span>
              </div>
            )}
          </Link>
        )
      })}
    </div>
  )
}
