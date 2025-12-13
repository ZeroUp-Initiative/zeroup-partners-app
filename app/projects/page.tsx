'use client'

import { useState, useEffect } from "react"
import { collection, onSnapshot, query, orderBy, doc, updateDoc, writeBatch } from "firebase/firestore"
import { db } from "@/lib/firebase/client"
import ProtectedRoute from "@/components/auth/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface Project {
  id: string;
  title: string;
  description: string;
  fundingGoal: number;
  currentFunding: number;
  status: 'open' | 'fully-funded' | 'closed';
}

function ProjectsPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [contributionAmount, setContributionAmount] = useState("")
  const [isContributing, setIsContributing] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const projectsData: Project[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        projectsData.push({ 
            id: doc.id, 
            ...data as Omit<Project, 'id'> 
        });
      });
      setProjects(projectsData);
    });
    return () => unsubscribe();
  }, []);

  const handleContributeClick = (project: Project) => {
    if (project.status !== 'open') return;
    setSelectedProject(project);
    setError("");
    setContributionAmount("");
  }

  const handleConfirmContribution = async () => {
    if (!selectedProject || !contributionAmount) {
        setError("Please enter an amount.");
        return;
    }
    const amount = parseFloat(contributionAmount);
    if (isNaN(amount) || amount <= 0) {
        setError("Please enter a valid amount.");
        return;
    }

    setIsContributing(true);
    setError("");

    try {
        const projectRef = doc(db, "projects", selectedProject.id);
        const newFunding = selectedProject.currentFunding + amount;
        const newStatus = newFunding >= selectedProject.fundingGoal ? 'fully-funded' : 'open';

        const batch = writeBatch(db);
        batch.update(projectRef, { 
            currentFunding: newFunding,
            status: newStatus
        });

        // This part is a placeholder. In a real app, you would verify the user has the funds.
        // For now, we'll create a transaction record to represent this contribution.
        const contributionRef = doc(collection(db, "payments"));
        batch.set(contributionRef, {
            amount: amount,
            projectId: selectedProject.id,
            projectTitle: selectedProject.title,
            userId: user?.uid,
            userFullName: `${user?.firstName} ${user?.lastName}`,
            status: 'approved', // Contributions to projects are auto-approved for now
            createdAt: new Date(),
            date: new Date(),
            description: `Contribution to project: ${selectedProject.title}`,
        });
        
        await batch.commit();
        
        setSelectedProject(null);
    } catch (err) {
        console.error("Contribution failed:", err);
        setError("Failed to process contribution. Please try again.");
    } finally {
        setIsContributing(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold">Our Social Impact Projects</h1>
        <p className="text-xl text-muted-foreground mt-2">Fund a project and make a direct impact.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => {
          const progress = (project.currentFunding / project.fundingGoal) * 100;
          return (
            <Card key={project.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{project.title}</CardTitle>
                <CardDescription>{project.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">₦{project.currentFunding.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground">Goal: ₦{project.fundingGoal.toLocaleString()}</span>
                  </div>
                  <Progress value={progress} />
                  <p className="text-xs text-center mt-1 text-muted-foreground">{progress.toFixed(1)}% Funded</p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                 <Badge variant={project.status === 'fully-funded' ? 'secondary' : 'default'}>{project.status.toUpperCase()}</Badge>
                <Button onClick={() => handleContributeClick(project)} disabled={project.status !== 'open'}>
                  {project.status === 'fully-funded' ? 'Goal Reached' : 'Contribute'}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <Dialog open={selectedProject !== null} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contribute to {selectedProject?.title}</DialogTitle>
            <DialogDescription>Your contribution will directly fund this project.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
              <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₦)</Label>
                  <Input 
                    id="amount" 
                    type="number" 
                    placeholder="e.g., 5000"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                  />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedProject(null)}>Cancel</Button>
            <Button onClick={handleConfirmContribution} disabled={isContributing}>
              {isContributing ? 'Processing...' : 'Confirm Contribution'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ProtectedProjectsPage() {
  return (
    <ProtectedRoute>
      <ProjectsPage />
    </ProtectedRoute>
  )
}
