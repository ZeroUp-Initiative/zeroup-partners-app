"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { db, auth } from "@/lib/firebase/client"
import { doc, updateDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore"
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, updateProfile } from "firebase/auth"
import { uploadImage, validateImageFile } from "@/lib/image-upload"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, User, Lock, Calendar, Save, ArrowLeft, Camera, Upload, X, Bell, Award } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"
import ProtectedRoute from "@/components/auth/protected-route"
import { NotificationPreferencesCard } from "@/components/notifications/notification-preferences"
import { PartnerFlierCard } from "@/components/partner-flier-card"

function ProfileContent() {
  const { user, isLoading: isAuthLoading } = useAuth()
  
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [organization, setOrganization] = useState("")
  const [photoURL, setPhotoURL] = useState("")
  
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [totalContributions, setTotalContributions] = useState(0)
  const [customFlierMessage, setCustomFlierMessage] = useState("")
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "")
      setLastName(user.lastName || "")
      setOrganization(user.organization || "")
      setPhotoURL(user.photoURL || "")
    }
  }, [user])

  // Fetch user's total verified contributions
  useEffect(() => {
    if (!user?.uid || !db) return;

    const fetchContributions = async () => {
      try {
        const paymentsQuery = query(
          collection(db, "payments"),
          where("userId", "==", user.uid),
          where("status", "==", "verified")
        );
        const snapshot = await getDocs(paymentsQuery);
        const total = snapshot.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);
        setTotalContributions(total);
      } catch (error) {
        console.error("Error fetching contributions:", error);
      }
    };

    fetchContributions();
  }, [user?.uid]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validation = validateImageFile(file, 5) // 5MB limit for profile photos
    if (!validation.valid) {
      toast.error(validation.error || "Invalid file")
      return
    }

    setIsUploadingPhoto(true)
    try {
      const imageUrl = await uploadImage(file)
      
      // Update Firestore
      if (user) {
        const userRef = doc(db, "users", user.uid)
        await setDoc(userRef, { photoURL: imageUrl, updatedAt: new Date() }, { merge: true })
      }
      
      // Update Firebase Auth profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: imageUrl })
      }
      
      setPhotoURL(imageUrl)
      toast.success("Profile photo updated!")
    } catch (error: any) {
      console.error("Error uploading photo:", error)
      toast.error("Failed to upload photo. Please try again.")
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handleRemovePhoto = async () => {
    setIsUploadingPhoto(true)
    try {
      // Update Firestore
      if (user) {
        const userRef = doc(db, "users", user.uid)
        await setDoc(userRef, { photoURL: null, updatedAt: new Date() }, { merge: true })
      }
      
      // Update Firebase Auth profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: "" })
      }
      
      setPhotoURL("")
      toast.success("Profile photo removed!")
    } catch (error: any) {
      console.error("Error removing photo:", error)
      toast.error("Failed to remove photo.")
    } finally {
      setIsUploadingPhoto(false)
    }
  }

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
        <div className="relative group">
          <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
            {photoURL ? (
              <AvatarImage src={photoURL} alt={`${user?.firstName}'s profile`} />
            ) : null}
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground text-3xl font-bold">
              {user?.firstName?.charAt(0)?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          {/* Photo upload overlay */}
          <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20 h-10 w-10"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
            >
              {isUploadingPhoto ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Camera className="h-5 w-5" />
              )}
            </Button>
          </div>
          
          {/* Remove photo button */}
          {photoURL && (
            <Button
              type="button"
              size="icon"
              variant="destructive"
              className="absolute -top-1 -right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleRemovePhoto}
              disabled={isUploadingPhoto}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{user?.firstName} {user?.lastName}</h1>
          <p className="text-muted-foreground">{user?.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded w-fit">
              <Calendar className="w-3 h-3 mr-1" />
              Joined {user?.createdAt?.toDate ? new Date(user.createdAt.toDate()).toLocaleDateString() : "Recently"}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-6 text-xs"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
            >
              <Upload className="h-3 w-3 mr-1" />
              {photoURL ? "Change Photo" : "Add Photo"}
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-8 grid w-full grid-cols-4 sm:w-auto sm:inline-flex">
          <TabsTrigger value="general" className="gap-2 text-xs sm:text-sm"><User className="w-4 h-4" /> <span className="hidden sm:inline">General</span><span className="sm:hidden">Info</span></TabsTrigger>
          <TabsTrigger value="security" className="gap-2 text-xs sm:text-sm"><Lock className="w-4 h-4" /> Security</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 text-xs sm:text-sm"><Bell className="w-4 h-4" /> <span className="hidden sm:inline">Notifications</span><span className="sm:hidden">Alerts</span></TabsTrigger>
          <TabsTrigger value="flier" className="gap-2 text-xs sm:text-sm"><Award className="w-4 h-4" /> <span className="hidden sm:inline">My Flier</span><span className="sm:hidden">Flier</span></TabsTrigger>
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

        <TabsContent value="notifications">
          <NotificationPreferencesCard />
        </TabsContent>

        <TabsContent value="flier">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Partner Flier Preview */}
            <div>
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>Your Partner Flier</CardTitle>
                  <CardDescription>
                    Download and share your personalized partner recognition card on social media.
                  </CardDescription>
                </CardHeader>
              </Card>
              {totalContributions > 0 ? (
                <PartnerFlierCard
                  variant="regular"
                  name={`${firstName} ${lastName}`.trim() || user?.email?.split('@')[0] || 'Partner'}
                  amount={totalContributions}
                  photoURL={photoURL}
                  month={new Date().toLocaleString('default', { month: 'long' })}
                  year={new Date().getFullYear()}
                  customMessage={customFlierMessage || undefined}
                  showDownload={true}
                />
              ) : (
                <Card className="p-8">
                  <div className="text-center space-y-4">
                    <Award className="w-16 h-16 mx-auto text-muted-foreground" />
                    <h3 className="text-lg font-semibold">No Contributions Yet</h3>
                    <p className="text-muted-foreground">
                      Start contributing to get your personalized partner flier that you can share on social media!
                    </p>
                    <Link href="/contributions">
                      <Button>Log Your First Contribution</Button>
                    </Link>
                  </div>
                </Card>
              )}
            </div>

            {/* Customization Options */}
            <Card>
              <CardHeader>
                <CardTitle>Customize Your Flier</CardTitle>
                <CardDescription>Add a personal message to your flier.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customMessage">Custom Message (optional)</Label>
                  <Input
                    id="customMessage"
                    placeholder="Thank you for being part of this journey..."
                    value={customFlierMessage}
                    onChange={(e) => setCustomFlierMessage(e.target.value)}
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground">
                    {customFlierMessage.length}/100 characters
                  </p>
                </div>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>Your Stats:</strong></p>
                  <p>• Total Verified Contributions: ₦{totalContributions.toLocaleString()}</p>
                  <p>• Share your flier on Instagram, Facebook, Twitter, or WhatsApp to inspire others!</p>
                </div>
              </CardContent>
            </Card>
          </div>
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
