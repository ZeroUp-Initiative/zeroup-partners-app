'use client'

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase/client"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import ProtectedRoute from "@/components/auth/protected-route"
import Header from "@/components/layout/header"
import { LogContributionModal } from "@/components/contributions/log-contribution-modal"

// UI Components
// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Target, TrendingUp, Award, Plus, BarChart, Users, Heart, Trophy, Medal, Star, Receipt } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

function DashboardPage() {
  const { user } = useAuth()
  const [totalContributions, setTotalContributions] = useState(0);
  const [myContributions, setMyContributions] = useState(0);
  const [topPartner, setTopPartner] = useState<{name: string, amount: number, id: string} | null>(null);
  const [otherTopContributors, setOtherTopContributors] = useState<{name: string, amount: number, id: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Listener for all approved contributions
      const paymentsQuery = query(collection(db, "payments"), where("status", "==", "approved"));
      const unsubscribeTotal = onSnapshot(paymentsQuery, (snapshot) => {
        let total = 0;
        const monthlyContributions: Record<string, { amount: number, name: string }> = {};
        const allTimeContributions: Record<string, { amount: number, name: string }> = {};
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        snapshot.forEach((doc) => {
          const data = doc.data();
          total += data.amount;

          // Check for monthly top partner
          let paymentDate = null;
          if (data.date && typeof data.date.toDate === 'function') {
             paymentDate = data.date.toDate();
          } else if (data.createdAt && typeof data.createdAt.toDate === 'function') {
             paymentDate = data.createdAt.toDate(); // Fallback to createdAt
          }

          if (paymentDate && paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
             if (data.userId) {
                if (!monthlyContributions[data.userId]) {
                    monthlyContributions[data.userId] = { amount: 0, name: data.userFullName || 'Unknown User' };
                }
                monthlyContributions[data.userId].amount += data.amount;
                if (data.userFullName) monthlyContributions[data.userId].name = data.userFullName;
             }
          }

          // Collect all-time contributions for other top contributors
          if (data.userId) {
            if (!allTimeContributions[data.userId]) {
                allTimeContributions[data.userId] = { amount: 0, name: data.userFullName || 'Unknown User' };
            }
            allTimeContributions[data.userId].amount += data.amount;
            if (data.userFullName) allTimeContributions[data.userId].name = data.userFullName;
          }
        });
        setTotalContributions(total);

        // Find top monthly partner
        let max = 0;
        let top: {id: string, amount: number, name: string} | null = null;
        Object.entries(monthlyContributions).forEach(([id, p]) => {
            if (p.amount > max) {
                max = p.amount;
                top = { id, ...p };
            }
        });
        setTopPartner(top);

        // Find other top contributors (all-time, excluding current top partner)
        const sortedContributors = Object.entries(allTimeContributions)
            .map(([id, p]) => ({ id, ...p }))
            .sort((a, b) => b.amount - a.amount)
            .filter(contributor => contributor.id !== top?.id) // Exclude current top partner
            .slice(0, 5); // Get top 5 others
        
        setOtherTopContributors(sortedContributors);

        setIsLoading(false); // Set loading to false once we have the data
      });

      // Listener for the current user's contributions
      const myPaymentsQuery = query(
        collection(db, "payments"), 
        where("userId", "==", user.uid),
        where("status", "==", "approved")
      );
      const unsubscribeMine = onSnapshot(myPaymentsQuery, (snapshot) => {
        let myTotal = 0;
        snapshot.forEach((doc) => {
          myTotal += doc.data().amount;
        });
        setMyContributions(myTotal);
      });

      // Cleanup listeners on component unmount
      return () => {
        unsubscribeTotal();
        unsubscribeMine();
      };
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <Header title="Partners Hub" subtitle="Partner Dashboard" />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
          <div className="flex-1 space-y-6">
              {/* Welcome Header */}
              <div className="flex items-center justify-between space-y-2 mb-8">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">
                    {(() => {
                      const hour = new Date().getHours();
                      if (hour < 12) return "Good morning";
                      if (hour < 18) return "Good afternoon";
                      return "Good evening";
                    })()}, {user?.firstName || user?.displayName?.split(' ')[0] || "Partner"}!
                  </h2>
                  <p className="text-muted-foreground">
                    Track your contributions and see the impact you're making through the ZeroUp Initiative.
                  </p>
                </div>
              </div>

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="recognition">Recognition</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                  {/* Grid of Stat Cards */}
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Contributions</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{isLoading ? '...' : `₦${totalContributions.toLocaleString()}`}</div>
                        <p className="text-xs text-muted-foreground">Live total of all partner funds</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">My Contributions</CardTitle>
                        <Heart className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{isLoading ? '...' : `₦${myContributions.toLocaleString()}`}</div>
                        <p className="text-xs text-muted-foreground">Your personal impact</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Impact Score</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">Coming Soon</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">Coming Soon</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Grid of Action Cards */}
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <LogContributionModal>
                        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                            <CardHeader className="flex flex-row items-center gap-4">
                                <div className="bg-primary/10 p-3 rounded-md">
                                    <Plus className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle>Log a New Contribution</CardTitle>
                                    <CardDescription>Submit your monthly support.</CardDescription>
                                </div>
                            </CardHeader>
                        </Card>
                    </LogContributionModal>
                    <Link href="/projects">
                        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                            <CardHeader className="flex flex-row items-center gap-4">
                                <div className="bg-primary/10 p-3 rounded-md">
                                    <BarChart className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle>Fund a Project</CardTitle>
                                    <CardDescription>Direct your funds to a specific cause.</CardDescription>
                                </div>
                            </CardHeader>
                        </Card>
                    </Link>
                    <Link href="/dashboard/transactions">
                        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                            <CardHeader className="flex flex-row items-center gap-4">
                                <div className="bg-blue-500/10 p-3 rounded-md">
                                    <Receipt className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <CardTitle>All Transactions</CardTitle>
                                    <CardDescription>View pending and completed transactions.</CardDescription>
                                </div>
                            </CardHeader>
                        </Card>
                    </Link>
                  </div>
              </TabsContent>

              <TabsContent value="recognition" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                    <Card className="col-span-1 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-200 dark:border-yellow-900">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-2xl text-yellow-600 dark:text-yellow-500">
                                <Trophy className="h-8 w-8" />
                                Partner of the Month
                            </CardTitle>
                            <CardDescription>
                                Recognizing the highest contributor for {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
                            {topPartner ? (
                                <>
                                    <div className="relative">
                                        <Avatar className="h-32 w-32 border-4 border-yellow-500 shadow-xl">
                                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${topPartner.name}`} />
                                            <AvatarFallback>{topPartner.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-white p-2 rounded-full shadow-lg">
                                            <Medal className="h-6 w-6" />
                                        </div>
                                    </div>
                                    <div className="text-center space-y-1">
                                        <h3 className="text-2xl font-bold">{topPartner.name}</h3>
                                        <p className="text-lg text-muted-foreground font-medium">
                                            Total Contribution: <span className="text-primary font-bold">₦{topPartner.amount.toLocaleString()}</span>
                                        </p>
                                    </div>
                                    <div className="flex gap-1">
                                        {[1,2,3,4,5].map(i => <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />)}
                                    </div>
                                    <p className="text-sm text-center text-muted-foreground max-w-xs pt-4">
                                        "Thank you for your incredible generosity and commitment to the mission!"
                                    </p>
                                </>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-lg text-muted-foreground">No contributions yet this month.</p>
                                    <p className="text-sm text-muted-foreground">Be the first to appear here!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle>Other Top Contributors</CardTitle>
                            <CardDescription>Honorable mentions for their support.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex items-center justify-center h-48 text-muted-foreground">
                                    Loading contributors...
                                </div>
                            ) : otherTopContributors.length > 0 ? (
                                <div className="space-y-3">
                                    {otherTopContributors.map((contributor, index) => (
                                        <div key={contributor.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                                                    {index + 2}
                                                </div>
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${contributor.name}`} />
                                                    <AvatarFallback>{contributor.name[0]}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium text-sm">{contributor.name}</p>
                                                    <p className="text-xs text-muted-foreground">Top Contributor</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-sm">₦{contributor.amount.toLocaleString()}</p>
                                                <p className="text-xs text-muted-foreground">Total</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-48 text-muted-foreground">
                                    No other contributors yet.
                                </div>
                            )}
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

export default function ProtectedDashboard() {
  return (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  )
}
