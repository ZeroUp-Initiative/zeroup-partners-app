"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { collection, onSnapshot, query, where, doc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/client"
import { authedFetch } from '@/lib/authed-fetch'
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
import { Loader2, CheckCircle, XCircle, Search, School as SchoolIcon, Inbox } from "lucide-react"
import { NotificationHelpers } from "@/lib/notifications"
import type { ReferralStatus } from "@/lib/types"

interface SchoolApplication {
  id: string
  schoolName: string
  schoolRegistrationNumber?: string
  schoolAddress?: string
  schoolContactName?: string
  schoolContactPhone?: string
  email: string
  schoolStatus: 'pending' | 'approved' | 'rejected'
  schoolAppliedAt?: any
  schoolReviewNotes?: string
}

interface ReferralLead {
  id: string
  submittedBy: string
  submittedByName?: string
  subjectName?: string
  contactInfo?: string
  description: string
  status: ReferralStatus
  createdAt: any
}

function AdminSchoolsPage() {
  const { user } = useAuth()
  const [activeView, setActiveView] = useState<'schools' | 'referrals'>('schools')

  const [schools, setSchools] = useState<SchoolApplication[]>([])
  const [selected, setSelected] = useState<SchoolApplication | null>(null)
  const [reviewNotes, setReviewNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [searchQuery, setSearchQuery] = useState("")

  const [referrals, setReferrals] = useState<ReferralLead[]>([])

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "school"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: SchoolApplication[] = []
      snapshot.forEach((docSnap) => {
        const d = docSnap.data()
        data.push({
          id: docSnap.id,
          schoolName: d.schoolName || 'Unnamed School',
          schoolRegistrationNumber: d.schoolRegistrationNumber,
          schoolAddress: d.schoolAddress,
          schoolContactName: d.schoolContactName,
          schoolContactPhone: d.schoolContactPhone,
          email: d.email,
          schoolStatus: d.schoolStatus || 'pending',
          schoolAppliedAt: d.schoolAppliedAt,
          schoolReviewNotes: d.schoolReviewNotes,
        })
      })
      data.sort((a, b) => (b.schoolAppliedAt?.toMillis?.() ?? 0) - (a.schoolAppliedAt?.toMillis?.() ?? 0))
      setSchools(data)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const q = query(collection(db, "referrals"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: ReferralLead[] = []
      snapshot.forEach((docSnap) => data.push({ id: docSnap.id, ...(docSnap.data() as any) }))
      data.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
      setReferrals(data)
    })
    return () => unsubscribe()
  }, [])

  async function sendSchoolEmail(type: 'school_approved' | 'school_rejected', school: SchoolApplication, notes: string) {
    try {
      await authedFetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: school.email,
          type,
          data: { schoolName: school.schoolName, contactName: school.schoolContactName?.split(' ')[0] || 'there', notes: notes || undefined },
        }),
      })
    } catch {
      toast.error("Status updated, but the notification email could not be sent.")
    }
  }

  const handleApprove = async () => {
    if (!selected) return
    setIsProcessing(true)
    try {
      await updateDoc(doc(db, "users", selected.id), {
        schoolStatus: 'approved',
        schoolReviewNotes: reviewNotes || '',
      })
      await NotificationHelpers.schoolApplicationApproved(selected.id, selected.schoolName)
      await sendSchoolEmail('school_approved', selected, reviewNotes)
      toast.success(`${selected.schoolName} approved as a partner school.`)
      setSelected(null)
      setReviewNotes("")
    } catch (err) {
      console.error(err)
      toast.error("Failed to approve school. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selected) return
    setIsProcessing(true)
    try {
      await updateDoc(doc(db, "users", selected.id), {
        schoolStatus: 'rejected',
        schoolReviewNotes: reviewNotes || '',
      })
      await NotificationHelpers.schoolApplicationRejected(selected.id, selected.schoolName, reviewNotes || undefined)
      await sendSchoolEmail('school_rejected', selected, reviewNotes)
      toast.success(`${selected.schoolName}'s application rejected.`)
      setSelected(null)
      setReviewNotes("")
    } catch (err) {
      console.error(err)
      toast.error("Failed to reject school. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const updateReferralStatus = async (referralId: string, status: ReferralStatus) => {
    try {
      await updateDoc(doc(db, "referrals", referralId), { status })
    } catch {
      toast.error("Failed to update referral status.")
    }
  }

  const filteredSchools = schools.filter((s) => {
    const matchesFilter = filter === 'all' ? true : s.schoolStatus === filter
    const matchesSearch = searchQuery === '' ||
      s.schoolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.schoolContactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  if (!user || user.role !== "admin") {
    return <p>You do not have permission to view this page.</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Partner Schools</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Review school applications and community-referred needs.</p>
      </div>

      <div className="flex gap-2">
        <Button variant={activeView === 'schools' ? 'default' : 'outline'} size="sm" onClick={() => setActiveView('schools')}>
          <SchoolIcon className="w-4 h-4 mr-2" /> Schools ({schools.length})
        </Button>
        <Button variant={activeView === 'referrals' ? 'default' : 'outline'} size="sm" onClick={() => setActiveView('referrals')}>
          <Inbox className="w-4 h-4 mr-2" /> Referrals ({referrals.length})
        </Button>
      </div>

      {activeView === 'schools' ? (
        <>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex space-x-2 overflow-x-auto pb-2 md:pb-0">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
                <Button
                  key={status}
                  variant={filter === status ? "default" : "outline"}
                  onClick={() => setFilter(status)}
                  className="capitalize whitespace-nowrap text-sm"
                  size="sm"
                >
                  {status} ({schools.filter(s => status === 'all' ? true : s.schoolStatus === status).length})
                </Button>
              ))}
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by school, contact, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Applications</CardTitle>
              <CardDescription>{filter === 'all' ? 'All schools' : `${filter} applications`}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto -mx-6 px-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>School</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSchools.map((school) => (
                      <TableRow key={school.id}>
                        <TableCell className="font-medium">{school.schoolName}</TableCell>
                        <TableCell>{school.schoolContactName || '—'}</TableCell>
                        <TableCell>{school.email}</TableCell>
                        <TableCell>
                          <Badge variant={
                            school.schoolStatus === 'approved' ? 'default' :
                            school.schoolStatus === 'rejected' ? 'destructive' : 'secondary'
                          }>
                            {school.schoolStatus.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {school.schoolStatus === 'pending' && (
                            <Button variant="outline" size="sm" onClick={() => { setSelected(school); setReviewNotes(school.schoolReviewNotes || "") }}>
                              Review
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredSchools.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No schools match this filter.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Referred Needs</CardTitle>
            <CardDescription>Leads flagged by partners — follow up, then convert into a school + case where appropriate.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-6 px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referred By</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.submittedByName || r.submittedBy}</TableCell>
                      <TableCell>{r.subjectName || '—'}</TableCell>
                      <TableCell className="max-w-xs truncate">{r.description}</TableCell>
                      <TableCell>{r.contactInfo || '—'}</TableCell>
                      <TableCell>
                        <Select value={r.status} onValueChange={(v) => updateReferralStatus(r.id, v as ReferralStatus)}>
                          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="converted">Converted</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                  {referrals.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No referrals yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review School Dialog */}
      <Dialog open={selected !== null} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review School Application</DialogTitle>
            <DialogDescription>Approve to let this school submit Education Cases, or reject with feedback.</DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">School Name</Label>
                  <p className="text-sm">{selected.schoolName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Registration No.</Label>
                  <p className="text-sm">{selected.schoolRegistrationNumber || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Contact</Label>
                  <p className="text-sm">{selected.schoolContactName} · {selected.schoolContactPhone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm">{selected.email}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium">Address</Label>
                  <p className="text-sm">{selected.schoolAddress || 'Not provided'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reviewNotes">Notes (shared with the school)</Label>
                <Textarea
                  id="reviewNotes"
                  placeholder="Add context for this decision..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <div className="flex space-x-2">
              <Button variant="destructive" onClick={handleReject} disabled={isProcessing}>
                {isProcessing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Rejecting...</> : <><XCircle className="w-4 h-4 mr-2" /> Reject</>}
              </Button>
              <Button onClick={handleApprove} disabled={isProcessing}>
                {isProcessing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Approving...</> : <><CheckCircle className="w-4 h-4 mr-2" /> Approve</>}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ProtectedAdminSchoolsPage() {
  return (
    <ProtectedRoute>
      <AdminSchoolsPage />
    </ProtectedRoute>
  )
}
