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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Target, TrendingUp, Award, Plus, BarChart, Users, Heart } from "lucide-react"

function DashboardPage() {
  const { user } = useAuth()
  const [totalContributions, setTotalContributions] = useState(0);
  const [myContributions, setMyContributions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Listener for all approved contributions
      const paymentsQuery = query(collection(db, "payments"), where("status", "==", "approved"));
      const unsubscribeTotal = onSnapshot(paymentsQuery, (snapshot) => {
        let total = 0;
        snapshot.forEach((doc) => {
          total += doc.data().amount;
        });
        setTotalContributions(total);
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
              <div className="grid gap-6 md:grid-cols-2">
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
              </div>
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
