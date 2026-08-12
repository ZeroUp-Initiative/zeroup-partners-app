'use client'

import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sparkles, Users } from 'lucide-react'

interface PartnerEntry {
  userId: string
  name: string
  photoURL?: string
  totalAmount: number
  firstDate: number
  messages: string[]
}

const FOUNDING_PARTNER_COUNT = 5
const AVATAR_STACK_SIZE = 10

function toMillis(value: any): number {
  if (!value) return Date.now()
  if (typeof value.toDate === 'function') return value.toDate().getTime()
  if (value instanceof Date) return value.getTime()
  const d = new Date(value)
  return isNaN(d.getTime()) ? Date.now() : d.getTime()
}

export function ProjectPartners({ projectId }: { projectId: string }) {
  const [partners, setPartners] = useState<PartnerEntry[]>([])
  const [usersMap, setUsersMap] = useState<Map<string, any>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const map = new Map<string, any>()
      snap.forEach((d) => map.set(d.id, d.data()))
      setUsersMap(map)
    })
    return () => unsubUsers()
  }, [])

  useEffect(() => {
    const q = query(collection(db, 'payments'), where('projectId', '==', projectId), where('status', '==', 'approved'))
    const unsubscribe = onSnapshot(q, (snap) => {
      const byUser = new Map<string, PartnerEntry>()
      snap.forEach((d) => {
        const data = d.data()
        const uid = data.userId
        if (!uid) return
        const existing = byUser.get(uid)
        const dateMs = toMillis(data.date || data.createdAt)
        if (existing) {
          existing.totalAmount += data.amount || 0
          existing.firstDate = Math.min(existing.firstDate, dateMs)
          if (data.message) existing.messages.push(data.message)
        } else {
          byUser.set(uid, {
            userId: uid,
            name: data.userFullName || 'Partner',
            totalAmount: data.amount || 0,
            firstDate: dateMs,
            messages: data.message ? [data.message] : [],
          })
        }
      })
      setPartners(Array.from(byUser.values()))
      setLoading(false)
    })
    return () => unsubscribe()
  }, [projectId])

  if (loading || partners.length === 0) return null

  const totalRaised = partners.reduce((sum, p) => sum + p.totalAmount, 0)
  const rankedByAmount = [...partners].sort((a, b) => b.totalAmount - a.totalAmount)
  const foundingPartnerIds = new Set(
    [...partners].sort((a, b) => a.firstDate - b.firstDate).slice(0, FOUNDING_PARTNER_COUNT).map((p) => p.userId)
  )

  const withDisplay = rankedByAmount.map((p) => {
    const u = usersMap.get(p.userId)
    const name = u?.firstName && u?.lastName ? `${u.firstName} ${u.lastName}` : p.name
    const photoURL = u?.photoURL as string | undefined
    const pct = totalRaised > 0 ? (p.totalAmount / totalRaised) * 100 : 0
    return { ...p, name, photoURL, pct, isFounding: foundingPartnerIds.has(p.userId) }
  })

  const avatarStack = withDisplay.slice(0, AVATAR_STACK_SIZE)
  const overflowCount = withDisplay.length - avatarStack.length

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-[#8d44d1]" />
        <h2 className="text-xl font-bold">Partners on This Project</h2>
        <span className="text-sm text-muted-foreground">({withDisplay.length})</span>
      </div>

      {/* Avatar strip */}
      <div className="flex items-center mb-6">
        <div className="flex -space-x-3">
          {avatarStack.map((p) => (
            <Avatar key={p.userId} className="h-10 w-10 border-2 border-background ring-1 ring-border" title={p.name}>
              <AvatarImage src={p.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${p.name}`} />
              <AvatarFallback className="bg-gradient-to-br from-[#8d44d1] to-[#7030b0] text-white text-xs">
                {p.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
        {overflowCount > 0 && (
          <span className="ml-3 text-sm text-muted-foreground">+{overflowCount} more</span>
        )}
      </div>

      {/* Full ranked list */}
      <div className="space-y-3">
        {withDisplay.map((p, i) => (
          <div key={p.userId} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs font-bold flex-shrink-0 mt-1">
              {i + 1}
            </div>
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarImage src={p.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${p.name}`} />
              <AvatarFallback className="bg-gradient-to-br from-[#8d44d1] to-[#7030b0] text-white text-xs">
                {p.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-medium text-sm">{p.name}</span>
                {p.isFounding && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-amber-600 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
                    <Sparkles className="w-2.5 h-2.5" /> Founding Partner
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                ₦{p.totalAmount.toLocaleString()} · {p.pct.toFixed(1)}% of funds raised
              </p>
              {p.messages.length > 0 && (
                <p className="text-sm italic text-muted-foreground mt-1.5">"{p.messages[p.messages.length - 1]}"</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
