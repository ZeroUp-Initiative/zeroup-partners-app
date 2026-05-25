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
import { Plus, Trash2, Loader2, Store, Users, Copy } from "lucide-react"
import toast from "react-hot-toast"
import type { DreamTierConfig } from "@/lib/dreamers/tiers"

interface Merchant {
  id: string
  name: string
  category: string
  location: string
  description: string
  discount: string
  minTierId: string
  verifyCode: string
  isActive: boolean
  redemptions: number
}

function AdminMerchantsPage() {
  const { user } = useAuth()
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [tiers, setTiers] = useState<DreamTierConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: "", discount: "", category: "", location: "", description: "", minTierId: "" })

  const authed = useCallback(async (init?: RequestInit) => {
    const idToken = await auth?.currentUser?.getIdToken()
    return fetch("/api/admin/merchants", { ...init, headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}`, ...(init?.headers || {}) } })
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authed()
      const d = await res.json()
      setMerchants(Array.isArray(d?.merchants) ? d.merchants : [])
    } catch {
      setMerchants([])
    } finally {
      setLoading(false)
    }
  }, [authed])

  useEffect(() => {
    load()
    fetch("/api/dream-tiers").then((r) => r.json()).then((d) => setTiers(d?.tiers || [])).catch(() => {})
  }, [load])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.discount.trim()) { toast.error("Name and discount are required"); return }
    setCreating(true)
    try {
      const res = await authed({ method: "POST", body: JSON.stringify(form) })
      if (!res.ok) { toast.error("Failed to create"); return }
      toast.success("Merchant added")
      setForm({ name: "", discount: "", category: "", location: "", description: "", minTierId: "" })
      load()
    } finally {
      setCreating(false)
    }
  }

  const toggle = async (m: Merchant) => { await authed({ method: "PATCH", body: JSON.stringify({ id: m.id, isActive: !m.isActive }) }); load() }
  const remove = async (m: Merchant) => { await authed({ method: "DELETE", body: JSON.stringify({ id: m.id }) }); load() }
  const tierName = (id: string) => tiers.find((t) => t.id === id)?.name || ""

  if (!user || user.role !== "admin") return <p>You do not have permission to view this page.</p>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Merchants</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Partner businesses where Dreamers get discounts. Give each merchant their verify code so staff can check cards.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add Merchant</CardTitle>
          <CardDescription>Active merchants appear in the Dreamers' Perks directory.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={create} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Business name *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Brew & Co Cafe" /></div>
            <div className="space-y-1.5"><Label>Discount *</Label><Input value={form.discount} onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))} placeholder="e.g. 10% off" /></div>
            <div className="space-y-1.5"><Label>Category</Label><Input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="e.g. Cafe" /></div>
            <div className="space-y-1.5"><Label>Location</Label><Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="e.g. Ibadan" /></div>
            <div className="space-y-1.5">
              <Label>Minimum tier</Label>
              <select value={form.minTierId} onChange={(e) => setForm((f) => ({ ...f, minTierId: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">All Dreamers</option>
                {tiers.map((t) => <option key={t.id} value={t.id}>{t.name} & up</option>)}
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2"><Label>Description</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What's the offer / any conditions?" /></div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={creating}>{creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}Add Merchant</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : merchants.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground"><Store className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No merchants yet.</p></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {merchants.map((m) => (
            <Card key={m.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{m.name}</CardTitle>
                    <CardDescription>{m.category}{m.location ? ` · ${m.location}` : ""}</CardDescription>
                  </div>
                  <Badge variant={m.isActive ? "default" : "secondary"}>{m.isActive ? "Active" : "Inactive"}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="font-semibold text-primary">{m.discount}</span>
                  <span className="text-muted-foreground">{m.minTierId ? `${tierName(m.minTierId)} & up` : "All Dreamers"}</span>
                  <span className="flex items-center gap-1 text-muted-foreground"><Users className="w-4 h-4" /> {m.redemptions}</span>
                </div>
                <div className="flex items-center gap-2 text-sm bg-muted/50 rounded px-2 py-1">
                  <span className="text-muted-foreground text-xs">Verify code:</span>
                  <span className="font-mono font-bold">{m.verifyCode}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto" onClick={() => { navigator.clipboard.writeText(m.verifyCode); toast.success("Code copied") }}><Copy className="w-3 h-3" /></Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => toggle(m)}>{m.isActive ? "Deactivate" : "Activate"}</Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => remove(m)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">Merchant staff verify cards at <span className="font-mono">/merchant/verify</span> using their verify code.</p>
    </div>
  )
}

export default function ProtectedAdminMerchantsPage() {
  return (
    <ProtectedRoute>
      <AdminMerchantsPage />
    </ProtectedRoute>
  )
}
