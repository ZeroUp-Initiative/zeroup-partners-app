"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { collection, onSnapshot, query, orderBy, doc, updateDoc, writeBatch, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/client"
import ProtectedRoute from "@/components/auth/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Loader2, CheckCircle, XCircle, Eye } from "lucide-react"

interface Transaction {
  id: string;
  amount: number;
  projectId: string;
  projectTitle: string;
  userId: string;
  userFullName: string;
  status: 'pending' | 'approved' | 'declined';
  receiptUrl?: string;
  createdAt: any;
  description?: string;
  adminDescription?: string;
}

function AdminTransactionsPage() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null)
  const [adminDescription, setAdminDescription] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'declined'>('pending')

  useEffect(() => {
    const q = query(collection(db, "transactions"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const transactionsData: Transaction[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        transactionsData.push({
          id: doc.id,
          amount: data.amount,
          projectId: data.projectId,
          projectTitle: data.projectTitle,
          userId: data.userId,
          userFullName: data.userFullName,
          status: data.status,
          receiptUrl: data.receiptUrl,
          createdAt: data.createdAt,
          description: data.description,
          adminDescription: data.adminDescription
        });
      });
      setTransactions(transactionsData);
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async () => {
    if (!selectedTransaction) return;

    setIsProcessing(true);
    setError("");

    try {
      const batch = writeBatch(db);

      // Update transaction status
      const transactionRef = doc(db, "transactions", selectedTransaction.id);
      batch.update(transactionRef, {
        status: 'approved',
        adminDescription: adminDescription,
        processedAt: new Date(),
        processedBy: user?.uid
      });

      // Update project funding
      const projectRef = doc(db, "projects", selectedTransaction.projectId);
      
      // Get current project data to update funding
      const projectSnapshot = await getDoc(projectRef);
      if (projectSnapshot.exists()) {
        const projectData = projectSnapshot.data();
        const newFunding = (projectData.currentFunding || 0) + selectedTransaction.amount;
        const newStatus = newFunding >= projectData.fundingGoal ? 'fully-funded' : 'open';
        
        batch.update(projectRef, {
          currentFunding: newFunding,
          status: newStatus
        });
      }

      await batch.commit();
      setSelectedTransaction(null);
      setAdminDescription("");
    } catch (err) {
      console.error("Error approving transaction:", err);
      setError("Failed to approve transaction. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!selectedTransaction) return;

    setIsProcessing(true);
    setError("");

    try {
      const transactionRef = doc(db, "transactions", selectedTransaction.id);
      await updateDoc(transactionRef, {
        status: 'declined',
        adminDescription: adminDescription,
        processedAt: new Date(),
        processedBy: user?.uid
      });

      setSelectedTransaction(null);
      setAdminDescription("");
    } catch (err) {
      console.error("Error declining transaction:", err);
      setError("Failed to decline transaction. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true;
    return transaction.status === filter;
  });

  if (!user || user.role !== "admin") {
    return <p>You do not have permission to view this page.</p>
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Manage Transactions</h1>
        <p className="text-muted-foreground">Review and approve or decline contribution transactions.</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 mb-6">
        {(['all', 'pending', 'approved', 'declined'] as const).map((status) => (
          <Button
            key={status}
            variant={filter === status ? "default" : "outline"}
            onClick={() => setFilter(status)}
            className="capitalize"
          >
            {status} ({transactions.filter(t => status === 'all' ? true : t.status === status).length})
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            {filter === 'all' ? 'All transactions' : `${filter} transactions`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Receipt</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {transaction.createdAt?.toDate ? 
                      transaction.createdAt.toDate().toLocaleDateString() : 
                      'N/A'
                    }
                  </TableCell>
                  <TableCell className="font-medium">{transaction.userFullName}</TableCell>
                  <TableCell>{transaction.projectTitle}</TableCell>
                  <TableCell>₦{transaction.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={
                      transaction.status === 'approved' ? 'default' :
                      transaction.status === 'declined' ? 'destructive' : 'secondary'
                    }>
                      {transaction.status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {transaction.receiptUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedReceipt(transaction.receiptUrl!)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    {transaction.status === 'pending' && (
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setAdminDescription("");
                          }}
                        >
                          Review
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Review Transaction Dialog */}
      <Dialog open={selectedTransaction !== null} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Transaction</DialogTitle>
            <DialogDescription>
              Review the contribution details and approve or decline this transaction.
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">User</Label>
                  <p className="text-sm">{selectedTransaction.userFullName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Amount</Label>
                  <p className="text-sm">₦{selectedTransaction.amount.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Project</Label>
                  <p className="text-sm">{selectedTransaction.projectTitle}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Date</Label>
                  <p className="text-sm">
                    {selectedTransaction.createdAt?.toDate ? 
                      selectedTransaction.createdAt.toDate().toLocaleDateString() : 
                      'N/A'
                    }
                  </p>
                </div>
              </div>

              {selectedTransaction.receiptUrl && (
                <div>
                  <Label className="text-sm font-medium">Receipt</Label>
                  <div className="mt-1">
                    <img 
                      src={selectedTransaction.receiptUrl} 
                      alt="Receipt"
                      className="max-w-full h-48 object-contain border rounded"
                    />
                  </div>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium">Description</Label>
                <p className="text-sm">{selectedTransaction.description}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminDescription">Admin Description</Label>
                <Textarea
                  id="adminDescription"
                  placeholder="Add notes about this decision..."
                  value={adminDescription}
                  onChange={(e) => setAdminDescription(e.target.value)}
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTransaction(null)}>
              Cancel
            </Button>
            <div className="flex space-x-2">
              <Button
                variant="destructive"
                onClick={handleDecline}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Declining...</>
                ) : (
                  <><XCircle className="w-4 h-4 mr-2" /> Decline</>
                )}
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Approving...</>
                ) : (
                  <><CheckCircle className="w-4 h-4 mr-2" /> Approve</>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Modal */}
      <Dialog open={selectedReceipt !== null} onOpenChange={() => setSelectedReceipt(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Receipt</DialogTitle>
          </DialogHeader>
          {selectedReceipt && (
            <div className="mt-4">
              <img 
                src={selectedReceipt} 
                alt="Payment Receipt"
                className="w-full h-auto max-h-96 object-contain border rounded"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ProtectedAdminTransactionsPage() {
  return (
    <ProtectedRoute>
      <AdminTransactionsPage />
    </ProtectedRoute>
  )
}
