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
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, TriangleAlert, Plus, Trash2, Upload } from 'lucide-react'
import { uploadImage, validateImageFile } from '@/lib/image-upload'
import type { CaseType, CaseBudgetItem } from '@/lib/types'
import toast from 'react-hot-toast'

interface SubmitCaseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CASE_TYPES: { value: CaseType; label: string }[] = [
  { value: 'fees', label: 'School Fees' },
  { value: 'feeding', label: 'Feeding Programme' },
  { value: 'materials', label: 'Learning Materials' },
  { value: 'infrastructure', label: 'Infrastructure / WASH' },
  { value: 'special_needs', label: 'Special Needs Support' },
  { value: 'teacher_support', label: 'Teacher Support' },
  { value: 'other', label: 'Other' },
]

const URGENCY = [
  { value: 'low', label: 'Low — can wait a term' },
  { value: 'medium', label: 'Medium — needed this term' },
  { value: 'high', label: 'High — needed immediately' },
]

const STEPS = ['The Need', 'Beneficiary & Budget', 'Evidence & Consent']

const emptyForm = {
  title: '',
  caseType: '' as CaseType | '',
  narrative: '',
  urgency: 'medium',
  beneficiaryDisplayName: '',
  beneficiaryAgeGrade: '',
  anonymize: false,
  estimatedCost: '',
  consentConfirmed: false,
}

export function SubmitCaseModal({ open, onOpenChange }: SubmitCaseModalProps) {
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(emptyForm)
  const [budgetItems, setBudgetItems] = useState<CaseBudgetItem[]>([])
  const [photos, setPhotos] = useState<string[]>([])
  const [documents, setDocuments] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const set = <K extends keyof typeof emptyForm>(field: K, value: typeof emptyForm[K]) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const budgetTotal = budgetItems.reduce((s, b) => s + (b.amount || 0), 0)

  const addBudgetItem = () =>
    setBudgetItems(prev => [...prev, { id: crypto.randomUUID(), name: '', amount: 0, description: '' }])
  const updateBudgetItem = (id: string, patch: Partial<CaseBudgetItem>) =>
    setBudgetItems(prev => prev.map(b => (b.id === id ? { ...b, ...patch } : b)))
  const removeBudgetItem = (id: string) => setBudgetItems(prev => prev.filter(b => b.id !== id))

  const handleFileUpload = async (files: FileList | null, kind: 'photo' | 'document') => {
    if (!files || files.length === 0) return
    setIsUploading(true)
    try {
      for (const file of Array.from(files)) {
        const validation = validateImageFile(file)
        if (!validation.valid) {
          toast.error(validation.error || 'Invalid file.')
          continue
        }
        const url = await uploadImage(file)
        if (kind === 'photo') setPhotos(prev => [...prev, url])
        else setDocuments(prev => [...prev, url])
      }
    } catch {
      toast.error('Upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const validateStep = () => {
    if (step === 0) {
      if (!form.title.trim()) return 'A case title is required.'
      if (!form.caseType) return 'Please select a case type.'
      if (!form.narrative.trim()) return 'Please tell us the story behind this need.'
    }
    if (step === 1) {
      if (!form.beneficiaryDisplayName.trim()) return "Please provide the beneficiary's first name or initials."
      if (!form.estimatedCost || isNaN(Number(form.estimatedCost)) || Number(form.estimatedCost) <= 0)
        return 'Please enter a valid estimated cost.'
    }
    if (step === 2) {
      if (!form.consentConfirmed) return 'You must confirm you have consent to share this story publicly.'
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
      await addDoc(collection(db, 'cases'), {
        schoolId: user?.uid || '',
        schoolName: (user as any)?.schoolName || (user as any)?.displayName || '',
        title: form.title.trim(),
        caseType: form.caseType,
        narrative: form.narrative.trim(),
        urgency: form.urgency,
        beneficiaryDisplayName: form.beneficiaryDisplayName.trim(),
        beneficiaryAgeGrade: form.beneficiaryAgeGrade.trim(),
        anonymize: form.anonymize,
        estimatedCost: Number(form.estimatedCost),
        budgetItems,
        photos: form.anonymize ? [] : photos,
        documents,
        consentConfirmed: form.consentConfirmed,
        status: 'submitted',
        adminNotes: '',
        createdAt: serverTimestamp(),
      })

      setSubmitted(true)
      toast.success('Case submitted for review!')
    } catch (err) {
      console.error(err)
      setError('Something went wrong submitting your case. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setStep(0)
      setForm(emptyForm)
      setBudgetItems([])
      setPhotos([])
      setDocuments([])
      setSubmitted(false)
      setError('')
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        {submitted ? (
          <div className="py-10 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <DialogTitle>Case Submitted</DialogTitle>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Thank you. Our team will review and follow up — you can track its status from "My Cases."
            </p>
            <Button onClick={() => handleClose(false)}>Done</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Submit an Education Case</DialogTitle>
              <DialogDescription>
                Step {step + 1} of {STEPS.length}: {STEPS[step]}
              </DialogDescription>
            </DialogHeader>

            {error && (
              <div className="flex gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
                <TriangleAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {step === 0 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="title">Case Title</Label>
                  <Input id="title" placeholder="e.g. Term 2 fees for a Grade 6 student" value={form.title} onChange={(e) => set('title', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="caseType">Case Type</Label>
                  <Select value={form.caseType} onValueChange={(v) => set('caseType', v as CaseType)}>
                    <SelectTrigger id="caseType"><SelectValue placeholder="Select a type" /></SelectTrigger>
                    <SelectContent>
                      {CASE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="urgency">Urgency</Label>
                  <Select value={form.urgency} onValueChange={(v) => set('urgency', v)}>
                    <SelectTrigger id="urgency"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {URGENCY.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="narrative">Tell us the story</Label>
                  <Textarea id="narrative" rows={5} placeholder="What's the situation? Why does it matter?" value={form.narrative} onChange={(e) => set('narrative', e.target.value)} />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="space-y-1.5 flex-1">
                    <Label htmlFor="beneficiaryDisplayName">Beneficiary First Name / Initials</Label>
                    <Input id="beneficiaryDisplayName" placeholder="e.g. Amara, or A.O." value={form.beneficiaryDisplayName} onChange={(e) => set('beneficiaryDisplayName', e.target.value)} />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <Label htmlFor="beneficiaryAgeGrade">Age / Grade Band</Label>
                    <Input id="beneficiaryAgeGrade" placeholder="e.g. Grade 6, or 14-16" value={form.beneficiaryAgeGrade} onChange={(e) => set('beneficiaryAgeGrade', e.target.value)} />
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="anonymize" checked={form.anonymize} onCheckedChange={(c) => set('anonymize', !!c)} />
                  <Label htmlFor="anonymize" className="text-sm font-normal leading-snug">
                    Keep this beneficiary fully anonymous (no name or photo shown publicly — use for especially sensitive situations)
                  </Label>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="estimatedCost">Estimated Cost (₦)</Label>
                  <Input id="estimatedCost" type="number" placeholder="0" value={form.estimatedCost} onChange={(e) => set('estimatedCost', e.target.value)} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Itemized Costs (optional)</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addBudgetItem}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Item
                    </Button>
                  </div>
                  {budgetItems.map((item) => (
                    <div key={item.id} className="flex gap-2 items-start">
                      <Input placeholder="Item name" value={item.name} onChange={(e) => updateBudgetItem(item.id, { name: e.target.value })} className="flex-1" />
                      <Input type="number" placeholder="Amount" value={item.amount || ''} onChange={(e) => updateBudgetItem(item.id, { amount: Number(e.target.value) })} className="w-32" />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeBudgetItem(item.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  {budgetItems.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Itemized total: ₦{budgetTotal.toLocaleString()}
                      {budgetTotal !== Number(form.estimatedCost || 0) && ' (does not need to match the estimate exactly)'}
                    </p>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Photos {form.anonymize && <span className="text-muted-foreground font-normal">(disabled — anonymized case)</span>}</Label>
                  <label className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 text-sm text-muted-foreground ${form.anonymize ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:border-primary/50'}`}>
                    <Upload className="w-4 h-4" /> {isUploading ? 'Uploading…' : 'Click to upload photo(s)'}
                    <input type="file" accept="image/*" multiple hidden disabled={isUploading || form.anonymize} onChange={(e) => handleFileUpload(e.target.files, 'photo')} />
                  </label>
                  {photos.length > 0 && <p className="text-xs text-muted-foreground">{photos.length} photo(s) uploaded.</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Supporting Documents</Label>
                  <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 text-sm text-muted-foreground cursor-pointer hover:border-primary/50">
                    <Upload className="w-4 h-4" /> {isUploading ? 'Uploading…' : 'Click to upload document(s) — fee invoice, admission letter, etc.'}
                    <input type="file" accept="image/*,application/pdf" multiple hidden disabled={isUploading} onChange={(e) => handleFileUpload(e.target.files, 'document')} />
                  </label>
                  {documents.length > 0 && <p className="text-xs text-muted-foreground">{documents.length} document(s) uploaded.</p>}
                </div>
                <div className="flex items-start gap-2 pt-2 border-t">
                  <Checkbox id="consent" checked={form.consentConfirmed} onCheckedChange={(c) => set('consentConfirmed', !!c)} />
                  <Label htmlFor="consent" className="text-sm font-normal leading-snug">
                    I confirm the school has the beneficiary's (or their guardian's) consent to share this story publicly on ZeroUp Partners.
                  </Label>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t">
              <Button type="button" variant="outline" onClick={step === 0 ? () => handleClose(false) : back} disabled={isSubmitting}>
                {step === 0 ? 'Cancel' : <><ArrowLeft className="w-4 h-4 mr-1" /> Back</>}
              </Button>
              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={next}>Next <ArrowRight className="w-4 h-4 ml-1" /></Button>
              ) : (
                <Button type="button" onClick={handleSubmit} disabled={isSubmitting || isUploading}>
                  {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…</> : 'Submit Case'}
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
