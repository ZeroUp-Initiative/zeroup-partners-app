"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { db, storage, auth } from "@/lib/firebase/client"
import { addDoc, collection, serverTimestamp, Timestamp } from "firebase/firestore"
import { getDownloadURL, ref, uploadBytes } from "firebase/storage"
import ProtectedRoute from "@/components/auth/protected-route"
import { useAuth } from "@/contexts/auth-context"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, Upload, LogOut, FileText, Calendar } from "lucide-react"

function NewContributionContent() {
  const { user } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    proofFile: null as File | null,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const logout = async () => {
    await auth.signOut()
  }

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
      setError("You must be logged in to submit a contribution.")
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

      setSuccess("Contribution logged successfully! It will be reviewed soon.")
      setTimeout(() => {
        router.push("/contributions")
      }, 2000)
    } catch (err) {
      console.error("Error submitting contribution:", err)
      setError("Failed to log contribution. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/contributions" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">Z</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">Log New Contribution</h1>
                <p className="text-sm text-muted-foreground">Record your monthly contribution</p>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user?.firstName?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium">{`${user?.firstName} ${user?.lastName}`}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          <Link href="/contributions" className="inline-flex items-center text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Contributions
          </Link>

          <Card className="border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">New Contribution Details</CardTitle>
              <CardDescription>Fill out the form to log your contribution.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                {success && <Alert className="border-green-500 text-green-500"><AlertDescription>{success}</AlertDescription></Alert>}

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₦) *</Label>
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
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Contribution Date *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="date" type="date" value={formData.date} onChange={(e) => handleInputChange("date", e.target.value)} className="pl-10" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea id="description" placeholder="e.g., Monthly contribution" value={formData.description} onChange={(e) => handleInputChange("description", e.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proof">Proof of Payment *</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <input id="proof" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="hidden" required />
                    <label htmlFor="proof" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm font-medium">{formData.proofFile ? formData.proofFile.name : "Click to upload"}</p>
                      <p className="text-xs text-muted-foreground">PDF, JPG, PNG up to 10MB</p>
                    </label>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit" className="flex-1" disabled={isLoading}>{isLoading ? "Submitting..." : "Submit Contribution"}</Button>
                  <Button type="button" variant="outline" asChild><Link href="/contributions">Cancel</Link></Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default function NewContributionPage() {
  return (
    <ProtectedRoute>
      <NewContributionContent />
    </ProtectedRoute>
  )
}
