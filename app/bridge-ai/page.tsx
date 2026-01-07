"use client"

import ProtectedRoute from "@/components/auth/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Brain, LogOut, Cpu, Database, Network, Zap, Users, Code, Lightbulb, Rocket, Target, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { auth } from "@/lib/firebase/client"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"

function BridgeAIContent() {
  const { user } = useAuth()

  const logout = async () => {
    await auth.signOut()
  }

  // Mock Bridge AI data
  const aiProjects = [
    {
      id: "1",
      name: "AI Education Platform",
      description: "Developing AI-powered learning tools for underserved communities",
      status: "active",
      progress: 75,
      funding: 15000,
      target: 20000,
      contributors: 12,
      category: "Education",
    },
    {
      id: "2",
      name: "Healthcare AI Assistant",
      description: "Building diagnostic AI tools for rural healthcare centers",
      status: "active",
      progress: 60,
      funding: 25000,
      target: 40000,
      contributors: 18,
      category: "Healthcare",
    },
    {
      id: "3",
      name: "Environmental Monitoring AI",
      description: "AI system for tracking and predicting environmental changes",
      status: "completed",
      progress: 100,
      funding: 30000,
      target: 30000,
      contributors: 25,
      category: "Environment",
    },
  ]

  const aiMetrics = [
    { month: "Jan", contributions: 2500, projects: 2, impact: 85 },
    { month: "Feb", contributions: 3200, projects: 3, impact: 88 },
    { month: "Mar", contributions: 4100, projects: 3, impact: 92 },
    { month: "Apr", contributions: 3800, projects: 4, impact: 94 },
    { month: "May", contributions: 4500, projects: 4, impact: 96 },
    { month: "Jun", contributions: 5200, projects: 5, impact: 98 },
  ]

  const aiTechnologies = [
    { name: "Machine Learning", usage: 85, projects: 8 },
    { name: "Natural Language Processing", usage: 70, projects: 6 },
    { name: "Computer Vision", usage: 60, projects: 5 },
    { name: "Deep Learning", usage: 75, projects: 7 },
    { name: "Robotics", usage: 45, projects: 3 },
  ]

  const bridgeAIPartners = [
    {
      name: "Dr. Sarah Chen",
      role: "AI Research Lead",
      organization: "MIT AI Lab",
      contributions: 8500,
      projects: 5,
      avatar: "SC",
    },
    {
      name: "Marcus Johnson",
      role: "ML Engineer",
      organization: "Google AI",
      contributions: 7200,
      projects: 4,
      avatar: "MJ",
    },
    {
      name: "Elena Rodriguez",
      role: "Data Scientist",
      organization: "Stanford AI",
      contributions: 6800,
      projects: 6,
      avatar: "ER",
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-primary text-primary-foreground"
      case "completed":
        return "bg-secondary text-secondary-foreground"
      case "planning":
        return "bg-accent text-accent-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                  <span className="text-primary-foreground font-bold text-lg">Z</span>
                </div>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Bridge AI
                </h1>
                <p className="text-sm text-muted-foreground">AI-powered initiatives and partnerships</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-4">
                <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
                <Link href="/contributions" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contributions
                </Link>
                <Link href="/analytics" className="text-muted-foreground hover:text-foreground transition-colors">
                  Analytics
                </Link>
                <Link href="/community" className="text-muted-foreground hover:text-foreground transition-colors">
                  Community
                </Link>
              </nav>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user?.email?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium">{user?.email}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-balance flex items-center gap-3">
              <Brain className="w-8 h-8 text-primary" />
              Bridge AI Initiative
            </h2>
            <p className="text-muted-foreground">
              Dedicated space for AI partners to collaborate on cutting-edge projects that bridge technology and social
              impact.
            </p>
          </div>

          {/* AI Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Projects Funded</CardTitle>
                <Rocket className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">15</div>
                <p className="text-xs text-muted-foreground">3 active, 12 completed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Contributions</CardTitle>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$28.3K</div>
                <p className="text-xs text-muted-foreground">+22% this quarter</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Partners</CardTitle>
                <Network className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">47</div>
                <p className="text-xs text-muted-foreground">Researchers & engineers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Impact Multiplier</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3.2x</div>
                <p className="text-xs text-muted-foreground">AI efficiency gain</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="projects" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="projects">AI Projects</TabsTrigger>
              <TabsTrigger value="analytics">AI Analytics</TabsTrigger>
              <TabsTrigger value="technologies">Technologies</TabsTrigger>
              <TabsTrigger value="partners">AI Partners</TabsTrigger>
            </TabsList>

            <TabsContent value="projects" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Projects */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Active AI Projects</CardTitle>
                      <CardDescription>Current initiatives driving AI for social good</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {aiProjects.map((project) => (
                          <div key={project.id} className="border rounded-lg p-6 space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                  <h3 className="text-lg font-semibold">{project.name}</h3>
                                  <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                                </div>
                                <p className="text-muted-foreground">{project.description}</p>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    {project.contributors} contributors
                                  </span>
                                  <Badge variant="outline">{project.category}</Badge>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span>Funding Progress</span>
                                <span>
                                  ${project.funding.toLocaleString()} / ${project.target.toLocaleString()}
                                </span>
                              </div>
                              <Progress value={project.progress} className="h-2" />
                              <p className="text-xs text-muted-foreground">{project.progress}% complete</p>
                            </div>

                            <div className="flex gap-2">
                              <Button size="sm">View Details</Button>
                              <Button size="sm" variant="outline">
                                Contribute
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AI Contributions Trend */}
                <Card>
                  <CardHeader>
                    <CardTitle>AI Contributions Trend</CardTitle>
                    <CardDescription>Monthly AI project funding over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={aiMetrics}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`$${value}`, "Contributions"]} />
                        <Area
                          type="monotone"
                          dataKey="contributions"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* AI Impact Score */}
                <Card>
                  <CardHeader>
                    <CardTitle>AI Impact Score</CardTitle>
                    <CardDescription>Measuring AI project effectiveness</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={aiMetrics}>
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

            <TabsContent value="technologies" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Technology Usage */}
                <Card>
                  <CardHeader>
                    <CardTitle>AI Technology Stack</CardTitle>
                    <CardDescription>Technologies used across Bridge AI projects</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={aiTechnologies} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis dataKey="name" type="category" width={120} />
                        <Tooltip formatter={(value) => [`${value}%`, "Usage"]} />
                        <Bar dataKey="usage" fill="hsl(var(--primary))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Technology Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Technology Breakdown</CardTitle>
                    <CardDescription>Detailed view of AI technologies in use</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {aiTechnologies.map((tech, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Code className="w-4 h-4 text-primary" />
                              <span className="font-medium">{tech.name}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">{tech.projects} projects</div>
                          </div>
                          <Progress value={tech.usage} className="h-2" />
                          <p className="text-xs text-muted-foreground">{tech.usage}% adoption rate</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="partners" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top AI Partners */}
                <Card>
                  <CardHeader>
                    <CardTitle>Leading AI Partners</CardTitle>
                    <CardDescription>Top contributors to Bridge AI initiatives</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {bridgeAIPartners.map((partner, index) => (
                        <div key={index} className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {partner.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-semibold">{partner.name}</h4>
                            <p className="text-sm text-muted-foreground">{partner.role}</p>
                            <p className="text-xs text-muted-foreground">{partner.organization}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">${partner.contributions.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">{partner.projects} projects</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* AI Partnership Opportunities */}
                <Card>
                  <CardHeader>
                    <CardTitle>Partnership Opportunities</CardTitle>
                    <CardDescription>Ways to get involved with Bridge AI</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg">
                        <Lightbulb className="w-8 h-8 text-primary" />
                        <div>
                          <h4 className="font-semibold">Research Collaboration</h4>
                          <p className="text-sm text-muted-foreground">
                            Partner with leading AI researchers on breakthrough projects
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-4 bg-secondary/10 rounded-lg">
                        <Database className="w-8 h-8 text-secondary" />
                        <div>
                          <h4 className="font-semibold">Data Contribution</h4>
                          <p className="text-sm text-muted-foreground">
                            Provide datasets to train AI models for social good
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-4 bg-accent/10 rounded-lg">
                        <Target className="w-8 h-8 text-accent" />
                        <div>
                          <h4 className="font-semibold">Project Funding</h4>
                          <p className="text-sm text-muted-foreground">
                            Fund specific AI initiatives aligned with your mission
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Call to Action */}
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <Brain className="w-8 h-8 text-primary" />
                  <h3 className="text-2xl font-bold">Join Bridge AI</h3>
                </div>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Be part of the next generation of AI-powered social impact. Connect with researchers, fund
                  breakthrough projects, and help build AI solutions that benefit humanity.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button size="lg">
                    <Rocket className="w-4 h-4 mr-2" />
                    Start AI Project
                  </Button>
                  <Button size="lg" variant="outline">
                    <Users className="w-4 h-4 mr-2" />
                    Connect with Partners
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default function BridgeAIPage() {
  return (
    <ProtectedRoute>
      <BridgeAIContent />
    </ProtectedRoute>
  )
}
