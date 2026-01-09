"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, query, orderBy, where } from "firebase/firestore"
import { db } from "@/lib/firebase/client"
import ProtectedRoute from "@/components/auth/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, ArrowLeft, Search } from "lucide-react"
import Link from "next/link"

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

function TransactionHistoryPage() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "transactions"), 
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    
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
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const totalAmount = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const approvedAmount = transactions
    .filter(t => t.status === 'approved')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const pendingAmount = transactions
    .filter(t => t.status === 'pending')
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const filteredTransactions = transactions.filter(transaction => 
    transaction.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return <p>Please log in to view your transaction history.</p>
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Transaction History</h1>
        <p className="text-muted-foreground">View all your transactions including pending, approved, and declined.</p>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions by project name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{transactions.length} transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₦{approvedAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{transactions.filter(t => t.status === 'approved').length} approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">₦{pendingAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{transactions.filter(t => t.status === 'pending').length} pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>Your complete transaction history</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading transactions...</div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No transactions found matching your search." : "No transactions found."}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{transaction.projectTitle}</h3>
                          <Badge variant={
                            transaction.status === 'approved' ? 'default' :
                            transaction.status === 'declined' ? 'destructive' : 'secondary'
                          }>
                            {transaction.status.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {transaction.description ? 
                            (transaction.description.length > 150 ? 
                              `${transaction.description.substring(0, 150)}...` : 
                              transaction.description
                            ) : 'No description'
                          }
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            {transaction.createdAt?.toDate ? 
                              transaction.createdAt.toDate().toLocaleDateString() : 
                              'N/A'
                            }
                          </span>
                          <span className="font-semibold text-foreground">₦{transaction.amount.toLocaleString()}</span>
                        </div>
                      </div>
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
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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

export default function ProtectedTransactionHistoryPage() {
  return (
    <ProtectedRoute>
      <TransactionHistoryPage />
    </ProtectedRoute>
  )
}
