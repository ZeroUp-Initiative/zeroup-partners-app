"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { collection, addDoc, onSnapshot, query, orderBy, updateDoc, deleteDoc, doc } from "firebase/firestore"
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
import { Upload, Loader2, DollarSign, Target, PieChart, Plus, Search, Pencil, Trash2 } from "lucide-react"

interface Project {
  id: string;
  title: string;
  description: string;
  fundingGoal: number;
  currentFunding: number;
  status: string;
  imageUrl?: string;
  dueDate?: any; // Timestamp or date string
  daysLeft?: number;
}

function AdminProjectsPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [newProject, setNewProject] = useState({ title: "", description: "", fundingGoal: "", dueDate: "", imageFile: null as File | null })
  const [stats, setStats] = useState({ totalProjects: 0, totalGoal: 0, totalRaised: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({ 
    id: "", 
    title: "", 
    description: "", 
    fundingGoal: "", 
    dueDate: "", 
    imageUrl: "", 
    imageFile: null as File | null 
  })

  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)

  useEffect(() => {
    const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const projectsData: Project[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        projectsData.push({
          id: doc.id,
          title: data.title,
          description: data.description,
          fundingGoal: data.fundingGoal,
          currentFunding: data.currentFunding || 0,
          daysLeft: data.daysLeft, // Assuming this might be calculated or stored
          status: data.status || 'open',
          imageUrl: data.imageUrl,
          dueDate: data.dueDate ? data.dueDate.toDate() : null
        });
      });
      setProjects(projectsData);

      const totalGoal = projectsData.reduce((sum, p) => sum + p.fundingGoal, 0);
      const totalRaised = projectsData.reduce((sum, p) => sum + p.currentFunding, 0);
      setStats({
        totalProjects: projectsData.length,
        totalGoal,
        totalRaised
      });

    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewProject(prev => ({ ...prev, [name]: value }))
  }

  const filteredProjects = projects.filter(project => 
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setNewProject(prev => ({ ...prev, imageFile: file }))
  }

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.title || !newProject.description || !newProject.fundingGoal) {
      setError("Please fill out all fields.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      let imageUrl = "";
      
      // Upload image if provided
      if (newProject.imageFile) {
        setIsUploading(true);
        const validation = validateImageFile(newProject.imageFile, 10);
        if (!validation.valid) {
          setError(validation.error || "Invalid file");
          setIsLoading(false);
          setIsUploading(false);
          return;
        }
        imageUrl = await uploadImage(newProject.imageFile);
        setIsUploading(false);
      }

      await addDoc(collection(db, "projects"), {
        title: newProject.title,
        description: newProject.description,
        fundingGoal: Number(newProject.fundingGoal),
        currentFunding: 0,
        status: 'open', // e.g., open, fully-funded, closed
        imageUrl: imageUrl,
        dueDate: newProject.dueDate ? new Date(newProject.dueDate) : null,
        createdAt: new Date(),
      });
      setNewProject({ title: "", description: "", fundingGoal: "", dueDate: "", imageFile: null });
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error("Error adding project:", err);
      setError("Failed to create project. Please try again.");
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  }

  const handleEditClick = (project: Project) => {
    setEditFormData({
      id: project.id,
      title: project.title,
      description: project.description,
      fundingGoal: project.fundingGoal.toString(),
      dueDate: project.dueDate ? new Date(project.dueDate).toISOString().split('T')[0] : "",
      imageUrl: project.imageUrl || "",
      imageFile: null
    })
    setIsEditModalOpen(true)
  }

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setEditFormData(prev => ({ ...prev, imageFile: file }))
  }

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.title || !editFormData.description || !editFormData.fundingGoal) {
      setError("Please fill out all fields.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      let imageUrl = editFormData.imageUrl;

      // Upload new image if provided
      if (editFormData.imageFile) {
        setIsUploading(true);
        const validation = validateImageFile(editFormData.imageFile, 10);
        if (!validation.valid) {
          setError(validation.error || "Invalid file");
          setIsLoading(false);
          setIsUploading(false);
          return;
        }
        imageUrl = await uploadImage(editFormData.imageFile);
        setIsUploading(false);
      }

      const projectRef = doc(db, "projects", editFormData.id);
      await updateDoc(projectRef, {
        title: editFormData.title,
        description: editFormData.description,
        fundingGoal: Number(editFormData.fundingGoal),
        imageUrl: imageUrl,
        dueDate: editFormData.dueDate ? new Date(editFormData.dueDate) : null,
      });

      setIsEditModalOpen(false);
    } catch (err) {
      console.error("Error updating project:", err);
      setError("Failed to update project. Please try again.");
    } finally {
      setIsLoading(false);
      setIsUploading(false);
    }
  }

  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project)
    setIsDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;

    setIsLoading(true);
    try {
      await deleteDoc(doc(db, "projects", projectToDelete.id));
      setIsDeleteModalOpen(false);
      setProjectToDelete(null);
    } catch (err) {
      console.error("Error deleting project:", err);
      setError("Failed to delete project.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!user || user.role !== "admin") {
    return <p>You do not have permission to view this page.</p>
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Manage Projects</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Create and oversee funding goals for social impact projects.</p>
      </div>

       {/* Stats Cards */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">Across all initiatives</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Funding Goal</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{stats.totalGoal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Combined target amount</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{stats.totalRaised.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{stats.totalGoal > 0 ? ((stats.totalRaised / stats.totalGoal) * 100).toFixed(1) : 0}% of goal reached</p>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar and Create Button */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="whitespace-nowrap">
          <Plus className="w-4 h-4 mr-2" />
          Create Project
        </Button>
      </div>
      {/* Projects Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project) => {
          const progress = (project.currentFunding / project.fundingGoal) * 100;
          return (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              {project.imageUrl && (
                <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                  <img 
                    src={project.imageUrl} 
                    alt={project.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{project.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={project.status === 'fully-funded' ? 'secondary' : 'default'}>
                      {project.status.toUpperCase()}
                    </Badge>
                     <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(project)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeleteClick(project)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <CardDescription>
                  {project.description.length > 150 ? 
                    `${project.description.substring(0, 150)}...` : 
                    project.description
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">₦{project.currentFunding.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground">Goal: ₦{project.fundingGoal.toLocaleString()}</span>
                  </div>
                  <Progress value={progress} />
                  <p className="text-xs text-center mt-1 text-muted-foreground">{progress.toFixed(1)}% Funded</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Due: {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'N/A'}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {searchTerm ? "No projects found matching your search." : "No projects found."}
        </div>
      )}

      {/* Create Project Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create a New Project</DialogTitle>
            <DialogDescription>This project will be visible to partners for funding.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddProject} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title</Label>
              <Input id="title" name="title" placeholder="e.g., Education for 100 Children" value={newProject.title} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Project Description</Label>
              <Textarea id="description" name="description" placeholder="Describe the project's goals and impact." value={newProject.description} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fundingGoal">Funding Goal (₦)</Label>
              <Input id="fundingGoal" name="fundingGoal" type="number" placeholder="500000" value={newProject.fundingGoal} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
               <Input id="dueDate" name="dueDate" type="date" value={newProject.dueDate} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectImage">Project Image (Optional)</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors">
                <input 
                  id="projectImage" 
                  type="file" 
                  accept=".jpg,.jpeg,.png,.gif,.webp" 
                  onChange={handleFileChange} 
                  className="hidden" 
                  disabled={isLoading}
                />
                <label htmlFor="projectImage" className="cursor-pointer block">
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 text-primary mx-auto mb-2 animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                  )}
                  <p className="text-sm font-medium truncate">
                    {newProject.imageFile ? newProject.imageFile.name : "Click to upload project image"}
                  </p>
                  <p className="text-xs text-muted-foreground">JPG, PNG, GIF, WebP (max 10MB)</p>
                </label>
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || isUploading}>
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {isUploading ? "Uploading Image..." : "Creating..."}</>
                ) : (
                  "Create Project"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Project Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update the project details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateProject} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Project Title</Label>
              <Input id="edit-title" name="title" placeholder="e.g., Education for 100 Children" value={editFormData.title} onChange={handleEditInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Project Description</Label>
              <Textarea id="edit-description" name="description" placeholder="Describe the project's goals and impact." value={editFormData.description} onChange={handleEditInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-fundingGoal">Funding Goal (₦)</Label>
              <Input id="edit-fundingGoal" name="fundingGoal" type="number" placeholder="500000" value={editFormData.fundingGoal} onChange={handleEditInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dueDate">Due Date</Label>
               <Input id="edit-dueDate" name="dueDate" type="date" value={editFormData.dueDate} onChange={handleEditInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-projectImage">Project Image (Optional)</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors">
                <input 
                  id="edit-projectImage" 
                  type="file" 
                  accept=".jpg,.jpeg,.png,.gif,.webp" 
                  onChange={handleEditFileChange} 
                  className="hidden" 
                  disabled={isLoading}
                />
                <label htmlFor="edit-projectImage" className="cursor-pointer block">
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 text-primary mx-auto mb-2 animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                  )}
                  <p className="text-sm font-medium truncate">
                    {editFormData.imageFile ? editFormData.imageFile.name : (editFormData.imageUrl ? "Change current image" : "Click to upload project image")}
                  </p>
                  <p className="text-xs text-muted-foreground">JPG, PNG, GIF, WebP (max 10MB)</p>
                </label>
              </div>
              {editFormData.imageUrl && !editFormData.imageFile && (
                  <p className="text-xs text-muted-foreground mt-1">Current image will be kept if no new file is uploaded.</p>
              )}
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || isUploading}>
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {isUploading ? "Uploading Image..." : "Saving..."}</>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this project? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ProtectedAdminProjectsPage() {
  return (
    <ProtectedRoute>
      <AdminProjectsPage />
    </ProtectedRoute>
  )
}
