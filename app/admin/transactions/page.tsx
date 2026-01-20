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
import { Loader2, CheckCircle, XCircle, Eye, ChevronLeft, ChevronRight, Search, Download } from "lucide-react"
import { NotificationHelpers } from "@/lib/notifications"

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
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const itemsPerPage = 10

  useEffect(() => {
    const q = query(collection(db, "payments"), orderBy("createdAt", "desc"));
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
          receiptUrl: data.proofURL,
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
      const transactionRef = doc(db, "payments", selectedTransaction.id);
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
      
      // Send notification to user
      await NotificationHelpers.contributionApproved(
        selectedTransaction.userId,
        selectedTransaction.amount,
        selectedTransaction.projectTitle
      );
      
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
      const transactionRef = doc(db, "payments", selectedTransaction.id);
      await updateDoc(transactionRef, {
        status: 'declined',
        adminDescription: adminDescription,
        processedAt: new Date(),
        processedBy: user?.uid
      });

      // Send notification to user
      await NotificationHelpers.contributionRejected(
        selectedTransaction.userId,
        selectedTransaction.amount,
        adminDescription || undefined
      );

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
    const matchesFilter = filter === 'all' ? true : transaction.status === filter;
    const matchesSearch = searchQuery === '' || 
      transaction.userFullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.projectTitle?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery]);

  // Export transactions to CSV
  const exportToCSV = () => {
    if (filteredTransactions.length === 0) return;
    
    const headers = ['Date', 'User', 'Project', 'Amount (₦)', 'Status', 'Admin Notes'];
    const rows = filteredTransactions.map(t => [
      t.createdAt?.toDate ? t.createdAt.toDate().toLocaleDateString() : 'N/A',
      t.userFullName,
      t.projectTitle,
      t.amount.toString(),
      t.status.charAt(0).toUpperCase() + t.status.slice(1),
      t.adminDescription || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${filter}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!user || user.role !== "admin") {
    return <p>You do not have permission to view this page.</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Manage Transactions</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Review and approve or decline contribution transactions.</p>
        </div>
        {filteredTransactions.length > 0 && (
          <Button variant="outline" onClick={exportToCSV} className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex space-x-2 overflow-x-auto pb-2 md:pb-0">
          {(['all', 'pending', 'approved', 'declined'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              onClick={() => setFilter(status)}
              className="capitalize whitespace-nowrap text-sm"
              size="sm"
            >
              {status} ({transactions.filter(t => status === 'all' ? true : t.status === status).length})
            </Button>
          ))}
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by user or project..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            {filter === 'all' ? 'All transactions' : `${filter} transactions`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6">
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
              {paginatedTransactions.map((transaction) => (
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
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t pt-4 mt-4">
              <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
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
