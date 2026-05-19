'use client'

import type React from "react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { db } from "@/lib/firebase/client"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import ProtectedRoute from "@/components/auth/protected-route"
import Header from "@/components/layout/header"
import { LogContributionModal } from "@/components/contributions/log-contribution-modal"
import html2canvas from "html2canvas"

const isBrowser = typeof window !== 'undefined';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DollarSign, Target, TrendingUp, Award, Plus, BarChart, Users, Heart, Trophy, Medal, Star, Receipt, Banknote, Copy, Crown, Sparkles, CalendarDays, ChevronDown, Download, Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CardSkeleton, Skeleton } from "@/components/ui/skeleton"
import { GradientCard } from "@/components/ui/gradient-card"
import { CurrencyCounter, AnimatedCounter } from "@/components/ui/animated-counter"
import { ProgressRing } from "@/components/ui/progress-ring"
import { MiniBarChart } from "@/components/ui/mini-chart"
import { PartnerFlierModal } from "@/components/partner-flier-card"
import { SubmitProjectModal } from "@/components/projects/submit-project-modal"
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
  const [isDownloadingFlier, setIsDownloadingFlier] = useState(false);
  const [isSubmitProjectOpen, setIsSubmitProjectOpen] = useState(false);
  const partnerFlierRef = useRef<HTMLDivElement>(null);

  const copyAccountNumber = () => {
    const accountNumber = "0219230107"
    navigator.clipboard.writeText(accountNumber)
    toast.success("Account number copied to clipboard!")
  }

  const downloadPartnerFlier = async () => {
    if (!partnerFlierRef.current) return;
    
    setIsDownloadingFlier(true);
    try {
      // Hide elements that shouldn't be in the export
      const selectEl = partnerFlierRef.current.querySelector('[data-hide-on-export]') as HTMLElement;
      if (selectEl) selectEl.style.display = 'none';
      
      const canvas = await html2canvas(partnerFlierRef.current, {
        scale: 3, // Higher quality for social media
        backgroundColor: null,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      
      // Restore hidden elements
      if (selectEl) selectEl.style.display = '';
      
      const partner = monthlyTopPartners.get(selectedMonth);
      const link = document.createElement("a");
      link.download = `zeroup-partner-of-month-${partner?.name?.toLowerCase().replace(/\s+/g, '-') || 'partner'}-${partner?.month || ''}-${partner?.year || ''}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Partner flier downloaded!");
    } catch (error) {
      console.error("Error downloading image:", error);
      toast.error("Failed to download image");
    } finally {
      setIsDownloadingFlier(false);
    }
  };

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
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8d44d1] to-[#7030b0]" />
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
                        <Card className="group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
                            <CardHeader className="flex flex-row items-center gap-4">
                                <div className="bg-gradient-to-br from-[#8d44d1]/20 to-[#8d44d1]/20 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
                                    <Plus className="h-6 w-6 text-[#7030b0] dark:text-[#a05cd4]" />
                                </div>
                                <div>
                                    <CardTitle className="group-hover:text-[#7030b0] dark:group-hover:text-[#a05cd4] transition-colors">Log a New Contribution</CardTitle>
                                    <CardDescription>Submit your monthly support.</CardDescription>
                                </div>
                            </CardHeader>
                        </Card>
                    </LogContributionModal>
                    <Link href="/projects">
                        <Card className="group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
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
                        <Card className="group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
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
                    <Card className="group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer" onClick={() => setIsSubmitProjectOpen(true)}>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <div className="bg-gradient-to-br from-[#8d44d1]/15 to-[#7030b0]/15 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
                                <Target className="h-6 w-6 text-[#7030b0] dark:text-[#a05cd4]" />
                            </div>
                            <div>
                                <CardTitle className="group-hover:text-[#7030b0] dark:group-hover:text-[#a05cd4] transition-colors">Submit a Project</CardTitle>
                                <CardDescription>Propose a project for community funding.</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                    
                    {/* Bank Account Details Card */}
                    <Card className="lg:col-span-2 relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8d44d1] to-[#7030b0]" />
                        <CardHeader className="flex flex-row items-center gap-4">
                            <div className="bg-gradient-to-br from-[#8d44d1]/15 to-[#7030b0]/15 p-3 rounded-xl">
                                <Banknote className="h-6 w-6 text-[#7030b0] dark:text-[#a05cd4]" />
                            </div>
                            <div>
                                <CardTitle>Bank Transfer Details</CardTitle>
                                <CardDescription>Quick access to account information.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-3 text-sm bg-muted/40 rounded-xl p-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground font-medium">Account Number:</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-base">0219230107</span>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={copyAccountNumber}
                                            className="h-8 px-2"
                                        >
                                            <Copy className="w-3.5 h-3.5 mr-1" />
                                            Copy
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground font-medium">Bank:</span>
                                    <span className="font-semibold">GT Bank</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground font-medium">Account Name:</span>
                                    <span className="font-semibold">PACSDA</span>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground text-center">
                                Pan African Centre for Social Development and Accountability
                            </p>
                        </CardContent>
                    </Card>
                  </div>
              </TabsContent>

              <TabsContent value="recognition" className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                    {/* Partner of the Month - Premium Flier Design */}
                    <div className="col-span-1">
                      <div ref={partnerFlierRef}>
                        <Card className="relative overflow-hidden border-0 shadow-2xl aspect-[4/5]">
                            {/* Background gradient with premium look */}
                            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500" />
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-400/40 via-transparent to-transparent" />
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-red-600/30 via-transparent to-transparent" />
                            
                            {/* Decorative sparkles/patterns */}
                            <div className="absolute top-4 right-4 text-white/20">
                              <Sparkles className="w-10 h-10 sm:w-14 sm:h-14" />
                            </div>
                            <div className="absolute top-1/4 left-6 text-white/15">
                              <Sparkles className="w-8 h-8 sm:w-10 sm:h-10" />
                            </div>
                            <div className="absolute top-1/4 left-8 w-2 h-2 bg-white/30 rounded-full" />
                            <div className="absolute top-1/3 right-12 w-3 h-3 bg-white/20 rounded-full" />
                            
                            <CardHeader className="relative pb-1 pt-3 sm:pt-5">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                                  <div className="flex items-center gap-2 sm:gap-3 justify-center sm:justify-start">
                                    <div className="p-1.5 sm:p-2.5 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
                                        <Crown className="h-4 w-4 sm:h-6 sm:w-6 text-white drop-shadow-lg" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base sm:text-xl md:text-2xl font-bold text-white drop-shadow-lg">
                                            Partner of the Month
                                        </CardTitle>
                                    </div>
                                  </div>
                                  {/* Month Selector - hidden on export */}
                                  <div data-hide-on-export>
                                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                      <SelectTrigger className="w-full sm:w-[140px] bg-white/20 border-white/30 text-white backdrop-blur-sm hover:bg-white/30 transition-colors text-xs sm:text-sm h-8 sm:h-10">
                                        <CalendarDays className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 opacity-80" />
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
                                </div>
                            </CardHeader>
                            <CardContent className="flex flex-col items-center justify-between h-[calc(100%-60px)] sm:h-[calc(100%-80px)] py-3 sm:py-5 relative">
                                {(() => {
                                  const partner = monthlyTopPartners.get(selectedMonth);
                                  if (partner) {
                                    return (
                                      <>
                                        {/* Avatar section - positioned at top */}
                                        <div className="relative">
                                            {/* Premium glow effect */}
                                            <div className="absolute inset-0 bg-white rounded-full blur-2xl opacity-40 scale-125" />
                                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full blur-xl opacity-50 scale-110" />
                                            <Avatar className="h-20 w-20 sm:h-28 sm:w-28 md:h-32 md:w-32 border-4 sm:border-[5px] border-white shadow-2xl relative">
                                                <AvatarImage src={partner.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${partner.name}&backgroundColor=f59e0b`} />
                                                <AvatarFallback className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                                                  {partner.name?.charAt(0)?.toUpperCase() || '?'}
                                                </AvatarFallback>
                                            </Avatar>
                                            {/* Crown badge */}
                                            <div className="absolute -top-2 sm:-top-3 left-1/2 -translate-x-1/2">
                                              <div className="bg-gradient-to-br from-yellow-400 to-amber-500 text-white p-1 sm:p-1.5 rounded-full shadow-xl animate-bounce">
                                                <Crown className="h-3 w-3 sm:h-5 sm:w-5" />
                                              </div>
                                            </div>
                                            {/* Medal badge */}
                                            <div className="absolute -bottom-1 -right-1 bg-white text-amber-500 p-1.5 sm:p-2 rounded-full shadow-xl ring-2 sm:ring-4 ring-amber-400">
                                                <Medal className="h-3 w-3 sm:h-5 sm:w-5" />
                                            </div>
                                        </div>
                                        
                                        {/* Name and contribution */}
                                        <div className="text-center space-y-2 sm:space-y-3 mt-3 sm:mt-4">
                                            <h3 className="text-lg sm:text-xl md:text-3xl font-extrabold text-white drop-shadow-lg tracking-tight px-2">
                                              {partner.name || 'Anonymous Partner'}
                                            </h3>
                                            <div className="inline-flex items-center gap-1 px-3 sm:px-5 py-1.5 sm:py-2 rounded-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-xl">
                                                <span className="text-gray-500 text-[10px] sm:text-xs font-medium">Contributed</span>
                                                <span className="text-base sm:text-xl md:text-2xl font-black bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
                                                    ₦{partner.amount.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        {/* Star rating */}
                                        <div className="flex gap-1 sm:gap-1.5 mt-3 sm:mt-4">
                                            {[1,2,3,4,5].map(i => (
                                                <Star 
                                                    key={i} 
                                                    className="h-4 w-4 sm:h-5 sm:w-5 fill-yellow-300 text-yellow-300 drop-shadow-lg" 
                                                />
                                            ))}
                                        </div>
                                        
                                        {/* Message */}
                                        <p className="text-[10px] sm:text-xs text-center text-white/90 max-w-[220px] sm:max-w-[300px] font-medium italic drop-shadow px-3 leading-relaxed mt-3 sm:mt-4">
                                            "Thank you for your incredible generosity and commitment to transforming lives!"
                                        </p>
                                        
                                        {/* Trophy icon and branding */}
                                        <div className="flex flex-col items-center gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                                          <div className="flex items-center gap-1.5 sm:gap-2 text-white/90">
                                            <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
                                            <span className="text-[10px] sm:text-xs font-semibold tracking-wide">TOP CONTRIBUTOR</span>
                                            <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
                                          </div>
                                          <span className="text-white/40 text-[8px] sm:text-[10px] font-semibold tracking-widest">
                                            ZEROUP PARTNERS
                                          </span>
                                        </div>
                                      </>
                                    );
                                  }
                                  return (
                                    <div className="text-center py-8 flex flex-col items-center justify-center flex-1">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                            <Trophy className="h-8 w-8 sm:h-10 sm:w-10 text-white/60" />
                                        </div>
                                        <p className="text-base sm:text-lg font-semibold text-white/90">No contributions yet</p>
                                        <p className="text-xs sm:text-sm text-white/70 mt-1">Be the first to appear here!</p>
                                        <span className="text-white/40 text-[8px] sm:text-[10px] font-semibold tracking-widest mt-4">
                                          ZEROUP PARTNERS
                                        </span>
                                    </div>
                                  );
                                })()}
                            </CardContent>
                        </Card>
                      </div>
                      {/* Download Button */}
                      {monthlyTopPartners.get(selectedMonth) && (
                        <div className="mt-4 flex justify-center" data-download-btn>
                          <Button
                            onClick={downloadPartnerFlier}
                            disabled={isDownloadingFlier}
                            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg"
                          >
                            {isDownloadingFlier ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4 mr-2" />
                            )}
                            Download Flier
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {/* Leaderboard - Modern Design */}
                    <Card className="relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8d44d1] to-[#7030b0]" />
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
                                            "from-[#7030b0] to-[#5e269a]", // 6th
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
                                                    <PartnerFlierModal
                                                        trigger={
                                                            <button className="cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0">
                                                                <Avatar className="h-8 w-8 sm:h-10 sm:w-10 ring-2 ring-background">
                                                                    <AvatarImage src={contributor.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${contributor.name}`} />
                                                                    <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white">{contributor.name[0]}</AvatarFallback>
                                                                </Avatar>
                                                            </button>
                                                        }
                                                        partner={{
                                                            name: contributor.name,
                                                            amount: contributor.amount,
                                                            photoURL: contributor.photoURL,
                                                        }}
                                                        variant="regular"
                                                    />
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

      <SubmitProjectModal open={isSubmitProjectOpen} onOpenChange={setIsSubmitProjectOpen} />
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
