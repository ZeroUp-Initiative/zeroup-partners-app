'use client'

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth"
import { auth, db } from "@/lib/firebase/client"
import { verifyEmailActionCodeSettings } from "@/lib/firebase/action-code-settings"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { uploadImage, validateImageFile } from "@/lib/image-upload"
import Link from "next/link"
import Image from "next/image"
import toast from "react-hot-toast"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Eye, EyeOff, TriangleAlert, Upload, Loader2, FileCheck } from "lucide-react"

function FullPageLoader() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-editorial-cream">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-editorial-navy border-t-transparent" />
    </div>
  )
}

const inputClass = "bg-white border-editorial-border text-editorial-navy placeholder:text-editorial-muted/60 focus:border-editorial-navy/60 transition-colors h-11"

type SignupMode = "partner" | "school"

export default function SignupPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const router = useRouter()

  const [mode, setMode] = useState<SignupMode>("partner")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [organization, setOrganization] = useState("")
  const [schoolName, setSchoolName] = useState("")
  const [schoolRegistrationNumber, setSchoolRegistrationNumber] = useState("")
  const [schoolAddress, setSchoolAddress] = useState("")
  const [schoolContactPhone, setSchoolContactPhone] = useState("")
  const [schoolRepTitle, setSchoolRepTitle] = useState("")
  const [schoolStudentPopulation, setSchoolStudentPopulation] = useState("")
  const [schoolApplicationNote, setSchoolApplicationNote] = useState("")
  const [schoolDocumentUrl, setSchoolDocumentUrl] = useState("")
  const [isUploadingDoc, setIsUploadingDoc] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isAuthLoading && user) {
      router.push("/dashboard")
    }
  }, [user, isAuthLoading, router])

  const handleDocUpload = async (file: File | null) => {
    if (!file) return
    const validation = validateImageFile(file)
    if (!validation.valid) {
      toast.error(validation.error || "Invalid file.")
      return
    }
    setIsUploadingDoc(true)
    try {
      const url = await uploadImage(file)
      setSchoolDocumentUrl(url)
      toast.success("Document uploaded.")
    } catch {
      toast.error("Upload failed. Please try again.")
    } finally {
      setIsUploadingDoc(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user

      const isSchool = mode === "school"

      await setDoc(doc(db, "users", firebaseUser.uid), {
        firstName,
        lastName,
        email,
        organization: organization || "",
        createdAt: serverTimestamp(),
        emailVerified: false,
        ...(isSchool
          ? {
              role: "school",
              schoolStatus: "pending",
              schoolName,
              schoolRegistrationNumber: schoolRegistrationNumber || "",
              schoolAddress,
              schoolContactName: `${firstName} ${lastName}`.trim(),
              schoolContactPhone,
              schoolRepTitle,
              schoolStudentPopulation: schoolStudentPopulation || "",
              schoolApplicationNote: schoolApplicationNote || "",
              schoolDocuments: schoolDocumentUrl ? [schoolDocumentUrl] : [],
              schoolAppliedAt: serverTimestamp(),
            }
          : {}),
      })

      await updateProfile(firebaseUser, {
        displayName: isSchool ? schoolName : `${firstName} ${lastName}`.trim(),
      })

      await sendEmailVerification(firebaseUser, verifyEmailActionCodeSettings)

      // Send welcome / application-received email (fire-and-forget, don't block signup flow)
      fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          type: isSchool ? 'school_application_submitted' : 'welcome',
          data: isSchool ? { schoolName, contactName: firstName } : { name: firstName },
        }),
      }).catch(() => {})

      if (isSchool) {
        // Notify admin of the new school application
        fetch('/api/settings/payment')
          .then(r => r.json())
          .then(settings => {
            if (settings.adminNotificationEmail) {
              return fetch('/api/email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  to: settings.adminNotificationEmail,
                  type: 'admin_school_application_submitted',
                  data: { schoolName, contactName: `${firstName} ${lastName}`.trim(), contactEmail: email },
                }),
              })
            }
          }).catch(() => {})
      } else {
        // Check whether this signup just crossed a new 100-partner milestone
        // (fire-and-forget — worst case it's caught on the next signup instead).
        firebaseUser.getIdToken().then((idToken) => {
          fetch('/api/milestones/check-partners', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          }).catch(() => {})
        }).catch(() => {})
      }

      toast.success(
        isSchool
          ? "Application submitted! We'll review it and email you once your school is approved."
          : "Account created! Check your email to verify your account."
      )
    } catch (err: any) {
      let errorMessage = "Signup failed. Please try again."
      if (err.code === "auth/email-already-in-use") {
        errorMessage = "This email is already in use. Try signing in instead."
      } else if (err.code === "auth/weak-password") {
        errorMessage = "Password must be at least 6 characters."
      } else if (err.code) {
        errorMessage = err.message
      }
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  if (isAuthLoading || user) return <FullPageLoader />

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-editorial-cream">
      <div className="w-full max-w-md relative z-10 py-8">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center text-sm text-editorial-muted hover:text-editorial-navy transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to home
        </Link>

        {/* Logo + brand */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden">
            <Image
              src="/images/zeroup-partners-logo-light-mode.png"
              alt="ZeroUp Partners"
              fill
              className="object-contain"
            />
          </div>
          <div className="text-center">
            <h1 className="font-display text-xl font-bold text-editorial-navy tracking-tight">ZeroUp Partners</h1>
            <p className="text-sm text-editorial-muted">People. Partnerships. Possibilities.</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-editorial-border bg-white shadow-sm p-8">
          <div className="mb-6">
            <h2 className="font-display text-2xl font-bold text-editorial-navy">Create Account</h2>
            <p className="text-sm text-editorial-muted mt-1">
              {mode === "school"
                ? "Apply to partner with ZeroUp as a school — we review every application before it's approved."
                : "Join the network and start making a difference"}
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-editorial-cream-soft p-1 border border-editorial-border">
            <button
              type="button"
              onClick={() => setMode("partner")}
              disabled={isLoading}
              className={`h-9 rounded-lg text-sm font-medium transition-colors ${
                mode === "partner" ? "bg-editorial-navy text-white" : "text-editorial-muted hover:text-editorial-navy"
              }`}
            >
              I'm a Partner
            </button>
            <button
              type="button"
              onClick={() => setMode("school")}
              disabled={isLoading}
              className={`h-9 rounded-lg text-sm font-medium transition-colors ${
                mode === "school" ? "bg-editorial-navy text-white" : "text-editorial-muted hover:text-editorial-navy"
              }`}
            >
              I'm a Partner School
            </button>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            {error && (
              <div className="flex gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
                <TriangleAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {mode === "school" && (
              <div className="space-y-1.5">
                <Label htmlFor="schoolName" className="text-editorial-ink text-sm">School Name</Label>
                <Input
                  id="schoolName"
                  placeholder="e.g. Bright Future Secondary School"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  required
                  disabled={isLoading}
                  className={inputClass}
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="space-y-1.5 flex-1">
                <Label htmlFor="firstName" className="text-editorial-ink text-sm">
                  {mode === "school" ? "Your First Name" : "First Name"}
                </Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  disabled={isLoading}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5 flex-1">
                <Label htmlFor="lastName" className="text-editorial-ink text-sm">
                  {mode === "school" ? "Your Last Name" : "Last Name"}
                </Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  disabled={isLoading}
                  className={inputClass}
                />
              </div>
            </div>

            {mode === "school" && (
              <div className="space-y-1.5">
                <Label htmlFor="schoolRepTitle" className="text-editorial-ink text-sm">Your Role at the School</Label>
                <Input
                  id="schoolRepTitle"
                  placeholder="e.g. Principal, Program Coordinator"
                  value={schoolRepTitle}
                  onChange={(e) => setSchoolRepTitle(e.target.value)}
                  required
                  disabled={isLoading}
                  className={inputClass}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-editorial-ink text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-editorial-ink text-sm">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className={`${inputClass} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-editorial-muted hover:text-editorial-navy transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {mode === "school" ? (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="schoolAddress" className="text-editorial-ink text-sm">School Address</Label>
                  <Input
                    id="schoolAddress"
                    placeholder="Street, city, state"
                    value={schoolAddress}
                    onChange={(e) => setSchoolAddress(e.target.value)}
                    required
                    disabled={isLoading}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="space-y-1.5 flex-1">
                    <Label htmlFor="schoolContactPhone" className="text-editorial-ink text-sm">Contact Phone</Label>
                    <Input
                      id="schoolContactPhone"
                      placeholder="+234..."
                      value={schoolContactPhone}
                      onChange={(e) => setSchoolContactPhone(e.target.value)}
                      required
                      disabled={isLoading}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <Label htmlFor="schoolRegistrationNumber" className="text-editorial-ink text-sm">
                      Registration No. <span className="text-editorial-muted/70">(optional)</span>
                    </Label>
                    <Input
                      id="schoolRegistrationNumber"
                      placeholder="If available"
                      value={schoolRegistrationNumber}
                      onChange={(e) => setSchoolRegistrationNumber(e.target.value)}
                      disabled={isLoading}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="schoolStudentPopulation" className="text-editorial-ink text-sm">
                    Approximate Student Population <span className="text-editorial-muted/70">(optional)</span>
                  </Label>
                  <Input
                    id="schoolStudentPopulation"
                    type="number"
                    placeholder="e.g. 450"
                    value={schoolStudentPopulation}
                    onChange={(e) => setSchoolStudentPopulation(e.target.value)}
                    disabled={isLoading}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="schoolApplicationNote" className="text-editorial-ink text-sm">
                    What prompted this application? <span className="text-editorial-muted/70">(optional)</span>
                  </Label>
                  <Textarea
                    id="schoolApplicationNote"
                    placeholder="Tell us briefly what your school needs support with..."
                    value={schoolApplicationNote}
                    onChange={(e) => setSchoolApplicationNote(e.target.value)}
                    disabled={isLoading}
                    rows={3}
                    className="bg-white border-editorial-border text-editorial-navy placeholder:text-editorial-muted/60 focus-visible:border-editorial-navy/60"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-editorial-ink text-sm">
                    Registration Certificate / Proof of Existence <span className="text-editorial-muted/70">(optional, speeds up review)</span>
                  </Label>
                  <label className="flex items-center justify-center gap-2 border-2 border-dashed border-editorial-border rounded-xl h-11 text-sm text-editorial-muted cursor-pointer hover:border-editorial-navy/40 transition-colors">
                    {isUploadingDoc ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                    ) : schoolDocumentUrl ? (
                      <span className="flex items-center gap-2 text-emerald-700"><FileCheck className="w-4 h-4" /> Document uploaded</span>
                    ) : (
                      <><Upload className="w-4 h-4" /> Click to upload a document</>
                    )}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      hidden
                      disabled={isLoading || isUploadingDoc}
                      onChange={(e) => handleDocUpload(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              </>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="organization" className="text-editorial-ink text-sm">
                  Organization <span className="text-editorial-muted/70">(optional)</span>
                </Label>
                <Input
                  id="organization"
                  placeholder="Your company or NGO"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  disabled={isLoading}
                  className={inputClass}
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || isUploadingDoc}
              className="w-full h-11 text-base font-semibold rounded-xl bg-editorial-navy hover:bg-editorial-navy-deep text-white border-0 transition-colors"
            >
              {isLoading
                ? (mode === "school" ? "Submitting Application…" : "Creating Account…")
                : (mode === "school" ? "Submit School Application" : "Create Account")}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-editorial-muted">
            Already have an account?{" "}
            <Link href="/login" className="text-editorial-navy font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
