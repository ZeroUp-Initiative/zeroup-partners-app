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
import { Plus, LogOut, DollarSign, Calendar, FileText, CheckCircle, Clock, AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { auth, db } from "@/lib/firebase/client"
import { collection, query, where, onSnapshot, Timestamp, getDocs, writeBatch } from "firebase/firestore"

interface Contribution {
  id: string;
  amount: number;
  date: Date;
  status: "verified" | "pending" | "rejected";
  description: string;
  proofURL: string;
  rejectionReason?: string;
}

// --- Function to reset all contribution data ---
const resetAllContributions = async () => {
    const paymentsRef = collection(db, "payments");
    const querySnapshot = await getDocs(paymentsRef);
    const batch = writeBatch(db);
    querySnapshot.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
    console.log("All contribution data has been reset.");
};


function ContributionsContent() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [isLoadingContributions, setIsLoadingContributions] = useState(true);

  useEffect(() => {
    if (!user) return;

    // --- UNCOMMENT THE LINE BELOW TO RESET ALL DATA ---
    // resetAllContributions(); 

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
      case "verified": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "pending": return <Clock className="w-4 h-4 text-yellow-500" />;
      case "rejected": return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified": return <Badge className="bg-green-500 text-white">Verified</Badge>;
      case "pending": return <Badge variant="outline">Pending</Badge>;
      case "rejected": return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  const totalContributions = contributions.filter(c => c.status === 'verified').reduce((sum, c) => sum + c.amount, 0);
  const verifiedCount = contributions.filter((c) => c.status === "verified").length;
  const pendingAmount = contributions.filter((c) => c.status === "pending").reduce((sum, c) => sum + c.amount, 0);
  const pendingCount = contributions.filter((c) => c.status === "pending").length;

  if (isAuthLoading || isLoadingContributions) {
      return <div className="flex items-center justify-center h-screen">Loading Dashboard...</div>
  }

  return (

    <div className="min-h-screen bg-background">
        <Header title="Contributions" subtitle="Track your contributions" />

        <main className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Link>
            </div>
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Verified</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{totalContributions.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Across {verifiedCount} contributions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{pendingAmount.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">{pendingCount} {pendingCount === 1 ? 'contribution' : 'contributions'} pending</p>
              </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">This Month</CardTitle>
                    <Calendar className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₦0</div>
                    <p className="text-xs text-muted-foreground">Functionality coming soon</p>
                </CardContent>
            </Card>
          </div>

          <div className="flex justify-between items-center">
             <div>
              <h2 className="text-2xl font-bold">Contribution History</h2>
              <p className="text-muted-foreground">View all your past contributions</p>
            </div>
            <LogContributionModal />
          </div>
          
          <div className="space-y-4">
              {contributions.length > 0 ? (
                  contributions.map((contribution, index) => (
                      <Card key={contribution.id}>
                      <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                  <div className="p-2 rounded-full bg-primary/10">
                                      {getStatusIcon(contribution.status)}
                                  </div>
                                  <div>
                                  <h3 className="font-semibold">{contribution.description}</h3>
                                  <p className="text-sm text-muted-foreground">
                                      {contribution.date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                                  </p>
                                  {contribution.status === "rejected" && contribution.rejectionReason && (
                                      <p className="text-sm text-red-500 mt-1"><b>Reason:</b> {contribution.rejectionReason}</p>
                                  )}
                                  </div>
                              </div>
                              <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <p className="text-2xl font-bold">₦{contribution.amount.toLocaleString()}</p>
                                    {getStatusBadge(contribution.status)}
                                  </div>
                                  {contribution.proofURL &&
                                    <Button variant="outline" size="sm" asChild>
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
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No contributions logged yet.</p>
                  </div>
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
