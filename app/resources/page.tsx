"use client"

import ProtectedRoute from "@/components/auth/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { BookOpen, LogOut, FileText, Video, Download, Search, Calendar, Eye, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { auth } from "@/lib/firebase/client"

function ResourcesContent() {
  const { user } = useAuth()

  const logout = async () => {
    await auth.signOut()
  }

  // Mock resources data
  const reports = [
    {
      id: "1",
      title: "Q1 2024 Impact Report",
      description:
        "Comprehensive overview of partner contributions and their real-world impact across all initiatives.",
      type: "Impact Report",
      date: "March 2024",
      downloads: 1247,
      size: "2.4 MB",
      featured: true,
    },
    {
      id: "2",
      title: "Bridge AI Progress Update",
      description: "Latest developments in AI-powered social impact projects and partner contributions.",
      type: "Progress Report",
      date: "February 2024",
      downloads: 892,
      size: "1.8 MB",
      featured: false,
    },
    {
      id: "3",
      title: "Partner Success Stories",
      description:
        "Inspiring stories from our community showcasing how individual contributions create lasting change.",
      type: "Case Studies",
      date: "January 2024",
      downloads: 1456,
      size: "3.2 MB",
      featured: true,
    },
  ]

  const videos = [
    {
      id: "1",
      title: "ZeroUp Initiative Overview",
      description: "Learn about our mission, vision, and how partners are driving meaningful change worldwide.",
      duration: "8:45",
      views: 12500,
      thumbnail: "/zeroup-initiative-video-thumbnail.jpg",
    },
    {
      id: "2",
      title: "How to Maximize Your Impact",
      description: "Best practices for partners to increase their contribution effectiveness and community engagement.",
      duration: "12:30",
      views: 8900,
      thumbnail: "/impact-maximization-tutorial.jpg",
    },
    {
      id: "3",
      title: "Bridge AI Explained",
      description: "Deep dive into our AI initiatives and how technology is amplifying social impact.",
      duration: "15:20",
      views: 6700,
      thumbnail: "/ai-technology-social-impact.jpg",
    },
  ]

  const guides = [
    {
      id: "1",
      title: "Getting Started Guide",
      description: "Complete walkthrough for new partners joining the ZeroUp Initiative.",
      category: "Onboarding",
      readTime: "10 min",
    },
    {
      id: "2",
      title: "Contribution Best Practices",
      description: "Tips and strategies to make the most impact with your monthly contributions.",
      category: "Contributions",
      readTime: "7 min",
    },
    {
      id: "3",
      title: "Community Engagement Guide",
      description: "How to connect with other partners and participate in community initiatives.",
      category: "Community",
      readTime: "5 min",
    },
    {
      id: "4",
      title: "Understanding Impact Metrics",
      description: "Learn how we measure and report on the effectiveness of your contributions.",
      category: "Analytics",
      readTime: "12 min",
    },
  ]

  const updates = [
    {
      id: "1",
      title: "New Dashboard Features Released",
      content:
        "We've added enhanced analytics and improved contribution tracking to help you better understand your impact.",
      date: "2 days ago",
      type: "Feature Update",
    },
    {
      id: "2",
      title: "Bridge AI Milestone Reached",
      content: "Our AI initiatives have successfully funded 15 projects, directly impacting over 10,000 beneficiaries.",
      date: "1 week ago",
      type: "Milestone",
    },
    {
      id: "3",
      title: "Community Reaches 2,500 Partners",
      content:
        "We're thrilled to announce that our partner community has grown to 2,500 active contributors worldwide.",
      date: "2 weeks ago",
      type: "Community",
    },
  ]

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
                  <BookOpen className="w-5 h-5" />
                  Resource Center
                </h1>
                <p className="text-sm text-muted-foreground">Reports, guides, and updates for partners</p>
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
          <div className="space-y-4">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-balance">Resource Center</h2>
              <p className="text-muted-foreground">
                Access reports, guides, videos, and updates to maximize your impact as a ZeroUp partner.
              </p>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search resources..." className="pl-10" />
            </div>
          </div>

          {/* Resource Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reports</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reports.length}</div>
                <p className="text-xs text-muted-foreground">Impact & progress reports</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Videos</CardTitle>
                <Video className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{videos.length}</div>
                <p className="text-xs text-muted-foreground">Educational content</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Guides</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{guides.length}</div>
                <p className="text-xs text-muted-foreground">How-to guides</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Updates</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{updates.length}</div>
                <p className="text-xs text-muted-foreground">Recent updates</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="reports" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="videos">Videos</TabsTrigger>
              <TabsTrigger value="guides">Guides</TabsTrigger>
              <TabsTrigger value="updates">Updates</TabsTrigger>
            </TabsList>

            <TabsContent value="reports" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {reports.map((report) => (
                  <Card key={report.id} className={report.featured ? "border-primary/50 bg-primary/5" : ""}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{report.title}</CardTitle>
                            {report.featured && <Badge variant="secondary">Featured</Badge>}
                          </div>
                          <CardDescription>{report.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <Badge variant="outline">{report.type}</Badge>
                            <span>{report.date}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Download className="w-4 h-4" />
                              {report.downloads}
                            </span>
                            <span>{report.size}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4 mr-2" />
                            Preview
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="videos" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {videos.map((video) => (
                  <Card key={video.id} className="overflow-hidden">
                    <div className="aspect-video bg-muted relative">
                      <img
                        src={video.thumbnail || "/placeholder.svg"}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <Button size="lg" className="rounded-full w-16 h-16">
                          <Video className="w-6 h-6" />
                        </Button>
                      </div>
                      <Badge className="absolute top-2 right-2 bg-black/70 text-white">{video.duration}</Badge>
                    </div>
                    <CardHeader>
                      <CardTitle className="text-lg">{video.title}</CardTitle>
                      <CardDescription>{video.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {video.views.toLocaleString()} views
                        </span>
                        <Button size="sm" variant="outline">
                          Watch Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="guides" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {guides.map((guide) => (
                  <Card key={guide.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <CardTitle className="text-lg">{guide.title}</CardTitle>
                          <CardDescription>{guide.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{guide.category}</Badge>
                          <span className="text-sm text-muted-foreground">{guide.readTime} read</span>
                        </div>
                        <Button size="sm" variant="outline">
                          Read Guide
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="updates" className="space-y-6">
              <div className="space-y-4">
                {updates.map((update) => (
                  <Card key={update.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{update.title}</h3>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{update.type}</Badge>
                              <span className="text-sm text-muted-foreground">{update.date}</span>
                            </div>
                          </div>
                          <p className="text-muted-foreground">{update.content}</p>
                          <Button size="sm" variant="ghost">
                            Read More
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

export default function ResourcesPage() {
  return (
    <ProtectedRoute>
      <ResourcesContent />
    </ProtectedRoute>
  )
}
