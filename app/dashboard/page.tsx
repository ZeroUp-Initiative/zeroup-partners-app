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

const isBrowser = typeof window !== 'undefined';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, Target, TrendingUp, Award, Plus, BarChart, Users, Heart, Trophy, Medal, Star, Receipt, Banknote, Copy, Crown, Sparkles, CalendarDays, ChevronDown } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CardSkeleton, Skeleton } from "@/components/ui/skeleton"
import { GradientCard } from "@/components/ui/gradient-card"
import { CurrencyCounter, AnimatedCounter } from "@/components/ui/animated-counter"
import { ProgressRing } from "@/components/ui/progress-ring"
import { MiniBarChart } from "@/components/ui/mini-chart"
import toast from "react-hot-toast"

interface MonthlyData {
  label: string;
  value: number;
}

function DashboardPage() {
  const { user } = useAuth()
  const [totalContributions, setTotalContributions] = useState(0);
  const [myContributions, setMyContributions] = useState(0);
  const [impactScore, setImpactScore] = useState(0);
  const [badgesEarned, setBadgesEarned] = useState(0);
  const [topPartner, setTopPartner] = useState<{name: string, amount: number, id: string, photoURL?: string} | null>(null);
  const [otherTopContributors, setOtherTopContributors] = useState<{name: string, amount: number, id: string, photoURL?: string}[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [usersMap, setUsersMap] = useState<Map<string, any>>(new Map());
  const [paymentsData, setPaymentsData] = useState<any[]>([]);
  const [monthlyTopPartners, setMonthlyTopPartners] = useState<Map<string, {name: string, amount: number, id: string, photoURL?: string, month: string, year: number}>>(new Map());
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth()}`;
  });

  const copyAccountNumber = () => {
    const accountNumber = "0219230107"
    navigator.clipboard.writeText(accountNumber)
    toast.success("Account number copied to clipboard!")
  }

  // Subscribe to users data for photoURLs
  useEffect(() => {
    if (!isBrowser || !user || !db) return;

    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const userMap = new Map<string, any>();
      snapshot.forEach(doc => {
        userMap.set(doc.id, { id: doc.id, ...doc.data() });
      });
      setUsersMap(userMap);
    });

    return () => unsubUsers();
  }, [user]);

  useEffect(() => {
    if (!isBrowser || !user || !db) {
      setIsLoading(false);
      return;
    }

    // Listener for all approved contributions
    const paymentsQuery = query(collection(db, "payments"), where("status", "==", "approved"));
    const unsubscribeTotal = onSnapshot(paymentsQuery, (snapshot) => {
      const payments: any[] = [];
      snapshot.forEach((doc) => payments.push({ id: doc.id, ...doc.data() }));
      setPaymentsData(payments);
    });

    // Listener for the current user's contributions
    const myPaymentsQuery = query(
      collection(db, "payments"), 
      where("userId", "==", user.uid),
      where("status", "==", "approved")
    );
    const unsubscribeMine = onSnapshot(myPaymentsQuery, (snapshot) => {
      let myTotal = 0;
      const uniqueProjects = new Set<string>();
      const monthsActive = new Set<string>();
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        myTotal += data.amount;
        
        // Track unique projects
        if (data.projectId) {
          uniqueProjects.add(data.projectId);
        }
        
        // Track months active
        let paymentDate = null;
        if (data.date && typeof data.date.toDate === 'function') {
           paymentDate = data.date.toDate();
        } else if (data.createdAt && typeof data.createdAt.toDate === 'function') {
           paymentDate = data.createdAt.toDate();
        }
        if (paymentDate) {
          monthsActive.add(`${paymentDate.getFullYear()}-${paymentDate.getMonth()}`);
        }
      });
      
      setMyContributions(myTotal);
      
      // Calculate impact score and badges based on actual contributions
      const score = Math.min(100, Math.round((myTotal / 500000) * 100));
      setImpactScore(score);
      
      // Badges: 1 per 10,000 contributed, max 10
      const badges = Math.min(10, Math.floor(myTotal / 10000));
      setBadgesEarned(badges);
    });

    return () => {
      unsubscribeTotal();
      unsubscribeMine();
    };
  }, [user]);

  // Process payments data with user photos
  useEffect(() => {
    if (paymentsData.length === 0) {
      setIsLoading(false);
      return;
    }

    let total = 0;
    const monthlyContributions: Record<string, { amount: number, name: string }> = {};
    const allTimeContributions: Record<string, { amount: number, name: string }> = {};
    const monthlyTrendData: Record<string, number> = {};
    // Track contributions per month per user for historic top partners
    const perMonthContributions: Record<string, Record<string, { amount: number, name: string, id: string }>> = {};
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Initialize last 12 months for tracking
    for (let i = 11; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      monthlyTrendData[key] = 0;
      perMonthContributions[key] = {};
    }

    paymentsData.forEach((data) => {
      total += data.amount;

      // Check for monthly top partner
      let paymentDate = null;
      if (data.date && typeof data.date.toDate === 'function') {
        paymentDate = data.date.toDate();
      } else if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        paymentDate = data.createdAt.toDate();
      } else if (data.date instanceof Date) {
        paymentDate = data.date;
      } else if (data.createdAt instanceof Date) {
        paymentDate = data.createdAt;
      }

      if (paymentDate) {
        const paymentMonth = paymentDate.getMonth();
        const paymentYear = paymentDate.getFullYear();
        
        // Track monthly trend (last 6 months)
        const trendKey = `${paymentYear}-${paymentMonth}`;
        if (trendKey in monthlyTrendData) {
          monthlyTrendData[trendKey] += data.amount;
        }
        
        // Track per-month contributions for all months
        if (trendKey in perMonthContributions && data.userId) {
          if (!perMonthContributions[trendKey][data.userId]) {
            perMonthContributions[trendKey][data.userId] = { 
              amount: 0, 
              name: data.userFullName || 'Unknown User',
              id: data.userId 
            };
          }
          perMonthContributions[trendKey][data.userId].amount += data.amount;
          if (data.userFullName) perMonthContributions[trendKey][data.userId].name = data.userFullName;
        }
        
        if (paymentMonth === currentMonth && paymentYear === currentYear) {
          if (data.userId) {
            if (!monthlyContributions[data.userId]) {
              monthlyContributions[data.userId] = { amount: 0, name: data.userFullName || 'Unknown User' };
            }
            monthlyContributions[data.userId].amount += data.amount;
            if (data.userFullName) monthlyContributions[data.userId].name = data.userFullName;
          }
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

    // Find top monthly partner with photoURL from usersMap
    let max = 0;
    let top: {id: string, amount: number, name: string, photoURL?: string} | null = null;
    Object.entries(monthlyContributions).forEach(([id, p]) => {
      if (p.amount > max) {
        max = p.amount;
        const userData = usersMap.get(id);
        
        // Determine display name
        let displayName = p.name;
        if (id === user?.uid) {
          if (user.firstName && user.lastName) {
            displayName = `${user.firstName} ${user.lastName}`;
          } else if (user.displayName) {
            displayName = user.displayName;
          }
        } else if (userData?.firstName && userData?.lastName) {
          displayName = `${userData.firstName} ${userData.lastName}`;
        } else if (userData?.displayName) {
          displayName = userData.displayName;
        }
        
        // Get photoURL from usersMap for all users
        const photoURL = id === user?.uid 
          ? (user?.photoURL || userData?.photoURL) 
          : userData?.photoURL;
        
        top = { id, amount: p.amount, name: displayName, photoURL };
      }
    });
    setTopPartner(top);

    // Find other top contributors (all-time, excluding current top partner) with photoURLs
    const sortedContributors = Object.entries(allTimeContributions)
      .map(([id, p]) => {
        const userData = usersMap.get(id);
        
        // Determine display name
        let displayName = p.name;
        if (id === user?.uid) {
          if (user.firstName && user.lastName) {
            displayName = `${user.firstName} ${user.lastName}`;
          } else if (user.displayName) {
            displayName = user.displayName;
          }
        } else if (userData?.firstName && userData?.lastName) {
          displayName = `${userData.firstName} ${userData.lastName}`;
        } else if (userData?.displayName) {
          displayName = userData.displayName;
        }
        
        // Get photoURL from usersMap for all users
        const photoURL = id === user?.uid 
          ? (user?.photoURL || userData?.photoURL) 
          : userData?.photoURL;
        
        return { id, amount: p.amount, name: displayName, photoURL };
      })
      .sort((a, b) => b.amount - a.amount)
      .filter(contributor => contributor.id !== top?.id)
      .slice(0, 5);
    
    setOtherTopContributors(sortedContributors);

    // Calculate top partner for each month
    const topPartnersMap = new Map<string, {name: string, amount: number, id: string, photoURL?: string, month: string, year: number}>();
    
    Object.entries(perMonthContributions).forEach(([monthKey, contributions]) => {
      const [yearStr, monthStr] = monthKey.split('-');
      const year = parseInt(yearStr);
      const month = parseInt(monthStr);
      const monthName = new Date(year, month).toLocaleString('default', { month: 'long' });
      
      let maxAmount = 0;
      let topContributor: {id: string, amount: number, name: string} | null = null;
      
      Object.entries(contributions).forEach(([userId, data]) => {
        if (data.amount > maxAmount) {
          maxAmount = data.amount;
          topContributor = { id: userId, amount: data.amount, name: data.name };
        }
      });
      
      if (topContributor) {
        const userData = usersMap.get(topContributor.id);
        
        // Determine display name with proper fallbacks
        let displayName = topContributor.name || 'Partner';
        if (topContributor.id === user?.uid) {
          if (user.firstName && user.lastName) {
            displayName = `${user.firstName} ${user.lastName}`;
          } else if (user.displayName) {
            displayName = user.displayName;
          }
        } else if (userData?.firstName && userData?.lastName) {
          displayName = `${userData.firstName} ${userData.lastName}`;
        } else if (userData?.displayName) {
          displayName = userData.displayName;
        } else if (userData?.email) {
          displayName = userData.email.split('@')[0];
        }
        
        // Get photoURL
        const photoURL = topContributor.id === user?.uid 
          ? (user?.photoURL || userData?.photoURL) 
          : userData?.photoURL;
        
        topPartnersMap.set(monthKey, {
          id: topContributor.id,
          name: displayName,
          amount: topContributor.amount,
          photoURL,
          month: monthName,
          year
        });
      }
    });
    
    setMonthlyTopPartners(topPartnersMap);

    // Set monthly trend data (only last 6 months for display)
    const trendArray: MonthlyData[] = Object.entries(monthlyTrendData)
      .map(([key, value]) => {
        const [year, month] = key.split('-').map(Number);
        const date = new Date(year, month);
        return {
          label: date.toLocaleString('default', { month: 'short' }),
          value,
          sortKey: year * 12 + month
        };
      })
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(({ label, value }) => ({ label, value }));
    
    setMonthlyTrend(trendArray);
    setIsLoading(false);
  }, [paymentsData, usersMap, user]);

  return (
    <div className="min-h-screen bg-background">
      <Header title="Partners Hub" subtitle="Partner Dashboard" />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
          <div className="flex-1 space-y-6">
              {/* Welcome Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-8">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    {(() => {
                      const hour = new Date().getHours();
                      if (hour < 12) return "Good morning";
                      if (hour < 18) return "Good afternoon";
                      return "Good evening";
                    })()}, {user?.firstName || user?.displayName?.split(' ')[0] || "Partner"}!
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Track your contributions and see the impact you're making through the ZeroUp Initiative.
                  </p>
                </div>
              </div>

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="recognition">Recognition</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                  {/* Bento Grid of Stat Cards */}
                  <div className="grid gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4">
                    {isLoading ? (
                      <>
                        <CardSkeleton />
                        <CardSkeleton />
                        <CardSkeleton />
                        <CardSkeleton />
                      </>
                    ) : (
                      <>
                        <GradientCard
                          variant="emerald"
                          title="Total Contributions"
                          icon={<DollarSign className="h-5 w-5" />}
                          value={<CurrencyCounter value={totalContributions} duration={2000} />}
                          subtitle="Live total of all partner funds"
                          className="col-span-2 lg:col-span-1"
                        />

                        <GradientCard
                          variant="rose"
                          title="My Contributions"
                          icon={<Heart className="h-5 w-5" />}
                          value={<CurrencyCounter value={myContributions} duration={2000} />}
                          subtitle="Your personal impact"
                        />

                        <GradientCard
                          variant="cyan"
                          title="Impact Score"
                          icon={<TrendingUp className="h-5 w-5" />}
                          value={
                            <div className="flex items-center gap-4">
                              <ProgressRing 
                                value={impactScore} 
                                max={100} 
                                size={70} 
                                strokeWidth={6}
                                gradientColors={{ start: "#06b6d4", end: "#3b82f6" }}
                                label="pts"
                              />
                            </div>
                          }
                          subtitle={impactScore >= 80 ? "Outstanding!" : impactScore >= 50 ? "Great progress!" : "Keep contributing!"}
                        />

                        <GradientCard
                          variant="amber"
                          title="Badges Earned"
                          icon={<Award className="h-5 w-5" />}
                          value={<AnimatedCounter value={badgesEarned} duration={1500} />}
                          subtitle={badgesEarned === 0 ? "Start earning badges!" : `${7 - badgesEarned} more to unlock`}
                        />
                      </>
                    )}
                  </div>

                  {/* Contribution Trend Chart */}
                  <Card className="relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-purple-600" />
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                            <BarChart className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                          </div>
                          <div>
                            <CardTitle>Contribution Trends</CardTitle>
                            <CardDescription>Total contributions over the last 6 months</CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="h-32 flex items-center justify-center">
                          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                        </div>
                      ) : (
                        <MiniBarChart 
                          data={monthlyTrend} 
                          height={140}
                          gradientColors={{ start: "#8b5cf6", end: "#a855f7" }}
                          showValues={true}
                          showLabels={true}
                        />
                      )}
                    </CardContent>
                  </Card>

                  {/* Grid of Action Cards */}
                  <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <LogContributionModal>
                        <Card className="group hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer border-transparent hover:border-emerald-500/30">
                            <CardHeader className="flex flex-row items-center gap-4">
                                <div className="bg-gradient-to-br from-emerald-500/20 to-teal-400/20 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
                                    <Plus className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <CardTitle className="group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Log a New Contribution</CardTitle>
                                    <CardDescription>Submit your monthly support.</CardDescription>
                                </div>
                            </CardHeader>
                        </Card>
                    </LogContributionModal>
                    <Link href="/projects">
                        <Card className="group hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer border-transparent hover:border-purple-500/30">
                            <CardHeader className="flex flex-row items-center gap-4">
                                <div className="bg-gradient-to-br from-purple-500/20 to-pink-400/20 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
                                    <BarChart className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <CardTitle className="group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Fund a Project</CardTitle>
                                    <CardDescription>Direct your funds to a specific cause.</CardDescription>
                                </div>
                            </CardHeader>
                        </Card>
                    </Link>
                    <Link href="/dashboard/transactions">
                        <Card className="group hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer border-transparent hover:border-blue-500/30">
                            <CardHeader className="flex flex-row items-center gap-4">
                                <div className="bg-gradient-to-br from-blue-500/20 to-cyan-400/20 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
                                    <Receipt className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <CardTitle className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">All Transactions</CardTitle>
                                    <CardDescription>View pending and completed transactions.</CardDescription>
                                </div>
                            </CardHeader>
                        </Card>
                    </Link>
                    
                    {/* Bank Account Details Card */}
                    <Card className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200/50 dark:border-blue-800/50">
                        {/* Decorative pattern */}
                        <div className="absolute inset-0 opacity-5">
                          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                              <pattern id="bank-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                                <circle cx="20" cy="20" r="1.5" fill="currentColor" />
                              </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#bank-pattern)" />
                          </svg>
                        </div>
                        <CardHeader className="flex flex-row items-center gap-4 relative">
                            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl shadow-lg shadow-blue-500/25">
                                <Banknote className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-blue-700 dark:text-blue-300">Bank Transfer Details</CardTitle>
                                <CardDescription>Quick access to account information.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3 relative">
                            <div className="space-y-3 text-sm bg-white/50 dark:bg-black/20 rounded-xl p-4 backdrop-blur-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600 dark:text-gray-400 font-medium">Account Number:</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-lg text-blue-600 dark:text-blue-400">0219230107</span>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={copyAccountNumber}
                                            className="h-8 px-2 hover:bg-blue-100 dark:hover:bg-blue-900 border-blue-200 dark:border-blue-800"
                                        >
                                            <Copy className="w-3.5 h-3.5 mr-1" />
                                            Copy
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400 font-medium">Bank:</span>
                                    <span className="font-semibold">GT Bank</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400 font-medium">Account Name:</span>
                                    <span className="font-semibold">PACSDA</span>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                (Pan African Centre for Social Development and Accountability)
                            </div>
                        </CardContent>
                    </Card>
                  </div>
              </TabsContent>

              <TabsContent value="recognition" className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                    {/* Partner of the Month - Premium Design */}
                    <Card className="col-span-1 relative overflow-hidden border-0 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-yellow-950/20">
                        {/* Decorative elements */}
                        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-amber-400/20 to-yellow-400/20 rounded-full blur-2xl" />
                        
                        <CardHeader className="relative">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-500/30">
                                    <Trophy className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
                                        Partner of the Month
                                    </CardTitle>
                                    <CardDescription>
                                        {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center py-8 space-y-5 relative">
                            {topPartner ? (
                                <>
                                    <div className="relative">
                                        {/* Glow effect behind avatar */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full blur-xl opacity-40 scale-110" />
                                        <Avatar className="h-28 w-28 border-4 border-white dark:border-gray-800 shadow-2xl relative ring-4 ring-amber-400/30">
                                            <AvatarImage src={topPartner.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${topPartner.name}`} />
                                            <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-amber-400 to-orange-500 text-white">{topPartner.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-amber-400 to-orange-500 text-white p-2.5 rounded-full shadow-lg ring-4 ring-white dark:ring-gray-900">
                                            <Medal className="h-5 w-5" />
                                        </div>
                                    </div>
                                    <div className="text-center space-y-2">
                                        <h3 className="text-2xl font-bold">{topPartner.name}</h3>
                                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-black/20 backdrop-blur-sm">
                                            <span className="text-muted-foreground">Total:</span>
                                            <span className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
                                                <CurrencyCounter value={topPartner.amount} duration={2000} />
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        {[1,2,3,4,5].map(i => (
                                            <Star 
                                                key={i} 
                                                className="h-6 w-6 fill-amber-400 text-amber-400 drop-shadow-sm" 
                                                style={{ animationDelay: `${i * 0.1}s` }}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-sm text-center text-muted-foreground max-w-xs italic">
                                        "Thank you for your incredible generosity and commitment to the mission!"
                                    </p>
                                </>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-200 to-orange-200 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center">
                                        <Trophy className="h-10 w-10 text-amber-400/50" />
                                    </div>
                                    <p className="text-lg text-muted-foreground">No contributions yet this month.</p>
                                    <p className="text-sm text-muted-foreground">Be the first to appear here!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    
                    {/* Leaderboard - Modern Design */}
                    <Card className="relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500" />
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                                    <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <CardTitle>Top Contributors</CardTitle>
                                    <CardDescription>All-time leaderboard rankings</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex items-center justify-center h-48 text-muted-foreground">
                                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                                </div>
                            ) : otherTopContributors.length > 0 ? (
                                <div className="space-y-3">
                                    {otherTopContributors.map((contributor, index) => {
                                        const rankColors = [
                                            "from-slate-400 to-slate-500", // 2nd
                                            "from-amber-600 to-amber-700", // 3rd
                                            "from-purple-500 to-purple-600", // 4th
                                            "from-blue-500 to-blue-600", // 5th
                                            "from-teal-500 to-teal-600", // 6th
                                        ];
                                        return (
                                            <div 
                                                key={contributor.id} 
                                                className="group flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 hover:from-muted hover:to-muted/50 transition-all duration-300 hover:-translate-x-1"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br ${rankColors[index] || "from-gray-400 to-gray-500"} text-white font-bold text-sm shadow-sm`}>
                                                        {index + 2}
                                                    </div>
                                                    <Avatar className="h-10 w-10 ring-2 ring-background">
                                                        <AvatarImage src={contributor.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${contributor.name}`} />
                                                        <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white">{contributor.name[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-semibold text-sm group-hover:text-primary transition-colors">{contributor.name}</p>
                                                        <p className="text-xs text-muted-foreground">Top Contributor</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-sm">₦{contributor.amount.toLocaleString()}</p>
                                                    <p className="text-xs text-muted-foreground">Total</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                                    <Users className="h-12 w-12 mb-3 opacity-30" />
                                    <p>No other contributors yet.</p>
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
