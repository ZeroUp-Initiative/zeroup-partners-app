'use client'

import ProtectedRoute from "@/components/auth/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GradientCard } from "@/components/ui/gradient-card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Target, Award, Calendar, LucidePieChart, Activity, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Header from "@/components/layout/header"
import { db } from "@/lib/firebase/client"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { useState, useEffect } from "react"
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
  const { user } = useAuth()

  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [impactData, setImpactData] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalImpact: 0,
    projectsSupported: 0,
    consistency: "0/0",
    impactScore: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const q = query(collection(db, "payments"), where("userId", "==", user.uid), where("status", "==", "approved"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const payments: any[] = []
        snapshot.forEach(doc => payments.push({ id: doc.id, ...doc.data() }))

        // 1. Total Impact (Sum of amount)
        const totalImpact = payments.reduce((sum, p) => sum + (p.amount || 0), 0)

        // 2. Projects Supported (Unique projectIds)
        const uniqueProjects = new Set(payments.filter(p => p.projectId).map(p => p.projectId))
        const projectsSupported = uniqueProjects.size

        // 3. Consistency (Months active logic) - simplified
        const monthsActive = new Set(payments.map(p => {
             const d = p.date?.toDate ? p.date.toDate() : new Date(p.date || Date.now())
             return `${d.getMonth()}-${d.getFullYear()}`
        })).size
        const currentMonth = new Date().getMonth() + 1 // roughly
        const consistency = `${monthsActive}/${currentMonth > 6 ? 12 : 6}` // Mock target

        // 4. Impact Score (Mock calc based on amount)
        const impactScore = Math.min(100, Math.floor(totalImpact / 500) + 10)

        setStats({
            totalImpact,
            projectsSupported,
            consistency,
            impactScore
        })

        // 5. Monthly Data (Last 6 months)
        const monthMap = new Map<string, number>()
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        
        payments.forEach(p => {
             const d = p.date?.toDate ? p.date.toDate() : new Date(p.date || Date.now())
             const monthName = months[d.getMonth()]
             monthMap.set(monthName, (monthMap.get(monthName) || 0) + p.amount)
        })

        // Fill in last 6 months data for chart
        const currentMonthIdx = new Date().getMonth()
        const chartData = []
        for (let i = 5; i >= 0; i--) {
            const idx = (currentMonthIdx - i + 12) % 12
            const m = months[idx]
            chartData.push({
                month: m,
                contributions: monthMap.get(m) || 0,
                goal: 5000, // Static goal for visualization
                impact: 80 + Math.random() * 15 // Mock variation
            })
        }
        setMonthlyData(chartData)

        // 6. Impact Data (Category)
        // Since we don't have categories, we'll split by Project vs General
        const projectTotal = payments.filter(p => p.projectId).reduce((s, p) => s + p.amount, 0)
        const generalTotal = totalImpact - projectTotal
        
        let pPercent = totalImpact > 0 ? Math.round((projectTotal / totalImpact) * 100) : 0
        let gPercent = totalImpact > 0 ? Math.round((generalTotal / totalImpact) * 100) : 0
        
        setImpactData([
            { category: "Focused Projects", value: pPercent, color: "hsl(var(--primary))" },
            { category: "General Fund", value: gPercent, color: "hsl(var(--secondary))" }
        ])
        
        setLoading(false)
    })

    return () => unsubscribe()
  }, [user])

  // Mock for yearly goals visualization since we don't have goal setting feature yet
  const yearlyGoals = [
    { goal: "Monthly Consistency", progress: stats.totalImpact > 0 ? 85 : 0, target: 100 },
    { goal: "Annual Target", progress: Math.min(100, Math.round((stats.totalImpact / 100000) * 100)), target: 100 },
    { goal: "Impact Score", progress: stats.impactScore, target: 100 },
    { goal: "Community Engagement", progress: 78, target: 100 },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <Header title="Analytics" subtitle="Track your impact and performance" />

      <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
        <div className="space-y-8">
          <div className="space-y-2 animate-fade-in">
            <h2 className="text-3xl font-bold text-balance">Your Impact Analytics</h2>
            <p className="text-muted-foreground">
              Comprehensive insights into your contributions and their real-world impact.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <GradientCard
              variant="emerald"
              title="Total Impact"
              icon={<LucidePieChart className="h-5 w-5" />}
              value={`₦${loading ? "..." : stats.totalImpact.toLocaleString()}`}
              subtitle="+ from last month"
              className="animate-fade-in"
            />

            <GradientCard
              variant="purple"
              title="Projects Supported"
              icon={<Target className="h-5 w-5" />}
              value={loading ? "..." : stats.projectsSupported}
              subtitle="Specific initiatives"
              className="animate-fade-in delay-100"
            />

            <GradientCard
              variant="cyan"
              title="Impact Score"
              icon={<Activity className="h-5 w-5" />}
              value={loading ? "..." : stats.impactScore}
              subtitle="Partner Tier"
              className="animate-fade-in delay-200"
            />

            <GradientCard
              variant="amber"
              title="Consistency"
              icon={<Calendar className="h-5 w-5" />}
              value={loading ? "..." : stats.consistency}
              subtitle="Months active"
              className="animate-fade-in delay-300"
            />
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
                <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/25 hover:-translate-y-1">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
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
                        <Tooltip formatter={(value) => [`₦${value}`, "Amount"]} />
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

                <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/25 hover:-translate-y-1">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-400" />
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
                <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/25 hover:-translate-y-1">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-400" />
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

                <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-1">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-400" />
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
                            ₦{Math.round((item.value / 100) * stats.totalImpact).toLocaleString()} contributed
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
                <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/25 hover:-translate-y-1">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-400" />
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

                <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-rose-500/25 hover:-translate-y-1">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-pink-400" />
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
                          <p className-="font-medium">Impact Leader</p>
                          <p className="text-sm text-muted-foreground">Top 10% impact score</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          <Card className="relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/25 hover:-translate-y-1 animate-fade-in delay-500">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
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
                    ₦850 contributed
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div className="w-full h-32 bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-lg flex items-center justify-center border border-secondary/20">
                    <span className="text-secondary font-medium">Healthcare Initiative</span>
                  </div>
                  <h4 className="font-semibold">Mobile Health Clinic</h4>
                  <p className="text-sm text-muted-foreground">
                    Funded medical supplies and equipment for mobile clinics that.tsx served 500+ patients in underserved
                    areas, providing essential healthcare access.
                  </p>
                  <Badge variant="outline" className="animate-pulse">
                    ₦650 contributed
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
    <ProtectedRoute>
      <AnalyticsContent />
    </ProtectedRoute>
  )
}
