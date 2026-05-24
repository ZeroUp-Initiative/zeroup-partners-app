"use client"

import ProtectedRoute from "@/components/auth/protected-route"
import { auth } from "@/lib/firebase/client"
import { ThemeToggle } from "@/components/theme-toggle"
import { CoinDropAnimation } from "@/components/coin-drop-animation"
import { SlotMachineCounter } from "@/components/slot-machine-counter"
import { LinkDreamerCard } from "@/components/dreamers/link-dreamer-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Coins, Trophy, Medal, Award, LogOut, Crown, Flame, Gift,
  TrendingUp, Wallet, ShoppingBag, ArrowLeft, Loader2,
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
  }
  leaderboard?: { rank: number; name: string; username: string | null; photoUrl: string | null; balance: number; isMe: boolean }[]
  perks?: { id: string; title: string; description: string; cost: number }[]
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
              <p className="text-muted-foreground">Live from Dreamer Dash — earned by being an active member of the community.</p>
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
            <Tabs defaultValue="leaderboard" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 glass-card">
                <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
                <TabsTrigger value="redeem">Perks</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

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

              <TabsContent value="redeem" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(data.perks || []).map((perk) => {
                    const affordable = (me?.balance || 0) >= perk.cost
                    return (
                      <Card key={perk.id} className={`glass-card h-full ${affordable ? "" : "opacity-60"}`}>
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <Gift className="w-6 h-6 text-primary" />
                            <CardTitle className="text-lg">{perk.title}</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-sm text-muted-foreground">{perk.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Coins className="w-4 h-4 text-primary" />
                              <span className="font-bold">{perk.cost.toLocaleString()}</span>
                            </div>
                            <Badge variant={affordable ? "default" : "secondary"}>{affordable ? "Redeem in Dreamer Dash" : "Not enough DR"}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                  {(!data.perks || data.perks.length === 0) && (
                    <p className="text-sm text-muted-foreground col-span-full text-center py-6">No perks available right now.</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground text-center">Redeeming happens in the Dreamer Dash app to keep your balance in sync.</p>
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
