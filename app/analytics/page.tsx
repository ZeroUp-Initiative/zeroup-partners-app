"use client"

import { AuthGuard, useAuth } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Target, Award, LogOut, Calendar, LucidePieChart, Activity } from "lucide-react"
import Link from "next/link"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Pie,
} from "recharts"

function AnalyticsContent() {
  const { user, logout } = useAuth()

  // Mock data for charts
  const monthlyData = [
    { month: "Jan", contributions: 500, goal: 500, impact: 85 },
    { month: "Feb", contributions: 500, goal: 500, impact: 88 },
    { month: "Mar", contributions: 750, goal: 500, impact: 92 },
    { month: "Apr", contributions: 500, goal: 500, impact: 94 },
    { month: "May", contributions: 600, goal: 500, impact: 96 },
    { month: "Jun", contributions: 500, goal: 500, impact: 94 },
  ]

  const impactData = [
    { category: "Education", value: 35, color: "hsl(var(--primary))" },
    { category: "Healthcare", value: 25, color: "hsl(var(--secondary))" },
    { category: "Environment", value: 20, color: "hsl(var(--accent))" },
    { category: "Technology", value: 20, color: "hsl(var(--destructive))" },
  ]

  const yearlyGoals = [
    { goal: "Monthly Consistency", progress: 85, target: 100 },
    { goal: "Annual Target", progress: 65, target: 100 },
    { goal: "Impact Score", progress: 94, target: 100 },
    { goal: "Community Engagement", progress: 78, target: 100 },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <header className="border-b border-border/20 bg-card/30 backdrop-blur-xl relative z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center cursor-pointer hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-primary/25">
                  <span className="text-primary-foreground font-bold text-lg">Z</span>
                </div>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground">Analytics</h1>
                <p className="text-sm text-muted-foreground">Track your impact and performance</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="text-muted-foreground hover:text-primary transition-colors duration-300"
                >
                  Dashboard
                </Link>
                <Link
                  href="/contributions"
                  className="text-muted-foreground hover:text-primary transition-colors duration-300"
                >
                  Contributions
                </Link>
                <Link
                  href="/community"
                  className="text-muted-foreground hover:text-primary transition-colors duration-300"
                >
                  Community
                </Link>
              </nav>
              <div className="flex items-center gap-3">
                <Avatar className="ring-2 ring-primary/20">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.organization || "Individual Partner"}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="glass-card hover:scale-105 transition-all duration-300 bg-transparent"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="space-y-8">
          <div className="space-y-2 animate-fade-in">
            <h2 className="text-3xl font-bold text-balance">Your Impact Analytics</h2>
            <p className="text-muted-foreground">
              Comprehensive insights into your contributions and their real-world impact.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="glass-card hover-tilt group border-primary/20 hover:border-primary/40 transition-all duration-500 animate-fade-in">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Impact</CardTitle>
                <LucidePieChart className="h-4 w-4 text-primary group-hover:scale-110 transition-transform duration-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary animate-number-glow">$3,350</div>
                <p className="text-xs text-muted-foreground">+18% from last quarter</p>
              </CardContent>
            </Card>

            <Card className="glass-card hover-tilt group border-secondary/20 hover:border-secondary/40 transition-all duration-500 animate-fade-in delay-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Projects Supported</CardTitle>
                <Target className="h-4 w-4 text-secondary group-hover:scale-110 transition-transform duration-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-secondary animate-number-glow">12</div>
                <p className="text-xs text-muted-foreground">Across 4 categories</p>
              </CardContent>
            </Card>

            <Card className="glass-card hover-tilt group border-accent/20 hover:border-accent/40 transition-all duration-500 animate-fade-in delay-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Impact Score</CardTitle>
                <Activity className="h-4 w-4 text-accent group-hover:scale-110 transition-transform duration-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent animate-number-glow">94</div>
                <p className="text-xs text-muted-foreground">Top 10% of partners</p>
              </CardContent>
            </Card>

            <Card className="glass-card hover-tilt group border-primary/20 hover:border-primary/40 transition-all duration-500 animate-fade-in delay-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Consistency</CardTitle>
                <Calendar className="h-4 w-4 text-primary group-hover:scale-110 transition-transform duration-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary animate-number-glow">6/6</div>
                <p className="text-xs text-muted-foreground">Months contributed</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="trends" className="space-y-6 animate-fade-in delay-400">
            <TabsList className="glass-card">
              <TabsTrigger
                value="trends"
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
              >
                Contribution Trends
              </TabsTrigger>
              <TabsTrigger
                value="impact"
                className="data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary"
              >
                Impact Distribution
              </TabsTrigger>
              <TabsTrigger value="goals" className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent">
                Goal Progress
              </TabsTrigger>
            </TabsList>

            <TabsContent value="trends" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass-card hover-tilt border-primary/10 hover:border-primary/30 transition-all duration-500">
                  <CardHeader>
                    <CardTitle>Monthly Contributions</CardTitle>
                    <CardDescription>Your contribution history over the past 6 months</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`$${value}`, "Amount"]} />
                        <Area
                          type="monotone"
                          dataKey="contributions"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.2}
                        />
                        <Area
                          type="monotone"
                          dataKey="goal"
                          stroke="hsl(var(--muted-foreground))"
                          fill="transparent"
                          strokeDasharray="5 5"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="glass-card hover-tilt border-secondary/10 hover:border-secondary/30 transition-all duration-500">
                  <CardHeader>
                    <CardTitle>Impact Score Trend</CardTitle>
                    <CardDescription>How your impact score has evolved</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis domain={[80, 100]} />
                        <Tooltip formatter={(value) => [value, "Impact Score"]} />
                        <Line
                          type="monotone"
                          dataKey="impact"
                          stroke="hsl(var(--secondary))"
                          strokeWidth={3}
                          dot={{ fill: "hsl(var(--secondary))", strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="impact" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass-card hover-tilt border-accent/10 hover:border-accent/30 transition-all duration-500">
                  <CardHeader>
                    <CardTitle>Impact by Category</CardTitle>
                    <CardDescription>Where your contributions are making the most difference</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={impactData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={120}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {impactData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value}%`, "Impact"]} />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="glass-card hover-tilt border-primary/10 hover:border-primary/30 transition-all duration-500">
                  <CardHeader>
                    <CardTitle>Impact Breakdown</CardTitle>
                    <CardDescription>Detailed view of your contributions by category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {impactData.map((item, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{item.category}</span>
                            <span className="text-sm text-muted-foreground animate-number-glow">{item.value}%</span>
                          </div>
                          <Progress value={item.value} className="h-2" />
                          <p className="text-xs text-muted-foreground">
                            ${Math.round((item.value / 100) * 3350)} contributed
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="goals" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass-card hover-tilt border-secondary/10 hover:border-secondary/30 transition-all duration-500">
                  <CardHeader>
                    <CardTitle>2024 Goals Progress</CardTitle>
                    <CardDescription>Track your progress towards annual objectives</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {yearlyGoals.map((goal, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{goal.goal}</span>
                            <span className="text-sm text-muted-foreground animate-number-glow">{goal.progress}%</span>
                          </div>
                          <Progress value={goal.progress} className="h-3" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card hover-tilt border-accent/10 hover:border-accent/30 transition-all duration-500">
                  <CardHeader>
                    <CardTitle>Recent Achievements</CardTitle>
                    <CardDescription>Milestones and badges you've earned</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 glass-card border-secondary/20 hover:border-secondary/40 transition-all duration-300">
                        <Award className="w-8 h-8 text-secondary" />
                        <div>
                          <p className="font-medium">Consistent Contributor</p>
                          <p className="text-sm text-muted-foreground">6 months in a row</p>
                        </div>
                        <Badge variant="secondary" className="animate-pulse">
                          New
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 p-3 glass-card border-primary/20 hover:border-primary/40 transition-all duration-300">
                        <Target className="w-8 h-8 text-primary" />
                        <div>
                          <p className="font-medium">Goal Crusher</p>
                          <p className="text-sm text-muted-foreground">Exceeded monthly goal</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 glass-card border-accent/20 hover:border-accent/40 transition-all duration-300">
                        <TrendingUp className="w-8 h-8 text-accent" />
                        <div>
                          <p className="font-medium">Impact Leader</p>
                          <p className="text-sm text-muted-foreground">Top 10% impact score</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          <Card className="glass-card hover-tilt border-primary/10 hover:border-primary/30 transition-all duration-500 animate-fade-in delay-500">
            <CardHeader>
              <CardTitle>Your Impact Stories</CardTitle>
              <CardDescription>See how your contributions are making a real difference</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="w-full h-32 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                    <span className="text-primary font-medium">Education Project</span>
                  </div>
                  <h4 className="font-semibold">School Technology Upgrade</h4>
                  <p className="text-sm text-muted-foreground">
                    Your contributions helped provide new computers and internet access to 200 students in rural
                    communities, improving their learning outcomes by 35%.
                  </p>
                  <Badge variant="outline" className="animate-pulse">
                    $850 contributed
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="w-full h-32 bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-lg flex items-center justify-center border border-secondary/20">
                    <span className="text-secondary font-medium">Healthcare Initiative</span>
                  </div>
                  <h4 className="font-semibold">Mobile Health Clinic</h4>
                  <p className="text-sm text-muted-foreground">
                    Funded medical supplies and equipment for mobile clinics that served 500+ patients in underserved
                    areas, providing essential healthcare access.
                  </p>
                  <Badge variant="outline" className="animate-pulse">
                    $650 contributed
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <AuthGuard>
      <AnalyticsContent />
    </AuthGuard>
  )
}
