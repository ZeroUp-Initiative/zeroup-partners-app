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

const gradientStyles: Record<GradientVariant, { bar: string; icon: string; glow: string }> = {
  emerald: {
    bar: "from-emerald-500 to-teal-400",
    icon: "bg-gradient-to-br from-emerald-500/20 to-teal-400/20 text-emerald-600 dark:text-emerald-400",
    glow: "hover:shadow-emerald-500/25"
  },
  blue: {
    bar: "from-blue-500 to-cyan-400",
    icon: "bg-gradient-to-br from-blue-500/20 to-cyan-400/20 text-blue-600 dark:text-blue-400",
    glow: "hover:shadow-blue-500/25"
  },
  purple: {
    bar: "from-purple-500 to-pink-400",
    icon: "bg-gradient-to-br from-purple-500/20 to-pink-400/20 text-purple-600 dark:text-purple-400",
    glow: "hover:shadow-purple-500/25"
  },
  orange: {
    bar: "from-orange-500 to-amber-400",
    icon: "bg-gradient-to-br from-orange-500/20 to-amber-400/20 text-orange-600 dark:text-orange-400",
    glow: "hover:shadow-orange-500/25"
  },
  cyan: {
    bar: "from-cyan-500 to-blue-400",
    icon: "bg-gradient-to-br from-cyan-500/20 to-blue-400/20 text-cyan-600 dark:text-cyan-400",
    glow: "hover:shadow-cyan-500/25"
  },
  rose: {
    bar: "from-rose-500 to-pink-400",
    icon: "bg-gradient-to-br from-rose-500/20 to-pink-400/20 text-rose-600 dark:text-rose-400",
    glow: "hover:shadow-rose-500/25"
  },
  amber: {
    bar: "from-amber-500 to-yellow-400",
    icon: "bg-gradient-to-br from-amber-500/20 to-yellow-400/20 text-amber-600 dark:text-amber-400",
    glow: "hover:shadow-amber-500/25"
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
        "relative overflow-hidden transition-all duration-300 hover:-translate-y-1",
        glowOnHover && `hover:shadow-xl ${styles.glow}`,
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

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon && (
          <div className={cn("p-2.5 rounded-xl", styles.icon)}>
            {icon}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="relative">
        <div className="text-2xl md:text-3xl font-bold tracking-tight">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium mt-2",
            trend.value >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
          )}>
            <span>{trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%</span>
            <span className="text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
