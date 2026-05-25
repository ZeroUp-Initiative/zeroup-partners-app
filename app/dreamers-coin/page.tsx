"use client"

import ProtectedRoute from "@/components/auth/protected-route"
import { auth } from "@/lib/firebase/client"
import { ThemeToggle } from "@/components/theme-toggle"
import { CoinDropAnimation } from "@/components/coin-drop-animation"
import { SlotMachineCounter } from "@/components/slot-machine-counter"
import { LinkDreamerCard } from "@/components/dreamers/link-dreamer-card"
import { DreamCard } from "@/components/dreamers/dream-card"
import { getTierStatus, resolveTierStyle, DEFAULT_DREAM_TIERS, type DreamTierConfig } from "@/lib/dreamers/tiers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Coins, Trophy, Medal, Award, LogOut, Crown, Flame,
  TrendingUp, Wallet, ShoppingBag, ArrowLeft, Loader2, Check, Lock, Copy, Share2, Heart,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { useState, useEffect, useCallback } from "react"

interface DreamerData {
  linked: boolean
  me?: {
    firstName: string | null
    username: string | null
    photoUrl: string | null
    balance: number
    totalEarned: number
    streak: number
    rank: number
    dreamerId: string
    partneredTotal: number
    memberNumber: string
    memberSince: string
  }
  leaderboard?: { rank: number; name: string; username: string | null; photoUrl: string | null; balance: number; isMe: boolean }[]
  history?: { type: string; amount: number; description: string; createdAt: string }[]
}

function getRankIcon(rank: number) {
  switch (rank) {
    case 1: return <Crown className="w-5 h-5 text-yellow-500" />
    case 2: return <Medal className="w-5 h-5 text-gray-400" />
    case 3: return <Award className="w-5 h-5 text-amber-600" />
    default: return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</span>
  }
}

function DreamersCoinContent() {
  const [data, setData] = useState<DreamerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCoinDrop, setShowCoinDrop] = useState(false)
  const [tiers, setTiers] = useState<DreamTierConfig[]>(DEFAULT_DREAM_TIERS)
  const [refCopied, setRefCopied] = useState(false)
  const [proposals, setProposals] = useState<{ id: string; title: string; description: string; voteCount: number }[]>([])
  const [myVotes, setMyVotes] = useState<string[]>([])
  const [votingId, setVotingId] = useState<string | null>(null)

  useEffect(() => {
    if (!data?.linked) return
    ;(async () => {
      const idToken = await auth?.currentUser?.getIdToken().catch(() => null)
      const res = await fetch("/api/proposals", { headers: idToken ? { Authorization: `Bearer ${idToken}` } : {} })
      const d = await res.json()
      setProposals(d.proposals || [])
      setMyVotes(d.myVotes || [])
    })().catch(() => {})
  }, [data?.linked])

  const toggleVote = async (proposalId: string) => {
    setVotingId(proposalId)
    try {
      const idToken = await auth?.currentUser?.getIdToken()
      const res = await fetch("/api/proposals/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ proposalId }),
      })
      const d = await res.json()
      if (!res.ok) return
      setMyVotes((prev) => (d.voted ? [...prev, proposalId] : prev.filter((x) => x !== proposalId)))
      setProposals((prev) =>
        prev.map((p) => (p.id === proposalId ? { ...p, voteCount: d.voteCount } : p)).sort((a, b) => b.voteCount - a.voteCount),
      )
    } finally {
      setVotingId(null)
    }
  }

  useEffect(() => {
    fetch("/api/dream-tiers")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d?.tiers) && d.tiers.length) setTiers(d.tiers) })
      .catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const idToken = await auth?.currentUser?.getIdToken()
      if (!idToken) { setData({ linked: false }); return }
      const res = await fetch("/api/dreamers/me", { headers: { Authorization: `Bearer ${idToken}` } })
      const json = await res.json()
      setData(res.ok ? json : { linked: false })
    } catch {
      setData({ linked: false })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (data?.linked) {
      const t = setTimeout(() => { setShowCoinDrop(true); setTimeout(() => setShowCoinDrop(false), 2000) }, 600)
      return () => clearTimeout(t)
    }
  }, [data?.linked])

  const logout = async () => { await auth?.signOut() }

  const me = data?.me
  const initials = (me?.firstName || me?.username || "D").charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float-delayed" />
      </div>

      {me && <CoinDropAnimation isActive={showCoinDrop} coinCount={me.balance} />}

      {/* Header */}
      <header className="glass-card border-b border-border/50 sticky top-0 z-50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <div className="relative w-12 h-12 cursor-pointer">
                <Image src="/images/zeroup-partners-logo.png" alt="ZeroUp Partners" fill className="object-contain" />
              </div>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground">Dreamers Coin</h1>
              <p className="text-sm text-muted-foreground">Your rewards wallet</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={logout} className="bg-transparent">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="mb-6">
          <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p>Loading your Dreamer wallet…</p>
          </div>
        ) : !data?.linked ? (
          <div className="py-12 space-y-8">
            <div className="text-center space-y-2 max-w-lg mx-auto">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Welcome, Dreamer
              </h2>
              <p className="text-muted-foreground">
                The dream coins you earn in Dreamer Dash live here too. Connect your account to see your balance, streak, and rewards.
              </p>
            </div>
            <LinkDreamerCard onLinked={load} />
          </div>
        ) : (
          <motion.div className="space-y-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="space-y-1">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {me?.firstName ? `${me.firstName}'s` : "Your"} Dreamers Coin Wallet
              </h2>
              <p className="text-muted-foreground">Your dream coins live here on the Partners app too. Earn them by being an active member in Dreamer Dash and by partnering with ZeroUp — and climb Dream Card tiers as you go.</p>
            </div>

            {/* Wallet stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="md:col-span-2 glass-card bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2"><Wallet className="w-5 h-5" /> Your Wallet</CardTitle>
                      <CardDescription>Current balance and rank</CardDescription>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      {getRankIcon(me?.rank || 0)}<span>Rank #{me?.rank}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                      <Coins className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold"><SlotMachineCounter value={me?.balance || 0} duration={2} className="text-3xl font-bold" /></p>
                      <p className="text-sm text-muted-foreground">Dream Coins (DR)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold"><SlotMachineCounter value={me?.totalEarned || 0} duration={1.5} /></div>
                  <p className="text-xs text-muted-foreground">All-time DR earned</p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Streak</CardTitle>
                  <Flame className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold flex items-baseline gap-1">
                    <SlotMachineCounter value={me?.streak || 0} duration={1.5} />
                    <span className="text-sm font-normal text-muted-foreground">days</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Keep showing up to grow it</p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="card" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 glass-card">
                <TabsTrigger value="card">My Card</TabsTrigger>
                <TabsTrigger value="vote">Vote</TabsTrigger>
                <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="card" className="space-y-6">
                {(() => {
                  const partnered = me?.partneredTotal || 0
                  const status = getTierStatus(partnered, tiers)
                  const tierForCard = status.current || tiers[0]
                  const locked = !status.current
                  const origin = typeof window !== "undefined" ? window.location.origin : "https://zeroup-partners-app.vercel.app"
                  const qrValue = `${origin}/dreamer/${me?.dreamerId || ""}`
                  return (
                    <div className="space-y-6">
                      <Card className="glass-card">
                        <CardHeader>
                          <CardTitle>Your Dream Card</CardTitle>
                          <CardDescription>
                            Earn dream coins as a ZeroUp partner. The more you partner directly with ZeroUp, the higher your Dream Card tier — download your card to print and carry it.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <DreamCard
                            tier={tierForCard}
                            name={me?.firstName || me?.username || "Dreamer"}
                            drBalance={me?.balance || 0}
                            memberNumber={me?.memberNumber || ""}
                            memberSince={me?.memberSince || ""}
                            qrValue={qrValue}
                            locked={locked}
                            unlockHint={`Partner ₦${tiers[0].min.toLocaleString()} with ZeroUp to unlock your ${tiers[0].name} Dream Card`}
                          />
                        </CardContent>
                      </Card>

                      <Card className="glass-card">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2"><Share2 className="w-4 h-4" /> Partner through me</CardTitle>
                          <CardDescription>Share your link. When someone partners with ZeroUp through it, you earn referral dream coins (50 DR per ₦1,000).</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex gap-2 items-center">
                            <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2 text-sm font-mono truncate">{`${origin}/?ref=${me?.dreamerId || ""}`}</div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(`${origin}/?ref=${me?.dreamerId || ""}`)
                                setRefCopied(true)
                                setTimeout(() => setRefCopied(false), 2000)
                              }}
                            >
                              {refCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="glass-card">
                        <CardHeader>
                          <CardTitle>{status.current ? status.current.cardName : "Not yet a card holder"}</CardTitle>
                          <CardDescription>You've partnered ₦{partnered.toLocaleString()} with ZeroUp so far.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {status.next ? (
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-muted-foreground">Progress to {status.next.name}</span>
                                <span className="font-medium">₦{status.amountToNext.toLocaleString()} to go</span>
                              </div>
                              <Progress value={Math.round(status.progress * 100)} />
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">You've reached the highest tier. 🖤</p>
                          )}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                            {tiers.map((t) => {
                              const reached = partnered >= t.min
                              const isCurrent = status.current?.id === t.id
                              return (
                                <div key={t.id} className={`rounded-xl p-3 text-center border ${isCurrent ? "border-amber-400 ring-1 ring-amber-400/40" : "border-border"} ${reached ? "" : "opacity-50"}`}>
                                  <div className="h-8 rounded-md mb-2" style={{ background: resolveTierStyle(t.style).gradient }} />
                                  <p className="text-xs font-semibold">{t.name}</p>
                                  <p className="text-[10px] text-muted-foreground">₦{t.min.toLocaleString()}+</p>
                                </div>
                              )
                            })}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            You'll get an email when you reach a new card level.
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="glass-card">
                        <CardHeader>
                          <CardTitle>Card Benefits</CardTitle>
                          <CardDescription>What your Dream Card unlocks — and what's waiting at the next tiers.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                          {tiers.map((t) => {
                            const unlocked = partnered >= t.min
                            const st = resolveTierStyle(t.style)
                            return (
                              <div key={t.id}>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="w-6 h-4 rounded-sm" style={{ background: st.gradient }} />
                                  <span className="font-semibold">{t.name} Dream Card</span>
                                  {unlocked ? (
                                    <Badge variant="secondary" className="text-[10px]">Unlocked</Badge>
                                  ) : (
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                      <Lock className="w-3 h-3" /> ₦{t.min.toLocaleString()}+
                                    </span>
                                  )}
                                </div>
                                {t.perks.length ? (
                                  <ul className="space-y-1.5 pl-1">
                                    {t.perks.map((p, i) => (
                                      <li key={i} className={`flex items-start gap-2 text-sm ${unlocked ? "" : "text-muted-foreground"}`}>
                                        {unlocked ? (
                                          <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        ) : (
                                          <Lock className="w-3.5 h-3.5 mt-0.5 opacity-60 flex-shrink-0" />
                                        )}
                                        <span>{p}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-sm text-muted-foreground pl-1">Perks coming soon.</p>
                                )}
                              </div>
                            )
                          })}
                        </CardContent>
                      </Card>
                    </div>
                  )
                })()}
              </TabsContent>

              <TabsContent value="vote" className="space-y-4">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Vote on Projects</CardTitle>
                    <CardDescription>Support the projects you want ZeroUp to fund next — tap the heart. Ranked by support.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {proposals.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">No projects up for voting right now.</p>
                    ) : (
                      proposals.map((p) => {
                        const voted = myVotes.includes(p.id)
                        return (
                          <div key={p.id} className="flex items-start gap-3 p-3 rounded-lg border">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold">{p.title}</p>
                              {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
                            </div>
                            <button
                              onClick={() => toggleVote(p.id)}
                              disabled={votingId === p.id}
                              className="flex flex-col items-center gap-0.5 flex-shrink-0 disabled:opacity-50"
                            >
                              {votingId === p.id ? (
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                              ) : (
                                <Heart className={`w-6 h-6 transition-colors ${voted ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
                              )}
                              <span className="text-xs font-bold">{p.voteCount}</span>
                            </button>
                          </div>
                        )
                      })
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="leaderboard" className="space-y-6">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Top Dreamers</CardTitle>
                    <CardDescription>Ranked by dream coins earned</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(data.leaderboard || []).map((p) => (
                        <div key={p.rank} className={`flex items-center gap-4 p-3 rounded-lg ${p.isMe ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/60"}`}>
                          <div className="flex items-center gap-3">
                            {getRankIcon(p.rank)}
                            <Avatar className="w-10 h-10">
                              {p.photoUrl && <AvatarImage src={p.photoUrl} alt={p.name} />}
                              <AvatarFallback className={p.isMe ? "bg-primary text-primary-foreground" : ""}>{p.name.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold truncate">{p.name}</p>
                              {p.isMe && <Badge variant="secondary">You</Badge>}
                            </div>
                            {p.username && <p className="text-sm text-muted-foreground truncate">@{p.username}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            <Coins className="w-4 h-4 text-primary" />
                            <p className="font-bold text-lg">{p.balance.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                      {(!data.leaderboard || data.leaderboard.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-6">No leaderboard data yet.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="space-y-6">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Your latest dream coin earnings and spending</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(data.history || []).map((tx, i) => {
                        const earned = tx.amount >= 0
                        return (
                          <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/60">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${earned ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                              {earned ? <TrendingUp className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{tx.description || tx.type}</p>
                              <p className="text-sm text-muted-foreground">{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : ""}</p>
                            </div>
                            <div className={`text-right font-bold ${earned ? "text-green-600" : "text-red-600"}`}>
                              {earned ? "+" : "-"}{Math.abs(tx.amount).toLocaleString()}
                            </div>
                          </div>
                        )
                      })}
                      {(!data.history || data.history.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-6">No activity yet.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </main>
    </div>
  )
}

export default function DreamersCoinPage() {
  return (
    <ProtectedRoute>
      <DreamersCoinContent />
    </ProtectedRoute>
  )
}
