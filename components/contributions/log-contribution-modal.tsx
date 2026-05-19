"use client"

import { useState, useEffect } from "react"
import { db } from "@/lib/firebase/client"
import { addDoc, collection, serverTimestamp, Timestamp, query, where, getDocs, orderBy } from "firebase/firestore"
import { uploadImage, validateImageFile } from "@/lib/image-upload"
import { useAuth } from "@/contexts/auth-context"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Upload, Plus, Calendar, Loader2, Copy, Banknote } from "lucide-react"

export function LogContributionModal({ onSuccess, children }: { onSuccess?: () => void, children?: React.ReactNode }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  const [projects, setProjects] = useState<{id: string, title: string}[]>([])
  const [formData, setFormData] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    proofFile: null as File | null,
    projectId: "",
    projectTitle: "",
    isGeneralContribution: false
  })

  useEffect(() => {
    const fetchProjects = async () => {
        try {
            const q = query(collection(db, "projects"), where("status", "==", "open"));
            const querySnapshot = await getDocs(q);
            const projectsList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                title: doc.data().title
            }));
            setProjects(projectsList);
        } catch (error) {
            console.error("Error fetching projects:", error);
        }
    }
    fetchProjects();
  }, []);

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field === "projectId") {
        const project = projects.find(p => p.id === value);
        setFormData(prev => ({ 
            ...prev, 
            projectId: value as string, 
            projectTitle: project ? project.title : "",
            isGeneralContribution: false
        }));
    } else if (field === "isGeneralContribution") {
        setFormData(prev => ({ 
            ...prev, 
            isGeneralContribution: value as boolean,
            projectId: value as boolean ? "general" : "",
            projectTitle: value as boolean ? "General Contribution" : ""
        }));
    } else {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData((prev) => ({ ...prev, proofFile: file }))
  }

  const copyAccountNumber = () => {
    const accountNumber = "0219230107"
    navigator.clipboard.writeText(accountNumber)
    toast.success("Account number copied to clipboard!")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError("You must be logged in.")
      return
    }

    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      if (!formData.amount || !formData.date || !formData.description || !formData.proofFile) {
        setError("Please fill in all required fields.")
        setIsLoading(false)
        return
      }

      const amount = Number.parseFloat(formData.amount)
      if (isNaN(amount) || amount <= 0) {
        setError("Please enter a valid amount.")
        setIsLoading(false)
        return
      }

      const file = formData.proofFile
      
      // Validate the file before uploading
      const validation = validateImageFile(file, 10)
      if (!validation.valid) {
        setError(validation.error || "Invalid file")
        setIsLoading(false)
        return
      }
      
      // Upload using the ZeroUp Image Upload API (Cloudinary)
      const proofURL = await uploadImage(file)

        await addDoc(collection(db, "payments"), {
        userId: user.uid,
        userFirstName: user.firstName,
        userLastName: user.lastName,
        userFullName: `${user.firstName} ${user.lastName}`,
        amount: amount,
        date: Timestamp.fromDate(new Date(formData.date)),
        description: formData.description,
        projectId: formData.projectId || "general",
        projectTitle: formData.projectTitle || "General Contribution",
        proofURL: proofURL,
        status: "pending",
        createdAt: serverTimestamp(),
      })

      setSuccess("Contribution logged successfully!")
      setTimeout(() => {
        setOpen(false)
        setSuccess("")
        setFormData({
            amount: "",
            date: new Date().toISOString().split("T")[0],
            description: "",
            proofFile: null,
            projectId: "",
            projectTitle: "",
            isGeneralContribution: false
        })
        if (onSuccess) onSuccess()
      }, 1500)
    } catch (err) {
      console.error("Error submitting contribution:", err)
      setError("Failed to log contribution. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ? children : (
        <Button size="lg" className="shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
          <Plus className="w-5 h-5 mr-2" />
          Log Contribution
        </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Contribution</DialogTitle>
          <DialogDescription>
            Record your monthly contribution. Changes are saved immediately.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            {success && <Alert className="border-green-500 text-green-500"><AlertDescription>{success}</AlertDescription></Alert>}

            {/* Bank Account Details */}
            <div className="bg-slate-50 dark:bg-[#1e1040]/60 border border-slate-200 dark:border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Banknote className="w-4 h-4 text-[#8d44d1]" />
                    <h4 className="font-semibold text-slate-800 dark:text-white text-sm">Bank Transfer Details</h4>
                </div>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-white/40">Account Number:</span>
                        <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-800 dark:text-white">0219230107</span>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={copyAccountNumber}
                                className="h-6 w-6 p-0 text-slate-400 hover:text-[#8d44d1] hover:bg-[#8d44d1]/10 dark:text-white/30 dark:hover:text-white/60"
                            >
                                <Copy className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-white/40">Bank:</span>
                        <span className="font-medium text-slate-700 dark:text-white/80">GT Bank</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-white/40">Account Name:</span>
                        <span className="font-medium text-slate-700 dark:text-white/80">PACSDA</span>
                    </div>
                    <div className="text-xs text-slate-400 dark:text-white/30 mt-2 border-t border-slate-200 dark:border-white/5 pt-2">
                        Pan African Centre for Social Development and Accountability
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="amount">Amount (₦)</Label>
                <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
                <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="5000.00"
                    value={formData.amount}
                    onChange={(e) => handleInputChange("amount", e.target.value)}
                    className="pl-8"
                    required
                    disabled={isLoading}
                />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Contribution Type</Label>
                <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="radio"
                            name="contributionType"
                            checked={!formData.isGeneralContribution}
                            onChange={() => handleInputChange("isGeneralContribution", false)}
                            className="text-primary"
                        />
                        <span className="text-sm">Contribute to a specific project</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="radio"
                            name="contributionType"
                            checked={formData.isGeneralContribution}
                            onChange={() => handleInputChange("isGeneralContribution", true)}
                            className="text-primary"
                        />
                        <span className="text-sm">General contribution (no specific project)</span>
                    </label>
                </div>
            </div>

            {!formData.isGeneralContribution && (
                <div className="space-y-2">
                    <Label htmlFor="project">Project</Label>
                    <div className="relative">
                        <select
                            id="project"
                            value={formData.projectId}
                            onChange={(e) => handleInputChange("projectId", e.target.value)}
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            required={!formData.isGeneralContribution}
                            disabled={isLoading}
                        >
                            <option value="" disabled>Select a project</option>
                            {projects.map(project => (
                                <option key={project.id} value={project.id}>{project.title}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                 <div className="relative">
                     <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                        id="date" 
                        type="date" 
                        value={formData.date} 
                        onChange={(e) => handleInputChange("date", e.target.value)} 
                        className="pl-10"
                        required 
                        disabled={isLoading}
                    />
                 </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                    id="description" 
                    placeholder="e.g. Monthly contribution" 
                    value={formData.description} 
                    onChange={(e) => handleInputChange("description", e.target.value)} 
                    required 
                    disabled={isLoading}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="proof">Proof of Payment</Label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors">
                <input id="proof" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="hidden" />
                <label htmlFor="proof" className="cursor-pointer block">
                    <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm font-medium truncate">{formData.proofFile ? formData.proofFile.name : "Click to upload proof"}</p>
                    <p className="text-xs text-muted-foreground">PDF, JPG, PNG (max 10MB)</p>
                </label>
                </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</> : "Submit Contribution"}
            </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
