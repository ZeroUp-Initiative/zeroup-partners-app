"use client"

import { useState, useEffect } from "react"
import { collection, onSnapshot, doc, updateDoc, query, orderBy, QuerySnapshot, DocumentData, QueryDocumentSnapshot } from "firebase/firestore"
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  Ban
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
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)
  const [isChangingRole, setIsChangingRole] = useState(false)
  const [newRole, setNewRole] = useState<string>("")
  const itemsPerPage = 10

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
  }, [searchQuery]);

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

      {/* Search */}
      <div className="relative w-full md:w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
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
                            <Button variant="ghost" size="sm" disabled={userData.id === user.uid}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {userData.role === 'admin' ? (
                              <DropdownMenuItem 
                                onClick={() => openRoleDialog(userData, 'user')}
                                className="text-destructive"
                              >
                                <ShieldOff className="w-4 h-4 mr-2" />
                                Remove Admin
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => openRoleDialog(userData, 'admin')}>
                                <Shield className="w-4 h-4 mr-2" />
                                Make Admin
                              </DropdownMenuItem>
                            )}
                            {(userData.flagged || userData.suspended) && (
                              <DropdownMenuItem onClick={() => handleClearFlags(userData)}>
                                <User className="w-4 h-4 mr-2" />
                                Clear Flags & Reactivate
                              </DropdownMenuItem>
                            )}
                            {!userData.suspended && userData.role !== 'admin' && (
                              <DropdownMenuItem 
                                onClick={() => handleSuspendUser(userData)}
                                className="text-destructive"
                              >
                                <Ban className="w-4 h-4 mr-2" />
                                Suspend User
                              </DropdownMenuItem>
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
