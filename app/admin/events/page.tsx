"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { auth } from "@/lib/firebase/client"
import { useAuth } from "@/contexts/auth-context"
import ProtectedRoute from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Loader2, QrCode, Users, Coins, Calendar } from "lucide-react"
import toast from "react-hot-toast"

interface EventItem {
  id: string
  title: string
  code: string
  reward: number
  location: string
  isActive: boolean
  date: string | null
  checkins: number
}

function AdminEventsPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ title: "", code: "", reward: "", location: "", date: "" })

  const authed = useCallback(async (init?: RequestInit) => {
    const idToken = await auth?.currentUser?.getIdToken()
    return fetch("/api/admin/events", { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}`, ...(init?.headers || {}) } })
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authed()
      const d = await res.json()
      setEvents(Array.isArray(d?.events) ? d.events : [])
    } catch {
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [authed])

  useEffect(() => { load() }, [load])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.code.trim()) { toast.error("Title and code are required"); return }
    setCreating(true)
    try {
      const res = await authed({ method: "POST", body: JSON.stringify({ ...form, reward: Number(form.reward) || 0 }) })
      if (!res.ok) { toast.error("Failed to create event"); return }
      toast.success("Event created")
      setForm({ title: "", code: "", reward: "", location: "", date: "" })
      load()
    } finally {
      setCreating(false)
    }
  }

  const toggle = async (ev: EventItem) => {
    await authed({ method: "PATCH", body: JSON.stringify({ id: ev.id, isActive: !ev.isActive }) })
    load()
  }

  const remove = async (ev: EventItem) => {
    await authed({ method: "DELETE", body: JSON.stringify({ id: ev.id }) })
    load()
  }

  if (!user || user.role !== "admin") return <p>You do not have permission to view this page.</p>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Events</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Create physical events and check Dreamers in by scanning their card. (Virtual events use the Telegram mini-app activity codes.)
          </p>
        </div>
        <Link href="/admin/events/scan">
          <Button className="whitespace-nowrap"><QrCode className="w-4 h-4 mr-2" /> Open Scanner</Button>
        </Link>
      </div>

      {/* Create */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Create Event</CardTitle>
          <CardDescription>Dreamers earn the reward (in dream coins) when checked in.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={create} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Lagos Dreamers Meetup" />
            </div>
            <div className="space-y-1.5">
              <Label>Code *</Label>
              <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. LAGOS25" className="font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label>Reward (DR)</Label>
              <Input type="number" value={form.reward} onChange={(e) => setForm((f) => ({ ...f, reward: e.target.value }))} placeholder="500" />
            </div>
            <div className="space-y-1.5">
              <Label>Date (optional)</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Location (optional)</Label>
              <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="e.g. Ibadan" />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={creating}>
                {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Create Event
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground"><Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No events yet.</p></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {events.map((ev) => (
            <Card key={ev.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{ev.title}</CardTitle>
                    <CardDescription>{ev.date ? new Date(ev.date).toLocaleDateString() : "No date"}{ev.location ? ` · ${ev.location}` : ""}</CardDescription>
                  </div>
                  <Badge variant={ev.isActive ? "default" : "secondary"}>{ev.isActive ? "Active" : "Inactive"}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="font-mono bg-muted rounded px-2 py-0.5">{ev.code}</span>
                  <span className="flex items-center gap-1 text-muted-foreground"><Coins className="w-4 h-4" /> {ev.reward.toLocaleString()} DR</span>
                  <span className="flex items-center gap-1 text-muted-foreground"><Users className="w-4 h-4" /> {ev.checkins} checked in</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => toggle(ev)}>{ev.isActive ? "Deactivate" : "Activate"}</Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => remove(ev)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProtectedAdminEventsPage() {
  return (
    <ProtectedRoute>
      <AdminEventsPage />
    </ProtectedRoute>
  )
}
