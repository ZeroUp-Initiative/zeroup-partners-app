"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { db, auth } from "@/lib/firebase/client"
import { doc, updateDoc, setDoc } from "firebase/firestore"
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, updateProfile } from "firebase/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, User, Lock, Calendar, Save, ArrowLeft } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"
import ProtectedRoute from "@/components/auth/protected-route"

function ProfileContent() {
  const { user, isLoading: isAuthLoading } = useAuth()
  
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [organization, setOrganization] = useState("")
  
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "")
      setLastName(user.lastName || "")
      setOrganization(user.organization || "")
    }
  }, [user])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage({ type: "", text: "" })

    try {
      if (!user) throw new Error("No user found")

      const userRef = doc(db, "users", user.uid)
      
      // Use setDoc with merge: true to create the document if it doesn't exist
      await setDoc(userRef, {
        firstName,
        lastName,
        organization,
        updatedAt: new Date() // Good practice to track updates
      }, { merge: true })

      // Also update the Auth profile for immediate UI consistency
      if (auth.currentUser) {
          await updateProfile(auth.currentUser, {
              displayName: `${firstName} ${lastName}`.trim()
          })
      }

      setMessage({ type: "success", text: "Profile updated successfully!" })
      toast.success("Profile updated successfully!")
    } catch (error: any) {
      console.error("Error updating profile:", error)
      setMessage({ type: "error", text: `Failed to update profile: ${error.message}` })
      toast.error(`Failed to update profile: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage({ type: "", text: "" })

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match." })
      setIsLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters." })
      setIsLoading(false)
      return
    }

    try {
      if (!auth.currentUser || !auth.currentUser.email) throw new Error("No user logged in")

      // Re-authenticate first
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword)
      await reauthenticateWithCredential(auth.currentUser, credential)

      // Update password
      await updatePassword(auth.currentUser, newPassword)

      setMessage({ type: "success", text: "Password updated successfully!" })
      toast.success("Password updated successfully!")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      console.error("Error updating password:", error)
      if (error.code === 'auth/wrong-password') {
         setMessage({ type: "error", text: "Incorrect current password." })
      } else {
         setMessage({ type: "error", text: error.message || "Failed to update password." })
      }
      toast.error("Failed to update password.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isAuthLoading) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
       <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
       </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-3xl font-bold shadow-lg">
          {user?.firstName?.charAt(0)?.toUpperCase()}
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{user?.firstName} {user?.lastName}</h1>
          <p className="text-muted-foreground">{user?.email}</p>
          <div className="flex items-center mt-2 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded w-fit">
            <Calendar className="w-3 h-3 mr-1" />
            Joined {user?.createdAt?.toDate ? new Date(user.createdAt.toDate()).toLocaleDateString() : "Recently"}
          </div>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="general" className="gap-2"><User className="w-4 h-4" /> General</TabsTrigger>
          <TabsTrigger value="security" className="gap-2"><Lock className="w-4 h-4" /> Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information and organization details.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                {message.type && (
                    <Alert variant={message.type === "error" ? "destructive" : "default"} className={message.type === "success" ? "border-green-500 text-green-500" : ""}>
                    <AlertTitle>{message.type === "error" ? "Error" : "Success"}</AlertTitle>
                    <AlertDescription>{message.text}</AlertDescription>
                    </Alert>
                )}
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={isLoading} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={isLoading} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organization">Organization</Label>
                  <Input id="organization" value={organization} onChange={(e) => setOrganization(e.target.value)} disabled={isLoading} />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.email || ""} disabled className="bg-muted cursor-not-allowed" />
                  <p className="text-xs text-muted-foreground">Contact support to change your email address.</p>
                </div>

                <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
             <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your password and account security.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-6">
                 {message.type && (
                    <Alert variant={message.type === "error" ? "destructive" : "default"} className={message.type === "success" ? "border-green-500 text-green-500" : ""}>
                    <AlertTitle>{message.type === "error" ? "Error" : "Success"}</AlertTitle>
                    <AlertDescription>{message.text}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required disabled={isLoading} />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required disabled={isLoading} />
                </div>

                 <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={isLoading} />
                </div>

                 <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function ProfilePage() {
    return (
        <ProtectedRoute>
            <ProfileContent />
        </ProtectedRoute>
    )
}
