"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { collection, onSnapshot, query, orderBy, doc, updateDoc, writeBatch, getDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase/client"
import toast from "react-hot-toast"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CheckCircle, XCircle, Eye, ChevronLeft, ChevronRight, Search, Download } from "lucide-react"
import { NotificationHelpers } from "@/lib/notifications"
import type { ProjectBudgetPhase } from "@/lib/types"

const UNALLOCATED = "__unallocated__"

interface Transaction {
  id: string;
  amount: number;
  projectId: string;
  projectTitle: string;
  userId: string;
  userFullName: string;
  userEmail?: string;
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
  const [budgetPhases, setBudgetPhases] = useState<ProjectBudgetPhase[]>([])
  const [allocatedItemId, setAllocatedItemId] = useState<string>(UNALLOCATED)
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
          userEmail: data.userEmail,
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

  // Load the selected transaction's project budget phases, so the admin can
  // optionally allocate this contribution to a specific line item.
  useEffect(() => {
    setAllocatedItemId(UNALLOCATED)
    if (!selectedTransaction) { setBudgetPhases([]); return }
    getDoc(doc(db, "projects", selectedTransaction.projectId)).then((snap) => {
      setBudgetPhases(snap.exists() ? (snap.data().budgetPhases || []) : [])
    }).catch(() => setBudgetPhases([]))
  }, [selectedTransaction?.id, selectedTransaction?.projectId]);

  // Resolve a contributor's email — prefer the value stored on the payment,
  // otherwise look it up from the user's profile document.
  async function resolveContributorEmail(transaction: Transaction): Promise<string | null> {
    if (transaction.userEmail) return transaction.userEmail;
    if (!transaction.userId) return null;
    try {
      const snap = await getDoc(doc(db, "users", transaction.userId));
      const email = snap.exists() ? (snap.data().email as string | undefined) : undefined;
      return email || null;
    } catch {
      return null;
    }
  }

  // Format a Firestore timestamp / Date / string into a readable receipt date.
  function formatReceiptDate(ts: any): string {
    try {
      const d = ts?.toDate ? ts.toDate() : ts ? new Date(ts) : new Date();
      return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    } catch {
      return "";
    }
  }

  // Build a human-friendly receipt reference from the payment id, e.g. ZUP-LBHAXPKQ.
  function receiptNumber(transaction: Transaction): string {
    return `ZUP-${transaction.id.slice(0, 8).toUpperCase()}`;
  }

  // Send a contribution email and surface failures via toast instead of
  // swallowing them, so the admin knows if the contributor wasn't notified.
  async function sendContributionEmail(
    type: "contribution_approved" | "contribution_rejected",
    transaction: Transaction,
    data: Record<string, unknown>
  ) {
    const to = await resolveContributorEmail(transaction);
    if (!to) {
      toast.error("Status updated, but no email was found for this contributor — they weren't notified by email.");
      return;
    }
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, type, data }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "send failed");
      }
    } catch {
      toast.error("Status updated, but the notification email could not be sent.");
    }
  }

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
      let crossedPhaseName: string | null = null
      let newFunding = 0
      if (projectSnapshot.exists()) {
        const projectData = projectSnapshot.data();
        const oldFunding = projectData.currentFunding || 0
        newFunding = oldFunding + selectedTransaction.amount;
        const newStatus = newFunding >= projectData.fundingGoal ? 'fully-funded' : 'open';

        const projectUpdate: Record<string, unknown> = {
          currentFunding: newFunding,
          status: newStatus
        }

        // If the admin allocated this contribution to a specific budget line
        // item, add it to that item's raised amount so its progress bar fills.
        const existingPhases: ProjectBudgetPhase[] = projectData.budgetPhases || []
        if (allocatedItemId !== UNALLOCATED && existingPhases.some(p => p.id === allocatedItemId)) {
          projectUpdate.budgetPhases = existingPhases.map(p =>
            p.id === allocatedItemId
              ? { ...p, currentAmount: (p.currentAmount || 0) + selectedTransaction.amount }
              : p
          )
        }

        batch.update(projectRef, projectUpdate);

        // Detect whether this approval pushed funding past a budget-phase
        // threshold, so we can announce it. If a single contribution
        // crosses multiple phases at once, only the last (most advanced)
        // one is announced.
        let cumulative = 0
        for (const phase of existingPhases) {
          cumulative += phase.amount || 0
          if (oldFunding < cumulative && newFunding >= cumulative) crossedPhaseName = phase.name
        }
      }

      await batch.commit();

      if (crossedPhaseName) {
        fetch('/api/email/notify-project', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'project_phase_unlocked',
            data: { title: selectedTransaction.projectTitle, projectId: selectedTransaction.projectId, phaseName: crossedPhaseName },
          }),
        }).catch(() => {})
      }

      // Send in-app notification
      await NotificationHelpers.contributionApproved(
        selectedTransaction.userId,
        selectedTransaction.amount,
        selectedTransaction.projectTitle
      );

      // Send approval confirmation email to contributor
      await sendContributionEmail('contribution_approved', selectedTransaction, {
        name: selectedTransaction.userFullName?.split(' ')[0] || 'Partner',
        amount: selectedTransaction.amount,
        projectTitle: selectedTransaction.projectTitle,
        date: formatReceiptDate(selectedTransaction.createdAt),
        receiptNo: receiptNumber(selectedTransaction),
      })

      // Award dream coins (only credits linked Dreamers contributing to ZeroUp-owned targets).
      // Failures here must be visible to the admin — this silently failed for months in the
      // past because errors only went to console.error, which nobody was watching.
      try {
        const idToken = await auth?.currentUser?.getIdToken()
        if (!idToken) {
          toast.error("Couldn't award dream coins: no auth token available. Try refreshing and approving again.")
        } else {
          const res = await fetch('/api/dreamers/award', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
            body: JSON.stringify({ paymentId: selectedTransaction.id }),
          })
          const data = await res.json().catch(() => ({}))
          if (!res.ok) {
            toast.error(`Dream coin award failed: ${data.error || res.status}`)
          } else if (data.awarded > 0) {
            toast.success(`Awarded ${Number(data.awarded).toLocaleString()} dream coins to this Dreamer`)
          } else if (data.already) {
            // Already awarded (re-approval edge case) — not an error, no toast needed.
          } else if (data.reason && data.reason !== 'not_a_dreamer' && data.reason !== 'not_zeroup_owned' && data.reason !== 'amount_too_small') {
            // Only surface unexpected skip reasons — the three above are normal, expected outcomes.
            toast.error(`Dream coin award skipped: ${data.reason}`)
          }
        }
      } catch (awardErr) {
        console.error("Dream coin award failed:", awardErr)
        toast.error("Dream coin award failed unexpectedly — check console for details.")
      }

      // Check whether this approval just pushed community-wide funding past a
      // new ₦1,000,000 milestone. Fire-and-forget: worst case a milestone is
      // detected on the next approval instead, nothing is lost.
      try {
        const idToken = await auth?.currentUser?.getIdToken()
        if (idToken) {
          const res = await fetch('/api/milestones/check-funding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          })
          const data = await res.json().catch(() => ({}))
          if (res.ok && data.fired) {
            toast.success(`🎉 Funding milestone reached: ₦${data.thresholds[data.thresholds.length - 1].toLocaleString()}! Badges sent to ${data.recipientCount} partners.`)
          }
        }
      } catch (milestoneErr) {
        console.error("Funding milestone check failed:", milestoneErr)
      }

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

      // Send rejection email to contributor
      await sendContributionEmail('contribution_rejected', selectedTransaction, {
        name: selectedTransaction.userFullName?.split(' ')[0] || 'Partner',
        amount: selectedTransaction.amount,
        projectTitle: selectedTransaction.projectTitle,
        rejectionReason: adminDescription || undefined,
      })

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

              {budgetPhases.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="allocateTo">Allocate to a budget line item (optional)</Label>
                  <Select value={allocatedItemId} onValueChange={setAllocatedItemId}>
                    <SelectTrigger id="allocateTo"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={UNALLOCATED}>General project funding (not tied to a specific cost)</SelectItem>
                      {budgetPhases.map((phase) => (
                        <SelectItem key={phase.id} value={phase.id}>
                          {phase.name} — ₦{(phase.currentAmount || 0).toLocaleString()} of ₦{(phase.amount || 0).toLocaleString()} raised
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    If this contribution was meant to cover a specific cost, pick it here — approving will add ₦{selectedTransaction.amount.toLocaleString()} to that item's progress on the public project page.
                  </p>
                </div>
              )}

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
