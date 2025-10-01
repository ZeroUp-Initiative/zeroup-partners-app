"use client"

import { AuthGuard, useAuth } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, LogOut, DollarSign, Calendar, FileText, CheckCircle, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"

function ContributionsContent() {
  const { user, logout } = useAuth()

  // Mock contribution data - replace with actual data fetching
  const contributions = [
    {
      id: "1",
      amount: 500,
      date: "2024-01-15",
      status: "verified",
      description: "Monthly contribution - January 2024",
      proofUrl: "/proof/jan-2024.pdf",
      verifiedDate: "2024-01-16",
    },
    {
      id: "2",
      amount: 500,
      date: "2024-02-15",
      status: "pending",
      description: "Monthly contribution - February 2024",
      proofUrl: "/proof/feb-2024.pdf",
      verifiedDate: null,
    },
    {
      id: "3",
      amount: 750,
      date: "2024-03-15",
      status: "verified",
      description: "Monthly contribution + bonus - March 2024",
      proofUrl: "/proof/mar-2024.pdf",
      verifiedDate: "2024-03-16",
    },
    {
      id: "4",
      amount: 500,
      date: "2024-04-15",
      status: "rejected",
      description: "Monthly contribution - April 2024",
      proofUrl: "/proof/apr-2024.pdf",
      verifiedDate: null,
      rejectionReason: "Proof of payment unclear. Please resubmit with clearer documentation.",
    },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="w-4 h-4 text-secondary" />
      case "pending":
        return <Clock className="w-4 h-4 text-accent" />
      case "rejected":
        return <AlertCircle className="w-4 h-4 text-destructive" />
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge variant="secondary">Verified</Badge>
      case "pending":
        return <Badge variant="outline">Pending</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const totalContributions = contributions.filter((c) => c.status === "verified").reduce((sum, c) => sum + c.amount, 0)

  const pendingAmount = contributions.filter((c) => c.status === "pending").reduce((sum, c) => sum + c.amount, 0)

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
                <h1 className="text-xl font-bold text-foreground">Contributions</h1>
                <p className="text-sm text-muted-foreground">Track and manage your contributions</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="glass-card hover-tilt group border-primary/20 hover:border-primary/40 transition-all duration-500 animate-fade-in">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Verified</CardTitle>
                <DollarSign className="h-4 w-4 text-primary group-hover:scale-110 transition-transform duration-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary animate-number-glow">
                  ${totalContributions.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across {contributions.filter((c) => c.status === "verified").length} contributions
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card hover-tilt group border-accent/20 hover:border-accent/40 transition-all duration-500 animate-fade-in delay-100">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                <Clock className="h-4 w-4 text-accent group-hover:scale-110 transition-transform duration-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent animate-number-glow">
                  ${pendingAmount.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {contributions.filter((c) => c.status === "pending").length} contributions pending
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card hover-tilt group border-secondary/20 hover:border-secondary/40 transition-all duration-500 animate-fade-in delay-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <Calendar className="h-4 w-4 text-secondary group-hover:scale-110 transition-transform duration-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-secondary animate-number-glow">$500</div>
                <p className="text-xs text-muted-foreground">Goal: $500 (100%)</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-between items-center animate-fade-in delay-300">
            <div>
              <h2 className="text-2xl font-bold text-balance">Contribution History</h2>
              <p className="text-muted-foreground">View and manage all your contributions</p>
            </div>
            <Button
              asChild
              className="glass-button hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-primary/25"
            >
              <Link href="/contributions/new">
                <Plus className="w-4 h-4 mr-2" />
                Log New Contribution
              </Link>
            </Button>
          </div>

          <Tabs defaultValue="all" className="space-y-6 animate-fade-in delay-400">
            <TabsList className="glass-card">
              <TabsTrigger value="all" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                All Contributions
              </TabsTrigger>
              <TabsTrigger
                value="verified"
                className="data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary"
              >
                Verified
              </TabsTrigger>
              <TabsTrigger value="pending" className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent">
                Pending
              </TabsTrigger>
              <TabsTrigger
                value="rejected"
                className="data-[state=active]:bg-destructive/20 data-[state=active]:text-destructive"
              >
                Rejected
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {contributions.map((contribution, index) => (
                <Card
                  key={contribution.id}
                  className={`glass-card hover-tilt transition-all duration-500 animate-fade-in border-primary/10 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                          {getStatusIcon(contribution.status)}
                        </div>
                        <div>
                          <h3 className="font-semibold">{contribution.description}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(contribution.date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                          {contribution.status === "rejected" && contribution.rejectionReason && (
                            <p className="text-sm text-destructive mt-1">{contribution.rejectionReason}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold animate-number-glow">${contribution.amount}</p>
                          {getStatusBadge(contribution.status)}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="glass-button hover:scale-105 transition-all duration-300 bg-transparent"
                        >
                          <Link href={contribution.proofUrl} target="_blank">
                            <FileText className="w-4 h-4 mr-2" />
                            View Proof
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="verified" className="space-y-4">
              {contributions
                .filter((c) => c.status === "verified")
                .map((contribution) => (
                  <Card key={contribution.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {getStatusIcon(contribution.status)}
                          <div>
                            <h3 className="font-semibold">{contribution.description}</h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(contribution.date).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                            {contribution.verifiedDate && (
                              <p className="text-sm text-secondary">
                                Verified on {new Date(contribution.verifiedDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-2xl font-bold">${contribution.amount}</p>
                            {getStatusBadge(contribution.status)}
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={contribution.proofUrl} target="_blank">
                              <FileText className="w-4 h-4 mr-2" />
                              View Proof
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              {contributions
                .filter((c) => c.status === "pending")
                .map((contribution) => (
                  <Card key={contribution.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {getStatusIcon(contribution.status)}
                          <div>
                            <h3 className="font-semibold">{contribution.description}</h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(contribution.date).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                            <p className="text-sm text-accent">Under review</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-2xl font-bold">${contribution.amount}</p>
                            {getStatusBadge(contribution.status)}
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={contribution.proofUrl} target="_blank">
                              <FileText className="w-4 h-4 mr-2" />
                              View Proof
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-4">
              {contributions
                .filter((c) => c.status === "rejected")
                .map((contribution) => (
                  <Card key={contribution.id} className="hover:shadow-md transition-shadow border-destructive/20">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {getStatusIcon(contribution.status)}
                          <div>
                            <h3 className="font-semibold">{contribution.description}</h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(contribution.date).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                            {contribution.rejectionReason && (
                              <p className="text-sm text-destructive mt-1">{contribution.rejectionReason}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-2xl font-bold">${contribution.amount}</p>
                            {getStatusBadge(contribution.status)}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={contribution.proofUrl} target="_blank">
                                <FileText className="w-4 h-4 mr-2" />
                                View Proof
                              </Link>
                            </Button>
                            <Button size="sm">Resubmit</Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

export default function ContributionsPage() {
  return (
    <AuthGuard>
      <ContributionsContent />
    </AuthGuard>
  )
}
