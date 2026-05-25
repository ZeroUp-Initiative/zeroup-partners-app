"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { auth } from "@/lib/firebase/client"
import { useAuth } from "@/contexts/auth-context"
import ProtectedRoute from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Loader2, Save } from "lucide-react"
import toast from "react-hot-toast"
import { TIER_STYLE_KEYS, resolveTierStyle, type DreamTierConfig, type TierStyleKey } from "@/lib/dreamers/tiers"

function AdminDreamCardsPage() {
  const { user } = useAuth()
  const [tiers, setTiers] = useState<DreamTierConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/dream-tiers")
      .then((r) => r.json())
      .then((d) => setTiers(Array.isArray(d?.tiers) ? d.tiers : []))
      .catch(() => setTiers([]))
      .finally(() => setLoading(false))
  }, [])

  const update = (i: number, patch: Partial<DreamTierConfig>) =>
    setTiers((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)))

  const remove = (i: number) => setTiers((prev) => prev.filter((_, idx) => idx !== i))

  const add = () =>
    setTiers((prev) => [...prev, { id: `tier-${Date.now()}`, name: "New Tier", min: 0, drCost: 0, perks: [], style: "blue" }])

  const save = async () => {
    setSaving(true)
    try {
      const idToken = await auth?.currentUser?.getIdToken()
      if (!idToken) { toast.error("Please sign in again"); return }
      const res = await fetch("/api/dream-tiers", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ tiers }),
      })
      const d = await res.json()
      if (!res.ok) { toast.error(d.error || "Failed to save tiers"); return }
      setTiers(d.tiers)
      toast.success("Dream Card tiers saved")
    } catch {
      toast.error("Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  if (!user || user.role !== "admin") {
    return <p>You do not have permission to view this page.</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dream Cards</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage Dreamer card tiers — names, the Naira a Dreamer must partner to reach each tier, the card style, and perks. Changes save to the database and apply everywhere.
          </p>
        </div>
        <Button onClick={save} disabled={saving || loading} className="whitespace-nowrap">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {tiers.map((t, i) => {
              const style = resolveTierStyle(t.style)
              return (
                <Card key={t.id ?? i}>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-16 h-10 rounded-md flex-shrink-0 shadow" style={{ background: style.gradient }} />
                        <div className="min-w-0">
                          <CardTitle className="truncate">{t.name || "Untitled tier"}</CardTitle>
                          <CardDescription>Unlocks at ₦{Number(t.min || 0).toLocaleString()}</CardDescription>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive flex-shrink-0" onClick={() => remove(i)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Tier name</Label>
                        <Input value={t.name} onChange={(e) => update(i, { name: e.target.value })} placeholder="e.g. Gold" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Threshold (₦ partnered)</Label>
                        <Input
                          type="number"
                          value={t.min}
                          onChange={(e) => update(i, { min: Number(e.target.value) })}
                          placeholder="50000"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Upgrade cost (DR)</Label>
                        <Input
                          type="number"
                          value={t.drCost}
                          onChange={(e) => update(i, { drCost: Number(e.target.value) })}
                          placeholder="0 = not purchasable"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Card style</Label>
                        <Select value={t.style} onValueChange={(v) => update(i, { style: v as TierStyleKey })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {TIER_STYLE_KEYS.map((key) => (
                              <SelectItem key={key} value={key}>
                                <span className="flex items-center gap-2">
                                  <span className="w-5 h-3.5 rounded-sm" style={{ background: resolveTierStyle(key).gradient }} />
                                  <span className="capitalize">{key}</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Perks (one per line)</Label>
                      <Textarea
                        rows={4}
                        value={t.perks.join("\n")}
                        onChange={(e) => update(i, { perks: e.target.value.split("\n") })}
                        placeholder={"Early access to new projects\nQuarterly meetup with the team\nFeatured spotlight"}
                      />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={add}>
              <Plus className="w-4 h-4 mr-2" /> Add Tier
            </Button>
            <Button onClick={save} disabled={saving} className="sm:ml-auto">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Tiers are automatically ordered by threshold when saved. Empty perk lines are ignored. Dreamers reach a tier once their total ₦ partnered with ZeroUp meets its threshold.
          </p>
        </>
      )}
    </div>
  )
}

export default function ProtectedAdminDreamCardsPage() {
  return (
    <ProtectedRoute>
      <AdminDreamCardsPage />
    </ProtectedRoute>
  )
}
