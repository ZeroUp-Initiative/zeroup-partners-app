export const dynamic = 'force-dynamic'

'use client'

import { useState, useEffect } from "react"
import { collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase/client"
import ProtectedRoute from "@/components/auth/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface Project {
  id: string;
  title: string;
  description: string;
  fundingGoal: number;
  currentFunding: number;
  status: string;
}

function AdminProjectsPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [newProject, setNewProject] = useState({ title: "", description: "", fundingGoal: "" })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

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
          status: data.status || 'open'
        });
      });
      setProjects(projectsData);
    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewProject(prev => ({ ...prev, [name]: value }))
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
      await addDoc(collection(db, "projects"), {
        title: newProject.title,
        description: newProject.description,
        fundingGoal: Number(newProject.fundingGoal),
        currentFunding: 0,
        status: 'open', // e.g., open, fully-funded, closed
        createdAt: new Date(),
      });
      setNewProject({ title: "", description: "", fundingGoal: "" }); // Reset form
    } catch (err) {
      console.error("Error adding project:", err);
      setError("Failed to create project. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!user || user.role !== "admin") {
    return <p>You do not have permission to view this page.</p>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Manage Projects</h1>
        <p className="text-muted-foreground">Create and oversee funding goals for social impact projects.</p>
      </div>

      <div className="grid gap-12 md:grid-cols-2">
        {/* Create New Project Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create a New Project</CardTitle>
            <CardDescription>This project will be visible to partners for funding.</CardDescription>
          </CardHeader>
          <CardContent>
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
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" disabled={isLoading}>{isLoading ? "Creating..." : "Create Project"}</Button>
            </form>
          </CardContent>
        </Card>

        {/* List of Existing Projects */}
        <Card>
          <CardHeader>
            <CardTitle>Existing Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Goal</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.title}</TableCell>
                    <TableCell>₦{project.fundingGoal.toLocaleString()}</TableCell>
                    <TableCell><Badge>{project.status.toUpperCase()}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
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
