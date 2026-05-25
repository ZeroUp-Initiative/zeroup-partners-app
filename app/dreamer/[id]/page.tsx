"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Coins, Flame, Heart, FolderHeart, Crown, Loader2, Sparkles } from "lucide-react"
import { resolveTierStyle } from "@/lib/dreamers/tiers"

interface Profile {
  name: string
  username: string | null
  photoUrl: string | null
  balance: number
  totalEarned: number
  streak: number
  memberSince: string
  partneredTotal: number
  projectsBacked: number
  tier: { name: string; style: string } | null
}

export default function DreamerProfilePage({ params }: { params: { id: string } }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/dreamer/${params.id}`)
      .then(async (r) => {
        if (!r.ok) { setNotFound(true); return null }
        return r.json()
      })
      .then((d) => { if (d) setProfile(d) })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background px-6 text-center">
        <Sparkles className="w-10 h-10 text-muted-foreground" />
        <h1 className="text-xl font-bold">Dreamer not found</h1>
        <p className="text-muted-foreground">This Dream Card doesn't match an active Dreamer.</p>
        <Link href="/"><Button className="mt-2">Visit ZeroUp Partners</Button></Link>
      </div>
    )
  }

  const tierStyle = profile.tier ? resolveTierStyle(profile.tier.style) : null
  const banner = tierStyle?.gradient || "linear-gradient(135deg, #3b0764, #7c3aed, #c084fc)"
  const onDark = tierStyle ? tierStyle.textOn === "light" : true
  const bannerText = onDark ? "#ffffff" : "#141414"
  const initials = profile.name.charAt(0).toUpperCase()

  const stats = [
    { label: "Total Partnered", value: `₦${profile.partneredTotal.toLocaleString()}`, icon: Heart },
    { label: "Projects Backed", value: profile.projectsBacked.toLocaleString(), icon: FolderHeart },
    { label: "Dream Coins", value: profile.balance.toLocaleString(), icon: Coins },
    { label: "Day Streak", value: profile.streak.toLocaleString(), icon: Flame },
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-md space-y-5">
        {/* Banner */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl p-6 pt-8" style={{ background: banner, color: bannerText }}>
          <div className="absolute inset-0" style={{ background: "linear-gradient(105deg, rgba(255,255,255,0.15) 0%, transparent 40%)" }} />
          <div className="relative flex flex-col items-center text-center gap-3">
            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-white/40 bg-white/20 flex items-center justify-center">
              {profile.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold">{initials}</span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold leading-tight">{profile.name}</h1>
              {profile.username && <p className="opacity-80 text-sm">@{profile.username}</p>}
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-sm font-semibold">
              <Crown className="w-4 h-4" />
              {profile.tier ? `${profile.tier.name} Dream Card holder` : "ZeroUp Dreamer"}
            </div>
            {profile.memberSince && <p className="opacity-70 text-[11px] tracking-wide">MEMBER SINCE {profile.memberSince}</p>}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-4 text-center">
              <s.icon className="w-5 h-5 mx-auto mb-1.5 text-primary" />
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="rounded-2xl border border-border bg-card p-5 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            {profile.name} is part of the <span className="font-semibold text-foreground">ZeroUp Dreamers Community</span> — partners co-creating real social impact.
          </p>
          <Link href={`/?ref=${params.id}`}><Button className="w-full">Become a ZeroUp Partner</Button></Link>
        </div>

        <div className="flex items-center justify-center gap-2 pt-2 opacity-70">
          <div className="relative w-6 h-6">
            <Image src="/images/zeroup-partners-logo.png" alt="ZeroUp" fill className="object-contain" />
          </div>
          <span className="text-xs font-semibold tracking-wide text-muted-foreground">ZEROUP PARTNERS</span>
        </div>
      </div>
    </div>
  )
}
