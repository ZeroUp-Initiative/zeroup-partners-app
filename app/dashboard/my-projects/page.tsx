'use client'

import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { useAuth } from '@/contexts/auth-context'
import ProtectedRoute from '@/components/auth/protected-route'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, Loader2, Plus, Edit, Trash2, Eye, ArrowLeft, Calendar, Banknote, MapPin, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react'
import { uploadImage, validateImageFile } from '@/lib/image-upload'
import toast from 'react-hot-toast'
import Header from '@/components/layout/header'
import { SubmitProjectModal } from '@/components/projects/submit-project-modal'
import { RichContentFields } from '@/components/projects/rich-content-fields'
import type { Project } from '@/lib/types'

const CATEGORIES = [
  'Education', 'Healthcare', 'Technology', 'Environment',
  'Economic Development', 'Agriculture', 'Youth & Sports', 'Arts & Culture', 'Other',
]

const PHASES = [
  { value: 'idea', label: 'Idea — Still in concept stage' },
  { value: 'planning', label: 'Planning — Actively designing the project' },
  { value: 'pilot', label: 'Pilot — Running a small test' },
  { value: 'active', label: 'Active — Already running, need more funds' },
]

function MyProjectsPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [editForm, setEditForm] = useState<Partial<Project>>({})
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [editError, setEditError] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitProjectOpen, setIsSubmitProjectOpen] = useState(false)

  useEffect(() => {
    if (!user?.uid) return

    const q = query(collection(db, 'projects'), where('submittedBy', '==', user.uid))
    const unsubscribe = onSnapshot(q, (snap) => {
      const data: Project[] = []
      snap.forEach((d) => {
        const p = d.data()
        data.push({
          id: d.id,
          title: p.title,
          description: p.description,
          fundingGoal: p.fundingGoal,
          currentFunding: p.currentFunding || 0,
          status: p.status || 'pending',
          imageUrl: p.imageUrl,
          dueDate: p.dueDate ? p.dueDate.toDate?.() ?? p.dueDate : null,
          category: p.category,
          location: p.location,
          phase: p.phase,
          background: p.background,
          fundingBreakdown: p.fundingBreakdown,
          expectedBeneficiaries: p.expectedBeneficiaries,
          expectedOutcomes: p.expectedOutcomes,
          previousFunding: p.previousFunding,
          contactName: p.contactName,
          contactEmail: p.contactEmail,
          contactPhone: p.contactPhone,
          organizationName: p.organizationName,
          submittedByName: p.submittedByName,
          submittedByEmail: p.submittedByEmail,
          submittedBy: p.submittedBy,
          adminNotes: p.adminNotes,
          story: p.story,
          videoUrl: p.videoUrl,
          gallery: p.gallery,
          timeline: p.timeline,
          budgetPhases: p.budgetPhases,
          createdAt: p.createdAt,
        })
      })
      setProjects(data)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [user?.uid])

  const handleEditClick = (project: Project) => {
    setEditProject(project)
    setEditForm(project)
    setEditError('')
    setIsEditOpen(true)
  }

  const handleUpdateProject = async () => {
    if (!editProject) return

    if (!editForm.title?.trim() || !editForm.description?.trim()) {
      setEditError('Title and description are required.')
      return
    }

    setIsUpdating(true)
    setEditError('')

    try {
      let imageUrl = editForm.imageUrl
      if ((editForm as any).imageFile) {
        setIsUploading(true)
        const validation = validateImageFile((editForm as any).imageFile, 10)
        if (!validation.valid) {
          setEditError(validation.error || 'Invalid image file')
          setIsUpdating(false)
          setIsUploading(false)
          return
        }
        imageUrl = await uploadImage((editForm as any).imageFile)
        setIsUploading(false)
      }

      await updateDoc(doc(db, 'projects', editProject.id), {
        title: editForm.title?.trim(),
        description: editForm.description?.trim(),
        category: editForm.category,
        location: editForm.location?.trim(),
        fundingGoal: Number(editForm.fundingGoal),
        dueDate: editForm.dueDate ? new Date(editForm.dueDate as string) : null,
        phase: editForm.phase,
        background: editForm.background?.trim(),
        fundingBreakdown: editForm.fundingBreakdown?.trim(),
        expectedBeneficiaries: editForm.expectedBeneficiaries?.trim(),
        expectedOutcomes: editForm.expectedOutcomes?.trim(),
        previousFunding: editForm.previousFunding?.trim(),
        contactName: editForm.contactName?.trim(),
        contactEmail: editForm.contactEmail?.trim(),
        contactPhone: editForm.contactPhone?.trim(),
        organizationName: editForm.organizationName?.trim(),
        imageUrl,
        story: editForm.story?.trim() || '',
        videoUrl: editForm.videoUrl?.trim() || '',
        gallery: editForm.gallery || [],
        timeline: editForm.timeline || [],
        budgetPhases: editForm.budgetPhases || [],
        updatedAt: serverTimestamp(),
      })

      toast.success('Project updated successfully!')
      setIsEditOpen(false)
      setEditProject(null)
      setEditForm({})
    } catch (error: any) {
      console.error('Update error:', error)
      setEditError(error.message || 'Failed to update project. Please try again.')
    } finally {
      setIsUpdating(false)
      setIsUploading(false)
    }
  }

  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project)
    setDeleteError('')
    setIsDeleteOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return

    setIsDeleting(true)
    setDeleteError('')

    try {
      await deleteDoc(doc(db, 'projects', projectToDelete.id))
      toast.success('Project deleted successfully!')
      setIsDeleteOpen(false)
      setProjectToDelete(null)
    } catch (error: any) {
      console.error('Delete error:', error)
      
      // Provide specific error messages based on the error
      let errorMessage = 'Failed to delete project.'
      if (error.code === 'permission-denied') {
        errorMessage = 'You do not have permission to delete this project. Only the project owner can delete it.'
      } else if (error.message?.includes('permission')) {
        errorMessage = 'Permission denied. Please ensure you are the project owner.'
      }
      
      setDeleteError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; icon: any; className: string }> = {
      pending: { label: 'Pending Review', icon: Clock, className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
      open: { label: 'Open', icon: CheckCircle, className: 'bg-green-500/10 text-green-600 dark:text-green-400' },
      'fully-funded': { label: 'Funded', icon: CheckCircle, className: 'bg-[#8d44d1]/10 text-[#7030b0]' },
      closed: { label: 'Closed', icon: XCircle, className: 'bg-gray-500/10 text-gray-600' },
      rejected: { label: 'Rejected', icon: XCircle, className: 'bg-red-500/10 text-red-600 dark:text-red-400' },
    }
    const s = map[status] || map.closed
    const Icon = s.icon
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${s.className}`}>
        <Icon className="w-3 h-3" />
        {s.label}
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Please log in to view your projects.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title="My Projects" subtitle="Manage your submitted projects" />
      <main className="container mx-auto px-4 py-8">
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">My Projects</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Manage and track your submitted projects.</p>
        </div>
        <Button
          className="bg-gradient-to-r from-[#8d44d1] to-[#7030b0] text-white border-0"
          onClick={() => setIsSubmitProjectOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" /> New Project
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-4 bg-muted rounded w-5/6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Plus className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No projects yet</p>
            <p className="text-muted-foreground mb-4">Create your first project to start receiving funding.</p>
            <Button
              className="bg-gradient-to-r from-[#8d44d1] to-[#7030b0] text-white border-0"
              onClick={() => setIsSubmitProjectOpen(true)}
            >
              Submit a Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {/* Group by status */}
          {['pending', 'open', 'fully-funded', 'closed', 'rejected'].map((status) => {
            const statusProjects = projects.filter((p) => p.status === status)
            if (statusProjects.length === 0) return null

            return (
              <div key={status}>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  {statusBadge(status)}
                  <span className="text-muted-foreground text-sm">({statusProjects.length})</span>
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {statusProjects.map((project) => {
                    const progress = project.fundingGoal > 0 ? (project.currentFunding / project.fundingGoal) * 100 : 0

                    return (
                      <Card key={project.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
                        {project.imageUrl && (
                          <div className="aspect-video w-full overflow-hidden bg-muted">
                            <img
                              src={project.imageUrl}
                              alt={project.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <CardTitle className="text-base leading-snug line-clamp-2">{project.title}</CardTitle>
                            {statusBadge(project.status)}
                          </div>
                          {project.location && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {project.location}
                            </p>
                          )}
                        </CardHeader>
                        <CardContent className="flex-1 space-y-3">
                          <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>

                          {project.status !== 'rejected' && (
                            <>
                              <div>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="font-medium">₦{project.currentFunding.toLocaleString()}</span>
                                  <span className="text-muted-foreground">₦{project.fundingGoal.toLocaleString()}</span>
                                </div>
                                <Progress value={progress} />
                                <p className="text-xs text-center mt-1 text-muted-foreground">{progress.toFixed(1)}% funded</p>
                              </div>
                            </>
                          )}

                          {project.dueDate && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> Due: {new Date(project.dueDate).toLocaleDateString()}
                            </p>
                          )}

                          {project.adminNotes && project.status === 'rejected' && (
                            <Alert className="border-red-500/30 bg-red-500/5">
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                              <AlertDescription className="text-sm text-red-600 ml-2">
                                {project.adminNotes}
                              </AlertDescription>
                            </Alert>
                          )}

                          {project.status === 'pending' && (
                            <Alert className="border-amber-500/30 bg-amber-500/5">
                              <Clock className="h-4 w-4 text-amber-600" />
                              <AlertDescription className="text-sm text-amber-600 ml-2">
                                Your project is under review. You'll be notified once approved.
                              </AlertDescription>
                            </Alert>
                          )}
                        </CardContent>

                        <div className="flex gap-2 p-4 border-t">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleEditClick(project)}
                          >
                            <Edit className="w-4 h-4 mr-2" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            onClick={() => handleDeleteClick(project)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </Button>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update your project details. Admin will review changes to public fields.</DialogDescription>
          </DialogHeader>

          {editError && (
            <Alert className="border-red-500/30 bg-red-500/5">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-sm text-red-600 ml-2">{editError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Project Title</Label>
              <Input
                value={editForm.title || ''}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                placeholder="e.g., Education for 100 Children"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editForm.description || ''}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Describe the project's goals and impact."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={editForm.category || ''}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={editForm.location || ''}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  placeholder="e.g., Lagos, Nigeria"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Funding Goal (₦)</Label>
                <Input
                  type="number"
                  value={editForm.fundingGoal || ''}
                  onChange={(e) => setEditForm({ ...editForm, fundingGoal: Number(e.target.value) })}
                  placeholder="500000"
                />
              </div>

              <div className="space-y-2">
                <Label>Target Date</Label>
                <Input
                  type="date"
                  value={
                    editForm.dueDate
                      ? editForm.dueDate instanceof Date
                        ? editForm.dueDate.toISOString().split('T')[0]
                        : ''
                      : ''
                  }
                  onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Phase</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={editForm.phase || ''}
                onChange={(e) => setEditForm({ ...editForm, phase: e.target.value })}
              >
                <option value="">Select phase</option>
                {PHASES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Background</Label>
              <Textarea
                value={editForm.background || ''}
                onChange={(e) => setEditForm({ ...editForm, background: e.target.value })}
                placeholder="What problem does this project solve?"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>How Will Funds Be Used?</Label>
              <Textarea
                value={editForm.fundingBreakdown || ''}
                onChange={(e) => setEditForm({ ...editForm, fundingBreakdown: e.target.value })}
                placeholder="Provide a breakdown of how funding will be spent."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Contact Name</Label>
              <Input
                value={editForm.contactName || ''}
                onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Contact Email</Label>
              <Input
                type="email"
                value={editForm.contactEmail || ''}
                onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Contact Phone</Label>
              <Input
                value={editForm.contactPhone || ''}
                onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })}
              />
            </div>

            <div className="pt-4 border-t space-y-1">
              <h3 className="font-semibold">Rich Content</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Add a full story, timeline, budget breakdown, video, and gallery to make your project page more detailed and convincing.
              </p>
              <RichContentFields
                value={{
                  story: editForm.story,
                  videoUrl: editForm.videoUrl,
                  gallery: editForm.gallery,
                  timeline: editForm.timeline,
                  budgetPhases: editForm.budgetPhases,
                }}
                onChange={(next) => setEditForm((prev) => ({ ...prev, ...next }))}
                fundingGoal={Number(editForm.fundingGoal) || 0}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateProject}
              disabled={isUpdating || isUploading}
              className="bg-gradient-to-r from-[#8d44d1] to-[#7030b0] text-white border-0"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{projectToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="ml-2">{deleteError}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
      </main>
      <SubmitProjectModal open={isSubmitProjectOpen} onOpenChange={setIsSubmitProjectOpen} />
    </div>
  )
}

export default function ProtectedMyProjectsPage() {
  return (
    <ProtectedRoute>
      <MyProjectsPage />
    </ProtectedRoute>
  )
}
