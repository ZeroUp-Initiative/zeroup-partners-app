"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy, QuerySnapshot, DocumentData, QueryDocumentSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase/client"
import ProtectedRoute from "@/components/auth/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  MoreHorizontal,
  Shield,
  ShieldOff,
  User,
  Users,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Ban,
  Trash2,
  Mail,
  Send,
  RefreshCw,
  Megaphone,
} from "lucide-react"
import toast from "react-hot-toast"

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  organization?: string;
  role?: string;
  createdAt: any;
  emailVerified?: boolean;
  flagged?: boolean;
  suspended?: boolean;
  declinedContributionsCount?: number;
}

function AdminUsersPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<UserData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<"all" | "user" | "admin">("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [isChangingRole, setIsChangingRole] = useState(false)
  const [newRole, setNewRole] = useState<string>("")
  const itemsPerPage = 10

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<UserData | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Email state
  const [emailTarget, setEmailTarget] = useState<UserData | null>(null)
  const [emailType, setEmailType] = useState("welcome")
  const [customEmailSubject, setCustomEmailSubject] = useState("")
  const [customEmailBody, setCustomEmailBody] = useState("")
  const [isSendingEmail, setIsSendingEmail] = useState(false)

  // Broadcast state
  const [broadcastOpen, setBroadcastOpen] = useState(false)
  const [broadcastSubject, setBroadcastSubject] = useState("")
  const [broadcastBody, setBroadcastBody] = useState("")
  const [broadcastFilter, setBroadcastFilter] = useState("active")
  const [isBroadcasting, setIsBroadcasting] = useState(false)
  const [broadcastResult, setBroadcastResult] = useState<{ sent: number; failed: number } | null>(null)

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const usersData: UserData[] = [];
      snapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
        const data = docSnap.data();
        usersData.push({
          id: docSnap.id,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          organization: data.organization,
          role: data.role || 'user',
          createdAt: data.createdAt,
          emailVerified: data.emailVerified,
          flagged: data.flagged || false,
          suspended: data.suspended || false,
          declinedContributionsCount: data.declinedContributionsCount || 0
        });
      });
      setUsers(usersData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredUsers = users.filter((u: UserData) => {
    if (roleFilter === "admin" && u.role !== "admin") return false;
    if (roleFilter === "user" && u.role === "admin") return false;
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      u.firstName?.toLowerCase().includes(searchLower) ||
      u.lastName?.toLowerCase().includes(searchLower) ||
      u.email?.toLowerCase().includes(searchLower) ||
      u.organization?.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter]);

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return;

    setIsChangingRole(true);
    try {
      const userRef = doc(db, "users", selectedUser.id);
      await updateDoc(userRef, { role: newRole });
      toast.success(`Role updated to ${newRole} for ${selectedUser.firstName} ${selectedUser.lastName}`);
      setSelectedUser(null);
      setNewRole("");
    } catch (err) {
      toast.error("Failed to update user role");
    } finally {
      setIsChangingRole(false);
    }
  };

  const openRoleDialog = (userData: UserData, role: string) => {
    setSelectedUser(userData);
    setNewRole(role);
  };

  const handleClearFlags = async (userData: UserData) => {
    try {
      const userRef = doc(db, "users", userData.id);
      await updateDoc(userRef, { 
        flagged: false, 
        suspended: false,
        declinedContributionsCount: 0 
      });
      toast.success(`Flags cleared for ${userData.firstName} ${userData.lastName}`);
    } catch (err) {
      toast.error("Failed to clear user flags");
    }
  };

  const handleSuspendUser = async (userData: UserData) => {
    try {
      const userRef = doc(db, "users", userData.id);
      await updateDoc(userRef, { 
        flagged: true,
        suspended: true 
      });
      toast.success(`${userData.firstName} ${userData.lastName} has been suspended`);
    } catch (err) {
      toast.error("Failed to suspend user");
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      await deleteDoc(doc(db, "users", deleteTarget.id))
      toast.success(`${deleteTarget.firstName} ${deleteTarget.lastName} has been deleted.`)
      setDeleteTarget(null)
    } catch {
      toast.error("Failed to delete user.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSendEmail = async () => {
    if (!emailTarget) return
    setIsSendingEmail(true)
    try {
      const payload =
        emailType === "custom"
          ? {
              to: emailTarget.email,
              type: "custom",
              data: {
                name: emailTarget.firstName || "Partner",
                subject: customEmailSubject,
                body: customEmailBody,
              },
            }
          : {
              to: emailTarget.email,
              type: emailType,
              data: { name: emailTarget.firstName || "Partner" },
            }

      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error("Send failed")
      toast.success(`Email sent to ${emailTarget.email}`)
      setEmailTarget(null)
      setCustomEmailSubject("")
      setCustomEmailBody("")
    } catch {
      toast.error("Failed to send email.")
    } finally {
      setIsSendingEmail(false)
    }
  }

  const handleBroadcast = async () => {
    const pool =
      broadcastFilter === "all"
        ? users
        : broadcastFilter === "admins"
        ? users.filter(u => u.role === "admin")
        : users.filter(u => !u.suspended)

    const recipients = pool
      .filter(u => u.email)
      .map(u => ({ email: u.email, name: u.firstName || "Partner" }))

    if (!recipients.length) {
      toast.error("No recipients match the selected filter.")
      return
    }

    setIsBroadcasting(true)
    setBroadcastResult(null)
    try {
      const res = await fetch("/api/email/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients, subject: broadcastSubject, body: broadcastBody }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Broadcast failed")
      setBroadcastResult({ sent: data.sent, failed: data.failed })
      toast.success(`Broadcast complete — ${data.sent} sent, ${data.failed} failed`)
      if (data.failed === 0) {
        setBroadcastOpen(false)
        setBroadcastSubject("")
        setBroadcastBody("")
      }
    } catch {
      toast.error("Broadcast failed. Check the console for details.")
    } finally {
      setIsBroadcasting(false)
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const adminCount = users.filter((u: UserData) => u.role === 'admin').length;
  const userCount = users.filter((u: UserData) => u.role !== 'admin').length;
  const flaggedCount = users.filter((u: UserData) => u.flagged && !u.suspended).length;
  const suspendedCount = users.filter((u: UserData) => u.suspended).length;

  if (!user || user.role !== "admin") {
    return <p>You do not have permission to view this page.</p>
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">User Management</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Manage user accounts and assign roles.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrators</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regular Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCount}</div>
          </CardContent>
        </Card>
        <Card className={flaggedCount > 0 ? "border-yellow-500" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flagged</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{flaggedCount}</div>
            <p className="text-xs text-muted-foreground">Under review</p>
          </CardContent>
        </Card>
        <Card className={suspendedCount > 0 ? "border-red-500" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <Ban className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{suspendedCount}</div>
            <p className="text-xs text-muted-foreground">Account disabled</p>
          </CardContent>
        </Card>
      </div>

      {/* Search + Filter + Broadcast */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Role filter tabs */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {(["all", "user", "admin"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setRoleFilter(f)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                roleFilter === f
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "admin" && <Shield className="h-3.5 w-3.5" />}
              {f === "user" && <User className="h-3.5 w-3.5" />}
              {f === "all" && <Users className="h-3.5 w-3.5" />}
              <span className="capitalize">{f === "all" ? "All" : f === "admin" ? "Admins" : "Users"}</span>
              <span className="ml-0.5 text-xs opacity-70">
                ({f === "all" ? users.length : f === "admin" ? adminCount : userCount})
              </span>
            </button>
          ))}
        </div>

        <Button
          onClick={() => { setBroadcastOpen(true); setBroadcastResult(null) }}
          className="bg-gradient-to-r from-[#8d44d1] to-[#7030b0] text-white border-0 gap-2 sm:ml-auto"
        >
          <Megaphone className="h-4 w-4" />
          Broadcast Email
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {roleFilter === "admin" ? "Administrators" : roleFilter === "user" ? "Regular Users" : "All Users"}
          </CardTitle>
          <CardDescription>
            {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
              <p className="text-muted-foreground mt-4">Loading users...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-6 px-6">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map((userData) => (
                    <TableRow key={userData.id} className={userData.suspended ? "bg-red-50 dark:bg-red-900/10" : userData.flagged ? "bg-yellow-50 dark:bg-yellow-900/10" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {userData.firstName?.charAt(0)?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {userData.firstName} {userData.lastName}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{userData.email}</TableCell>
                      <TableCell>{userData.organization || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={userData.role === 'admin' ? 'default' : 'secondary'}>
                          {userData.role === 'admin' ? (
                            <>
                              <Shield className="w-3 h-3 mr-1" />
                              Admin
                            </>
                          ) : (
                            'User'
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {userData.suspended ? (
                          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                            <Ban className="w-3 h-3" />
                            Suspended
                          </Badge>
                        ) : userData.flagged ? (
                          <Badge className="bg-yellow-500 text-white flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" />
                            Flagged ({userData.declinedContributionsCount})
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(userData.createdAt)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="flex items-center gap-1.5 h-8 px-3">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                              <span className="text-xs">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            {/* Role — only for other users */}
                            {userData.id !== user.uid && (
                              userData.role === 'admin' ? (
                                <DropdownMenuItem onClick={() => openRoleDialog(userData, 'user')} className="text-destructive focus:text-destructive">
                                  <ShieldOff className="w-4 h-4 mr-2" />Remove Admin
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => openRoleDialog(userData, 'admin')}>
                                  <Shield className="w-4 h-4 mr-2" />Make Admin
                                </DropdownMenuItem>
                              )
                            )}

                            <DropdownMenuSeparator />

                            {/* Email actions — available for all users */}
                            <DropdownMenuItem onClick={() => { setEmailTarget(userData); setEmailType("welcome") }}>
                              <RefreshCw className="w-4 h-4 mr-2" />Resend Welcome Email
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setEmailTarget(userData); setEmailType("custom") }}>
                              <Mail className="w-4 h-4 mr-2" />Send Custom Email
                            </DropdownMenuItem>

                            {/* Account status — only for other non-admin users */}
                            {userData.id !== user.uid && userData.role !== 'admin' && (
                              <>
                                <DropdownMenuSeparator />
                                {(userData.flagged || userData.suspended) && (
                                  <DropdownMenuItem onClick={() => handleClearFlags(userData)}>
                                    <User className="w-4 h-4 mr-2" />Clear Flags & Reactivate
                                  </DropdownMenuItem>
                                )}
                                {!userData.suspended && (
                                  <DropdownMenuItem onClick={() => handleSuspendUser(userData)} className="text-amber-600 focus:text-amber-600">
                                    <Ban className="w-4 h-4 mr-2" />Suspend User
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setDeleteTarget(userData)} className="text-destructive focus:text-destructive">
                                  <Trash2 className="w-4 h-4 mr-2" />Delete User
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t pt-4 mt-4">
                  <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete User Dialog */}
      <Dialog open={deleteTarget !== null} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              This will permanently delete <strong>{deleteTarget?.firstName} {deleteTarget?.lastName}</strong>'s profile from the database. Their contribution history will be preserved. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={isDeleting}>
              {isDeleting ? "Deleting…" : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog open={emailTarget !== null} onOpenChange={() => { setEmailTarget(null); setCustomEmailSubject(""); setCustomEmailBody("") }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Send Email to {emailTarget?.firstName} {emailTarget?.lastName}
            </DialogTitle>
            <DialogDescription>{emailTarget?.email}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Email Type</Label>
              <Select value={emailType} onValueChange={setEmailType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="welcome">Welcome Email</SelectItem>
                  <SelectItem value="custom">Custom Message</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {emailType === "custom" && (
              <>
                <div className="space-y-1.5">
                  <Label>Subject</Label>
                  <Input
                    placeholder="Email subject"
                    value={customEmailSubject}
                    onChange={e => setCustomEmailSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Message</Label>
                  <Textarea
                    placeholder="Write your message here…"
                    value={customEmailBody}
                    onChange={e => setCustomEmailBody(e.target.value)}
                    rows={5}
                  />
                </div>
              </>
            )}

            {emailType !== "custom" && (
              <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                {emailType === "welcome" && "Sends the standard welcome email with platform overview and a link to the dashboard."}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailTarget(null)}>Cancel</Button>
            <Button
              onClick={handleSendEmail}
              disabled={isSendingEmail || (emailType === "custom" && (!customEmailSubject.trim() || !customEmailBody.trim()))}
              className="bg-gradient-to-r from-[#8d44d1] to-[#7030b0] text-white border-0"
            >
              {isSendingEmail ? "Sending…" : <><Send className="w-4 h-4 mr-2" />Send Email</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Broadcast Email Dialog */}
      <Dialog open={broadcastOpen} onOpenChange={open => { setBroadcastOpen(open); if (!open) setBroadcastResult(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="w-4 h-4" />
              Broadcast Email
            </DialogTitle>
            <DialogDescription>
              Send a message to multiple users at once.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Recipients</Label>
              <Select value={broadcastFilter} onValueChange={setBroadcastFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active users only ({users.filter(u => !u.suspended).length})</SelectItem>
                  <SelectItem value="all">All users ({users.length})</SelectItem>
                  <SelectItem value="admins">Admins only ({users.filter(u => u.role === "admin").length})</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Input
                placeholder="Email subject"
                value={broadcastSubject}
                onChange={e => setBroadcastSubject(e.target.value)}
                disabled={isBroadcasting}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Message</Label>
              <Textarea
                placeholder="Write your message here…"
                value={broadcastBody}
                onChange={e => setBroadcastBody(e.target.value)}
                rows={5}
                disabled={isBroadcasting}
              />
            </div>

            {broadcastResult && (
              <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm space-y-1">
                <p className="text-green-600 font-medium">Sent: {broadcastResult.sent}</p>
                {broadcastResult.failed > 0 && (
                  <p className="text-destructive font-medium">Failed: {broadcastResult.failed}</p>
                )}
              </div>
            )}

            {isBroadcasting && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent inline-block" />
                Sending emails, please wait…
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBroadcastOpen(false)} disabled={isBroadcasting}>Cancel</Button>
            <Button
              onClick={handleBroadcast}
              disabled={isBroadcasting || !broadcastSubject.trim() || !broadcastBody.trim()}
              className="bg-gradient-to-r from-[#8d44d1] to-[#7030b0] text-white border-0"
            >
              {isBroadcasting
                ? "Sending…"
                : <><Send className="w-4 h-4 mr-2" />Send to {
                    broadcastFilter === "all" ? users.length
                    : broadcastFilter === "admins" ? users.filter(u => u.role === "admin").length
                    : users.filter(u => !u.suspended).length
                  } users</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Change Confirmation Dialog */}
      <Dialog open={selectedUser !== null} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {newRole === 'admin' ? 'Grant Admin Access' : 'Remove Admin Access'}
            </DialogTitle>
            <DialogDescription>
              {newRole === 'admin' 
                ? `Are you sure you want to make ${selectedUser?.firstName} ${selectedUser?.lastName} an administrator? They will have full access to manage projects, approve transactions, and manage users.`
                : `Are you sure you want to remove admin access from ${selectedUser?.firstName} ${selectedUser?.lastName}? They will no longer be able to access the admin panel.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>
              Cancel
            </Button>
            <Button 
              variant={newRole === 'admin' ? 'default' : 'destructive'}
              onClick={handleRoleChange}
              disabled={isChangingRole}
            >
              {isChangingRole ? 'Updating...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ProtectedAdminUsersPage() {
  return (
    <ProtectedRoute>
      <AdminUsersPage />
    </ProtectedRoute>
  )
}
