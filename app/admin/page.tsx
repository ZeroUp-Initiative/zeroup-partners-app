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

function AdminDashboard() {
  const [pendingPayments, setPendingPayments] = useState<any[]>([])
  const [processedPayments, setProcessedPayments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [rejectionReason, setRejectionReason] = useState("")
  const [isRejecting, setIsRejecting] = useState<string | null>(null)
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
        }
      })

      setPendingPayments(payments.filter(p => p.status === "pending"))
      setProcessedPayments(payments.filter(p => p.status === "approved" || p.status === "rejected"))
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
      await updateDoc(paymentRef, { status: newStatus, reviewedAt: Timestamp.now() })
      await fetchPayments() // Re-fetch all payments to update lists
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
      await updateDoc(paymentRef, {
        status: "rejected",
        rejectionReason: rejectionReason,
        reviewedAt: Timestamp.now(),
      })
      await fetchPayments() // Re-fetch all payments
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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Review and manage all partner contributions.</p>
      </div>

      {/* Pending Contributions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Pending Contributions</CardTitle>
          <CardDescription>There are {pendingPayments.length} contributions awaiting approval.</CardDescription>
        </CardHeader>
        <CardContent>
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
                    <Button variant="outline" size="sm" asChild>
                      <Link href={payment.proofURL || '#'} target="_blank">View</Link>
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
      <Card>
        <CardHeader>
          <CardTitle>Contribution History</CardTitle>
          <CardDescription>A log of all approved and rejected contributions.</CardDescription>
        </CardHeader>
        <CardContent>
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
              {processedPayments.map(payment => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.userFullName || "N/A"}</TableCell>
                  <TableCell>₦{payment.amount?.toLocaleString() || "0.00"}</TableCell>
                  <TableCell>{payment.date?.toLocaleDateString() || "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant={payment.status === 'approved' ? 'secondary' : 'destructive'}>{payment.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">{payment.rejectionReason || "-"}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={payment.proofURL || '#'} target="_blank">View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
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
