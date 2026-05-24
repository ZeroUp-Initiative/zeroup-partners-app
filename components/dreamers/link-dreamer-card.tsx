'use client'

import { useState } from 'react'
import { auth } from '@/lib/firebase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, Link2, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

export function LinkDreamerCard({ onLinked }: { onLinked?: () => void }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    const clean = code.trim()
    if (!clean) {
      toast.error('Enter your link code')
      return
    }
    setLoading(true)
    try {
      const idToken = await auth?.currentUser?.getIdToken()
      if (!idToken) {
        toast.error('Please sign in again')
        return
      }
      const res = await fetch('/api/dreamers/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ code: clean }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Could not link your account')
        return
      }
      toast.success(`Welcome, ${data.dreamer?.firstName || data.dreamer?.username || 'Dreamer'}! 🎉`)
      onLinked?.()
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mb-2">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <CardTitle>Connect your Dreamer account</CardTitle>
        <CardDescription>
          Link your Dreamer Dash (Telegram) account to bring your dream coins, streak, and rewards here.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Open the Dreamer Dash app on Telegram</li>
          <li>Find your <span className="font-medium text-foreground">link code</span></li>
          <li>Paste it below</li>
        </ol>
        <div className="flex gap-2">
          <Input
            placeholder="e.g. D7K-9QP"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            disabled={loading}
            className="font-mono tracking-wider"
          />
          <Button onClick={submit} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Link2 className="w-4 h-4 mr-2" />Link</>}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
