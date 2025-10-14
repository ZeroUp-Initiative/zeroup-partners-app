'use client'

import { useState, useEffect } from "react"
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/client"
import ProtectedRoute from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

function AdminDashboard() {
  const [pendingPayments, setPendingPayments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const fetchPendingPayments = async () => {
      // Ensure the user object and role are loaded before fetching
      if (!user || user.role !== "admin") {
        setIsLoading(false)
        return
      }

      try {
        const paymentsRef = collection(db, "payments")
        const q = query(paymentsRef, where("status", "==", "pending"))
        const querySnapshot = await getDocs(q)
        const payments = querySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          // Convert Firestore timestamp to a JavaScript Date object
          createdAt: doc.data().createdAt?.toDate() 
        }))
        setPendingPayments(payments)
      } catch (error) {
        console.error("Error fetching pending payments:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) { // Only fetch if the user object is available
      fetchPendingPayments()
    }
  }, [user])

  const handleApproval = async (paymentId: string, newStatus: "approved" | "rejected") => {
    try {
      const paymentRef = doc(db, "payments", paymentId)
      await updateDoc(paymentRef, { status: newStatus })
      // Update the UI by removing the payment from the list
      setPendingPayments(prev => prev.filter(p => p.id !== paymentId))
    } catch (error) {
      console.error(`Error ${newStatus === "approved" ? "approving" : "rejecting"} payment:`, error)
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
                <CardDescription>You do not have permission to view this page. Please contact an administrator if you believe this is a mistake.</CardDescription>
            </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Review and approve new partner contributions.</p>
        </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Pending Contributions</CardTitle>
          <CardDescription>There are currently {pendingPayments.length} contributions awaiting approval.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Date</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingPayments.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                        <p className="text-muted-foreground">No pending contributions to review.</p>
                    </TableCell>
                </TableRow>
              ) : (
                pendingPayments.map(payment => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.userEmail || "N/A"}</TableCell>
                    <TableCell className="text-right">${payment.amount?.toLocaleString() || "0.00"}</TableCell>
                    <TableCell className="text-center">{payment.createdAt?.toLocaleDateString() || "N/A"}</TableCell>
                    <TableCell className="text-center">
                        <Badge variant="outline" className="border-yellow-500 text-yellow-500">{payment.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" onClick={() => handleApproval(payment.id, "approved")}>Approve</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleApproval(payment.id, "rejected")}>Reject</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
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
