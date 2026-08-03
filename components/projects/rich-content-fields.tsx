'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Trash2, ArrowUp, ArrowDown, Upload, Loader2, TriangleAlert } from 'lucide-react'
import { VideoEmbed } from '@/components/projects/video-embed'
import { uploadImage, validateImageFile } from '@/lib/image-upload'
import type { ProjectTimelineItem, ProjectBudgetPhase } from '@/lib/types'
import toast from 'react-hot-toast'

export interface RichContentValue {
  story?: string
  videoUrl?: string
  gallery?: string[]
  timeline?: ProjectTimelineItem[]
  budgetPhases?: ProjectBudgetPhase[]
}

interface RichContentFieldsProps {
  value: RichContentValue
  onChange: (next: RichContentValue) => void
  fundingGoal: number
}

function move<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr
  const next = [...arr]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

const TIMELINE_STATUSES: { value: ProjectTimelineItem['status']; label: string }[] = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
]

export function RichContentFields({ value, onChange, fundingGoal }: RichContentFieldsProps) {
  const [isUploadingGallery, setIsUploadingGallery] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')

  const timeline = value.timeline || []
  const budgetPhases = value.budgetPhases || []
  const gallery = value.gallery || []
  const budgetTotal = budgetPhases.reduce((s, p) => s + (p.amount || 0), 0)

  // Timeline
  const addTimelineItem = () => {
    onChange({
      ...value,
      timeline: [...timeline, { id: crypto.randomUUID(), title: '', date: '', description: '', status: 'upcoming' }],
    })
  }
  const updateTimelineItem = (id: string, patch: Partial<ProjectTimelineItem>) => {
    onChange({ ...value, timeline: timeline.map((t) => (t.id === id ? { ...t, ...patch } : t)) })
  }
  const removeTimelineItem = (id: string) => {
    onChange({ ...value, timeline: timeline.filter((t) => t.id !== id) })
  }
  const moveTimelineItem = (index: number, dir: -1 | 1) => {
    onChange({ ...value, timeline: move(timeline, index, index + dir) })
  }

  // Budget phases
  const addBudgetPhase = () => {
    onChange({
      ...value,
      budgetPhases: [...budgetPhases, { id: crypto.randomUUID(), name: '', amount: 0, description: '' }],
    })
  }
  const updateBudgetPhase = (id: string, patch: Partial<ProjectBudgetPhase>) => {
    onChange({ ...value, budgetPhases: budgetPhases.map((p) => (p.id === id ? { ...p, ...patch } : p)) })
  }
  const removeBudgetPhase = (id: string) => {
    onChange({ ...value, budgetPhases: budgetPhases.filter((p) => p.id !== id) })
  }
  const moveBudgetPhase = (index: number, dir: -1 | 1) => {
    onChange({ ...value, budgetPhases: move(budgetPhases, index, index + dir) })
  }

  // Gallery
  const handleGalleryUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setIsUploadingGallery(true)
    const uploaded: string[] = []
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setUploadProgress(`Uploading ${i + 1} of ${files.length}...`)
        const validation = validateImageFile(file, 10)
        if (!validation.valid) {
          toast.error(`${file.name}: ${validation.error}`)
          continue
        }
        const url = await uploadImage(file)
        uploaded.push(url)
      }
      if (uploaded.length > 0) {
        onChange({ ...value, gallery: [...gallery, ...uploaded] })
      }
    } catch (err) {
      console.error('Gallery upload failed:', err)
      toast.error('Some images failed to upload.')
    } finally {
      setIsUploadingGallery(false)
      setUploadProgress('')
    }
  }
  const removeGalleryImage = (index: number) => {
    onChange({ ...value, gallery: gallery.filter((_, i) => i !== index) })
  }
  const moveGalleryImage = (index: number, dir: -1 | 1) => {
    onChange({ ...value, gallery: move(gallery, index, index + dir) })
  }

  return (
    <div className="space-y-6">
      {/* Story */}
      <div className="space-y-1.5">
        <h4 className="text-sm font-semibold">Story</h4>
        <p className="text-xs text-muted-foreground">The full, long-form narrative shown on the project's detail page.</p>
        <Textarea
          placeholder="Tell the full story of this project..."
          value={value.story || ''}
          onChange={(e) => onChange({ ...value, story: e.target.value })}
          rows={8}
        />
      </div>

      {/* Video */}
      <div className="space-y-1.5">
        <h4 className="text-sm font-semibold">Video</h4>
        <p className="text-xs text-muted-foreground">A YouTube or Vimeo link, or a direct .mp4/.webm video URL.</p>
        <Input
          placeholder="https://youtube.com/watch?v=..."
          value={value.videoUrl || ''}
          onChange={(e) => onChange({ ...value, videoUrl: e.target.value })}
        />
        {value.videoUrl && (
          <div className="aspect-video rounded-lg overflow-hidden bg-black mt-2">
            <VideoEmbed url={value.videoUrl} />
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold">Timeline</h4>
            <p className="text-xs text-muted-foreground">Milestones shown as a vertical timeline.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addTimelineItem}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Milestone
          </Button>
        </div>
        <div className="space-y-3">
          {timeline.map((item, i) => (
            <div key={item.id} className="rounded-lg border p-3 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  placeholder="Milestone title"
                  value={item.title}
                  onChange={(e) => updateTimelineItem(item.id, { title: e.target.value })}
                />
                <Input
                  placeholder="Date (e.g., March 2026 or TBD)"
                  value={item.date || ''}
                  onChange={(e) => updateTimelineItem(item.id, { date: e.target.value })}
                />
              </div>
              <Textarea
                placeholder="Description (optional)"
                value={item.description || ''}
                onChange={(e) => updateTimelineItem(item.id, { description: e.target.value })}
                rows={2}
              />
              <div className="flex items-center justify-between gap-2">
                <Select value={item.status} onValueChange={(v) => updateTimelineItem(item.id, { status: v as ProjectTimelineItem['status'] })}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIMELINE_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1">
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={i === 0} onClick={() => moveTimelineItem(i, -1)}><ArrowUp className="h-3.5 w-3.5" /></Button>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={i === timeline.length - 1} onClick={() => moveTimelineItem(i, 1)}><ArrowDown className="h-3.5 w-3.5" /></Button>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeTimelineItem(item.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </div>
          ))}
          {timeline.length === 0 && <p className="text-xs text-muted-foreground italic">No milestones yet.</p>}
        </div>
      </div>

      {/* Budget phases */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold">Budget by Phase</h4>
            <p className="text-xs text-muted-foreground">Public, structured breakdown of how funds will be spent.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addBudgetPhase}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Phase
          </Button>
        </div>
        <div className="space-y-3">
          {budgetPhases.map((phase, i) => (
            <div key={phase.id} className="rounded-lg border p-3 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  placeholder="Phase name (e.g., Pre-production)"
                  value={phase.name}
                  onChange={(e) => updateBudgetPhase(phase.id, { name: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Amount (₦)"
                  value={phase.amount || ''}
                  onChange={(e) => updateBudgetPhase(phase.id, { amount: Number(e.target.value) })}
                />
              </div>
              <Textarea
                placeholder="Description (optional)"
                value={phase.description || ''}
                onChange={(e) => updateBudgetPhase(phase.id, { description: e.target.value })}
                rows={2}
              />
              <div className="flex items-center justify-end gap-1">
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={i === 0} onClick={() => moveBudgetPhase(i, -1)}><ArrowUp className="h-3.5 w-3.5" /></Button>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={i === budgetPhases.length - 1} onClick={() => moveBudgetPhase(i, 1)}><ArrowDown className="h-3.5 w-3.5" /></Button>
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeBudgetPhase(phase.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
          {budgetPhases.length === 0 && <p className="text-xs text-muted-foreground italic">No budget phases yet.</p>}
        </div>
        {budgetPhases.length > 0 && (
          <p className={`text-sm font-medium ${budgetTotal > fundingGoal ? 'text-red-600' : budgetTotal < fundingGoal ? 'text-amber-600' : 'text-green-600'}`}>
            Allocated: ₦{budgetTotal.toLocaleString()} of ₦{fundingGoal.toLocaleString()} goal
          </p>
        )}
        {budgetTotal > fundingGoal && fundingGoal > 0 && (
          <Alert className="border-red-500/30 bg-red-500/5">
            <TriangleAlert className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-sm text-red-600 ml-2">
              Budget phases add up to more than the funding goal.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Gallery */}
      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-semibold">Gallery</h4>
          <p className="text-xs text-muted-foreground">Additional images shown in a gallery on the detail page.</p>
        </div>
        {gallery.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {gallery.map((src, i) => (
              <div key={src + i} className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
                <img src={src} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20" disabled={i === 0} onClick={() => moveGalleryImage(i, -1)}><ArrowUp className="h-3 w-3" /></Button>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20" disabled={i === gallery.length - 1} onClick={() => moveGalleryImage(i, 1)}><ArrowDown className="h-3 w-3" /></Button>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-red-500/50" onClick={() => removeGalleryImage(i)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors">
          <input
            id="gallery-upload"
            type="file"
            accept=".jpg,.jpeg,.png,.gif,.webp"
            multiple
            onChange={(e) => handleGalleryUpload(e.target.files)}
            className="hidden"
            disabled={isUploadingGallery}
          />
          <label htmlFor="gallery-upload" className="cursor-pointer block">
            {isUploadingGallery ? (
              <Loader2 className="w-6 h-6 text-primary mx-auto mb-2 animate-spin" />
            ) : (
              <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            )}
            <p className="text-sm font-medium">{isUploadingGallery ? uploadProgress : 'Click to add images'}</p>
            <p className="text-xs text-muted-foreground">JPG, PNG, GIF, WebP (max 10MB each)</p>
          </label>
        </div>
      </div>
    </div>
  )
}
