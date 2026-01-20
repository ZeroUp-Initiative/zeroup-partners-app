"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import ProtectedRoute from "@/components/auth/protected-route"
import { useAuth } from "@/contexts/auth-context"
import Header from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogContributionModal } from "@/components/contributions/log-contribution-modal"
import { Plus, LogOut, DollarSign, Calendar, FileText, CheckCircle, Clock, AlertCircle, ArrowLeft, Download, AlertTriangle, Ban } from "lucide-react"
import Link from "next/link"
import { auth, db } from "@/lib/firebase/client"
import { collection, query, where, onSnapshot, Timestamp, doc, updateDoc } from "firebase/firestore"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { GradientCard } from "@/components/ui/gradient-card"
import { CurrencyCounter, AnimatedCounter } from "@/components/ui/animated-counter"

interface Contribution {
  id: string;
  amount: number;
  date: Date;
  status: "approved" | "pending" | "declined";
  description: string;
  proofURL: string;
  rejectionReason?: string;
}

function ContributionsContent() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [isLoadingContributions, setIsLoadingContributions] = useState(true);

  useEffect(() => {
    if (!user) return;

    setIsLoadingContributions(true);
    const contributionsQuery = query(collection(db, 'payments'), where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(contributionsQuery, (querySnapshot) => {
      const fetchedContributions: Contribution[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        let contributionDate = new Date();
        if (data.date && typeof data.date.toDate === 'function') {
            contributionDate = (data.date as Timestamp).toDate();
        } else if (data.createdAt && typeof data.createdAt.toDate === 'function') {
            contributionDate = (data.createdAt as Timestamp).toDate();
        }

        fetchedContributions.push({
          id: doc.id,
          amount: data.amount,
          date: contributionDate,
          status: data.status,
          description: data.description || `Contribution on ${contributionDate.toLocaleDateString()}`,
          proofURL: data.proofURL,
          rejectionReason: data.rejectionReason,
        });
      });
      fetchedContributions.sort((a, b) => b.date.getTime() - a.date.getTime());
      setContributions(fetchedContributions);
      setIsLoadingContributions(false);
    });

    return () => unsubscribe();
  }, [user]);

  const logout = async () => {
    await auth.signOut();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "pending": return <Clock className="w-4 h-4 text-yellow-500" />;
      case "declined": return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved": return <Badge className="bg-green-500 text-white">Verified</Badge>;
      case "pending": return <Badge variant="outline">Pending</Badge>;
      case "declined": return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  const totalContributions = contributions.filter(c => c.status === 'approved').reduce((sum, c) => sum + c.amount, 0);
  const verifiedCount = contributions.filter((c) => c.status === "approved").length;
  const pendingAmount = contributions.filter((c) => c.status === "pending").reduce((sum, c) => sum + c.amount, 0);
  const pendingCount = contributions.filter((c) => c.status === "pending").length;
  const declinedCount = contributions.filter((c) => c.status === "declined").length;
  
  // Flagging thresholds
  const FLAG_THRESHOLD = 3; // Flag user after 3 declined contributions
  const SUSPEND_THRESHOLD = 5; // Suspend user after 5 declined contributions
  
  const isFlagged = declinedCount >= FLAG_THRESHOLD;
  const isSuspended = declinedCount >= SUSPEND_THRESHOLD;
  
  // Update user flagged/suspended status in Firestore when declined count changes
  useEffect(() => {
    if (!user) return;
    
    const updateUserStatus = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          flagged: isFlagged,
          suspended: isSuspended,
          declinedContributionsCount: declinedCount
        });
      } catch (error) {
        console.error('Error updating user status:', error);
      }
    };
    
    // Only update if we have contributions loaded
    if (contributions.length > 0 || !isLoadingContributions) {
      updateUserStatus();
    }
  }, [declinedCount, isFlagged, isSuspended, user, contributions.length, isLoadingContributions]);
  
  // Calculate this month's contributions
  const now = new Date();
  const thisMonthContributions = contributions.filter(c => {
    const contributionDate = c.date;
    return c.status === 'approved' && 
           contributionDate.getMonth() === now.getMonth() && 
           contributionDate.getFullYear() === now.getFullYear();
  });
  const thisMonthAmount = thisMonthContributions.reduce((sum, c) => sum + c.amount, 0);
  const thisMonthCount = thisMonthContributions.length;

  // Export contributions to CSV
  const exportToCSV = () => {
    if (contributions.length === 0) return;
    
    const headers = ['Date', 'Description', 'Amount (₦)', 'Status'];
    const rows = contributions.map(c => [
      c.date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      c.description,
      c.amount.toString(),
      c.status.charAt(0).toUpperCase() + c.status.slice(1)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `contributions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isAuthLoading || isLoadingContributions) {
      return <div className="flex items-center justify-center h-screen">Loading Dashboard...</div>
  }

  return (

    <div className="min-h-screen bg-background">
        <Header title="Contributions" subtitle="Track your contributions" />

        <main className="container mx-auto px-4 py-8">
            {/* Suspended Account Warning */}
            {isSuspended && (
              <Alert variant="destructive" className="mb-6">
                <Ban className="h-4 w-4" />
                <AlertTitle>Account Suspended</AlertTitle>
                <AlertDescription>
                  Your account has been suspended due to {declinedCount} declined contributions. 
                  You cannot log new contributions until this is resolved. 
                  Please contact support at support@zeroup.org for assistance.
                </AlertDescription>
              </Alert>
            )}
            
            {/* Flagged Account Warning */}
            {isFlagged && !isSuspended && (
              <Alert className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertTitle className="text-yellow-800 dark:text-yellow-200">Account Under Review</AlertTitle>
                <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                  Your account has been flagged due to {declinedCount} declined contributions. 
                  Please ensure all future contributions include valid proof of payment. 
                  {SUSPEND_THRESHOLD - declinedCount} more declined contributions will result in account suspension.
                </AlertDescription>
              </Alert>
            )}

            <div className="mb-6">
                <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Link>
            </div>
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <GradientCard
              variant="emerald"
              title="Total Verified"
              icon={<CheckCircle className="h-5 w-5" />}
              value={<CurrencyCounter value={totalContributions} duration={2000} />}
              subtitle={`Across ${verifiedCount} contributions`}
            />

            <GradientCard
              variant="amber"
              title="Pending Review"
              icon={<Clock className="h-5 w-5" />}
              value={<CurrencyCounter value={pendingAmount} duration={2000} />}
              subtitle={`${pendingCount} ${pendingCount === 1 ? 'contribution' : 'contributions'} pending`}
            />

            <GradientCard
              variant="blue"
              title="This Month"
              icon={<Calendar className="h-5 w-5" />}
              value={<CurrencyCounter value={thisMonthAmount} duration={2000} />}
              subtitle={`${thisMonthCount} verified this month`}
            />

            <GradientCard
              variant="rose"
              title="Declined"
              icon={<AlertCircle className="h-5 w-5" />}
              value={<AnimatedCounter value={declinedCount} duration={1500} />}
              subtitle={
                declinedCount >= SUSPEND_THRESHOLD ? "Account suspended" : 
                declinedCount >= FLAG_THRESHOLD ? "Account flagged" : 
                "contributions declined"
              }
              className={declinedCount >= FLAG_THRESHOLD ? "ring-2 ring-red-500/50" : ""}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
             <div>
              <h2 className="text-xl sm:text-2xl font-bold">Your Contributions</h2>
              <p className="text-sm sm:text-base text-muted-foreground">View all your contributions and their status</p>
            </div>
            <div className="flex items-center gap-2">
              {contributions.length > 0 && (
                <Button variant="outline" onClick={exportToCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              )}
              {isSuspended ? (
                <Button disabled variant="destructive">
                  <Ban className="w-4 h-4 mr-2" />
                  Account Suspended
                </Button>
              ) : (
                <LogContributionModal />
              )}
            </div>
          </div>
          
          <div className="space-y-4">
              {contributions.length > 0 ? (
                  contributions.map((contribution, index) => (
                      <Card 
                        key={contribution.id} 
                        className="group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                      {/* Status indicator bar */}
                      <div className={`h-1 ${
                        contribution.status === 'approved' ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                        contribution.status === 'pending' ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
                        'bg-gradient-to-r from-red-500 to-rose-400'
                      }`} />
                      <CardContent className="p-6">
                          <div className="flex items-center justify-between flex-wrap gap-4">
                              <div className="flex items-center gap-4">
                                  <div className={`p-3 rounded-xl transition-transform duration-300 group-hover:scale-110 ${
                                    contribution.status === 'approved' ? 'bg-gradient-to-br from-emerald-500/20 to-teal-400/20' :
                                    contribution.status === 'pending' ? 'bg-gradient-to-br from-amber-500/20 to-yellow-400/20' :
                                    'bg-gradient-to-br from-red-500/20 to-rose-400/20'
                                  }`}>
                                      {getStatusIcon(contribution.status)}
                                  </div>
                                  <div>
                                  <h3 className="font-semibold group-hover:text-primary transition-colors">{contribution.description}</h3>
                                  <p className="text-sm text-muted-foreground">
                                      {contribution.date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                                  </p>
                                  {contribution.status === "declined" && contribution.rejectionReason && (
                                      <p className="text-sm text-red-500 mt-1"><b>Reason:</b> {contribution.rejectionReason}</p>
                                  )}
                                  </div>
                              </div>
                              <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <p className="text-2xl font-bold tabular-nums">₦{contribution.amount.toLocaleString()}</p>
                                    {getStatusBadge(contribution.status)}
                                  </div>
                                  {contribution.proofURL &&
                                    <Button variant="outline" size="sm" asChild className="hover:bg-primary hover:text-primary-foreground transition-colors">
                                      <Link href={contribution.proofURL} target="_blank">
                                          <FileText className="w-4 h-4 mr-2" />
                                          View Proof
                                      </Link>
                                    </Button>
                                  }
                              </div>
                          </div>
                      </CardContent>
                      </Card>
                  ))
              ) : (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                        <DollarSign className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                      <p className="text-lg font-medium text-muted-foreground">No contributions logged yet</p>
                      <p className="text-sm text-muted-foreground/70 mb-4">Start contributing to see your history here</p>
                      <LogContributionModal />
                    </CardContent>
                  </Card>
              )}
          </div>

        </div>
      </main>
    </div>
  )
}

export default function ContributionsPage() {
  return (
    <ProtectedRoute>
      <ContributionsContent />
    </ProtectedRoute>
  )
}
