"use client"

import { AuthGuard, useAuth } from "@/components/auth-guard"
import { NotificationBell } from "@/components/notification-bell"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  TrendingUp,
  DollarSign,
  Target,
  Award,
  LogOut,
  Plus,
  Users,
  BarChart3,
  Brain,
  BookOpen,
  Coins,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

function DashboardContent() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute bottom-1/4 left-1/3 w-48 h-48 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      {/* Header */}
      <header className="glass-card border-b border-border/50 sticky top-0 z-50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 neon-glow-blue">
                <Image src="/images/zeroup-partners-logo.png" alt="ZeroUp Partners" fill className="object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Partners Hub</h1>
                <p className="text-sm text-muted-foreground">Partner Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-4">
                <Link
                  href="/contributions"
                  className="text-muted-foreground hover:text-primary transition-all duration-300 hover:glow-text"
                >
                  Contributions
                </Link>
                <Link
                  href="/analytics"
                  className="text-muted-foreground hover:text-primary transition-all duration-300 hover:glow-text"
                >
                  Analytics
                </Link>
                <Link
                  href="/community"
                  className="text-muted-foreground hover:text-primary transition-all duration-300 hover:glow-text"
                >
                  Community
                </Link>
                <Link
                  href="/dreamers-coin"
                  className="text-muted-foreground hover:text-primary transition-all duration-300 hover:glow-text"
                >
                  Dreamers Coin
                </Link>
                <Link
                  href="/bridge-ai"
                  className="text-muted-foreground hover:text-primary transition-all duration-300 hover:glow-text"
                >
                  Bridge AI
                </Link>
                <Link
                  href="/resources"
                  className="text-muted-foreground hover:text-primary transition-all duration-300 hover:glow-text"
                >
                  Resources
                </Link>
              </nav>
              <NotificationBell />
              <ThemeToggle />
              <div className="flex items-center gap-3">
                <Avatar className="ring-2 ring-primary/20 neon-glow-blue">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.organization || "Individual Partner"}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={logout} className="neon-button bg-transparent">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="space-y-8">
          <div className="space-y-2 animate-slide-up">
            <h2 className="text-3xl font-bold text-balance bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Welcome back, {user?.name?.split(" ")[0]}!
            </h2>
            <p className="text-muted-foreground animate-fade-in-delayed">
              Track your contributions and see the impact you're making through the ZeroUp Initiative.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Total Contributions",
                value: "$2,450",
                change: "+12% from last month",
                icon: DollarSign,
                glowColor: "neon-glow-green",
              },
              {
                title: "Monthly Goal",
                value: "85%",
                change: "$425 of $500 goal",
                icon: Target,
                glowColor: "neon-glow-blue",
              },
              {
                title: "Impact Score",
                value: "94",
                change: "Top 10% of partners",
                icon: TrendingUp,
                glowColor: "neon-glow-purple",
              },
              {
                title: "Badges Earned",
                value: "7",
                change: "3 new this month",
                icon: Award,
                glowColor: "neon-glow-orange",
              },
            ].map((stat, index) => (
              <Card
                key={index}
                className={`glass-card hover-tilt animate-slide-up ${stat.glowColor} transition-all duration-500`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground animate-pulse-slow" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold animate-number-glow">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.change}</p>
                  {stat.title === "Monthly Goal" && (
                    <div className="mt-2">
                      <Progress value={85} className="h-2 neon-progress" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                href: "/contributions/new",
                icon: Plus,
                title: "Log Contribution",
                description: "Record your monthly contribution",
                glowColor: "neon-glow-green",
              },
              {
                href: "/analytics",
                icon: BarChart3,
                title: "View Analytics",
                description: "See your impact dashboard",
                glowColor: "neon-glow-blue",
              },
              {
                href: "/community",
                icon: Users,
                title: "Community",
                description: "Connect with other partners",
                glowColor: "neon-glow-purple",
              },
              {
                href: "/dreamers-coin",
                icon: Coins,
                title: "Dreamers Coin",
                description: "Your rewards wallet",
                glowColor: "neon-glow-orange",
              },
              {
                href: "/bridge-ai",
                icon: Brain,
                title: "Bridge AI",
                description: "AI-powered initiatives",
                glowColor: "neon-glow-cyan",
              },
              {
                href: "/resources",
                icon: BookOpen,
                title: "Resources",
                description: "Reports and guides",
                glowColor: "neon-glow-pink",
              },
            ].map((action, index) => (
              <Card
                key={index}
                className={`glass-card hover-tilt cursor-pointer transition-all duration-500 ${action.glowColor} animate-slide-up`}
                style={{ animationDelay: `${index * 100}ms` }}
                asChild
              >
                <Link href={action.href}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center neon-icon-glow">
                        <action.icon className="w-5 h-5 text-primary animate-pulse-slow" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{action.title}</CardTitle>
                        <CardDescription>{action.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Link>
              </Card>
            ))}
          </div>

          <Card className="glass-card neon-glow-blue animate-slide-up">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Recent Activity
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  </CardTitle>
                  <CardDescription>Your latest contributions and achievements</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="neon-button bg-transparent" asChild>
                  <Link href="/contributions">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    title: "Monthly contribution logged",
                    subtitle: "$500 • 2 days ago",
                    badge: "Completed",
                    badgeVariant: "secondary" as const,
                  },
                  {
                    title: 'Earned "Consistent Contributor" badge',
                    subtitle: "5 days ago",
                    badge: "Achievement",
                    badgeVariant: "outline" as const,
                  },
                  {
                    title: "Reached 85% of monthly goal",
                    subtitle: "1 week ago",
                    badge: "Milestone",
                    badgeVariant: "outline" as const,
                  },
                ].map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 border rounded-lg glass-card hover-tilt transition-all duration-300 animate-fade-in"
                    style={{ animationDelay: `${index * 200}ms` }}
                  >
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    <div className="flex-1">
                      <p className="font-medium">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">{activity.subtitle}</p>
                    </div>
                    <Badge variant={activity.badgeVariant} className="neon-badge">
                      {activity.badge}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  )
}
