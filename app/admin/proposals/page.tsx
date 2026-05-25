"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from "react"
import { auth } from "@/lib/firebase/client"
import { useAuth } from "@/contexts/auth-context"
import ProtectedRoute from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Loader2, Heart, Vote } from "lucide-react"
import toast from "react-hot-toast"

interface Proposal {
  id: string
  title: string
  description: string
  isActive: boolean
  voteCount: number
}

function AdminProposalsPage() {
  const { user } = useAuth()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ title: "", description: "" })

  const authed = useCallback(async (init?: RequestInit) => {
    const idToken = await auth?.currentUser?.getIdToken()
    return fetch("/api/admin/proposals", { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}`, ...(init?.headers || {}) } })
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authed()
      const d = await res.json()
      setProposals(Array.isArray(d?.proposals) ? d.proposals : [])
    } catch {
      setProposals([])
    } finally {
      setLoading(false)
    }
  }, [authed])

  useEffect(() => { load() }, [load])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { toast.error("Title is required"); return }
    setCreating(true)
    try {
      const res = await authed({ method: "POST", body: JSON.stringify(form) })
      if (!res.ok) { toast.error("Failed to create"); return }
      toast.success("Proposal created")
      setForm({ title: "", description: "" })
      load()
    } finally {
      setCreating(false)
    }
  }

  const toggle = async (p: Proposal) => { await authed({ method: "PATCH", body: JSON.stringify({ id: p.id, isActive: !p.isActive }) }); load() }
  const remove = async (p: Proposal) => { await authed({ method: "DELETE", body: JSON.stringify({ id: p.id }) }); load() }

  if (!user || user.role !== "admin") return <p>You do not have permission to view this page.</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Project Votes</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Put up candidate projects for Dreamers to vote on. Ranked by support.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">New Proposal</CardTitle>
          <CardDescription>Active proposals appear on the Dreamers page for voting.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={create} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Clean Water Borehole — Ibadan" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What is this project and why should Dreamers prioritize it?" />
            </div>
            <Button type="submit" disabled={creating}>
              {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Proposal
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : proposals.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground"><Vote className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No proposals yet.</p></div>
      ) : (
        <div className="space-y-3">
          {proposals.map((p) => (
            <Card key={p.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{p.title}</h3>
                      <Badge variant={p.isActive ? "default" : "secondary"}>{p.isActive ? "Active" : "Hidden"}</Badge>
                    </div>
                    {p.description && <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>}
                  </div>
                  <div className="flex items-center gap-1 text-primary font-bold flex-shrink-0">
                    <Heart className="w-4 h-4 fill-primary" /> {p.voteCount}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" onClick={() => toggle(p)}>{p.isActive ? "Hide" : "Show"}</Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => remove(p)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProtectedAdminProposalsPage() {
  return (
    <ProtectedRoute>
      <AdminProposalsPage />
    </ProtectedRoute>
  )
}
