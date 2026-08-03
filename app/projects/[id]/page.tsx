'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { doc, onSnapshot, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import ProtectedRoute from '@/components/auth/protected-route'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ArrowLeft, Loader2, Sparkles, MapPin, Tag, Trash2 } from 'lucide-react'
import type { Project } from '@/lib/types'
import { VideoEmbed, parseVideoUrl } from '@/components/projects/video-embed'
import { ProjectTimeline } from '@/components/projects/project-timeline'
import { ProjectBudgetBreakdown } from '@/components/projects/project-budget-breakdown'
import { ProjectGallery } from '@/components/projects/project-gallery'
import { ContributeDialog } from '@/components/projects/contribute-dialog'

const VISIBLE_STATUSES = new Set(['open', 'fully-funded', 'closed'])

function ProjectDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [contributeOpen, setContributeOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'projects', params.id),
      (snap) => {
        if (!snap.exists()) {
          setNotFound(true)
          setLoading(false)
          return
        }
        const data = snap.data()
        if (!VISIBLE_STATUSES.has(data.status)) {
          setNotFound(true)
          setLoading(false)
          return
        }
        setProject({ id: snap.id, ...data } as Project)
        setLoading(false)
      },
      () => {
        setNotFound(true)
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (notFound || !project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <Sparkles className="w-10 h-10 text-muted-foreground" />
        <h1 className="text-xl font-bold">Project not found</h1>
        <p className="text-muted-foreground">This project doesn't exist or isn't public yet.</p>
        <Link href="/projects"><Button className="mt-2">Back to Projects</Button></Link>
      </div>
    )
  }

  const progress = project.fundingGoal > 0 ? (project.currentFunding / project.fundingGoal) * 100 : 0
  const hasVideo = !!parseVideoUrl(project.videoUrl)
  const hasTimeline = (project.timeline?.length || 0) > 0
  const hasBudget = (project.budgetPhases?.length || 0) > 0
  const hasGallery = (project.gallery?.length || 0) > 0
  const hasOutcomes = !!(project.expectedOutcomes || project.expectedBeneficiaries)
  const isFullyFunded = project.status === 'fully-funded'
  const isClosed = project.status === 'closed'
  const canContribute = project.status === 'open'
  const canDelete = !!user?.uid && project.submittedBy === user.uid

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteDoc(doc(db, 'projects', project.id))
      router.push('/projects')
    } catch (err) {
      console.error('Failed to delete project:', err)
      setIsDeleting(false)
    }
  }

  const FundingWidget = (
    <div className="rounded-2xl border bg-card p-5 space-y-4">
      <div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-lg font-bold">₦{project.currentFunding.toLocaleString()}</span>
          <span className="text-sm text-muted-foreground">of ₦{project.fundingGoal.toLocaleString()}</span>
        </div>
        <Progress value={progress} />
        <p className="text-xs text-center mt-1 text-muted-foreground">{progress.toFixed(1)}% funded</p>
      </div>
      <Badge variant={isFullyFunded ? 'secondary' : 'default'} className="w-full justify-center py-1">
        {project.status.toUpperCase()}
      </Badge>
      <Button
        className="w-full bg-gradient-to-r from-[#8d44d1] to-[#7030b0] text-white border-0"
        disabled={!canContribute}
        onClick={() => setContributeOpen(true)}
      >
        {isFullyFunded ? 'Goal Reached' : isClosed ? 'Closed' : 'Contribute to This Project'}
      </Button>
      {canDelete && (
        <Button
          variant="outline"
          className="w-full text-destructive hover:text-destructive"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="w-4 h-4 mr-2" /> Delete Project
        </Button>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] overflow-hidden">
        {hasVideo ? (
          <VideoEmbed url={project.videoUrl} className="w-full h-full" />
        ) : project.imageUrl ? (
          <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#8d44d1] to-[#7030b0]" />
        )}
        {!hasVideo && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        )}
        <div className="absolute top-4 left-4">
          <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-white/90 hover:text-white bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Projects
          </Link>
        </div>
        {!hasVideo && (
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8">
            <div className="container mx-auto">
              <div className="flex flex-wrap gap-2 mb-2">
                {project.category && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-white bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
                    <Tag className="w-3 h-3" /> {project.category}
                  </span>
                )}
                {project.location && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-white bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
                    <MapPin className="w-3 h-3" /> {project.location}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold text-white drop-shadow-sm">{project.title}</h1>
            </div>
          </div>
        )}
      </div>
      {hasVideo && (
        <div className="container mx-auto px-4 pt-6">
          <div className="flex flex-wrap gap-2 mb-2">
            {project.category && (
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-muted px-2.5 py-1 rounded-full">
                <Tag className="w-3 h-3" /> {project.category}
              </span>
            )}
            {project.location && (
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-muted px-2.5 py-1 rounded-full">
                <MapPin className="w-3 h-3" /> {project.location}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold">{project.title}</h1>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Funding widget — near top on mobile, sticky sidebar on desktop */}
          <div className="lg:hidden">{FundingWidget}</div>

          {/* Main content */}
          <div className="lg:col-span-2 space-y-10 lg:order-1">
            {/* Story */}
            <section>
              <h2 className="text-xl font-bold mb-3">About This Project</h2>
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {project.story || project.description}
              </p>
            </section>

            {hasTimeline && (
              <section>
                <h2 className="text-xl font-bold mb-4">Timeline</h2>
                <ProjectTimeline items={project.timeline!} />
              </section>
            )}

            {hasBudget && (
              <section>
                <h2 className="text-xl font-bold mb-4">Budget by Phase</h2>
                <ProjectBudgetBreakdown phases={project.budgetPhases!} fundingGoal={project.fundingGoal} />
              </section>
            )}

            {hasGallery && (
              <section>
                <h2 className="text-xl font-bold mb-4">Gallery</h2>
                <ProjectGallery images={project.gallery!} />
              </section>
            )}

            {hasOutcomes && (
              <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {project.expectedBeneficiaries && (
                  <div>
                    <h3 className="font-semibold mb-1.5">Expected Beneficiaries</h3>
                    <p className="text-sm text-muted-foreground">{project.expectedBeneficiaries}</p>
                  </div>
                )}
                {project.expectedOutcomes && (
                  <div>
                    <h3 className="font-semibold mb-1.5">Expected Outcomes</h3>
                    <p className="text-sm text-muted-foreground">{project.expectedOutcomes}</p>
                  </div>
                )}
              </section>
            )}

            {/* CTA footer */}
            <section className="rounded-2xl border bg-gradient-to-br from-[#8d44d1]/10 to-[#7030b0]/10 p-6 sm:p-8 text-center space-y-3">
              <h3 className="text-lg font-bold">Ready to partner on this project?</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Every contribution is custodially managed and routed directly toward this project's goals.
              </p>
              <Button
                size="lg"
                className="bg-gradient-to-r from-[#8d44d1] to-[#7030b0] text-white border-0"
                disabled={!canContribute}
                onClick={() => setContributeOpen(true)}
              >
                {isFullyFunded ? 'Goal Reached' : isClosed ? 'Closed' : 'Contribute Now'}
              </Button>
            </section>
          </div>

          {/* Sticky funding sidebar (desktop only) */}
          <div className="hidden lg:block lg:order-2">
            <div className="lg:sticky lg:top-24">{FundingWidget}</div>
          </div>
        </div>
      </div>

      <ContributeDialog project={project} open={contributeOpen} onOpenChange={setContributeOpen} />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{project.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ProtectedProjectDetailPage(props: { params: { id: string } }) {
  return (
    <ProtectedRoute>
      <ProjectDetailPage {...props} />
    </ProtectedRoute>
  )
}
