'use client'

import ProtectedRoute from "@/components/auth/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { auth, db } from "@/lib/firebase/client"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Trophy, Medal, Award, LogOut, Search, Users, TrendingUp, Crown, Star, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Header from "@/components/layout/header"

function CommunityContent() {
  const { user } = useAuth()

  const logout = async () => {
    await auth.signOut()
  }

  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [topContributors, setTopContributors] = useState<any[]>([])
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [topPartnerOfTheMonth, setTopPartnerOfTheMonth] = useState<{name: string, amount: number, id: string} | null>(null)
  const [stats, setStats] = useState({
    totalPartners: 0,
    activeThisMonth: 0,
    totalRaised: 0,
    userRank: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = () => {
        // Real-time listener for users to build leaderboard and stats
        const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
             const users: any[] = []
             snapshot.forEach(doc => users.push({ id: doc.id, ...doc.data() }))
             
             // Calculate stats
             const totalPartners = users.length
             
             // For leaderboard, we ideally need aggregated contribution data. 
             // Since we don't have a 'totalContributions' field on users updated via functions yet, 
             // we might need to fetch payments. But for MVP let's assume we might update user doc or just use what we have.
             // BETTER APPROACH for MVP: Fetch all payments to calculate totals.
        })

        // Fetching payments to calculate everything dynamically
        const unsubPayments = onSnapshot(query(collection(db, "payments"), where("status", "==", "approved")), (snapshot) => {
            const payments: any[] = []
            snapshot.forEach(doc => payments.push({ id: doc.id, ...doc.data() }))

            // 1. Total Raised
            const totalRaised = payments.reduce((sum, p) => sum + (p.amount || 0), 0)

            // 2. Calculate Partner of the Month
            const monthlyContributions: Record<string, { amount: number, name: string }> = {};
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            payments.forEach(p => {
                // Check for monthly top partner
                let paymentDate = null;
                if (p.date && typeof p.date.toDate === 'function') {
                   paymentDate = p.date.toDate();
                } else if (p.createdAt && typeof p.createdAt.toDate === 'function') {
                   paymentDate = p.createdAt.toDate();
                } else if (p.date instanceof Date) {
                   paymentDate = p.date;
                } else if (p.createdAt instanceof Date) {
                   paymentDate = p.createdAt;
                }

                if (paymentDate) {
                  const paymentMonth = paymentDate.getMonth();
                  const paymentYear = paymentDate.getFullYear();
                  
                  if (paymentMonth === currentMonth && paymentYear === currentYear) {
                     if (p.userId) {
                        if (!monthlyContributions[p.userId]) {
                            monthlyContributions[p.userId] = { amount: 0, name: p.userFullName || 'Unknown User' };
                        }
                        monthlyContributions[p.userId].amount += p.amount;
                        if (p.userFullName) monthlyContributions[p.userId].name = p.userFullName;
                     }
                  }
                }
            });

            // Find top monthly partner
            let max = 0;
            let top: {id: string, amount: number, name: string} | null = null;
            Object.entries(monthlyContributions).forEach(([id, p]) => {
                if (p.amount > max) {
                    max = p.amount;
                    top = { id, ...p };
                }
            });
            setTopPartnerOfTheMonth(top);

            // 3. Aggregating User Contributions
            const userMap = new Map<string, number>()
            const activeUsersThisMonth = new Set<string>()
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

            payments.forEach(p => {
                const amount = p.amount || 0
                const uid = p.userId
                userMap.set(uid, (userMap.get(uid) || 0) + amount)
                
                // Date check for active users
                let pDate = new Date()
                 if (p.date && typeof p.date.toDate === 'function') {
                    pDate = p.date.toDate();
                } else if (p.createdAt && typeof p.createdAt.toDate === 'function') {
                    pDate = p.createdAt.toDate();
                }
                
                if (pDate >= startOfMonth) {
                    activeUsersThisMonth.add(uid)
                }
            })

            // 3. Leaderboard Construction
            const leaderboardData = Array.from(userMap.entries()).map(([uid, total]) => {
                // We need user details. In a real app we'd join this. 
                // For this client-side demo, we'll try to match with the user object if possible, 
                // or we rely on the payment doc having userFullName as saved in our contribution logic.
                const payment = payments.find(p => p.userId === uid)
                const isCurrentUser = uid === user?.uid
                
                // For current user, use their name from auth context
                let displayName = payment?.userFullName || "Partner"
                if (isCurrentUser && user?.firstName && user?.lastName) {
                    displayName = `${user.firstName} ${user.lastName}`
                } else if (isCurrentUser && user?.displayName) {
                    displayName = user.displayName
                }
                
                return {
                    name: displayName,
                    organization: "Individual Partner", // customizable if we fethed users
                    totalContributions: total,
                    impactScore: Math.min(100, Math.floor(total / 1000)), // dynamic calc
                    badges: Math.floor(total / 5000), // dynamic calc
                    avatar: displayName.charAt(0).toUpperCase(),
                    userId: uid,
                    isCurrentUser,
                    photoURL: isCurrentUser ? user?.photoURL : null // Show current user's photo
                }
            }).sort((a, b) => b.totalContributions - a.totalContributions)
              .map((item, index) => ({ ...item, rank: index + 1 }))
            
            setLeaderboard(leaderboardData.slice(0, 10)) // Top 10

            // 4. User Rank
            const myRankItem = leaderboardData.find(i => i.userId === user?.uid)
            const userRank = myRankItem ? myRankItem.rank : 0

            // 5. Recent Activities (Just taking latest 5 payments)
            const sortedPayments = [...payments].sort((a,b) => {
                 let dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date)
                 let dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date)
                 return dateB.getTime() - dateA.getTime()
            })
            
            const activities = sortedPayments.slice(0, 5).map(p => {
                 let pDate = p.date?.toDate ? p.date.toDate() : new Date(p.date)
                 // Simple relative time format
                 const diff = Math.floor((now.getTime() - pDate.getTime()) / (1000 * 60 * 60))
                 const timeStr = diff < 1 ? "Just now" : diff < 24 ? `${diff} hours ago` : `${Math.floor(diff/24)} days ago`
                 
                 return {
                    user: p.userFullName || "Partner",
                    action: `contributed ₦${p.amount.toLocaleString()}`,
                    time: timeStr,
                    type: "contribution"
                 }
            })
            setRecentActivities(activities)

             // 6. Top Contributors (Same as leaderboard for now but maybe filtered)
            const topCons = leaderboardData.slice(0, 3).map(i => ({
                name: i.name,
                amount: i.totalContributions,
                period: "All time"
            }))
            setTopContributors(topCons)

            // Update stats
            setStats(prev => ({
                ...prev,
                totalRaised,
                activeThisMonth: activeUsersThisMonth.size,
                userRank
            }))
        })
        
        // Listener for total partners count
        const unsubPartners = onSnapshot(collection(db, "users"), (snapshot) => {
             setStats(prev => ({ ...prev, totalPartners: snapshot.size }))
             setLoading(false)
        })

        return () => {
            unsubPayments()
            unsubPartners()
        }
    }

    if (user) {
        return fetchData()
    }
  }, [user])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />
      default:
        return (
          <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">
            #{rank}
          </span>
        )
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title="Community" subtitle="Connect with fellow partners" />

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
            <h2 className="text-3xl font-bold text-balance">Partner Community</h2>
            <p className="text-muted-foreground">
              Connect with other partners, celebrate achievements, and see who's making the biggest impact.
            </p>
          </div>

          {/* Community Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Partners</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : stats.totalPartners.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Growing community</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active This Month</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : stats.activeThisMonth.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Partners contributing</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{loading ? "..." : stats.totalRaised.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Your Rank</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">#{loading ? "..." : stats.userRank > 0 ? stats.userRank : "-"}</div>
                <p className="text-xs text-muted-foreground">Based on contributions</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="leaderboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="leaderboard" className="text-xs sm:text-sm">Leaderboard</TabsTrigger>
              <TabsTrigger value="activity" className="text-xs sm:text-sm">Activity</TabsTrigger>
              <TabsTrigger value="recognition" className="text-xs sm:text-sm">Recognition</TabsTrigger>
            </TabsList>

            <TabsContent value="leaderboard" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Leaderboard */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Partner Leaderboard</CardTitle>
                          <CardDescription>Top contributors making the biggest impact</CardDescription>
                        </div>
                        <div className="relative hidden sm:block">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input placeholder="Search partners..." className="pl-10 w-full sm:w-48 md:w-64" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {leaderboard.map((partner) => (
                          <div
                            key={partner.rank}
                            className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                              partner.isCurrentUser
                                ? "bg-primary/10 border border-primary/20"
                                : "bg-muted/50 hover:bg-muted/70"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {getRankIcon(partner.rank)}
                              <Avatar className="w-10 h-10">
                                {partner.photoURL && (
                                  <AvatarImage src={partner.photoURL} alt={partner.name} />
                                )}
                                <AvatarFallback
                                  className={partner.isCurrentUser ? "bg-primary text-primary-foreground" : ""}
                                >
                                  {partner.avatar}
                                </AvatarFallback>
                              </Avatar>
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">{partner.name}</p>
                                {partner.isCurrentUser && <Badge variant="secondary">You</Badge>}
                              </div>
                              <p className="text-sm text-muted-foreground">{partner.organization}</p>
                            </div>

                            <div className="text-right space-y-1">
                              <p className="font-bold">₦{partner.totalContributions.toLocaleString()}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Score: {partner.impactScore}</span>
                                <Badge variant="outline" className="text-xs">
                                  {partner.badges} badges
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Contributors Sidebar */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Contributors</CardTitle>
                      <CardDescription>Leading partners by period</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {topContributors.map((contributor, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{contributor.name}</p>
                              <p className="text-sm text-muted-foreground">{contributor.period}</p>
                            </div>
                            <p className="font-bold">₦{contributor.amount.toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Your Progress</CardTitle>
                      <CardDescription>How you're doing this month</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span>Monthly Goal</span>
                          <span className="font-bold">85%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Rank Change</span>
                          <Badge variant="secondary">+2</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Impact Score</span>
                          <span className="font-bold">94</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Community Activity</CardTitle>
                  <CardDescription>Recent achievements and contributions from the community</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            activity.type === "achievement"
                              ? "bg-secondary"
                              : activity.type === "contribution"
                                ? "bg-primary"
                                : activity.type === "milestone"
                                  ? "bg-accent"
                                  : "bg-muted-foreground"
                          }`}
                        ></div>
                        <div className="flex-1">
                          <p>
                            <span className="font-medium">{activity.user}</span> {activity.action}
                          </p>
                          <p className="text-sm text-muted-foreground">{activity.time}</p>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {activity.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recognition" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Partner of the Month</CardTitle>
                    <CardDescription>Celebrating outstanding contributions for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {topPartnerOfTheMonth ? (
                      <div className="text-center space-y-4">
                        <Avatar className="w-20 h-20 mx-auto">
                          {topPartnerOfTheMonth.id === user?.uid && user?.photoURL && (
                            <AvatarImage src={user.photoURL} alt={topPartnerOfTheMonth.name} />
                          )}
                          <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                            {topPartnerOfTheMonth.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-xl font-bold">{topPartnerOfTheMonth.name}</h3>
                          <p className="text-muted-foreground">Top Contributor</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm">
                            {topPartnerOfTheMonth.name}'s exceptional dedication and ₦{topPartnerOfTheMonth.amount.toLocaleString()} contribution this month helped fund important projects and make a significant impact in our community.
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            <Trophy className="w-3 h-3 mr-1" />
                            Partner of the Month
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">No contributions yet this month.</p>
                        <p className="text-sm text-muted-foreground">Be the first to be recognized!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Achievements</CardTitle>
                    <CardDescription>Community milestones and badges</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
                        <Award className="w-8 h-8 text-secondary" />
                        <div>
                          <p className="font-medium">$1M Milestone Reached!</p>
                          <p className="text-sm text-muted-foreground">Community total contributions</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
                        <Users className="w-8 h-8 text-primary" />
                        <div>
                          <p className="font-medium">2,500 Partners Strong</p>
                          <p className="text-sm text-muted-foreground">Growing community</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-accent/10 rounded-lg">
                        <TrendingUp className="w-8 h-8 text-accent" />
                        <div>
                          <p className="font-medium">150 Projects Funded</p>
                          <p className="text-sm text-muted-foreground">Real impact achieved</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

export default function CommunityPage() {
  return (
    <ProtectedRoute>
      <CommunityContent />
    </ProtectedRoute>
  )
}
