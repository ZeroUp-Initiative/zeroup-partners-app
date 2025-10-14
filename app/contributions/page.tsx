'use client'

import { useState, useEffect } from "react"
import ProtectedRoute from "@/components/auth/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, LogOut, DollarSign, Calendar, FileText, CheckCircle, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"
import { auth, db } from "@/lib/firebase/client"
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore"

// Interface for a contribution document from Firestore
interface Contribution {
  id: string;
  amount: number;
  date: Date;
  status: "verified" | "pending" | "rejected";
  description: string;
  proofUrl: string;
  verifiedDate?: Date | null;
  rejectionReason?: string;
  // Any other fields you have
}

function ContributionsContent() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [isLoadingContributions, setIsLoadingContributions] = useState(true);

  useEffect(() => {
    if (!user) return; // Don't run if user is not logged in

    setIsLoadingContributions(true);
    const contributionsQuery = query(collection(db, 'payments'), where('userId', '==', user.uid));

    const unsubscribe = onSnapshot(contributionsQuery, (querySnapshot) => {
      const fetchedContributions: Contribution[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedContributions.push({
          id: doc.id,
          amount: data.amount,
          // Convert Firestore Timestamp to JavaScript Date object
          date: (data.submittedAt as Timestamp).toDate(),
          status: data.status,
          description: data.description || `Contribution on ${ (data.submittedAt as Timestamp).toDate().toLocaleDateString()}`,
          proofUrl: data.proofUrl,
          verifiedDate: data.verifiedDate ? (data.verifiedDate as Timestamp).toDate() : null,
          rejectionReason: data.rejectionReason,
        });
      });
      // Sort by date, most recent first
      fetchedContributions.sort((a, b) => b.date.getTime() - a.date.getTime());
      setContributions(fetchedContributions);
      setIsLoadingContributions(false);
    });

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, [user]);

  const logout = async () => {
    await auth.signOut();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified": return <CheckCircle className="w-4 h-4 text-secondary" />;
      case "pending": return <Clock className="w-4 h-4 text-accent" />;
      case "rejected": return <AlertCircle className="w-4 h-4 text-destructive" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified": return <Badge variant="secondary">Verified</Badge>;
      case "pending": return <Badge variant="outline">Pending</Badge>;
      case "rejected": return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const totalContributions = user?.totalContributions || 0;
  const verifiedCount = contributions.filter((c) => c.status === "verified").length;
  const pendingAmount = contributions.filter((c) => c.status === "pending").reduce((sum, c) => sum + c.amount, 0);
  const pendingCount = contributions.filter((c) => c.status === "pending").length;

  if (isAuthLoading || isLoadingContributions) {
      return <div>Loading Dashboard...</div> // Or a more sophisticated skeleton loader
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
        {/* ... (decorative elements are unchanged) ... */}

        <header className="border-b border-border/20 bg-card/30 backdrop-blur-xl relative z-10">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
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
                        {user?.firstName?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block">
                    <p className="text-sm font-medium">{`${user?.firstName} ${user?.lastName}`}</p>
                    <p className="text-xs text-muted-foreground">{user?.organization || "Individual Partner"}</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={logout} className="glass-card hover:scale-105 transition-all duration-300 bg-transparent">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                </Button>
                </div>
            </div>
        </header>

        <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="space-y-8">
          {/* --- REAL-TIME SUMMARY CARDS --- */}
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
                  Across {verifiedCount} contributions
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
                  {pendingCount} {pendingCount === 1 ? 'contribution' : 'contributions'} pending
                </p>
              </CardContent>
            </Card>
             {/* ... (This Month card is unchanged for now) ... */}
             <Card className="glass-card hover-tilt group border-secondary/20 hover:border-secondary/40 transition-all duration-500 animate-fade-in delay-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <Calendar className="h-4 w-4 text-secondary group-hover:scale-110 transition-transform duration-300" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-secondary animate-number-glow">$0</div>
                <p className="text-xs text-muted-foreground">Functionality coming soon</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-between items-center animate-fade-in delay-300">
             <div>
              <h2 className="text-2xl font-bold text-balance">Contribution History</h2>
              <p className="text-muted-foreground">View and manage all your contributions</p>
            </div>
            <Button asChild className="glass-button hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-primary/25">
              <Link href="/contributions/new">
                <Plus className="w-4 h-4 mr-2" />
                Log New Contribution
              </Link>
            </Button>
          </div>
          
          {/* --- REAL-TIME TABS & CONTENT --- */}
          <Tabs defaultValue="all" className="space-y-6 animate-fade-in delay-400">
             {/* ... (TabsList is unchanged) ... */}

            {contributions.length > 0 ? (
                <TabsContent value="all" className="space-y-4">
                {contributions.map((contribution, index) => (
                    <Card key={contribution.id} className={`glass-card hover-tilt transition-all duration-500 animate-fade-in border-primary/10 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10`} style={{ animationDelay: `${index * 100}ms` }}>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                                    {getStatusIcon(contribution.status)}
                                </div>
                                <div>
                                <h3 className="font-semibold">{contribution.description}</h3>
                                <p className="text-sm text-muted-foreground">
                                    {contribution.date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
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
                                <Button variant="outline" size="sm" asChild className="glass-button hover:scale-105 transition-all duration-300 bg-transparent">
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
            ) : (
                <p>No contributions logged yet. Click 'Log New Contribution' to get started!</p>
            )}
            {/* You can add filtered views for other tabs in a similar way */}
          </Tabs>

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
