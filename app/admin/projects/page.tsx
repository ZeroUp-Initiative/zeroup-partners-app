"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { collection, addDoc, onSnapshot, query, orderBy, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase/client"
import { uploadImage, validateImageFile } from "@/lib/image-upload"
import ProtectedRoute from "@/components/auth/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Loader2, DollarSign, Target, PieChart, Plus, Search, Pencil, Trash2, Clock, CheckCircle, XCircle, Eye, Phone, Mail, User, Building2, Users, Banknote, Calendar } from "lucide-react"
import toast from "react-hot-toast"

interface Project {
  id: string
  title: string
  description: string
  fundingGoal: number
  currentFunding: number
  status: string
  imageUrl?: string
  dueDate?: any
  category?: string
  location?: string
  phase?: string
  // Private fields
  background?: string
  fundingBreakdown?: string
  expectedBeneficiaries?: string
  expectedOutcomes?: string
  previousFunding?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  organizationName?: string
  submittedByName?: string
  submittedByEmail?: string
  adminNotes?: string
  createdAt?: any
}

function AdminProjectsPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [newProject, setNewProject] = useState({ title: "", description: "", fundingGoal: "", dueDate: "", imageFile: null as File | null })
  const [stats, setStats] = useState({ totalProjects: 0, totalGoal: 0, totalRaised: 0, pendingCount: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Edit
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({ id: "", title: "", description: "", fundingGoal: "", dueDate: "", imageUrl: "", imageFile: null as File | null })

  // Delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)

  // Review (approve/reject)
  const [reviewProject, setReviewProject] = useState<Project | null>(null)
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const [adminNotes, setAdminNotes] = useState("")
  const [isReviewing, setIsReviewing] = useState(false)

  useEffect(() => {
    const q = query(collection(db, "projects"), orderBy("createdAt", "desc"))
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
          status: p.status || 'open',
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
          adminNotes: p.adminNotes,
          createdAt: p.createdAt,
        })
      })
      setProjects(data)

      const live = data.filter(p => p.status !== 'pending' && p.status !== 'rejected')
      setStats({
        totalProjects: live.length,
        totalGoal: live.reduce((s, p) => s + p.fundingGoal, 0),
        totalRaised: live.reduce((s, p) => s + p.currentFunding, 0),
        pendingCount: data.filter(p => p.status === 'pending').length,
      })
    })
    return () => unsubscribe()
  }, [])

  const filtered = (status: string | null) =>
    projects
      .filter(p => status ? p.status === status : p.status !== 'pending' && p.status !== 'rejected')
      .filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      )

  // Create
  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProject.title || !newProject.description || !newProject.fundingGoal) { setError("Please fill out all required fields."); return }
    setIsLoading(true); setError("")
    try {
      let imageUrl = ""
      if (newProject.imageFile) {
        setIsUploading(true)
        const v = validateImageFile(newProject.imageFile, 10)
        if (!v.valid) { setError(v.error || "Invalid file"); setIsLoading(false); setIsUploading(false); return }
        imageUrl = await uploadImage(newProject.imageFile)
        setIsUploading(false)
      }
      await addDoc(collection(db, "projects"), {
        title: newProject.title, description: newProject.description,
        fundingGoal: Number(newProject.fundingGoal), currentFunding: 0,
        status: 'open', imageUrl,
        dueDate: newProject.dueDate ? new Date(newProject.dueDate) : null,
        createdAt: serverTimestamp(),
      })
      setNewProject({ title: "", description: "", fundingGoal: "", dueDate: "", imageFile: null })
      setIsCreateModalOpen(false)
      toast.success("Project created.")
    } catch { setError("Failed to create project.") }
    finally { setIsLoading(false); setIsUploading(false) }
  }

  // Edit
  const handleEditClick = (p: Project) => {
    setEditFormData({ id: p.id, title: p.title, description: p.description, fundingGoal: p.fundingGoal.toString(), dueDate: p.dueDate ? new Date(p.dueDate).toISOString().split('T')[0] : "", imageUrl: p.imageUrl || "", imageFile: null })
    setIsEditModalOpen(true)
  }

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true); setError("")
    try {
      let imageUrl = editFormData.imageUrl
      if (editFormData.imageFile) {
        setIsUploading(true)
        const v = validateImageFile(editFormData.imageFile, 10)
        if (!v.valid) { setError(v.error || "Invalid file"); setIsLoading(false); setIsUploading(false); return }
        imageUrl = await uploadImage(editFormData.imageFile)
        setIsUploading(false)
      }
      await updateDoc(doc(db, "projects", editFormData.id), {
        title: editFormData.title, description: editFormData.description,
        fundingGoal: Number(editFormData.fundingGoal), imageUrl,
        dueDate: editFormData.dueDate ? new Date(editFormData.dueDate) : null,
      })
      setIsEditModalOpen(false)
      toast.success("Project updated.")
    } catch { setError("Failed to update project.") }
    finally { setIsLoading(false); setIsUploading(false) }
  }

  // Delete
  const handleConfirmDelete = async () => {
    if (!projectToDelete) return
    setIsLoading(true)
    try { await deleteDoc(doc(db, "projects", projectToDelete.id)); setIsDeleteModalOpen(false); setProjectToDelete(null); toast.success("Project deleted.") }
    catch { setError("Failed to delete project.") }
    finally { setIsLoading(false) }
  }

  const sendProjectEmail = (type: string, project: Project, notes?: string) => {
    const to = project.contactEmail || project.submittedByEmail
    if (!to) return
    const name = project.contactName || project.submittedByName || 'Partner'
    fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, type, data: { name, title: project.title, notes } }),
    }).catch(() => {})
  }

  // Approve
  const handleApprove = async () => {
    if (!reviewProject) return
    setIsReviewing(true)
    try {
      await updateDoc(doc(db, "projects", reviewProject.id), {
        status: 'open',
        adminNotes: adminNotes.trim(),
        reviewedAt: serverTimestamp(),
        reviewedBy: user?.uid || '',
      })
      sendProjectEmail('project_approved', reviewProject, adminNotes.trim() || undefined)
      toast.success("Project approved and published!")
      setIsReviewOpen(false)
      setReviewProject(null)
      setAdminNotes("")
    } catch { toast.error("Failed to approve project.") }
    finally { setIsReviewing(false) }
  }

  // Reject
  const handleReject = async () => {
    if (!reviewProject) return
    setIsReviewing(true)
    try {
      await updateDoc(doc(db, "projects", reviewProject.id), {
        status: 'rejected',
        adminNotes: adminNotes.trim(),
        reviewedAt: serverTimestamp(),
        reviewedBy: user?.uid || '',
      })
      sendProjectEmail('project_rejected', reviewProject, adminNotes.trim() || undefined)
      toast.success("Project rejected.")
      setIsReviewOpen(false)
      setReviewProject(null)
      setAdminNotes("")
    } catch { toast.error("Failed to reject project.") }
    finally { setIsReviewing(false) }
  }

  const openReview = (p: Project) => { setReviewProject(p); setAdminNotes(p.adminNotes || ""); setIsReviewOpen(true) }

  if (!user || user.role !== "admin") return <p>You do not have permission to view this page.</p>

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      open: { label: 'Open', className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' },
      'fully-funded': { label: 'Funded', className: 'bg-[#8d44d1]/10 text-[#7030b0] dark:text-[#a05cd4] border-[#8d44d1]/20' },
      closed: { label: 'Closed', className: 'bg-muted text-muted-foreground border-border' },
      pending: { label: 'Pending', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
      rejected: { label: 'Rejected', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
    }
    const s = map[status] || map.closed
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${s.className}`}>{s.label}</span>
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Manage Projects</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Create projects, review submissions, and oversee funding.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 mb-6">
        {[
          { label: 'Live Projects', value: stats.totalProjects, icon: PieChart },
          { label: 'Total Goal', value: `₦${stats.totalGoal.toLocaleString()}`, icon: Target },
          { label: 'Total Raised', value: `₦${stats.totalRaised.toLocaleString()}`, icon: DollarSign },
          { label: 'Pending Review', value: stats.pendingCount, icon: Clock, highlight: stats.pendingCount > 0 },
        ].map(({ label, value, icon: Icon, highlight }) => (
          <Card key={label} className={highlight ? 'border-amber-500/30' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className={`h-4 w-4 ${highlight ? 'text-amber-500' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className={`text-xl font-bold ${highlight ? 'text-amber-600 dark:text-amber-400' : ''}`}>{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="live">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
          <TabsList>
            <TabsTrigger value="live">Live</TabsTrigger>
            <TabsTrigger value="pending" className="relative">
              Pending
              {stats.pendingCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold">{stats.pendingCount}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
          <div className="flex flex-col sm:flex-row gap-3 sm:ml-auto w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search projects…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)} className="whitespace-nowrap bg-gradient-to-r from-[#8d44d1] to-[#7030b0] text-white border-0">
              <Plus className="w-4 h-4 mr-2" /> Create Project
            </Button>
          </div>
        </div>

        {/* Live projects */}
        <TabsContent value="live" className="space-y-2">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered(null).map(project => {
              const progress = project.fundingGoal > 0 ? (project.currentFunding / project.fundingGoal) * 100 : 0
              return (
                <Card key={project.id}>
                  {project.imageUrl && (
                    <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                      <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-snug">{project.title}</CardTitle>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {statusBadge(project.status)}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditClick(project)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => { setProjectToDelete(project); setIsDeleteModalOpen(true) }}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                    <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">₦{project.currentFunding.toLocaleString()}</span>
                        <span className="text-muted-foreground">₦{project.fundingGoal.toLocaleString()}</span>
                      </div>
                      <Progress value={progress} />
                      <p className="text-xs text-center mt-1 text-muted-foreground">{progress.toFixed(1)}% funded</p>
                    </div>
                    {project.dueDate && <p className="text-xs text-muted-foreground">Due: {new Date(project.dueDate).toLocaleDateString()}</p>}
                  </CardContent>
                </Card>
              )
            })}
          </div>
          {filtered(null).length === 0 && <div className="text-center py-12 text-muted-foreground">No live projects found.</div>}
        </TabsContent>

        {/* Pending submissions */}
        <TabsContent value="pending" className="space-y-4">
          {filtered('pending').length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No pending submissions.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered('pending').map(project => (
                <Card key={project.id} className="border-amber-500/20">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {statusBadge(project.status)}
                          {project.category && <span className="text-xs text-muted-foreground">{project.category}</span>}
                        </div>
                        <CardTitle className="text-lg">{project.title}</CardTitle>
                        <CardDescription className="mt-1">{project.location}</CardDescription>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button size="sm" variant="outline" onClick={() => openReview(project)}>
                          <Eye className="w-3.5 h-3.5 mr-1.5" /> Review
                        </Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => openReview(project)}>
                          <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Approve
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{project.description}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Banknote className="w-3.5 h-3.5" /> Goal: ₦{project.fundingGoal.toLocaleString()}</span>
                      {project.submittedByName && <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {project.submittedByName}</span>}
                      {project.contactEmail && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {project.contactEmail}</span>}
                      {project.createdAt && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {project.createdAt.toDate?.()?.toLocaleDateString() || 'N/A'}</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Rejected */}
        <TabsContent value="rejected" className="space-y-4">
          {filtered('rejected').length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <XCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No rejected submissions.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filtered('rejected').map(project => (
                <Card key={project.id} className="border-red-500/20 opacity-75">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {statusBadge(project.status)}
                        <CardTitle className="text-base mt-1">{project.title}</CardTitle>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setProjectToDelete(project); setIsDeleteModalOpen(true) }}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                    {project.adminNotes && <p className="text-xs text-muted-foreground mt-2 italic">Notes: {project.adminNotes}</p>}
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Review Modal */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Project Submission</DialogTitle>
            <DialogDescription>Full details submitted by the applicant.</DialogDescription>
          </DialogHeader>
          {reviewProject && (
            <div className="space-y-5">
              {/* Public info */}
              <div className="rounded-xl border p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Public Information</p>
                <div>
                  <p className="font-bold text-lg">{reviewProject.title}</p>
                  {reviewProject.location && <p className="text-sm text-muted-foreground">{reviewProject.location} · {reviewProject.category}</p>}
                </div>
                <p className="text-sm">{reviewProject.description}</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span><span className="text-muted-foreground">Goal:</span> ₦{reviewProject.fundingGoal.toLocaleString()}</span>
                  <span><span className="text-muted-foreground">Phase:</span> {reviewProject.phase || 'N/A'}</span>
                  {reviewProject.dueDate && <span><span className="text-muted-foreground">Target:</span> {new Date(reviewProject.dueDate).toLocaleDateString()}</span>}
                </div>
              </div>

              {/* Private project details */}
              <div className="rounded-xl border border-dashed p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">🔒 Project Details (Private)</p>
                {reviewProject.background && (
                  <div><p className="text-xs text-muted-foreground mb-1">Background</p><p className="text-sm">{reviewProject.background}</p></div>
                )}
                {reviewProject.fundingBreakdown && (
                  <div><p className="text-xs text-muted-foreground mb-1">How Funds Will Be Used</p><p className="text-sm">{reviewProject.fundingBreakdown}</p></div>
                )}
                {reviewProject.expectedBeneficiaries && (
                  <div className="flex items-start gap-1.5"><Users className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" /><div><p className="text-xs text-muted-foreground">Expected Beneficiaries</p><p className="text-sm">{reviewProject.expectedBeneficiaries}</p></div></div>
                )}
                {reviewProject.expectedOutcomes && (
                  <div><p className="text-xs text-muted-foreground mb-1">Expected Outcomes</p><p className="text-sm">{reviewProject.expectedOutcomes}</p></div>
                )}
                {reviewProject.previousFunding && (
                  <div><p className="text-xs text-muted-foreground mb-1">Previous Funding</p><p className="text-sm">{reviewProject.previousFunding}</p></div>
                )}
              </div>

              {/* Contact info */}
              <div className="rounded-xl border border-dashed p-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">🔒 Contact Information (Private)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {reviewProject.contactName && <span className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" />{reviewProject.contactName}</span>}
                  {reviewProject.organizationName && <span className="flex items-center gap-2"><Building2 className="w-4 h-4 text-muted-foreground" />{reviewProject.organizationName}</span>}
                  {reviewProject.contactEmail && <span className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" />{reviewProject.contactEmail}</span>}
                  {reviewProject.contactPhone && <span className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" />{reviewProject.contactPhone}</span>}
                  {reviewProject.submittedByEmail && <span className="flex items-center gap-2 text-muted-foreground text-xs col-span-2">Submitted via account: {reviewProject.submittedByEmail}</span>}
                </div>
              </div>

              {/* Admin notes */}
              <div className="space-y-1.5">
                <Label>Admin Notes (optional, visible to your team)</Label>
                <Textarea placeholder="Add any notes about this decision…" value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={3} />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-end">
                <Button variant="outline" onClick={() => setIsReviewOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleReject} disabled={isReviewing}>
                  {isReviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4 mr-1.5" /> Reject</>}
                </Button>
                <Button onClick={handleApprove} disabled={isReviewing} className="bg-green-600 hover:bg-green-700 text-white">
                  {isReviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-1.5" /> Approve & Publish</>}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Project Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create a New Project</DialogTitle>
            <DialogDescription>This project will go live immediately.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddProject} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="title">Project Title</Label><Input id="title" name="title" placeholder="e.g., Education for 100 Children" value={newProject.title} onChange={e => setNewProject(p => ({ ...p, title: e.target.value }))} required /></div>
            <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" name="description" placeholder="Describe the project's goals and impact." value={newProject.description} onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))} required /></div>
            <div className="space-y-2"><Label htmlFor="fundingGoal">Funding Goal (₦)</Label><Input id="fundingGoal" name="fundingGoal" type="number" placeholder="500000" value={newProject.fundingGoal} onChange={e => setNewProject(p => ({ ...p, fundingGoal: e.target.value }))} required /></div>
            <div className="space-y-2"><Label htmlFor="dueDate">Due Date</Label><Input id="dueDate" name="dueDate" type="date" value={newProject.dueDate} onChange={e => setNewProject(p => ({ ...p, dueDate: e.target.value }))} /></div>
            <div className="space-y-2">
              <Label htmlFor="projectImage">Project Image (Optional)</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors">
                <input id="projectImage" type="file" accept=".jpg,.jpeg,.png,.gif,.webp" onChange={e => setNewProject(p => ({ ...p, imageFile: e.target.files?.[0] || null }))} className="hidden" disabled={isLoading} />
                <label htmlFor="projectImage" className="cursor-pointer block">
                  {isUploading ? <Loader2 className="w-6 h-6 text-primary mx-auto mb-2 animate-spin" /> : <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />}
                  <p className="text-sm font-medium truncate">{newProject.imageFile ? newProject.imageFile.name : "Click to upload image"}</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG, GIF, WebP (max 10MB)</p>
                </label>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading || isUploading} className="bg-gradient-to-r from-[#8d44d1] to-[#7030b0] text-white border-0">
                {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{isUploading ? 'Uploading…' : 'Creating…'}</> : 'Create Project'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Project</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdateProject} className="space-y-4">
            <div className="space-y-2"><Label>Title</Label><Input name="title" value={editFormData.title} onChange={e => setEditFormData(p => ({ ...p, title: e.target.value }))} required /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea name="description" value={editFormData.description} onChange={e => setEditFormData(p => ({ ...p, description: e.target.value }))} required /></div>
            <div className="space-y-2"><Label>Funding Goal (₦)</Label><Input name="fundingGoal" type="number" value={editFormData.fundingGoal} onChange={e => setEditFormData(p => ({ ...p, fundingGoal: e.target.value }))} required /></div>
            <div className="space-y-2"><Label>Due Date</Label><Input name="dueDate" type="date" value={editFormData.dueDate} onChange={e => setEditFormData(p => ({ ...p, dueDate: e.target.value }))} /></div>
            <div className="space-y-2">
              <Label>Project Image</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors">
                <input id="edit-projectImage" type="file" accept=".jpg,.jpeg,.png,.gif,.webp" onChange={e => setEditFormData(p => ({ ...p, imageFile: e.target.files?.[0] || null }))} className="hidden" disabled={isLoading} />
                <label htmlFor="edit-projectImage" className="cursor-pointer block">
                  {isUploading ? <Loader2 className="w-6 h-6 text-primary mx-auto mb-2 animate-spin" /> : <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />}
                  <p className="text-sm truncate">{editFormData.imageFile ? editFormData.imageFile.name : editFormData.imageUrl ? 'Change image' : 'Upload image'}</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG, GIF, WebP (max 10MB)</p>
                </label>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading || isUploading}>{isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Project</DialogTitle><DialogDescription>Are you sure? This cannot be undone.</DialogDescription></DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isLoading}>{isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ProtectedAdminProjectsPage() {
  return <ProtectedRoute><AdminProjectsPage /></ProtectedRoute>
}
