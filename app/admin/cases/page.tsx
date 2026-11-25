"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { collection, onSnapshot, query, orderBy, doc, updateDoc, getDoc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase/client"
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
import { Loader2, CheckCircle, XCircle, HelpCircle, Search, ExternalLink, Rocket, Camera } from "lucide-react"
import { NotificationHelpers } from "@/lib/notifications"
import { ConvertCaseModal } from "@/components/cases/convert-case-modal"
import type { EducationCase, CaseStatus } from "@/lib/types"

const STATUS_LABEL: Record<CaseStatus, string> = {
  submitted: 'Submitted',
  needs_info: 'Needs Info',
  verified: 'Verified',
  published: 'Published',
  outcome_submitted: 'Outcome Pending',
  closed: 'Closed',
  rejected: 'Rejected',
}

function AdminCasesPage() {
  const { user } = useAuth()
  const [cases, setCases] = useState<EducationCase[]>([])
  const [selected, setSelected] = useState<EducationCase | null>(null)
  const [notes, setNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [filter, setFilter] = useState<'all' | CaseStatus>('submitted')
  const [searchQuery, setSearchQuery] = useState("")
  const [convertCase, setConvertCase] = useState<EducationCase | null>(null)
  const [outcomeCase, setOutcomeCase] = useState<EducationCase | null>(null)
  const [isPublishingOutcome, setIsPublishingOutcome] = useState(false)

  useEffect(() => {
    const q = query(collection(db, "cases"), orderBy("createdAt", "desc"))
    const unsubscribe = onSnapshot(q, (snap) => {
      const data: EducationCase[] = []
      snap.forEach((d) => data.push({ id: d.id, ...(d.data() as any) }))
      setCases(data)
    })
    return () => unsubscribe()
  }, [])

  async function notifyAndEmail(type: 'case_needs_info' | 'case_verified' | 'case_rejected', c: EducationCase, extraNotes: string) {
    try {
      // users/{uid} is publicly readable, so a direct client read is enough
      // to resolve the school's contact email/name for the notification.
      const schoolSnap = await getDoc(doc(db, 'users', c.schoolId))
      const school = schoolSnap.exists() ? schoolSnap.data() : null
      const to = school?.email
      if (to) {
        await authedFetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to,
            type,
            data: { contactName: school?.schoolContactName?.split(' ')[0], schoolName: c.schoolName, caseTitle: c.title, notes: extraNotes || undefined },
          }),
        })
      }
    } catch {
      toast.error("Status updated, but the notification email could not be sent.")
    }
  }

  const handleRequestInfo = async () => {
    if (!selected) return
    setIsProcessing(true)
    try {
      await updateDoc(doc(db, "cases", selected.id), { status: 'needs_info', verificationNotes: notes })
      await NotificationHelpers.caseNeedsInfo(selected.schoolId, selected.title, notes || undefined)
      await notifyAndEmail('case_needs_info', selected, notes)
      toast.success("Requested more info from the school.")
      setSelected(null); setNotes("")
    } catch (err) { console.error(err); toast.error("Failed to update case.") }
    finally { setIsProcessing(false) }
  }

  const handleVerify = async () => {
    if (!selected) return
    setIsProcessing(true)
    try {
      await updateDoc(doc(db, "cases", selected.id), { status: 'verified', verificationNotes: notes })
      await NotificationHelpers.caseVerified(selected.schoolId, selected.title)
      await notifyAndEmail('case_verified', selected, notes)
      toast.success("Case verified — ready to convert to a project.")
      setSelected(null); setNotes("")
    } catch (err) { console.error(err); toast.error("Failed to update case.") }
    finally { setIsProcessing(false) }
  }

  const handleReject = async () => {
    if (!selected) return
    setIsProcessing(true)
    try {
      await updateDoc(doc(db, "cases", selected.id), { status: 'rejected', verificationNotes: notes })
      await NotificationHelpers.caseRejected(selected.schoolId, selected.title, notes || undefined)
      await notifyAndEmail('case_rejected', selected, notes)
      toast.success("Case rejected.")
      setSelected(null); setNotes("")
    } catch (err) { console.error(err); toast.error("Failed to update case.") }
    finally { setIsProcessing(false) }
  }

  const handleConverted = async (projectId: string) => {
    if (convertCase) {
      await NotificationHelpers.caseConvertedToProject(convertCase.schoolId, convertCase.title)
      try {
        const schoolSnap = await getDoc(doc(db, 'users', convertCase.schoolId))
        const school = schoolSnap.exists() ? schoolSnap.data() : null
        if (school?.email) {
          authedFetch('/api/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: school.email,
              type: 'case_published',
              data: {
                contactName: school.schoolContactName?.split(' ')[0],
                schoolName: convertCase.schoolName,
                caseTitle: convertCase.title,
                projectUrl: `${window.location.origin}/projects/${projectId}`,
              },
            }),
          }).catch(() => {})
        }
      } catch {}
    }
    setConvertCase(null)
  }

  const handlePublishOutcome = async () => {
    if (!outcomeCase) return
    setIsPublishingOutcome(true)
    try {
      const idToken = await auth?.currentUser?.getIdToken()
      if (!idToken) throw new Error('No auth token available. Please refresh and try again.')
      const res = await fetch(`/api/admin/cases/${outcomeCase.id}/publish-outcome`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${idToken}` },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to publish outcome.')

      await NotificationHelpers.caseOutcomePublished(outcomeCase.schoolId, outcomeCase.title)
      const schoolSnap = await getDoc(doc(db, 'users', outcomeCase.schoolId))
      const school = schoolSnap.exists() ? schoolSnap.data() : null
      if (school?.email) {
        authedFetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: school.email,
            type: 'case_outcome_published',
            data: {
              contactName: school.schoolContactName?.split(' ')[0],
              schoolName: outcomeCase.schoolName,
              caseTitle: outcomeCase.title,
              projectUrl: `${window.location.origin}/projects/${data.projectId}`,
            },
          }),
        }).catch(() => {})
      }
      toast.success('Outcome published — now visible on the live project.')
      setOutcomeCase(null)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to publish outcome.')
    } finally {
      setIsPublishingOutcome(false)
    }
  }

  const filteredCases = cases.filter((c) => {
    const matchesFilter = filter === 'all' ? true : c.status === filter
    const matchesSearch = searchQuery === '' ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.schoolName?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  if (!user || user.role !== "admin") {
    return <p>You do not have permission to view this page.</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Education Cases</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Review, verify, and publish cases submitted by partner schools.</p>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex space-x-2 overflow-x-auto pb-2 md:pb-0">
          {(['all', 'submitted', 'needs_info', 'verified', 'published', 'outcome_submitted', 'closed', 'rejected'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              onClick={() => setFilter(status)}
              className="whitespace-nowrap text-sm"
              size="sm"
            >
              {status === 'all' ? 'All' : STATUS_LABEL[status]} ({cases.filter(c => status === 'all' ? true : c.status === status).length})
            </Button>
          ))}
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by title or school..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cases</CardTitle>
          <CardDescription>{filter === 'all' ? 'All cases' : `${STATUS_LABEL[filter as CaseStatus]} cases`}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-6 px-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Estimated Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.title}</TableCell>
                    <TableCell>{c.schoolName}</TableCell>
                    <TableCell className="capitalize">{c.caseType?.replace('_', ' ')}</TableCell>
                    <TableCell>₦{c.estimatedCost?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={
                        c.status === 'published' || c.status === 'closed' ? 'default' :
                        c.status === 'rejected' ? 'destructive' : 'secondary'
                      }>
                        {STATUS_LABEL[c.status].toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex gap-2">
                      {(c.status === 'submitted' || c.status === 'needs_info') && (
                        <Button variant="outline" size="sm" onClick={() => { setSelected(c); setNotes(c.verificationNotes || "") }}>Review</Button>
                      )}
                      {c.status === 'verified' && (
                        <Button size="sm" onClick={() => setConvertCase(c)}>
                          <Rocket className="w-3.5 h-3.5 mr-1" /> Convert to Project
                        </Button>
                      )}
                      {c.status === 'outcome_submitted' && (
                        <Button size="sm" onClick={() => setOutcomeCase(c)}>
                          <Camera className="w-3.5 h-3.5 mr-1" /> Review Outcome
                        </Button>
                      )}
                      {(c.status === 'published' || c.status === 'closed') && c.projectId && (
                        <a href={`/projects/${c.projectId}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-editorial-navy dark:text-editorial-cream hover:underline">
                          View <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCases.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No cases match this filter.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Review Case Dialog */}
      <Dialog open={selected !== null} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Case</DialogTitle>
            <DialogDescription>Verify what's real before it can be converted into a public project.</DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-sm font-medium">School</Label><p className="text-sm">{selected.schoolName}</p></div>
                <div><Label className="text-sm font-medium">Type</Label><p className="text-sm capitalize">{selected.caseType?.replace('_', ' ')}</p></div>
                <div><Label className="text-sm font-medium">Beneficiary</Label><p className="text-sm">{selected.beneficiaryDisplayName} {selected.beneficiaryAgeGrade ? `(${selected.beneficiaryAgeGrade})` : ''} {selected.anonymize && <Badge variant="secondary" className="ml-1">Anonymize publicly</Badge>}</p></div>
                <div><Label className="text-sm font-medium">Estimated Cost</Label><p className="text-sm">₦{selected.estimatedCost?.toLocaleString()}</p></div>
                <div><Label className="text-sm font-medium">Urgency</Label><p className="text-sm capitalize">{selected.urgency || 'Not specified'}</p></div>
                <div><Label className="text-sm font-medium">Consent Confirmed</Label><p className="text-sm">{selected.consentConfirmed ? 'Yes' : 'No — flag this'}</p></div>
              </div>

              <div>
                <Label className="text-sm font-medium">Narrative</Label>
                <p className="text-sm whitespace-pre-wrap">{selected.narrative}</p>
              </div>

              {selected.budgetItems && selected.budgetItems.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Itemized Costs</Label>
                  <ul className="text-sm list-disc list-inside">
                    {selected.budgetItems.map((b) => <li key={b.id}>{b.name} — ₦{b.amount?.toLocaleString()}</li>)}
                  </ul>
                </div>
              )}

              {selected.photos && selected.photos.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Photos</Label>
                  <div className="flex gap-2 flex-wrap mt-1">
                    {selected.photos.map((p, i) => <img key={i} src={p} alt="" className="h-20 w-20 object-cover rounded border" />)}
                  </div>
                </div>
              )}

              {selected.documents && selected.documents.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Documents</Label>
                  <div className="flex gap-2 flex-col mt-1">
                    {selected.documents.map((docUrl, i) => (
                      <a key={i} href={docUrl} target="_blank" rel="noreferrer" className="text-sm text-editorial-navy dark:text-editorial-cream hover:underline">Document {i + 1}</a>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (what you checked / feedback to the school)</Label>
                <Textarea id="notes" placeholder="e.g. Called the school, confirmed enrollment and fee balance." value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <div className="flex flex-wrap gap-2 justify-end">
              <Button variant="destructive" onClick={handleReject} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4 mr-2" /> Reject</>}
              </Button>
              <Button variant="outline" onClick={handleRequestInfo} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><HelpCircle className="w-4 h-4 mr-2" /> Request Info</>}
              </Button>
              <Button onClick={handleVerify} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-2" /> Verify</>}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConvertCaseModal educationCase={convertCase} onOpenChange={(o) => !o && setConvertCase(null)} onConverted={handleConverted} />

      {/* Review Outcome Dialog */}
      <Dialog open={outcomeCase !== null} onOpenChange={() => setOutcomeCase(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Outcome Update</DialogTitle>
            <DialogDescription>Publishing makes this visible on the live project page to every partner who funded it.</DialogDescription>
          </DialogHeader>
          {outcomeCase && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">What the school reported</Label>
                <p className="text-sm whitespace-pre-wrap">{outcomeCase.outcomeNote}</p>
              </div>
              {outcomeCase.outcomePhotos && outcomeCase.outcomePhotos.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {outcomeCase.outcomePhotos.map((p, i) => <img key={i} src={p} alt="" className="h-20 w-20 object-cover rounded border" />)}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOutcomeCase(null)}>Cancel</Button>
            <Button onClick={handlePublishOutcome} disabled={isPublishingOutcome}>
              {isPublishingOutcome ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Publishing…</> : <><CheckCircle className="w-4 h-4 mr-2" /> Publish Outcome</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ProtectedAdminCasesPage() {
  return (
    <ProtectedRoute>
      <AdminCasesPage />
    </ProtectedRoute>
  )
}
