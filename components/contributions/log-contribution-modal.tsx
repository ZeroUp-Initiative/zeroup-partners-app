"use client"

import { useState } from "react"
import { db, storage } from "@/lib/firebase/client"
import { addDoc, collection, serverTimestamp, Timestamp } from "firebase/firestore"
import { getDownloadURL, ref, uploadBytes } from "firebase/storage"
import { useAuth } from "@/contexts/auth-context"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Upload, Plus, Calendar, Loader2 } from "lucide-react"

export function LogContributionModal({ onSuccess, children }: { onSuccess?: () => void, children?: React.ReactNode }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  
  const [formData, setFormData] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    proofFile: null as File | null,
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData((prev) => ({ ...prev, proofFile: file }))
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
      const storageRef = ref(storage, `proofs/${user.uid}/${user.firstName}_${user.lastName}_${Date.now()}_${file.name}`)
      const uploadResult = await uploadBytes(storageRef, file)
      const proofURL = await getDownloadURL(uploadResult.ref)

      await addDoc(collection(db, "payments"), {
        userId: user.uid,
        userFirstName: user.firstName,
        userLastName: user.lastName,
        userFullName: `${user.firstName} ${user.lastName}`,
        amount: amount,
        date: Timestamp.fromDate(new Date(formData.date)),
        description: formData.description,
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
