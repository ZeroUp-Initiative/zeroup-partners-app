'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import ProtectedRoute from '@/components/auth/protected-route'
import Header from '@/components/layout/header'
import { authedFetch } from '@/lib/authed-fetch'
import { uploadImage, validateImageFile } from '@/lib/image-upload'
import { PROJECT_CATEGORIES } from '@/lib/organizations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, MessageSquarePlus, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

interface Data {
  organization: { name: string; contactName: string }
  proposals: { id: string; title: string; fundingGoal: number; status: string; notes: string; projectId: string | null; createdAt: string | null }[]
  projects: { id: string; title: string; fundingGoal: number; currentFunding: number; status: string }[]
}

const EMPTY = { title: '', description: '', story: '', fundingGoal: '', category: PROJECT_CATEGORIES[0], location: '', dueDate: '' }

const STATUS: Record<string, { label: string; className: string }> = {
  submitted: { label: 'In review', className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  approved: { label: 'Approved', className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  rejected: { label: 'Not approved', className: 'bg-red-500/10 text-red-700 dark:text-red-400' },
}

function OrganizationDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<Data | null>(null)
  const [loadError, setLoadError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [image, setImage] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [updateFor, setUpdateFor] = useState<{ id: string; title: string } | null>(null)
  const [update, setUpdate] = useState({ title: '', description: '' })

  const load = useCallback(async () => {
    setLoadError('')
    try {
      const res = await authedFetch('/api/organizations/proposals')
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Could not load your organization.')
      setData(json)
    } catch (e: any) {
      setLoadError(e.message)
    }
  }, [])

  useEffect(() => { if (user?.uid) load() }, [user?.uid, load])

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      let imageUrl = ''
      if (image) {
        const v = validateImageFile(image, 10)
        if (!v.valid) throw new Error(v.error || 'That image can’t be used.')
        imageUrl = await uploadImage(image)
      }
      const res = await authedFetch('/api/organizations/proposals', {
        method: 'POST',
        body: JSON.stringify({ ...form, fundingGoal: Number(form.fundingGoal), imageUrl }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Your project was not submitted. Try again.')
      toast.success('Submitted. ZeroUp will review it and email you.')
      setFormOpen(false)
      setForm(EMPTY)
      setImage(null)
      load()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const postUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!updateFor) return
    setBusy(true)
    setError('')
    try {
      const res = await authedFetch(`/api/organizations/projects/${updateFor.id}/updates`, { method: 'POST', body: JSON.stringify(update) })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'The update was not posted. Try again.')
      toast.success('Update posted to your project page.')
      setUpdateFor(null)
      setUpdate({ title: '', description: '' })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title="Partners Hub" subtitle="Organization" />
      <main className="container mx-auto space-y-8 px-4 py-8">
        {loadError ? (
          <Card>
            <CardHeader>
              <CardTitle>Can&apos;t open this page</CardTitle>
              <CardDescription>{loadError}</CardDescription>
            </CardHeader>
            <CardContent><Button variant="outline" onClick={load}>Try again</Button></CardContent>
          </Card>
        ) : !data ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status"><Loader2 className="h-4 w-4 animate-spin" /> Loading</p>
        ) : (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h1 className="break-words text-2xl font-bold sm:text-3xl">{data.organization.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">Submit projects for partners to support, and tell them how it&apos;s going.</p>
              </div>
              <Button onClick={() => { setError(''); setFormOpen(true) }} className="min-h-[44px] w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" /> Submit a project</Button>
            </div>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Live projects</h2>
              {data.projects.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing live yet. Approved projects appear here.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {data.projects.map((p) => (
                    <Card key={p.id}>
                      <CardHeader><CardTitle className="break-words text-base"><Link href={`/projects/${p.id}`} className="hover:underline">{p.title}</Link></CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        <Progress value={p.fundingGoal ? Math.min(100, (p.currentFunding / p.fundingGoal) * 100) : 0} />
                        <p className="text-sm tabular-nums text-muted-foreground">₦{p.currentFunding.toLocaleString()} of ₦{p.fundingGoal.toLocaleString()}</p>
                        <Button variant="outline" className="min-h-[44px] w-full" onClick={() => { setError(''); setUpdateFor({ id: p.id, title: p.title }) }}>
                          <MessageSquarePlus className="mr-2 h-4 w-4" /> Post an update
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Submissions</h2>
              {data.proposals.length === 0 ? (
                <p className="text-sm text-muted-foreground">You haven&apos;t submitted a project yet.</p>
              ) : (
                <ul className="divide-y rounded-xl border bg-card">
                  {data.proposals.map((p) => (
                    <li key={p.id} className="space-y-1 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <span className="min-w-0 break-words font-medium">{p.title}</span>
                        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS[p.status]?.className || ''}`}>{STATUS[p.status]?.label || p.status}</span>
                      </div>
                      <p className="text-sm tabular-nums text-muted-foreground">₦{p.fundingGoal.toLocaleString()}</p>
                      {p.notes && <p className="text-sm">Note from ZeroUp: {p.notes}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>

      <Dialog open={formOpen} onOpenChange={(o) => !busy && setFormOpen(o)}>
        <DialogContent className="max-h-[92dvh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit a project</DialogTitle>
            <DialogDescription>ZeroUp reviews every project before partners can see it. The funding goal can&apos;t be changed after approval.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="op-title">Title</Label><Input id="op-title" value={form.title} onChange={set('title')} maxLength={120} required /></div>
            <div className="space-y-1.5"><Label htmlFor="op-desc">Short summary</Label><Textarea id="op-desc" rows={2} value={form.description} onChange={set('description')} maxLength={400} required /></div>
            <div className="space-y-1.5"><Label htmlFor="op-story">Full story</Label><Textarea id="op-story" rows={6} value={form.story} onChange={set('story')} maxLength={8000} required placeholder="What's the need, what will you do, and who benefits?" /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5"><Label htmlFor="op-goal">Funding goal (₦)</Label><Input id="op-goal" type="number" inputMode="numeric" min={1000} value={form.fundingGoal} onChange={set('fundingGoal')} required /></div>
              <div className="space-y-1.5">
                <Label htmlFor="op-cat">Category</Label>
                <select id="op-cat" value={form.category} onChange={set('category')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm">
                  {PROJECT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5"><Label htmlFor="op-loc">Location (optional)</Label><Input id="op-loc" value={form.location} onChange={set('location')} maxLength={120} /></div>
              <div className="space-y-1.5"><Label htmlFor="op-due">End date (optional)</Label><Input id="op-due" type="date" value={form.dueDate} onChange={set('dueDate')} /></div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="op-img">Cover image (optional)</Label><Input id="op-img" type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} /></div>
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} disabled={busy} className="min-h-[44px]">Cancel</Button>
              <Button type="submit" disabled={busy} className="min-h-[44px]">{busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting</> : 'Submit for review'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={updateFor !== null} onOpenChange={(o) => !o && !busy && setUpdateFor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Post an update</DialogTitle>
            <DialogDescription className="break-words">{updateFor?.title}</DialogDescription>
          </DialogHeader>
          <form onSubmit={postUpdate} className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="up-title">What happened</Label><Input id="up-title" value={update.title} onChange={(e) => setUpdate((u) => ({ ...u, title: e.target.value }))} maxLength={120} required /></div>
            <div className="space-y-1.5"><Label htmlFor="up-desc">Details (optional)</Label><Textarea id="up-desc" rows={4} value={update.description} onChange={(e) => setUpdate((u) => ({ ...u, description: e.target.value }))} maxLength={1000} /></div>
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            <Button type="submit" disabled={busy} className="min-h-[44px] w-full">{busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Posting</> : 'Post update'}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function OrganizationDashboardPage() {
  return <ProtectedRoute><OrganizationDashboard /></ProtectedRoute>
}
