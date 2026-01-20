'use client'

import { useState, useEffect } from "react"
import { collection, onSnapshot, query, orderBy, doc, setDoc, addDoc } from "firebase/firestore"
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
import { ArrowLeft, Upload, Loader2, Copy, Banknote } from "lucide-react"
import { uploadImage, validateImageFile } from "@/lib/image-upload"
import toast from "react-hot-toast"

interface Project {
  id: string;
  title: string;
  description: string;
  fundingGoal: number;
  currentFunding: number;
  status: 'open' | 'fully-funded' | 'closed';
  imageUrl?: string;
}

function ProjectsPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [contributionAmount, setContributionAmount] = useState("")
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [isContributing, setIsContributing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")
  const [viewingProject, setViewingProject] = useState<Project | null>(null)

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
    setReceiptFile(null);
  }

  const handleViewProject = (project: Project) => {
    setViewingProject(project);
  }

  const copyAccountNumber = () => {
    const accountNumber = "0219230107"
    navigator.clipboard.writeText(accountNumber)
    toast.success("Account number copied to clipboard!")
  }

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setReceiptFile(file)
  }

  const handleConfirmContribution = async () => {
    if (!selectedProject || !contributionAmount || !receiptFile) {
        setError("Please enter an amount and upload a receipt.");
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
        // Validate and upload receipt
        setIsUploading(true);
        const validation = validateImageFile(receiptFile, 10);
        if (!validation.valid) {
            setError(validation.error || "Invalid receipt file");
            setIsContributing(false);
            setIsUploading(false);
            return;
        }
        const receiptUrl = await uploadImage(receiptFile);
        setIsUploading(false);

        // Create pending payment instead of auto-approving
        await addDoc(collection(db, "payments"), {
            amount: amount,
            projectId: selectedProject.id === "general" ? "general" : selectedProject.id,
            projectTitle: selectedProject.id === "general" ? "General Contribution" : selectedProject.title,
            userId: user?.uid,
            userFirstName: user?.firstName,
            userLastName: user?.lastName,
            userFullName: `${user?.firstName} ${user?.lastName}`,
            status: 'pending',
            proofURL: receiptUrl,
            createdAt: new Date(),
            date: new Date(),
            description: selectedProject.id === "general" ? "General contribution" : `Contribution to project: ${selectedProject.title}`,
        });
        
        setSelectedProject(null);
        setReceiptFile(null);
    } catch (err) {
        console.error("Contribution failed:", err);
        setError("Failed to process contribution. Please try again.");
    } finally {
        setIsContributing(false);
        setIsUploading(false);
    }
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
              setError("");
              setContributionAmount("");
              setReceiptFile(null);
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
            <Card key={project.id} className="flex flex-col">
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
                <CardTitle 
                  className="cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleViewProject(project)}
                >
                  {project.title}
                </CardTitle>
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
            <DialogTitle>
              {selectedProject?.id === "general" ? "Make General Contribution" : `Contribute to ${selectedProject?.title}`}
            </DialogTitle>
            <DialogDescription>
              {selectedProject?.id === "general" 
                ? "Your contribution will support our overall mission." 
                : "Your contribution will directly fund this project."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
              {/* Bank Account Details */}
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                      <Banknote className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100">Bank Transfer Details</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-400">Account Number:</span>
                          <div className="flex items-center gap-2">
                              <span className="font-mono font-bold">0219230107</span>
                              <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={copyAccountNumber}
                                  className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
                              >
                                  <Copy className="w-3 h-3" />
                              </Button>
                          </div>
                      </div>
                      <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Bank:</span>
                          <span className="font-medium">GT Bank</span>
                      </div>
                      <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Account Name:</span>
                          <span className="font-medium">PACSDA</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          (Pan African Centre for Social Development and Accountability)
                      </div>
                  </div>
              </div>

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
              <div className="space-y-2">
                  <Label htmlFor="receipt">Upload Receipt</Label>
                  <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors">
                      <input 
                          id="receipt" 
                          type="file" 
                          accept=".jpg,.jpeg,.png,.gif,.webp" 
                          onChange={handleReceiptChange} 
                          className="hidden" 
                          disabled={isContributing}
                      />
                      <label htmlFor="receipt" className="cursor-pointer block">
                          {isUploading ? (
                              <Loader2 className="w-6 h-6 text-primary mx-auto mb-2 animate-spin" />
                          ) : (
                              <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                          )}
                          <p className="text-sm font-medium truncate">
                              {receiptFile ? receiptFile.name : "Click to upload receipt"}
                          </p>
                          <p className="text-xs text-muted-foreground">JPG, PNG, GIF, WebP (max 10MB)</p>
                      </label>
                  </div>
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

      {/* Project Details Modal */}
      <Dialog open={viewingProject !== null} onOpenChange={() => setViewingProject(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingProject?.title}</DialogTitle>
            <DialogDescription>Full project details</DialogDescription>
          </DialogHeader>
          {viewingProject && (
            <div className="space-y-4">
              {viewingProject.imageUrl && (
                <div className="aspect-video w-full overflow-hidden rounded-lg">
                  <img 
                    src={viewingProject.imageUrl} 
                    alt={viewingProject.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{viewingProject.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Funding Progress</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Raised:</span>
                      <span className="font-medium">₦{viewingProject.currentFunding.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Goal:</span>
                      <span className="font-medium">₦{viewingProject.fundingGoal.toLocaleString()}</span>
                    </div>
                    <Progress value={(viewingProject.currentFunding / viewingProject.fundingGoal) * 100} />
                    <p className="text-sm text-center text-muted-foreground">
                      {((viewingProject.currentFunding / viewingProject.fundingGoal) * 100).toFixed(1)}% Funded
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Status</h3>
                  <Badge variant={viewingProject.status === 'fully-funded' ? 'secondary' : 'default'}>
                    {viewingProject.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button onClick={() => {
                  setViewingProject(null);
                  handleContributeClick(viewingProject);
                }} disabled={viewingProject.status !== 'open'}>
                  {viewingProject.status === 'fully-funded' ? 'Goal Reached' : 'Contribute to This Project'}
                </Button>
              </div>
            </div>
          )}
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
