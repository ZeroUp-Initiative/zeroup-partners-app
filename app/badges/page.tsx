"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import ProtectedRoute from "@/components/auth/protected-route"
import { useAuth } from "@/contexts/auth-context"
import Header from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Trophy, Sparkles, Loader2, CheckCircle2, Coins } from "lucide-react"
import { db, auth } from "@/lib/firebase/client"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import type { PartnerBadge } from "@/lib/types"
import toast from "react-hot-toast"

function BadgesContent() {
  const { user } = useAuth()
  const [badges, setBadges] = useState<PartnerBadge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [claimingId, setClaimingId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, "badges"), where("userId", "==", user.uid))
    const unsubscribe = onSnapshot(q, (snap) => {
      const data: PartnerBadge[] = []
      snap.forEach((d) => data.push({ id: d.id, ...d.data() } as PartnerBadge))
      // Newest first
      data.sort((a, b) => {
        const at = (a.createdAt as any)?.toDate?.() ?? new Date(a.createdAt as any)
        const bt = (b.createdAt as any)?.toDate?.() ?? new Date(b.createdAt as any)
        return bt.getTime() - at.getTime()
      })
      setBadges(data)
      setIsLoading(false)
    })
    return () => unsubscribe()
  }, [user])

  const claim = async (badge: PartnerBadge) => {
    setClaimingId(badge.id)
    try {
      const idToken = await auth?.currentUser?.getIdToken()
      if (!idToken) {
        toast.error("Please refresh and try again.")
        return
      }
      const res = await fetch('/api/badges/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ badgeId: badge.id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || 'Failed to claim badge.')
        return
      }
      if (data.warning) {
        toast.error(data.warning)
      } else if (data.drAwarded > 0) {
        toast.success(`Badge claimed! ${Number(data.drAwarded).toLocaleString()} DR added to your Dreamer Dash wallet.`)
      } else {
        toast.success('Badge claimed!')
      }
    } catch {
      toast.error('Something went wrong claiming this badge.')
    } finally {
      setClaimingId(null)
    }
  }

  const pending = badges.filter(b => b.status === 'pending')
  const claimed = badges.filter(b => b.status === 'claimed')

  return (
    <div className="min-h-screen bg-background">
      <Header title="Your Badges" subtitle="Milestones you've helped ZeroUp Partners reach" />
      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : badges.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 text-muted-foreground">
            <Trophy className="w-14 h-14 mb-4 opacity-30" />
            <p className="text-lg font-semibold">No badges yet</p>
            <p className="text-sm mt-1 max-w-sm">
              Badges are awarded automatically whenever ZeroUp Partners crosses a community-wide milestone — you'll be notified the moment one is earned.
            </p>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Ready to Claim</h2>
                {pending.map((badge) => (
                  <Card key={badge.id} className="border-amber-500/30 bg-amber-500/5">
                    <CardContent className="flex items-center justify-between gap-4 py-5">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg">
                          <Trophy className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold">{badge.label}</p>
                          {badge.isDreamerEligible && badge.drAmount > 0 && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Coins className="w-3.5 h-3.5 text-amber-500" /> +{badge.drAmount.toLocaleString()} DR when claimed
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => claim(badge)}
                        disabled={claimingId === badge.id}
                        className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shrink-0"
                      >
                        {claimingId === badge.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4 mr-1.5" /> Claim</>}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {claimed.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Claimed</h2>
                {claimed.map((badge) => (
                  <Card key={badge.id}>
                    <CardContent className="flex items-center gap-3 py-4">
                      <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                        <Trophy className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{badge.label}</p>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-[#8d44d1]" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default function BadgesPage() {
  return (
    <ProtectedRoute>
      <BadgesContent />
    </ProtectedRoute>
  )
}
