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
import { CheckCircle2, Loader2, TriangleAlert } from 'lucide-react'
import toast from 'react-hot-toast'

interface ReferNeedModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReferNeedModal({ open, onOpenChange }: ReferNeedModalProps) {
  const { user } = useAuth()
  const [subjectName, setSubjectName] = useState('')
  const [contactInfo, setContactInfo] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError('Please describe the need you\'re referring.')
      return
    }
    setError('')
    setIsSubmitting(true)
    try {
      await addDoc(collection(db, 'referrals'), {
        submittedBy: user?.uid || '',
        submittedByName: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.displayName || '',
        subjectName: subjectName.trim(),
        contactInfo: contactInfo.trim(),
        description: description.trim(),
        status: 'new',
        createdAt: serverTimestamp(),
      })
      setSubmitted(true)
    } catch (err) {
      console.error(err)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSubjectName(''); setContactInfo(''); setDescription(''); setSubmitted(false); setError('')
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
            <DialogTitle>Thank You</DialogTitle>
            <p className="text-sm text-muted-foreground">We'll follow up on this and reach out if we need more detail.</p>
            <Button onClick={() => handleClose(false)}>Done</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Refer a Need</DialogTitle>
              <DialogDescription>Know a student or school that could use support? Let us know and our team will follow up.</DialogDescription>
            </DialogHeader>

            {error && (
              <div className="flex gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
                <TriangleAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="subjectName">Student or School Name (if known)</Label>
                <Input id="subjectName" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} placeholder="e.g. Bright Future Secondary School" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contactInfo">Contact Info (if known)</Label>
                <Input id="contactInfo" value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} placeholder="Phone or email" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">What's the need?</Label>
                <Textarea id="description" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell us what you know..." />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => handleClose(false)} disabled={isSubmitting}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending…</> : 'Send Referral'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
