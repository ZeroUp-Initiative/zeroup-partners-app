'use client'

import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { useAuth } from '@/contexts/auth-context'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, TriangleAlert } from 'lucide-react'
import toast from 'react-hot-toast'

interface SubmitProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CATEGORIES = [
  'Education', 'Healthcare', 'Technology', 'Environment',
  'Economic Development', 'Agriculture', 'Youth & Sports', 'Arts & Culture', 'Other',
]

const PHASES = [
  { value: 'idea', label: 'Idea — Still in concept stage' },
  { value: 'planning', label: 'Planning — Actively designing the project' },
  { value: 'pilot', label: 'Pilot — Running a small test' },
  { value: 'active', label: 'Active — Already running, need more funds' },
]

const STEPS = ['About the Project', 'Project Details', 'Your Information']

const empty = {
  // Step 1 — public
  title: '',
  summary: '',
  category: '',
  location: '',
  fundingGoal: '',
  dueDate: '',
  phase: '',
  // Step 2 — private (admin-only)
  background: '',
  fundingBreakdown: '',
  expectedBeneficiaries: '',
  expectedOutcomes: '',
  previousFunding: '',
  // Step 3 — private (submitter info)
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  organizationName: '',
}

export function SubmitProjectModal({ open, onOpenChange }: SubmitProjectModalProps) {
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(empty)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const set = (field: keyof typeof empty, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const validateStep = () => {
    if (step === 0) {
      if (!form.title.trim()) return 'Project title is required.'
      if (!form.summary.trim()) return 'Project summary is required.'
      if (!form.category) return 'Please select a category.'
      if (!form.location.trim()) return 'Location is required.'
      if (!form.fundingGoal || isNaN(Number(form.fundingGoal)) || Number(form.fundingGoal) <= 0)
        return 'Please enter a valid funding goal.'
      if (!form.phase) return 'Please select a project phase.'
    }
    if (step === 1) {
      if (!form.background.trim()) return 'Please describe the project background.'
      if (!form.fundingBreakdown.trim()) return 'Please explain how funds will be used.'
      if (!form.expectedBeneficiaries.trim()) return 'Please estimate the number of beneficiaries.'
      if (!form.expectedOutcomes.trim()) return 'Please describe expected outcomes.'
    }
    if (step === 2) {
      if (!form.contactName.trim()) return 'Contact name is required.'
      if (!form.contactEmail.trim() || !/\S+@\S+\.\S+/.test(form.contactEmail))
        return 'A valid contact email is required.'
      if (!form.contactPhone.trim()) return 'Contact phone number is required.'
    }
    return ''
  }

  const next = () => {
    const err = validateStep()
    if (err) { setError(err); return }
    setError('')
    setStep(s => s + 1)
  }

  const back = () => { setError(''); setStep(s => s - 1) }

  const handleSubmit = async () => {
    const err = validateStep()
    if (err) { setError(err); return }
    setError('')
    setIsSubmitting(true)

    try {
      await addDoc(collection(db, 'projects'), {
        // Public fields
        title: form.title.trim(),
        description: form.summary.trim(),
        category: form.category,
        location: form.location.trim(),
        fundingGoal: Number(form.fundingGoal),
        currentFunding: 0,
        dueDate: form.dueDate ? new Date(form.dueDate) : null,
        phase: form.phase,
        status: 'pending',
        imageUrl: '',
        // Private admin fields
        background: form.background.trim(),
        fundingBreakdown: form.fundingBreakdown.trim(),
        expectedBeneficiaries: form.expectedBeneficiaries.trim(),
        expectedOutcomes: form.expectedOutcomes.trim(),
        previousFunding: form.previousFunding.trim(),
        // Submitter info (private)
        contactName: form.contactName.trim(),
        contactEmail: form.contactEmail.trim(),
        contactPhone: form.contactPhone.trim(),
        organizationName: form.organizationName.trim(),
        // Meta
        submittedBy: user?.uid || '',
        submittedByName: user?.firstName
          ? `${user.firstName} ${user.lastName || ''}`.trim()
          : user?.displayName || '',
        submittedByEmail: user?.email || '',
        createdAt: serverTimestamp(),
        adminNotes: '',
      })

      // Send confirmation email to submitter
      const recipientEmail = form.contactEmail.trim() || user?.email
      const recipientName = form.contactName.trim() || user?.firstName || 'Partner'
      if (recipientEmail) {
        fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: recipientEmail,
            type: 'project_submitted',
            data: { name: recipientName, title: form.title.trim() },
          }),
        }).catch(() => {})
      }

      // Notify admin
      fetch('/api/settings/payment')
        .then(r => r.json())
        .then(settings => {
          if (settings.adminNotificationEmail) {
            return fetch('/api/email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: settings.adminNotificationEmail,
                type: 'admin_project_submitted',
                data: {
                  submitterName: recipientName,
                  submitterEmail: recipientEmail || '',
                  title: form.title.trim(),
                  category: form.category,
                  location: form.location.trim(),
                  fundingGoal: form.fundingGoal,
                },
              }),
            })
          }
        })
        .catch(() => {})

      setSubmitted(true)
      toast.success('Project submitted successfully!')
    } catch (e) {
      console.error(e)
      setError('Submission failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setTimeout(() => {
      setStep(0)
      setForm(empty)
      setError('')
      setSubmitted(false)
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit a Project for Funding</DialogTitle>
          <DialogDescription>
            Your submission will be reviewed before it goes live. Fields marked with a lock are only visible to our admin team.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <CheckCircle2 className="w-16 h-16 text-[#8d44d1]" />
            <h3 className="text-xl font-bold">Submission Received!</h3>
            <p className="text-muted-foreground max-w-sm">
              Your project has been submitted and is pending review. We'll notify you once it's been approved and made live.
            </p>
            <Button onClick={handleClose} className="mt-2 bg-gradient-to-r from-[#8d44d1] to-[#7030b0] text-white border-0">
              Close
            </Button>
          </div>
        ) : (
          <>
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6">
              {STEPS.map((label, i) => (
                <div key={i} className="flex items-center gap-2 flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                    i < step ? 'bg-[#8d44d1] text-white' : i === step ? 'bg-[#8d44d1] text-white ring-2 ring-[#8d44d1]/30' : 'bg-muted text-muted-foreground'
                  }`}>{i < step ? '✓' : i + 1}</div>
                  <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
                  {i < STEPS.length - 1 && <div className={`h-px flex-1 mx-1 ${i < step ? 'bg-[#8d44d1]' : 'bg-border'}`} />}
                </div>
              ))}
            </div>

            {/* Step 0 — Public info */}
            {step === 0 && (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
                  🌐 This information will be shown publicly on the projects page once approved.
                </p>
                <div className="space-y-1.5">
                  <Label>Project Title <span className="text-destructive">*</span></Label>
                  <Input placeholder="e.g., Digital Literacy for 200 Youths in Kano" value={form.title} onChange={e => set('title', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Short Public Summary <span className="text-destructive">*</span></Label>
                  <Textarea
                    placeholder="Describe your project in 2–4 sentences. This is what partners will read on the projects page."
                    value={form.summary}
                    onChange={e => set('summary', e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Category <span className="text-destructive">*</span></Label>
                    <Select value={form.category} onValueChange={v => set('category', v)}>
                      <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Location / Region <span className="text-destructive">*</span></Label>
                    <Input placeholder="e.g., Lagos, Nigeria" value={form.location} onChange={e => set('location', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Funding Goal (₦) <span className="text-destructive">*</span></Label>
                    <Input type="number" placeholder="500000" value={form.fundingGoal} onChange={e => set('fundingGoal', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Target Date (optional)</Label>
                    <Input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Project Phase <span className="text-destructive">*</span></Label>
                  <Select value={form.phase} onValueChange={v => set('phase', v)}>
                    <SelectTrigger><SelectValue placeholder="Where is this project right now?" /></SelectTrigger>
                    <SelectContent>
                      {PHASES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 1 — Private details */}
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
                  🔒 This information is only visible to our admin team. It helps us evaluate and approve your project.
                </p>
                <div className="space-y-1.5">
                  <Label>Project Background <span className="text-destructive">*</span></Label>
                  <Textarea
                    placeholder="What problem does this project solve? What is the community context and why is this important right now?"
                    value={form.background}
                    onChange={e => set('background', e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>How Will Funds Be Used? <span className="text-destructive">*</span></Label>
                  <Textarea
                    placeholder="Provide a breakdown of how the funding will be spent. E.g., 40% equipment, 30% training, 20% logistics, 10% admin."
                    value={form.fundingBreakdown}
                    onChange={e => set('fundingBreakdown', e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Expected Beneficiaries <span className="text-destructive">*</span></Label>
                    <Input placeholder="e.g., 200 youths aged 15–25" value={form.expectedBeneficiaries} onChange={e => set('expectedBeneficiaries', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Previous Funding Received</Label>
                    <Input placeholder="e.g., ₦100,000 from local NGO in 2024, or None" value={form.previousFunding} onChange={e => set('previousFunding', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Expected Outcomes & Timeline <span className="text-destructive">*</span></Label>
                  <Textarea
                    placeholder="What specific outcomes will this project achieve and by when? Be as concrete as possible."
                    value={form.expectedOutcomes}
                    onChange={e => set('expectedOutcomes', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Step 2 — Submitter contact info */}
            {step === 2 && (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
                  🔒 Your contact details are private and only used by our admin team to follow up during review.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Contact Person <span className="text-destructive">*</span></Label>
                    <Input placeholder="Full name" value={form.contactName} onChange={e => set('contactName', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Organization / Group (optional)</Label>
                    <Input placeholder="e.g., Tech4Africa Foundation" value={form.organizationName} onChange={e => set('organizationName', e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Contact Email <span className="text-destructive">*</span></Label>
                    <Input type="email" placeholder="you@example.com" value={form.contactEmail} onChange={e => set('contactEmail', e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Contact Phone <span className="text-destructive">*</span></Label>
                    <Input type="tel" placeholder="+234 800 000 0000" value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} />
                  </div>
                </div>
                <div className="rounded-xl border border-[#8d44d1]/20 bg-[#8d44d1]/5 p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Before you submit</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Your project will be reviewed by our team within 3–5 business days.</li>
                    <li>You will be notified via email when it is approved or if more information is needed.</li>
                    <li>Only approved projects appear publicly on the platform.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex gap-2 items-start p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm mt-2">
                <TriangleAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              {step > 0 ? (
                <Button type="button" variant="outline" onClick={back}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
              ) : (
                <Button type="button" variant="ghost" onClick={handleClose}>Cancel</Button>
              )}

              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={next} className="bg-gradient-to-r from-[#8d44d1] to-[#7030b0] text-white border-0">
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-[#8d44d1] to-[#7030b0] text-white border-0"
                >
                  {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…</> : 'Submit Project'}
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
