"use client"

import { AuthGuard, useAuth } from "@/components/auth-guard"
import { ThemeToggle } from "@/components/theme-toggle"
import { CoinDropAnimation } from "@/components/coin-drop-animation"
import { SlotMachineCounter } from "@/components/slot-machine-counter"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Coins,
  Trophy,
  Medal,
  Award,
  LogOut,
  Crown,
  Star,
  Gift,
  Zap,
  TrendingUp,
  Wallet,
  ShoppingBag,
  Target,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { useState, useEffect } from "react"

function DreamersCoinContent() {
  const { user, logout } = useAuth()
  const [showCoinDrop, setShowCoinDrop] = useState(false)
  const [redeemingPerk, setRedeemingPerk] = useState<number | null>(null)

  // Calculate coins based on rank (higher rank = more coins)
  const calculateCoinsFromRank = (rank: number) => {
    if (rank === 1) return 1000
    if (rank === 2) return 800
    if (rank === 3) return 600
    if (rank <= 5) return 400
    if (rank <= 10) return 200
    return 100
  }

  // Mock leaderboard data with coins
  const leaderboard = [
    {
      rank: 1,
      name: "Sarah Johnson",
      organization: "Tech for Good",
      totalContributions: 8500,
      coins: 1000,
      avatar: "SJ",
    },
    {
      rank: 2,
      name: "Michael Chen",
      organization: "Global Impact Corp",
      totalContributions: 7200,
      coins: 800,
      avatar: "MC",
    },
    {
      rank: 3,
      name: "Emily Rodriguez",
      organization: "Change Makers Inc",
      totalContributions: 6800,
      coins: 600,
      avatar: "ER",
    },
    {
      rank: 4,
      name: user?.name || "You",
      organization: user?.organization || "Individual Partner",
      totalContributions: 3350,
      coins: 400,
      avatar: user?.name?.charAt(0)?.toUpperCase() || "U",
      isCurrentUser: true,
    },
    {
      rank: 5,
      name: "David Kim",
      organization: "Innovation Hub",
      totalContributions: 3100,
      coins: 400,
      avatar: "DK",
    },
  ]

  const userCoins = leaderboard.find((p) => p.isCurrentUser)?.coins || 400
  const userRank = leaderboard.find((p) => p.isCurrentUser)?.rank || 4

  // Available perks for redemption
  const availablePerks = [
    {
      id: 1,
      name: "Impact Champion Badge",
      description: "Exclusive badge for your profile",
      cost: 500,
      icon: <Trophy className="w-6 h-6 text-yellow-500" />,
      category: "Badge",
      available: userCoins >= 500,
    },
    {
      id: 2,
      name: "Priority Support",
      description: "Get priority customer support for 30 days",
      cost: 300,
      icon: <Zap className="w-6 h-6 text-blue-500" />,
      category: "Service",
      available: userCoins >= 300,
    },
    {
      id: 3,
      name: "Monthly Spotlight",
      description: "Featured in next month's newsletter",
      cost: 800,
      icon: <Star className="w-6 h-6 text-purple-500" />,
      category: "Recognition",
      available: userCoins >= 800,
    },
    {
      id: 4,
      name: "Exclusive Webinar Access",
      description: "Access to VIP-only educational webinars",
      cost: 200,
      icon: <Target className="w-6 h-6 text-green-500" />,
      category: "Education",
      available: userCoins >= 200,
    },
    {
      id: 5,
      name: "Custom Profile Theme",
      description: "Personalize your profile with custom colors",
      cost: 150,
      icon: <Gift className="w-6 h-6 text-pink-500" />,
      category: "Customization",
      available: userCoins >= 150,
    },
    {
      id: 6,
      name: "Leadership Circle Invite",
      description: "Join exclusive leadership discussions",
      cost: 1200,
      icon: <Crown className="w-6 h-6 text-amber-500" />,
      category: "Access",
      available: userCoins >= 1200,
    },
  ]

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />
      default:
        return (
          <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">
            #{rank}
          </span>
        )
    }
  }

  const coinHistory = [
    { date: "2024-01-15", amount: +400, reason: "Monthly ranking #4", type: "earned" },
    { date: "2024-01-10", amount: -200, reason: "Redeemed: Exclusive Webinar Access", type: "spent" },
    { date: "2024-01-05", amount: +100, reason: "Consistency bonus", type: "earned" },
    { date: "2023-12-30", amount: +400, reason: "Monthly ranking #4", type: "earned" },
  ]

  const handleRedeemPerk = (perkId: number) => {
    setRedeemingPerk(perkId)
    setShowCoinDrop(true)

    setTimeout(() => {
      setRedeemingPerk(null)
      setShowCoinDrop(false)
    }, 3000)
  }

  useEffect(() => {
    // Trigger coin drop animation on page load
    const timer = setTimeout(() => {
      setShowCoinDrop(true)
      setTimeout(() => setShowCoinDrop(false), 2000)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute bottom-1/4 left-1/3 w-48 h-48 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      <CoinDropAnimation isActive={showCoinDrop} coinCount={userCoins} />

      {/* Header */}
      <motion.header
        className="glass-card border-b border-border/50 sticky top-0 z-50 backdrop-blur-xl"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center gap-3"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Link href="/dashboard">
                <motion.div
                  className="relative w-12 h-12 cursor-pointer neon-glow-blue"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <Image src="/images/zeroup-partners-logo.png" alt="ZeroUp Partners" fill className="object-contain" />
                </motion.div>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground">Dreamers Coin</h1>
                <p className="text-sm text-muted-foreground">Your rewards wallet</p>
              </div>
            </motion.div>
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="text-muted-foreground hover:text-primary transition-all duration-300 hover:glow-text"
                >
                  Dashboard
                </Link>
                <Link
                  href="/community"
                  className="text-muted-foreground hover:text-primary transition-all duration-300 hover:glow-text"
                >
                  Community
                </Link>
                <Link
                  href="/contributions"
                  className="text-muted-foreground hover:text-primary transition-all duration-300 hover:glow-text"
                >
                  Contributions
                </Link>
              </nav>
              <ThemeToggle />
              <motion.div
                className="flex items-center gap-3"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Avatar className="ring-2 ring-primary/20 neon-glow-blue">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.organization || "Individual Partner"}</p>
                </div>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="outline" size="sm" onClick={logout} className="neon-button bg-transparent">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 relative z-10">
        <motion.div className="space-y-8" variants={containerVariants} initial="hidden" animate="visible">
          <motion.div className="space-y-2 animate-slide-up" variants={itemVariants}>
            <h2 className="text-3xl font-bold text-balance bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Dreamers Coin Wallet
            </h2>
            <p className="text-muted-foreground animate-fade-in-delayed">
              Earn coins based on your leaderboard ranking and redeem them for exclusive perks and recognition.
            </p>
          </motion.div>

          {/* Wallet Overview */}
          <motion.div className="grid grid-cols-1 md:grid-cols-4 gap-6" variants={containerVariants}>
            <motion.div
              className="md:col-span-2"
              variants={itemVariants}
              whileHover={{
                y: -5,
                transition: { type: "spring", stiffness: 300, damping: 10 },
              }}
            >
              <Card className="glass-card hover-tilt neon-glow-purple bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20 transition-all duration-500 relative overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        >
                          <Wallet className="w-5 h-5" />
                        </motion.div>
                        Your Wallet
                      </CardTitle>
                      <CardDescription>Current balance and rank</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                        >
                          {getRankIcon(userRank)}
                        </motion.div>
                        <span>Rank #{userRank}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <motion.div
                        className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center"
                        animate={{
                          boxShadow: [
                            "0 0 0px rgba(234, 179, 8, 0)",
                            "0 0 20px rgba(234, 179, 8, 0.5)",
                            "0 0 0px rgba(234, 179, 8, 0)",
                          ],
                        }}
                        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                      >
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        >
                          <Coins className="w-6 h-6 text-primary" />
                        </motion.div>
                      </motion.div>
                      <div>
                        <p className="text-3xl font-bold">
                          <SlotMachineCounter value={userCoins} duration={2} className="text-3xl font-bold" />
                        </p>
                        <p className="text-sm text-muted-foreground">Dreamers Coins</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Next rank bonus</span>
                        <span className="font-medium">+200 coins</span>
                      </div>
                      <Progress value={75} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        Improve your ranking to earn more coins next month
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {[
              {
                title: "This Month",
                value: 400,
                prefix: "+",
                subtitle: "Coins earned",
                icon: TrendingUp,
                glowColor: "neon-glow-green",
              },
              {
                title: "Total Spent",
                value: 200,
                subtitle: "On perks & badges",
                icon: ShoppingBag,
                glowColor: "neon-glow-red",
              },
            ].map((stat, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{
                  y: -5,
                  transition: { type: "spring", stiffness: 300, damping: 10 },
                }}
              >
                <Card className={`glass-card hover-tilt ${stat.glowColor} transition-all duration-500`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <motion.div whileHover={{ rotate: 360, scale: 1.1 }} transition={{ duration: 0.6 }}>
                      <stat.icon className="h-4 w-4 text-muted-foreground animate-pulse-slow" />
                    </motion.div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold animate-number-glow">
                      <SlotMachineCounter value={stat.value} prefix={stat.prefix} duration={1.5} />
                    </div>
                    <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Main Content Tabs */}
          <motion.div variants={itemVariants}>
            <Tabs defaultValue="leaderboard" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 glass-card">
                <TabsTrigger value="leaderboard">Coin Leaderboard</TabsTrigger>
                <TabsTrigger value="redeem">Redeem Perks</TabsTrigger>
                <TabsTrigger value="history">Transaction History</TabsTrigger>
              </TabsList>

              <TabsContent value="leaderboard" className="space-y-6">
                <Card className="glass-card neon-glow-blue">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Coin Leaderboard
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    </CardTitle>
                    <CardDescription>Partners ranked by coins earned this month</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {leaderboard.map((partner, index) => (
                        <motion.div
                          key={partner.rank}
                          className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-300 glass-card hover-tilt animate-fade-in ${
                            partner.isCurrentUser
                              ? "bg-primary/10 border border-primary/20 neon-glow-accent"
                              : "hover:bg-muted/70"
                          }`}
                          initial={{ opacity: 0, x: -50 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="flex items-center gap-3">
                            <motion.div
                              animate={
                                partner.rank <= 3
                                  ? {
                                      scale: [1, 1.1, 1],
                                      rotate: [0, 5, -5, 0],
                                    }
                                  : {}
                              }
                              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                            >
                              {getRankIcon(partner.rank)}
                            </motion.div>
                            <Avatar className="w-10 h-10">
                              <AvatarFallback
                                className={partner.isCurrentUser ? "bg-primary text-primary-foreground" : ""}
                              >
                                {partner.avatar}
                              </AvatarFallback>
                            </Avatar>
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{partner.name}</p>
                              {partner.isCurrentUser && <Badge variant="secondary">You</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">{partner.organization}</p>
                          </div>

                          <div className="text-right space-y-1">
                            <div className="flex items-center gap-2">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                              >
                                <Coins className="w-4 h-4 text-primary" />
                              </motion.div>
                              <p className="font-bold text-lg">
                                <SlotMachineCounter value={partner.coins} duration={1 + index * 0.2} />
                              </p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              ${partner.totalContributions.toLocaleString()} contributed
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="redeem" className="space-y-6">
                <motion.div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  variants={containerVariants}
                >
                  {availablePerks.map((perk, index) => (
                    <motion.div
                      key={perk.id}
                      variants={itemVariants}
                      whileHover={{
                        y: -8,
                        scale: 1.02,
                        transition: { type: "spring", stiffness: 300, damping: 10 },
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card
                        className={`glass-card hover-tilt transition-all duration-500 h-full animate-slide-up ${
                          perk.available ? "neon-glow cursor-pointer" : "opacity-60"
                        } ${redeemingPerk === perk.id ? "animate-pulse-glow" : ""}`}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <motion.div
                                whileHover={{ rotate: 360, scale: 1.1 }}
                                transition={{ duration: 0.6 }}
                                animate={
                                  redeemingPerk === perk.id
                                    ? {
                                        rotate: 360,
                                        scale: [1, 1.2, 1],
                                      }
                                    : {}
                                }
                              >
                                {perk.icon}
                              </motion.div>
                              <div>
                                <CardTitle className="text-lg">{perk.name}</CardTitle>
                                <Badge variant="outline" className="text-xs">
                                  {perk.category}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">{perk.description}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                                >
                                  <Coins className="w-4 h-4 text-primary" />
                                </motion.div>
                                <span className="font-bold">{perk.cost}</span>
                              </div>
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button
                                  size="sm"
                                  disabled={!perk.available || redeemingPerk === perk.id}
                                  variant={perk.available ? "default" : "secondary"}
                                  onClick={() => perk.available && handleRedeemPerk(perk.id)}
                                  className={perk.available ? "neon-button" : ""}
                                >
                                  {redeemingPerk === perk.id
                                    ? "Redeeming..."
                                    : perk.available
                                      ? "Redeem"
                                      : "Insufficient Coins"}
                                </Button>
                              </motion.div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </TabsContent>

              <TabsContent value="history" className="space-y-6">
                <Card className="glass-card neon-glow-green">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Transaction History
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    </CardTitle>
                    <CardDescription>Your recent coin earnings and spending</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {coinHistory.map((transaction, index) => (
                        <motion.div
                          key={index}
                          className="flex items-center gap-4 p-4 glass-card hover-tilt rounded-lg animate-fade-in"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          style={{ animationDelay: `${index * 200}ms` }}
                        >
                          <motion.div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              transaction.type === "earned" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                            }`}
                            whileHover={{ rotate: 360, scale: 1.1 }}
                            transition={{ duration: 0.6 }}
                          >
                            {transaction.type === "earned" ? (
                              <TrendingUp className="w-5 h-5" />
                            ) : (
                              <ShoppingBag className="w-5 h-5" />
                            )}
                          </motion.div>
                          <div className="flex-1">
                            <p className="font-medium">{transaction.reason}</p>
                            <p className="text-sm text-muted-foreground">{transaction.date}</p>
                          </div>
                          <div
                            className={`text-right font-bold ${
                              transaction.type === "earned" ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            <SlotMachineCounter
                              value={Math.abs(transaction.amount)}
                              prefix={transaction.type === "earned" ? "+" : "-"}
                              duration={1}
                            />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      </main>
    </div>
  )
}

export default function DreamersCoinPage() {
  return (
    <AuthGuard>
      <DreamersCoinContent />
    </AuthGuard>
  )
}
