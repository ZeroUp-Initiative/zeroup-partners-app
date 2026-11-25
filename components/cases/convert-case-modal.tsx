'use client'

import { useEffect, useState } from 'react'
import { auth } from '@/lib/firebase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Rocket } from 'lucide-react'
import { RichContentFields, type RichContentValue } from '@/components/projects/rich-content-fields'
import type { EducationCase } from '@/lib/types'
import toast from 'react-hot-toast'

interface ConvertCaseModalProps {
  educationCase: EducationCase | null
  onOpenChange: (open: boolean) => void
  onConverted: (projectId: string) => void
}

export function ConvertCaseModal({ educationCase, onOpenChange, onConverted }: ConvertCaseModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [fundingGoal, setFundingGoal] = useState('')
  const [location, setLocation] = useState('')
  const [ownedByZeroUp, setOwnedByZeroUp] = useState(true)
  const [rich, setRich] = useState<RichContentValue>({ story: '', videoUrl: '', gallery: [], timeline: [], budgetPhases: [] })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!educationCase) return
    setTitle(educationCase.title)
    setDescription(educationCase.narrative)
    setFundingGoal(String(educationCase.estimatedCost))
    setLocation('')
    setOwnedByZeroUp(true)
    setRich({
      story: educationCase.narrative,
      videoUrl: '',
      // Admin explicitly curates the public gallery — never auto-copied,
      // especially for an anonymized case where nothing beneficiary-
      // identifying should end up public without a deliberate choice.
      gallery: [],
      timeline: [],
      budgetPhases: (educationCase.budgetItems || []).map((b) => ({
        id: b.id, name: b.name, amount: b.amount, description: b.description,
      })),
    })
    setError('')
  }, [educationCase])

  const handleSubmit = async () => {
    if (!educationCase) return
    if (!title.trim() || !description.trim() || !fundingGoal || Number(fundingGoal) <= 0) {
      setError('Title, description, and a positive funding goal are required.')
      return
    }
    setIsSubmitting(true)
    setError('')
    try {
      const idToken = await auth?.currentUser?.getIdToken()
      if (!idToken) throw new Error('No auth token available. Please refresh and try again.')

      const res = await fetch(`/api/admin/cases/${educationCase.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          fundingGoal: Number(fundingGoal),
          category: 'Education',
          location: location.trim(),
          ownedByZeroUp,
          story: rich.story,
          videoUrl: rich.videoUrl,
          gallery: rich.gallery,
          timeline: rich.timeline,
          budgetPhases: rich.budgetPhases,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Conversion failed.')

      toast.success('Case converted and published as a live project!')
      onConverted(data.projectId)
    } catch (err: any) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={educationCase !== null} onOpenChange={(o) => !o && onOpenChange(false)}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convert to Project</DialogTitle>
          <DialogDescription>
            Curate what goes public before this case becomes a live, fundable project. Nothing from the case's evidence is auto-published — add what you've chosen below.
          </DialogDescription>
        </DialogHeader>

        {educationCase && (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="convTitle">Project Title</Label>
              <Input id="convTitle" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="convDescription">Public Summary</Label>
              <Textarea id="convDescription" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="space-y-1.5 flex-1">
                <Label htmlFor="convFundingGoal">Funding Goal (₦)</Label>
                <Input id="convFundingGoal" type="number" value={fundingGoal} onChange={(e) => setFundingGoal(e.target.value)} />
              </div>
              <div className="space-y-1.5 flex-1">
                <Label htmlFor="convLocation">Location (optional)</Label>
                <Input id="convLocation" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, State" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="convOwned" checked={ownedByZeroUp} onCheckedChange={(c) => setOwnedByZeroUp(!!c)} />
              <Label htmlFor="convOwned" className="text-sm font-normal">ZeroUp's own project (coins and tier credit apply either way)</Label>
            </div>

            <div className="pt-2 border-t">
              <RichContentFields value={rich} onChange={setRich} fundingGoal={Number(fundingGoal) || 0} />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Publishing…</> : <><Rocket className="w-4 h-4 mr-2" /> Publish as Project</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
