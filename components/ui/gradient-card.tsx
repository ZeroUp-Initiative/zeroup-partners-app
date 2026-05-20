"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export type GradientVariant = "emerald" | "blue" | "purple" | "orange" | "cyan" | "rose" | "amber"

interface GradientCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: GradientVariant
  icon?: React.ReactNode
  title: string
  value: React.ReactNode
  subtitle?: string
  trend?: {
    value: number
    label: string
  }
  glowOnHover?: boolean
}

const gradientStyles: Record<GradientVariant, { bar: string; icon: string }> = {
  emerald: {
    bar: "from-[#8d44d1] to-[#7030b0]",
    icon: "bg-gradient-to-br from-[#8d44d1]/15 to-[#7030b0]/15 text-[#7030b0] dark:text-[#a05cd4]",
  },
  blue: {
    bar: "from-blue-500 to-cyan-400",
    icon: "bg-gradient-to-br from-blue-500/15 to-cyan-400/15 text-blue-600 dark:text-blue-400",
  },
  purple: {
    bar: "from-purple-500 to-pink-400",
    icon: "bg-gradient-to-br from-purple-500/15 to-pink-400/15 text-purple-600 dark:text-purple-400",
  },
  orange: {
    bar: "from-orange-500 to-amber-400",
    icon: "bg-gradient-to-br from-orange-500/15 to-amber-400/15 text-orange-600 dark:text-orange-400",
  },
  cyan: {
    bar: "from-cyan-500 to-blue-400",
    icon: "bg-gradient-to-br from-cyan-500/15 to-blue-400/15 text-cyan-600 dark:text-cyan-400",
  },
  rose: {
    bar: "from-rose-500 to-pink-400",
    icon: "bg-gradient-to-br from-rose-500/15 to-pink-400/15 text-rose-600 dark:text-rose-400",
  },
  amber: {
    bar: "from-amber-500 to-yellow-400",
    icon: "bg-gradient-to-br from-amber-500/15 to-yellow-400/15 text-amber-600 dark:text-amber-400",
  }
}

export function GradientCard({
  variant = "blue",
  icon,
  title,
  value,
  subtitle,
  trend,
  glowOnHover = true,
  className,
  ...props
}: GradientCardProps) {
  const styles = gradientStyles[variant]

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md p-0",
        className
      )}
      {...props}
    >
      {/* Gradient top bar */}
      <div className={cn("absolute top-0 left-0 right-0 h-1 bg-gradient-to-r", styles.bar)} />
      
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id={`dots-${variant}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#dots-${variant})`} />
        </svg>
      </div>

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 sm:pt-5 px-3 sm:px-6">
        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon && (
          <div className={cn("p-1.5 sm:p-2.5 rounded-xl flex-shrink-0", styles.icon)}>
            {icon}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="relative overflow-hidden px-3 sm:px-6 pb-4 sm:pb-6">
        <div className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight overflow-hidden">{value}</div>
        {subtitle && (
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 truncate">{subtitle}</p>
        )}
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium mt-2",
            trend.value >= 0 ? "text-[#7030b0] dark:text-[#a05cd4]" : "text-rose-600 dark:text-rose-400"
          )}>
            <span>{trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%</span>
            <span className="text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
