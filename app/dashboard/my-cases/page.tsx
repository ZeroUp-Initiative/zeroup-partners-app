'use client'

import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { useAuth } from '@/contexts/auth-context'
import ProtectedRoute from '@/components/auth/protected-route'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, Loader2, Clock, CheckCircle, XCircle, HelpCircle, Rocket, ExternalLink, Camera, Download, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import Header from '@/components/layout/header'
import { SubmitCaseModal } from '@/components/cases/submit-case-modal'
import { SchoolImpactReport } from '@/components/schools/school-impact-report'
import { uploadImage, validateImageFile } from '@/lib/image-upload'
import type { EducationCase } from '@/lib/types'

function statusBadge(status: string) {
  const map: Record<string, { label: string; icon: any; className: string }> = {
    submitted: { label: 'Submitted', icon: Clock, className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
    needs_info: { label: 'Needs Info', icon: HelpCircle, className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
    verified: { label: 'Verified', icon: CheckCircle, className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    published: { label: 'Live', icon: Rocket, className: 'bg-green-500/10 text-green-600 dark:text-green-400' },
    outcome_submitted: { label: 'Outcome In Review', icon: Clock, className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
    closed: { label: 'Closed — Outcome Live', icon: CheckCircle, className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
    rejected: { label: 'Not Approved', icon: XCircle, className: 'bg-red-500/10 text-red-600 dark:text-red-400' },
  }
  const s = map[status] || map.submitted
  const Icon = s.icon
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${s.className}`}>
      <Icon className="w-3 h-3" /> {s.label}
    </div>
  )
}

function MyCasesPage() {
  const { user } = useAuth()
  const [cases, setCases] = useState<EducationCase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitOpen, setIsSubmitOpen] = useState(false)
  const [resubmitCase, setResubmitCase] = useState<EducationCase | null>(null)
  const [resubmitResponse, setResubmitResponse] = useState('')
  const [isResubmitting, setIsResubmitting] = useState(false)
  const [outcomeCase, setOutcomeCase] = useState<EducationCase | null>(null)
  const [outcomeNote, setOutcomeNote] = useState('')
  const [outcomePhotos, setOutcomePhotos] = useState<string[]>([])
  const [isUploadingOutcome, setIsUploadingOutcome] = useState(false)
  const [isSubmittingOutcome, setIsSubmittingOutcome] = useState(false)
  const [showImpactReport, setShowImpactReport] = useState(false)

  useEffect(() => {
    if (!user?.uid) return
    const q = query(collection(db, 'cases'), where('schoolId', '==', user.uid))
    const unsubscribe = onSnapshot(q, (snap) => {
      const data: EducationCase[] = []
      snap.forEach((d) => data.push({ id: d.id, ...(d.data() as any) }))
      data.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
      setCases(data)
      setIsLoading(false)
    })
    return () => unsubscribe()
  }, [user?.uid])

  const handleResubmit = async () => {
    if (!resubmitCase) return
    setIsResubmitting(true)
    try {
      const updatedNarrative = resubmitResponse.trim()
        ? `${resubmitCase.narrative}\n\n— Follow-up: ${resubmitResponse.trim()}`
        : resubmitCase.narrative
      await updateDoc(doc(db, 'cases', resubmitCase.id), {
        narrative: updatedNarrative,
        status: 'submitted',
        updatedAt: serverTimestamp(),
      })
      toast.success('Case resubmitted for review.')
      setResubmitCase(null)
      setResubmitResponse('')
    } catch (err) {
      console.error(err)
      toast.error('Failed to resubmit. Please try again.')
    } finally {
      setIsResubmitting(false)
    }
  }

  const handleOutcomePhotoUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setIsUploadingOutcome(true)
    try {
      for (const file of Array.from(files)) {
        const validation = validateImageFile(file)
        if (!validation.valid) { toast.error(validation.error || 'Invalid file.'); continue }
        const url = await uploadImage(file)
        setOutcomePhotos(prev => [...prev, url])
      }
    } catch {
      toast.error('Upload failed. Please try again.')
    } finally {
      setIsUploadingOutcome(false)
    }
  }

  const handleSubmitOutcome = async () => {
    if (!outcomeCase) return
    if (!outcomeNote.trim()) { toast.error('Please describe what happened.'); return }
    setIsSubmittingOutcome(true)
    try {
      await updateDoc(doc(db, 'cases', outcomeCase.id), {
        status: 'outcome_submitted',
        outcomeNote: outcomeNote.trim(),
        outcomePhotos,
        outcomeSubmittedAt: serverTimestamp(),
      })
      fetch('/api/settings/payment')
        .then(r => r.json())
        .then(settings => {
          if (settings.adminNotificationEmail) {
            return fetch('/api/email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: settings.adminNotificationEmail,
                type: 'admin_case_outcome_submitted',
                data: { schoolName: outcomeCase.schoolName, caseTitle: outcomeCase.title },
              }),
            })
          }
        }).catch(() => {})
      toast.success('Outcome update submitted — our team will review it before it goes live.')
      setOutcomeCase(null); setOutcomeNote(''); setOutcomePhotos([])
    } catch (err) {
      console.error(err)
      toast.error('Failed to submit outcome. Please try again.')
    } finally {
      setIsSubmittingOutcome(false)
    }
  }

  const publishedCount = cases.filter(c => c.status === 'published' || c.status === 'outcome_submitted' || c.status === 'closed').length
  const totalRaisedEstimate = cases
    .filter(c => c.status === 'published' || c.status === 'outcome_submitted' || c.status === 'closed')
    .reduce((s, c) => s + (c.estimatedCost || 0), 0)

  if (!user) {
    return <div className="text-center py-12"><p className="text-muted-foreground">Please log in to view your cases.</p></div>
  }

  if (user.role !== 'school' || (user as any).schoolStatus !== 'approved') {
    return (
      <div className="min-h-screen bg-background">
        <Header title="My Cases" subtitle="Education Cases" />
        <main className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">
            {user.role === 'school'
              ? "Your school application is still under review — you'll be able to submit cases once it's approved."
              : "This area is for approved partner schools. Apply from the signup page to get started."}
          </p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title="My Cases" subtitle="Submit and track Education Cases for your school" />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">My Cases</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Real, specific needs at your school — we verify each one before it goes live for partnership.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowImpactReport(true)}>
                <Download className="w-4 h-4 mr-2" /> Impact Report
              </Button>
              <Button className="bg-editorial-navy hover:bg-editorial-navy-deep text-editorial-cream border-0" onClick={() => setIsSubmitOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> New Case
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[...Array(2)].map((_, i) => (
                <Card key={i} className="animate-pulse"><CardHeader><div className="h-6 bg-muted rounded w-3/4" /></CardHeader></Card>
              ))}
            </div>
          ) : cases.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Plus className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No cases yet</p>
                <p className="text-muted-foreground mb-4">Submit your first case to start finding partners.</p>
                <Button className="bg-editorial-navy hover:bg-editorial-navy-deep text-editorial-cream border-0" onClick={() => setIsSubmitOpen(true)}>
                  Submit a Case
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {cases.map((c) => (
                <Card key={c.id} className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <CardTitle className="text-base leading-snug line-clamp-2">{c.title}</CardTitle>
                      {statusBadge(c.status)}
                    </div>
                    <p className="text-xs text-muted-foreground">Estimated cost: ₦{c.estimatedCost?.toLocaleString()}</p>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col gap-3">
                    <p className="text-sm text-muted-foreground line-clamp-3">{c.narrative}</p>

                    {c.status === 'needs_info' && (
                      <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 p-3 space-y-2">
                        <p className="text-xs font-medium text-orange-700 dark:text-orange-400">What we need from you</p>
                        <p className="text-xs text-muted-foreground">{c.verificationNotes || 'Please review and provide more detail.'}</p>
                        <Button size="sm" variant="outline" onClick={() => { setResubmitCase(c); setResubmitResponse('') }}>
                          Respond &amp; Resubmit
                        </Button>
                      </div>
                    )}

                    {c.status === 'rejected' && c.verificationNotes && (
                      <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                        <p className="text-xs font-medium text-red-700 dark:text-red-400">Reviewer feedback</p>
                        <p className="text-xs text-muted-foreground">{c.verificationNotes}</p>
                      </div>
                    )}

                    {c.status === 'published' && c.projectId && (
                      <div className="mt-auto space-y-2">
                        <a href={`/projects/${c.projectId}`} className="inline-flex items-center gap-1 text-sm text-editorial-navy dark:text-editorial-cream hover:underline">
                          View Live Project <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <Button size="sm" variant="outline" className="w-full" onClick={() => { setOutcomeCase(c); setOutcomeNote(''); setOutcomePhotos([]) }}>
                          <Camera className="w-3.5 h-3.5 mr-1" /> Submit Outcome Update
                        </Button>
                      </div>
                    )}

                    {c.status === 'outcome_submitted' && (
                      <p className="text-xs text-muted-foreground mt-auto">Outcome update submitted — awaiting review before it goes public.</p>
                    )}

                    {c.status === 'closed' && c.projectId && (
                      <a href={`/projects/${c.projectId}`} className="inline-flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 hover:underline mt-auto">
                        View Published Outcome <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <SubmitCaseModal open={isSubmitOpen} onOpenChange={setIsSubmitOpen} />

      <Dialog open={resubmitCase !== null} onOpenChange={() => setResubmitCase(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respond &amp; Resubmit</DialogTitle>
            <DialogDescription>Add the information requested, then resubmit for review.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="resubmitResponse">Your response</Label>
            <Textarea id="resubmitResponse" rows={4} value={resubmitResponse} onChange={(e) => setResubmitResponse(e.target.value)} placeholder="Provide the requested detail..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResubmitCase(null)}>Cancel</Button>
            <Button onClick={handleResubmit} disabled={isResubmitting}>
              {isResubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Resubmitting…</> : 'Resubmit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={outcomeCase !== null} onOpenChange={() => setOutcomeCase(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Outcome Update</DialogTitle>
            <DialogDescription>Tell partners what happened — this closes the loop on their support. Our team reviews it before it goes public.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="outcomeNote">What happened?</Label>
              <Textarea id="outcomeNote" rows={4} value={outcomeNote} onChange={(e) => setOutcomeNote(e.target.value)} placeholder="e.g. Fees were paid in full and the student resumed classes this term." />
            </div>
            <div className="space-y-1.5">
              <Label>Photos (optional)</Label>
              <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 text-sm text-muted-foreground cursor-pointer hover:border-primary/50">
                <Upload className="w-4 h-4" /> {isUploadingOutcome ? 'Uploading…' : 'Click to upload photo(s)'}
                <input type="file" accept="image/*" multiple hidden disabled={isUploadingOutcome} onChange={(e) => handleOutcomePhotoUpload(e.target.files)} />
              </label>
              {outcomePhotos.length > 0 && <p className="text-xs text-muted-foreground">{outcomePhotos.length} photo(s) uploaded.</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOutcomeCase(null)}>Cancel</Button>
            <Button onClick={handleSubmitOutcome} disabled={isSubmittingOutcome || isUploadingOutcome}>
              {isSubmittingOutcome ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…</> : 'Submit for Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showImpactReport} onOpenChange={setShowImpactReport}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>School Impact Report</DialogTitle>
            <DialogDescription>A shareable summary of your school's partnership with ZeroUp.</DialogDescription>
          </DialogHeader>
          <SchoolImpactReport
            schoolName={(user as any)?.schoolName || 'Partner School'}
            casesSubmitted={cases.length}
            casesPublished={publishedCount}
            totalEstimatedNeed={totalRaisedEstimate}
            memberSince={(user as any)?.schoolAppliedAt}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ProtectedMyCasesPage() {
  return (
    <ProtectedRoute>
      <MyCasesPage />
    </ProtectedRoute>
  )
}
