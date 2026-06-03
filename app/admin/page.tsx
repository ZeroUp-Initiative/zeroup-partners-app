'use client'

import { useState, useEffect } from "react"
import { collection, query, where, getDocs, doc, updateDoc, Timestamp, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase/client"
import ProtectedRoute from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { DollarSign, Activity, FolderOpen, ChevronLeft, ChevronRight } from "lucide-react"

function AdminDashboard() {
  const [pendingPayments, setPendingPayments] = useState<any[]>([])
  const [processedPayments, setProcessedPayments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isRejecting, setIsRejecting] = useState<string | null>(null)
  const [stats, setStats] = useState({ totalFunds: 0, activeProjects: 0, pendingCount: 0 })
  const [viewingProof, setViewingProof] = useState<string | null>(null)
  const [historyPage, setHistoryPage] = useState(1)
  const HISTORY_PAGE_SIZE = 10
  const { user } = useAuth()

  const fetchPayments = async () => {
    if (!user || user.role !== "admin") {
      setIsLoading(false)
      return
    }

    try {
      const paymentsRef = collection(db, "payments")
      const q = query(paymentsRef, orderBy("createdAt", "desc"))
      const querySnapshot = await getDocs(q)
      const payments = querySnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null,
          date: data.date instanceof Timestamp ? data.date.toDate() : null,
        } as any
      })

      const pending = payments.filter(p => p.status === "pending");
      const approved = payments.filter(p => p.status === "approved");
      
      const totalFunds = approved.reduce((sum, p) => sum + (p.amount || 0), 0);

      setPendingPayments(pending)
      setProcessedPayments(payments.filter(p => p.status === "approved" || p.status === "rejected"))

      // Fetch active projects count
      const projectsQuery = query(collection(db, "projects"), where("status", "==", "open"));
      const projectsSnapshot = await getDocs(projectsQuery);
      
      setStats({
        totalFunds,
        activeProjects: projectsSnapshot.size,
        pendingCount: pending.length
      });

    } catch (error) {
      console.error("Error fetching payments:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchPayments()
    }
  }, [user])

  const handleApproval = async (paymentId: string, newStatus: "approved" | "rejected") => {
    try {
      const paymentRef = doc(db, "payments", paymentId)
      const paymentSnap = await getDocs(query(collection(db, "payments"), where("__name__", "==", paymentId)))
      
      // Get payment details for email
      const paymentDoc = pendingPayments.find(p => p.id === paymentId)
      
      await updateDoc(paymentRef, { status: newStatus, reviewedAt: Timestamp.now() })
      
      // Send approval email to user
      if (paymentDoc && newStatus === "approved") {
        try {
          await fetch('/api/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: paymentDoc.userEmail,
              type: 'contribution_approved',
              data: {
                name: paymentDoc.userFirstName || 'Partner',
                amount: paymentDoc.amount?.toLocaleString() || '0',
                projectTitle: paymentDoc.projectTitle,
              },
            }),
          });
        } catch (err) {
          console.error('Failed to send approval email:', err);
        }
      }
      
      await fetchPayments() 
    } catch (error) {
      console.error(`Error approving payment:`, error)
    }
  }

  const openRejectDialog = (paymentId: string) => {
    setIsRejecting(paymentId)
  }

  const handleRejection = async () => {
    if (!isRejecting || !rejectionReason) return
    try {
      const paymentRef = doc(db, "payments", isRejecting)
      
      // Get payment details for email
      const paymentDoc = pendingPayments.find(p => p.id === isRejecting)
      
      await updateDoc(paymentRef, {
        status: "rejected",
        rejectionReason: rejectionReason,
        reviewedAt: Timestamp.now(),
      })
      
      // Send rejection email to user
      if (paymentDoc) {
        try {
          await fetch('/api/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: paymentDoc.userEmail,
              type: 'contribution_rejected',
              data: {
                name: paymentDoc.userFirstName || 'Partner',
                amount: paymentDoc.amount?.toLocaleString() || '0',
                projectTitle: paymentDoc.projectTitle,
                rejectionReason: rejectionReason,
              },
            }),
          });
        } catch (err) {
          console.error('Failed to send rejection email:', err);
        }
      }
      
      await fetchPayments()
    } catch (error) {
      console.error(`Error rejecting payment:`, error)
    } finally {
      setIsRejecting(null)
      setRejectionReason("")
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-destructive">Access Denied</CardTitle>
            <CardDescription>You do not have permission to view this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Contribution Overview</h1>
        <p className="text-muted-foreground">Manage approvals and view financial contribution history.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Funds Raised</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{stats.totalFunds.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingCount}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground">Currently open for funding</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Contributions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Pending Contributions</CardTitle>
          <CardDescription>There are {pendingPayments.length} contributions awaiting approval.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Proof</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingPayments.map(payment => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.userFullName || "N/A"}</TableCell>
                  <TableCell>₦{payment.amount?.toLocaleString() || "0.00"}</TableCell>
                  <TableCell>{payment.date?.toLocaleDateString() || "N/A"}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => setViewingProof(payment.proofURL)}>
                      View
                    </Button>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" onClick={() => handleApproval(payment.id, "approved")}>Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => openRejectDialog(payment.id)}>Reject</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Contribution History */}
      {(() => {
        const historyTotalPages = Math.ceil(processedPayments.length / HISTORY_PAGE_SIZE)
        const historyStart = (historyPage - 1) * HISTORY_PAGE_SIZE
        const pagedHistory = processedPayments.slice(historyStart, historyStart + HISTORY_PAGE_SIZE)
        return (
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle>Contribution History</CardTitle>
                <CardDescription>
                  {processedPayments.length} processed contribution{processedPayments.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              {historyTotalPages > 1 && (
                <p className="text-sm text-muted-foreground">
                  Page {historyPage} of {historyTotalPages}
                </p>
              )}
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Proof</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No processed contributions yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pagedHistory.map(payment => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.userFullName || "N/A"}</TableCell>
                        <TableCell>₦{payment.amount?.toLocaleString() || "0.00"}</TableCell>
                        <TableCell>{payment.date?.toLocaleDateString() || "N/A"}</TableCell>
                        <TableCell>
                          <Badge variant={payment.status === 'approved' ? 'secondary' : 'destructive'}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs max-w-[160px] truncate">{payment.rejectionReason || "-"}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => setViewingProof(payment.proofURL)}>
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {historyTotalPages > 1 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t pt-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {historyStart + 1}–{Math.min(historyStart + HISTORY_PAGE_SIZE, processedPayments.length)} of {processedPayments.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline" size="sm"
                      onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                      disabled={historyPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    {Array.from({ length: historyTotalPages }, (_, i) => i + 1).map(page => {
                      const isEdge = page === 1 || page === historyTotalPages
                      const isNear = Math.abs(page - historyPage) <= 1
                      if (!isEdge && !isNear) {
                        if (page === 2 || page === historyTotalPages - 1) return <span key={page} className="px-1 text-muted-foreground text-sm">…</span>
                        return null
                      }
                      return (
                        <Button
                          key={page}
                          variant={historyPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setHistoryPage(page)}
                          className={`h-8 w-8 p-0 ${historyPage === page ? 'bg-[#8d44d1] hover:bg-[#7030b0] border-[#8d44d1]' : ''}`}
                        >
                          {page}
                        </Button>
                      )
                    })}
                    <Button
                      variant="outline" size="sm"
                      onClick={() => setHistoryPage(p => Math.min(historyTotalPages, p + 1))}
                      disabled={historyPage === historyTotalPages}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })()}
      
      {/* Rejection Dialog */}
      <Dialog open={isRejecting !== null} onOpenChange={() => setIsRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Contribution</DialogTitle>
            <DialogDescription>Please provide a reason for rejecting this contribution. This will be shown to the user.</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="e.g., Unclear proof of payment, incorrect amount..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejecting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRejection}>Confirm Rejection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Proof Dialog */}
      <Dialog open={viewingProof !== null} onOpenChange={() => setViewingProof(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-transparent border-none shadow-none">
             <div className="relative w-full h-full min-h-[50vh] flex items-center justify-center bg-black/80 rounded-lg backdrop-blur-sm p-4">
                <button 
                  onClick={() => setViewingProof(null)}
                  className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 text-white hover:bg-white/20 transition-colors"
                >
                  <span className="sr-only">Close</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                {viewingProof && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={viewingProof} 
                    alt="Proof of Payment" 
                    className="max-w-full max-h-[85vh] object-contain rounded-md shadow-2xl"
                  />
                )}
             </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <AdminDashboard />
    </ProtectedRoute>
  )
}
