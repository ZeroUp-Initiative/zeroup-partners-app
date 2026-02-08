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
      .slice(-6) // Only last 6 months
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
                  <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
                          icon={<DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />}
                          value={<CurrencyCounter value={totalContributions} duration={2000} />}
                          subtitle="All partner funds"
                          className="col-span-2 lg:col-span-1"
                        />

                        <GradientCard
                          variant="rose"
                          title="My Contributions"
                          icon={<Heart className="h-4 w-4 sm:h-5 sm:w-5" />}
                          value={<CurrencyCounter value={myContributions} duration={2000} />}
                          subtitle="Your impact"
                        />

                        <GradientCard
                          variant="cyan"
                          title="Impact Score"
                          icon={<TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />}
                          value={
                            <div className="flex items-center justify-center">
                              <ProgressRing 
                                value={impactScore} 
                                max={100} 
                                size={50} 
                                strokeWidth={4}
                                gradientColors={{ start: "#06b6d4", end: "#3b82f6" }}
                                label="pts"
                              />
                            </div>
                          }
                          subtitle={impactScore >= 80 ? "Outstanding!" : impactScore >= 50 ? "Great!" : "Keep going!"}
                        />

                        <GradientCard
                          variant="amber"
                          title="Badges Earned"
                          icon={<Award className="h-4 w-4 sm:h-5 sm:w-5" />}
                          value={<AnimatedCounter value={badgesEarned} duration={1500} />}
                          subtitle={badgesEarned === 0 ? "Start earning!" : `${7 - badgesEarned} to unlock`}
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
                  <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
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
                                    <span className="font-semibold text-gray-900 dark:text-gray-100">GT Bank</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400 font-medium">Account Name:</span>
                                    <span className="font-semibold text-gray-900 dark:text-gray-100">PACSDA</span>
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
                    {/* Partner of the Month - Premium Flier Design */}
                    <Card className="col-span-1 relative overflow-hidden border-0 shadow-2xl">
                        {/* Background gradient with premium look */}
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500" />
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-400/40 via-transparent to-transparent" />
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-red-600/30 via-transparent to-transparent" />
                        
                        {/* Decorative sparkles/patterns */}
                        <div className="absolute top-4 right-4 text-white/20">
                          <Sparkles className="w-16 h-16" />
                        </div>
                        <div className="absolute bottom-4 left-4 text-white/20">
                          <Sparkles className="w-12 h-12" />
                        </div>
                        <div className="absolute top-1/4 left-8 w-2 h-2 bg-white/30 rounded-full" />
                        <div className="absolute top-1/3 right-12 w-3 h-3 bg-white/20 rounded-full" />
                        <div className="absolute bottom-1/4 right-8 w-2 h-2 bg-white/25 rounded-full" />
                        
                        {/* ZeroUp branding watermark */}
                        <div className="absolute bottom-3 right-4 text-white/30 text-xs font-semibold tracking-widest">
                          ZEROUP PARTNERS
                        </div>
                        
                        <CardHeader className="relative pb-2">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="p-2 sm:p-3 rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
                                    <Crown className="h-6 w-6 sm:h-8 sm:w-8 text-white drop-shadow-lg" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                                        Partner of the Month
                                    </CardTitle>
                                </div>
                              </div>
                              {/* Month Selector */}
                              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                <SelectTrigger className="w-full sm:w-[140px] bg-white/20 border-white/30 text-white backdrop-blur-sm hover:bg-white/30 transition-colors">
                                  <CalendarDays className="w-4 h-4 mr-2 opacity-80" />
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from(monthlyTopPartners.keys()).sort((a, b) => {
                                    const [yearA, monthA] = a.split('-').map(Number);
                                    const [yearB, monthB] = b.split('-').map(Number);
                                    return (yearB * 12 + monthB) - (yearA * 12 + monthA);
                                  }).map((key) => {
                                    const [year, month] = key.split('-').map(Number);
                                    const date = new Date(year, month);
                                    return (
                                      <SelectItem key={key} value={key}>
                                        {date.toLocaleString('default', { month: 'short', year: 'numeric' })}
                                      </SelectItem>
                                    );
                                  })}
                                  {monthlyTopPartners.size === 0 && (
                                    <SelectItem value={selectedMonth} disabled>
                                      {new Date().toLocaleString('default', { month: 'short', year: 'numeric' })}
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center py-8 space-y-6 relative">
                            {(() => {
                              const partner = monthlyTopPartners.get(selectedMonth);
                              if (partner) {
                                return (
                                  <>
                                    {/* Month/Year Banner */}
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                      <div className="px-6 py-1.5 bg-white/90 dark:bg-gray-900/90 rounded-full shadow-xl backdrop-blur-sm">
                                        <span className="text-sm font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                                          {partner.month} {partner.year}
                                        </span>
                                      </div>
                                    </div>
                                    
                                    <div className="relative mt-4">
                                        {/* Premium glow effect */}
                                        <div className="absolute inset-0 bg-white rounded-full blur-2xl opacity-40 scale-125" />
                                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full blur-xl opacity-50 scale-110" />
                                        <Avatar className="h-32 w-32 md:h-36 md:w-36 border-[6px] border-white shadow-2xl relative">
                                            <AvatarImage src={partner.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${partner.name}&backgroundColor=f59e0b`} />
                                            <AvatarFallback className="text-4xl font-bold bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                                              {partner.name?.charAt(0)?.toUpperCase() || '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        {/* Crown badge */}
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                          <div className="bg-gradient-to-br from-yellow-400 to-amber-500 text-white p-2 rounded-full shadow-xl animate-bounce">
                                            <Crown className="h-6 w-6" />
                                          </div>
                                        </div>
                                        {/* Medal badge */}
                                        <div className="absolute -bottom-2 -right-2 bg-white text-amber-500 p-3 rounded-full shadow-xl ring-4 ring-amber-400">
                                            <Medal className="h-6 w-6" />
                                        </div>
                                    </div>
                                    
                                    <div className="text-center space-y-3">
                                        <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white drop-shadow-lg tracking-tight">
                                          {partner.name || 'Anonymous Partner'}
                                        </h3>
                                        <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-xl">
                                            <span className="text-gray-500 text-sm font-medium">Contributed</span>
                                            <span className="text-xl sm:text-2xl md:text-3xl font-black bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                                                ₦{partner.amount.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Star rating */}
                                    <div className="flex gap-1.5">
                                        {[1,2,3,4,5].map(i => (
                                            <Star 
                                                key={i} 
                                                className="h-7 w-7 fill-yellow-300 text-yellow-300 drop-shadow-lg" 
                                            />
                                        ))}
                                    </div>
                                    
                                    <p className="text-base text-center text-white/90 max-w-sm font-medium italic drop-shadow">
                                        "Thank you for your incredible generosity and commitment to transforming lives!"
                                    </p>
                                    
                                    {/* Trophy icon at bottom */}
                                    <div className="flex items-center gap-2 text-white/80">
                                      <Trophy className="h-5 w-5" />
                                      <span className="text-sm font-semibold tracking-wide">TOP CONTRIBUTOR</span>
                                      <Trophy className="h-5 w-5" />
                                    </div>
                                  </>
                                );
                              }
                              return (
                                <div className="text-center py-8">
                                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                        <Trophy className="h-12 w-12 text-white/60" />
                                    </div>
                                    <p className="text-xl font-semibold text-white/90">No contributions yet</p>
                                    <p className="text-sm text-white/70 mt-1">Be the first to appear here!</p>
                                </div>
                              );
                            })()}
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
                                <div className="space-y-3 overflow-hidden">
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
                                                className="group flex items-center justify-between p-2 sm:p-3 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 hover:from-muted hover:to-muted/50 transition-all duration-300 gap-2"
                                            >
                                                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                                                    <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br ${rankColors[index] || "from-gray-400 to-gray-500"} text-white font-bold text-xs sm:text-sm shadow-sm flex-shrink-0`}>
                                                        {index + 2}
                                                    </div>
                                                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 ring-2 ring-background flex-shrink-0">
                                                        <AvatarImage src={contributor.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${contributor.name}`} />
                                                        <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white">{contributor.name[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-semibold text-xs sm:text-sm group-hover:text-primary transition-colors truncate">{contributor.name}</p>
                                                        <p className="text-xs text-muted-foreground hidden sm:block">Top Contributor</p>
                                                    </div>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <p className="font-bold text-xs sm:text-sm">₦{contributor.amount.toLocaleString()}</p>
                                                    <p className="text-xs text-muted-foreground hidden sm:block">Total</p>
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
