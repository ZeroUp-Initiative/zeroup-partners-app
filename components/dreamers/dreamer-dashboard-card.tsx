'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { auth } from '@/lib/firebase/client'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Coins, Flame } from 'lucide-react'

type State =
  | { status: 'loading' }
  | { status: 'unlinked' }
  | { status: 'linked'; balance: number; streak: number }

export function DreamerDashboardCard() {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const idToken = await auth?.currentUser?.getIdToken()
        if (!idToken) { if (active) setState({ status: 'unlinked' }); return }
        const res = await fetch('/api/dreamers/me', { headers: { Authorization: `Bearer ${idToken}` } })
        const data = await res.json().catch(() => ({}))
        if (!active) return
        if (res.ok && data.linked) {
          setState({ status: 'linked', balance: data.me?.balance || 0, streak: data.me?.streak || 0 })
        } else {
          setState({ status: 'unlinked' })
        }
      } catch {
        if (active) setState({ status: 'unlinked' })
      }
    })()
    return () => { active = false }
  }, [])

  return (
    <Link href="/dreamers-coin">
      <Card className="group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-yellow-500" />
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="bg-gradient-to-br from-amber-500/20 to-yellow-400/20 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
            <Coins className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            {state.status === 'linked' ? (
              <>
                <CardTitle className="group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {state.balance.toLocaleString()} Dream Coins
                </CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-orange-500" /> {state.streak}-day streak · View your wallet
                </CardDescription>
              </>
            ) : state.status === 'loading' ? (
              <>
                <CardTitle className="text-muted-foreground">Dreamers Coin</CardTitle>
                <CardDescription>Loading…</CardDescription>
              </>
            ) : (
              <>
                <CardTitle className="group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Are you a Dreamer?</CardTitle>
                <CardDescription>Connect your Dreamer Dash account and view your dream coins.</CardDescription>
              </>
            )}
          </div>
        </CardHeader>
      </Card>
    </Link>
  )
}
