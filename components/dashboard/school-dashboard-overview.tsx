'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import Header from '@/components/layout/header'
import { SubmitCaseModal } from '@/components/cases/submit-case-modal'
import { SchoolImpactReport } from '@/components/schools/school-impact-report'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import {
  Plus, Download, Clock, CheckCircle, HelpCircle, Rocket, ArrowRight,
  MapPin, Phone, Hash, Building2, ExternalLink,
} from 'lucide-react'
import type { EducationCase } from '@/lib/types'

interface SchoolUser {
  uid: string
  schoolName?: string
  schoolStatus?: 'pending' | 'approved' | 'rejected'
  schoolAddress?: string
  schoolRegistrationNumber?: string
  schoolContactName?: string
  schoolContactPhone?: string
  schoolReviewNotes?: string
  schoolAppliedAt?: any
}

function statusMeta(status: string) {
  const map: Record<string, { label: string; icon: any; className: string }> = {
    submitted: { label: 'Submitted', icon: Clock, className: 'bg-amber-500/10 text-amber-700' },
    needs_info: { label: 'Needs Info', icon: HelpCircle, className: 'bg-orange-500/10 text-orange-700' },
    verified: { label: 'Verified', icon: CheckCircle, className: 'bg-blue-500/10 text-blue-700' },
    published: { label: 'Live', icon: Rocket, className: 'bg-emerald-500/10 text-emerald-700' },
    outcome_submitted: { label: 'Outcome In Review', icon: Clock, className: 'bg-blue-500/10 text-blue-700' },
    closed: { label: 'Closed', icon: CheckCircle, className: 'bg-emerald-600/10 text-emerald-700' },
    rejected: { label: 'Not Approved', icon: HelpCircle, className: 'bg-red-500/10 text-red-700' },
  }
  const s = map[status] || map.submitted
  return { ...s, Icon: s.icon }
}

export function SchoolDashboardOverview({ user }: { user: SchoolUser }) {
  const [cases, setCases] = useState<EducationCase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitOpen, setIsSubmitOpen] = useState(false)
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

  const isPending = user.schoolStatus === 'pending'
  const isRejected = user.schoolStatus === 'rejected'
  const isApproved = user.schoolStatus === 'approved'

  const liveCases = cases.filter((c) => ['published', 'outcome_submitted', 'closed'].includes(c.status))
  const needingAttention = cases.filter((c) => c.status === 'needs_info')
  const totalNeed = liveCases.reduce((sum, c) => sum + (c.estimatedCost || 0), 0)

  const stats = [
    { label: 'Cases Submitted', value: cases.length },
    { label: 'Live', value: liveCases.length },
    { label: 'Needing Your Attention', value: needingAttention.length },
    { label: 'Total Need Represented', value: `₦${totalNeed.toLocaleString()}` },
  ]

  return (
    <div className="min-h-screen bg-editorial-cream">
      <Header title={user.schoolName || 'Partner School'} subtitle="School Dashboard" />
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold tracking-[0.15em] text-editorial-muted uppercase mb-2">School Dashboard</p>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-editorial-navy">
              Welcome back, {user.schoolName || 'Partner School'}
            </h1>
          </div>
          {isApproved && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowImpactReport(true)}
                className="inline-flex items-center gap-2 rounded-full border border-editorial-border text-editorial-navy text-sm font-semibold px-5 h-11 hover:bg-editorial-cream-soft transition-colors"
              >
                <Download className="w-4 h-4" /> Impact Report
              </button>
              <button
                onClick={() => setIsSubmitOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-editorial-navy text-white text-sm font-semibold px-5 h-11 hover:bg-editorial-navy-deep transition-colors"
              >
                <Plus className="w-4 h-4" /> Submit a New Case
              </button>
            </div>
          )}
        </div>

        {/* Status banner */}
        {isPending && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 mb-8">
            <p className="font-semibold text-amber-800 mb-1">Your application is under review</p>
            <p className="text-sm text-amber-700">
              We're reviewing {user.schoolName || 'your school'}'s partnership application. You'll be able to submit Education Cases once it's approved — we'll email you.
            </p>
          </div>
        )}
        {isRejected && (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-5 mb-8">
            <p className="font-semibold text-red-800 mb-1">Application not approved</p>
            <p className="text-sm text-red-700">{user.schoolReviewNotes || 'Please contact us if you would like more information or wish to reapply.'}</p>
          </div>
        )}

        {isApproved && (
          <>
            {/* Stat tiles */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl border border-editorial-border bg-editorial-cream-soft p-5">
                  <p className="font-display text-2xl font-bold text-editorial-navy mb-1">{s.value}</p>
                  <p className="text-xs text-editorial-muted leading-snug">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-[1fr_320px] gap-8">
              {/* Cases list */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl font-bold text-editorial-navy">Your Cases</h2>
                  <Link href="/dashboard/my-cases" className="inline-flex items-center gap-1 text-sm font-medium text-editorial-navy hover:underline">
                    View all <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="h-20 rounded-2xl border border-editorial-border bg-editorial-cream-soft animate-pulse" />
                    ))}
                  </div>
                ) : cases.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-editorial-border p-10 text-center">
                    <p className="text-editorial-navy font-medium mb-1">No cases yet</p>
                    <p className="text-sm text-editorial-muted mb-4">Submit your first case to start finding partners.</p>
                    <button
                      onClick={() => setIsSubmitOpen(true)}
                      className="inline-flex items-center gap-2 rounded-full bg-editorial-navy text-white text-sm font-semibold px-5 h-11 hover:bg-editorial-navy-deep transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Submit a Case
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cases.slice(0, 5).map((c) => {
                      const meta = statusMeta(c.status)
                      const Icon = meta.Icon
                      return (
                        <div key={c.id} className="flex items-center justify-between gap-4 rounded-2xl border border-editorial-border bg-editorial-cream-soft p-4">
                          <div className="min-w-0">
                            <p className="font-medium text-editorial-navy truncate">{c.title}</p>
                            <p className="text-xs text-editorial-muted">₦{c.estimatedCost?.toLocaleString()}</p>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${meta.className}`}>
                              <Icon className="w-3 h-3" /> {meta.label}
                            </span>
                            {c.status === 'published' || c.status === 'closed' ? (
                              c.projectId && (
                                <a href={`/projects/${c.projectId}`} target="_blank" rel="noreferrer" className="text-editorial-navy">
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )
                            ) : null}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* School profile card */}
              <div className="rounded-2xl border border-editorial-border bg-editorial-cream-soft p-6 h-fit">
                <h3 className="font-display text-lg font-bold text-editorial-navy mb-4">School Profile</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <Building2 className="w-4 h-4 text-editorial-muted mt-0.5 flex-shrink-0" />
                    <span className="text-editorial-ink">{user.schoolName || '—'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-editorial-muted mt-0.5 flex-shrink-0" />
                    <span className="text-editorial-ink">{user.schoolAddress || 'Not provided'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 text-editorial-muted mt-0.5 flex-shrink-0" />
                    <span className="text-editorial-ink">{user.schoolContactName} · {user.schoolContactPhone || 'Not provided'}</span>
                  </div>
                  {user.schoolRegistrationNumber && (
                    <div className="flex items-start gap-2">
                      <Hash className="w-4 h-4 text-editorial-muted mt-0.5 flex-shrink-0" />
                      <span className="text-editorial-ink">{user.schoolRegistrationNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <SubmitCaseModal open={isSubmitOpen} onOpenChange={setIsSubmitOpen} />

      <Dialog open={showImpactReport} onOpenChange={setShowImpactReport}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>School Impact Report</DialogTitle>
            <DialogDescription>A shareable summary of your school's partnership with ZeroUp.</DialogDescription>
          </DialogHeader>
          <SchoolImpactReport
            schoolName={user.schoolName || 'Partner School'}
            casesSubmitted={cases.length}
            casesPublished={liveCases.length}
            totalEstimatedNeed={totalNeed}
            memberSince={user.schoolAppliedAt}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
