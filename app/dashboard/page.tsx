'use client'

import type React from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { auth } from "@/lib/firebase/client"
import ProtectedRoute from "@/components/auth/protected-route"

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DollarSign, Target, TrendingUp, Award, Plus, BarChart, Users, LogOut } from "lucide-react"

function DashboardPage() {
  const { user } = useAuth()

  const logout = async () => {
    await auth.signOut()
  }

  // Dummy data based on the screenshot
  const stats = {
    totalContributions: 2450,
    contributionChange: "+12%",
    monthlyGoal: 500,
    currentMonthContribution: 425,
    impactScore: 94,
    impactPercentile: "Top 10%",
    badgesEarned: 7,
    newBadges: 3,
  }

  const monthlyProgress = (stats.currentMonthContribution / stats.monthlyGoal) * 100

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">Z</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Partners Hub</h1>
                <p className="text-sm text-muted-foreground">Partner Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
                <Link href="/contributions" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contributions
                </Link>
                <Link href="/analytics" className="text-muted-foreground hover:text-foreground transition-colors">
                  Analytics
                </Link>
                <Link href="/community" className="text-muted-foreground hover:text-foreground transition-colors">
                  Community
                </Link>
                 <Link href="/resources" className="text-muted-foreground hover:text-foreground transition-colors">
                  Resources
                </Link>
              </nav>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user?.firstName?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                 <div className="hidden md:block text-right">
                  <p className="text-sm font-bold">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-muted-foreground">Individual Partner</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2 md:mr-0" />
                <span className="hidden md:inline ml-2">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
          <div className="flex-1 space-y-6">
              {/* Welcome Header */}
              <div className="flex items-center justify-between space-y-2 mb-8">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">
                    Welcome back, {user?.firstName || "Partner"}!
                  </h2>
                  <p className="text-muted-foreground">
                    Track your contributions and see the impact you\'re making through the ZeroUp Initiative.
                  </p>
                </div>
              </div>

              {/* Grid of Stat Cards */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="card-glow-effect card-glow-green">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Contributions</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${stats.totalContributions.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">{stats.contributionChange} from last month</p>
                  </CardContent>
                </Card>

                <Card className="card-glow-effect card-glow-blue">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Monthly Goal</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{monthlyProgress.toFixed(0)}%</div>
                    <p className="text-xs text-muted-foreground">
                      ${stats.currentMonthContribution} of ${stats.monthlyGoal} goal
                    </p>
                    <Progress value={monthlyProgress} className="mt-2" />
                  </CardContent>
                </Card>

                <Card className="card-glow-effect card-glow-purple">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Impact Score</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.impactScore}</div>
                    <p className="text-xs text-muted-foreground">{stats.impactPercentile} of partners</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.badgesEarned}</div>
                    <p className="text-xs text-muted-foreground">{stats.newBadges} new this month</p>
                  </CardContent>
                </Card>
              </div>

              {/* Grid of Action Cards */}
              <div className="grid gap-6 md:grid-cols-3">
                <Link href="/contributions/new">
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <div className="bg-primary/10 p-3 rounded-md">
                                <Plus className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Log Contribution</CardTitle>
                                <CardDescription>Record your monthly contribution</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                </Link>
                <Link href="/analytics">
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <div className="bg-primary/10 p-3 rounded-md">
                                <BarChart className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle>View Analytics</CardTitle>
                                <CardDescription>See your impact dashboard</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                </Link>
                <Link href="/community">
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <div className="bg-primary/10 p-3 rounded-md">
                                <Users className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle>Community</CardTitle>
                                <CardDescription>Connect with other partners</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                </Link>
              </div>
          </div>
      </main>
    </div>
  )
}

// Wrap the page with the ProtectedRoute to ensure only authenticated users can access it.
export default function ProtectedDashboard() {
  return (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  )
}
