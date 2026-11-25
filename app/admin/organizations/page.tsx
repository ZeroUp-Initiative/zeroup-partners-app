"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import ProtectedRoute from "@/components/auth/protected-route"
import { authedFetch } from "@/lib/authed-fetch"
import { ORG_TYPES, type Organization, type OrgProposal } from "@/lib/organizations"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Plus } from "lucide-react"
import toast from "react-hot-toast"

const EMPTY = { name: "", type: ORG_TYPES[0].value as string, contactName: "", email: "", phone: "", registrationNumber: "" }

const STATUS: Record<string, { label: string; className: string }> = {
  invited: { label: "Invited", className: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  active: { label: "Active", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  suspended: { label: "Suspended", className: "bg-red-500/10 text-red-700 dark:text-red-400" },
  cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground" },
}

function AdminOrganizations() {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"
  const [orgs, setOrgs] = useState<Organization[] | null>(null)
  const [proposals, setProposals] = useState<OrgProposal[]>([])
  const [loadError, setLoadError] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState<{ org: Organization; action: "cancel" | "suspend" } | null>(null)
  const [review, setReview] = useState<OrgProposal | null>(null)
  const [notes, setNotes] = useState("")

  const load = useCallback(async () => {
    setLoadError("")
    try {
      const res = await authedFetch("/api/admin/organizations")
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Could not load organizations.")
      setOrgs(json.organizations)
      setProposals(json.proposals)
    } catch (e: any) {
      setLoadError(e.message)
    }
  }, [])

  useEffect(() => { if (isAdmin) load() }, [isAdmin, load])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError("")
    try {
      const res = await authedFetch("/api/admin/organizations", { method: "POST", body: JSON.stringify(form) })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Could not create the organization.")
      if (json.emailSent) toast.success(`Invite sent to ${form.email}.`)
      else toast.error("Created, but the invite email failed. Use Resend invite.")
      setCreateOpen(false)
      setForm(EMPTY)
      load()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const act = async (org: Organization, action: string, done: string) => {
    setBusy(true)
    try {
      const res = await authedFetch(`/api/admin/organizations/${org.id}`, { method: "POST", body: JSON.stringify({ action }) })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "That did not go through. Try again.")
      toast.success(done)
      setConfirming(null)
      load()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  const decide = async (action: "approve" | "reject") => {
    if (!review) return
    setBusy(true)
    setError("")
    try {
      const res = await authedFetch(`/api/admin/organizations/proposals/${review.id}`, { method: "POST", body: JSON.stringify({ action, notes }) })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "The review was not saved. Try again.")
      toast.success(action === "approve" ? "Project is live." : "Sent back to the organization.")
      if (json.emailSent === false) toast.error("The organization couldn't be emailed.")
      setReview(null)
      setNotes("")
      load()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (!isAdmin) return <p>You do not have permission to view this page.</p>

  const waiting = proposals.filter((p) => p.status === "submitted")
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Organizations</h1>
          <p className="text-sm text-muted-foreground sm:text-base">Only admins can create these accounts. The organization activates by email and sets its own password.</p>
        </div>
        <Button onClick={() => { setError(""); setCreateOpen(true) }} className="min-h-[44px] w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" /> Invite organization</Button>
      </div>

      {loadError && (
        <Card><CardHeader><CardTitle className="text-base">{loadError}</CardTitle></CardHeader><CardContent><Button variant="outline" onClick={load}>Try again</Button></CardContent></Card>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Projects to review{waiting.length > 0 && ` (${waiting.length})`}</h2>
        {waiting.length === 0 ? <p className="text-sm text-muted-foreground">Nothing waiting.</p> : (
          <ul className="divide-y rounded-xl border bg-card">
            {waiting.map((p) => (
              <li key={p.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="break-words font-medium">{p.title}</p>
                  <p className="text-sm text-muted-foreground">{p.orgName}, ₦{p.fundingGoal.toLocaleString()}</p>
                </div>
                <Button variant="outline" className="min-h-[44px]" onClick={() => { setError(""); setNotes(""); setReview(p) }}>Review</Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Accounts</h2>
        {!orgs ? (!loadError && <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status"><Loader2 className="h-4 w-4 animate-spin" /> Loading</p>) : orgs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No organizations yet. Invite the first one.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {orgs.map((o) => {
              const expired = o.status === "invited" && !!o.inviteExpiresAt && new Date(o.inviteExpiresAt).getTime() < Date.now()
              return (
                <Card key={o.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="break-words text-base">{o.name}</CardTitle>
                        <CardDescription className="break-words">{ORG_TYPES.find((t) => t.value === o.type)?.label}, {o.contactName}</CardDescription>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS[o.status]?.className}`}>{expired ? "Invite expired" : STATUS[o.status]?.label}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="break-words text-sm text-muted-foreground">{o.email}{o.registrationNumber && ` · Reg. ${o.registrationNumber}`}</p>
                    <div className="flex flex-wrap gap-2">
                      {o.status === "invited" && <>
                        <Button size="sm" variant="outline" className="min-h-[40px]" disabled={busy} onClick={() => act(o, "resend", `New invite sent to ${o.email}.`)}>Resend invite</Button>
                        <Button size="sm" variant="ghost" className="min-h-[40px] text-destructive hover:text-destructive" disabled={busy} onClick={() => setConfirming({ org: o, action: "cancel" })}>Cancel invite</Button>
                      </>}
                      {o.status === "active" && <Button size="sm" variant="ghost" className="min-h-[40px] text-destructive hover:text-destructive" disabled={busy} onClick={() => setConfirming({ org: o, action: "suspend" })}>Suspend</Button>}
                      {o.status === "suspended" && <Button size="sm" variant="outline" className="min-h-[40px]" disabled={busy} onClick={() => act(o, "reactivate", `${o.name} is active again.`)}>Reactivate</Button>}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      <Dialog open={createOpen} onOpenChange={(o) => !busy && setCreateOpen(o)}>
        <DialogContent className="max-h-[92dvh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invite organization</DialogTitle>
            <DialogDescription>We email a link that works once and expires in 72 hours.</DialogDescription>
          </DialogHeader>
          <form onSubmit={create} className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="o-name">Organization name</Label><Input id="o-name" value={form.name} onChange={set("name")} maxLength={120} required /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="o-type">Type</Label>
                <select id="o-type" value={form.type} onChange={set("type")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm">
                  {ORG_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5"><Label htmlFor="o-reg">Registration no. (optional)</Label><Input id="o-reg" value={form.registrationNumber} onChange={set("registrationNumber")} maxLength={80} /></div>
              <div className="space-y-1.5"><Label htmlFor="o-contact">Contact person</Label><Input id="o-contact" value={form.contactName} onChange={set("contactName")} maxLength={120} required /></div>
              <div className="space-y-1.5"><Label htmlFor="o-phone">Phone (optional)</Label><Input id="o-phone" type="tel" value={form.phone} onChange={set("phone")} maxLength={40} /></div>
            </div>
            <div className="space-y-1.5"><Label htmlFor="o-email">Email</Label><Input id="o-email" type="email" value={form.email} onChange={set("email")} required /></div>
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            <Button type="submit" disabled={busy} className="min-h-[44px] w-full">{busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending</> : "Send invite"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={confirming !== null} onOpenChange={(o) => !o && !busy && setConfirming(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{confirming?.action === "suspend" ? `Suspend ${confirming.org.name}?` : `Cancel the invite for ${confirming?.org.name}?`}</DialogTitle>
            <DialogDescription>{confirming?.action === "suspend" ? "They won't be able to submit projects or post updates until you reactivate them. Live projects stay up." : "The emailed link stops working."}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" disabled={busy} onClick={() => setConfirming(null)}>Keep it</Button>
            <Button variant="destructive" disabled={busy} onClick={() => confirming && act(confirming.org, confirming.action, confirming.action === "suspend" ? "Organization suspended." : "Invite cancelled.")}>
              {confirming?.action === "suspend" ? "Suspend" : "Cancel invite"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={review !== null} onOpenChange={(o) => !o && !busy && setReview(null)}>
        <DialogContent className="max-h-[92dvh] max-w-xl overflow-y-auto">
          {review && <>
            <DialogHeader>
              <DialogTitle className="break-words">{review.title}</DialogTitle>
              <DialogDescription>{review.orgName}, ₦{review.fundingGoal.toLocaleString()}, {review.category}{review.location && `, ${review.location}`}</DialogDescription>
            </DialogHeader>
            {review.imageUrl && <img src={review.imageUrl} alt="" className="max-h-64 w-full rounded-lg object-contain" />}
            <p className="break-words text-sm">{review.description}</p>
            <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{review.story}</p>
            <div className="space-y-1.5"><Label htmlFor="r-notes">Note to the organization (required to send back)</Label><Textarea id="r-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} /></div>
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="min-h-[44px]" disabled={busy} onClick={() => decide("reject")}>Send back</Button>
              <Button className="min-h-[44px]" disabled={busy} onClick={() => decide("approve")}>Approve and publish</Button>
            </div>
          </>}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function AdminOrganizationsPage() {
  return <ProtectedRoute><AdminOrganizations /></ProtectedRoute>
}
