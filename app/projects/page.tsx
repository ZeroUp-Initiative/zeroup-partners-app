'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { collection, onSnapshot, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase/client"
import ProtectedRoute from "@/components/auth/protected-route"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, Banknote } from "lucide-react"
import { ContributeDialog } from "@/components/projects/contribute-dialog"
import type { Project } from "@/lib/types"

function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  useEffect(() => {
    const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const projectsData: Project[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status === 'pending' || data.status === 'rejected') return;
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
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>
      <div className="mb-8 text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Our Social Impact Projects</h1>
        <p className="text-base sm:text-lg md:text-xl text-muted-foreground mt-2">Fund a project and make a direct impact.</p>

        {/* General Contribution Button */}
        <div className="mt-6">
          <Button
            size="lg"
            onClick={() => {
              setSelectedProject({
                id: "general",
                title: "General Contribution",
                description: "Contribute without selecting a specific project",
                fundingGoal: 0,
                currentFunding: 0,
                status: 'open'
              } as Project);
            }}
            className="shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
          >
            <Banknote className="w-5 h-5 mr-2" />
            Make General Contribution
          </Button>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => {
          const progress = (project.currentFunding / project.fundingGoal) * 100;
          return (
            <Card
              key={project.id}
              className="flex flex-col cursor-pointer transition-shadow hover:shadow-lg"
              onClick={() => router.push(`/projects/${project.id}`)}
            >
              <Link href={`/projects/${project.id}`}>
                {project.imageUrl && (
                  <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                    <img
                      src={project.imageUrl}
                      alt={project.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
              </Link>
              <CardHeader>
                <Link href={`/projects/${project.id}`}>
                  <CardTitle className="cursor-pointer hover:text-primary transition-colors">
                    {project.title}
                  </CardTitle>
                </Link>
                <CardDescription>
                  {project.description.length > 150 ?
                    `${project.description.substring(0, 150)}...` :
                    project.description
                  }
                </CardDescription>
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
                <Button
                  onClick={(e) => { e.stopPropagation(); handleContributeClick(project) }}
                  disabled={project.status !== 'open'}
                >
                  {project.status === 'fully-funded' ? 'Goal Reached' : 'Contribute'}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <ContributeDialog
        project={selectedProject}
        open={selectedProject !== null}
        onOpenChange={(open) => !open && setSelectedProject(null)}
      />
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
