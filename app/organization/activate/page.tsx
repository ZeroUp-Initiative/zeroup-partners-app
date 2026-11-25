'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, Eye, EyeOff, Loader2 } from 'lucide-react'
import { MIN_PASSWORD } from '@/lib/organizations'

type Stage = 'checking' | 'ready' | 'invalid'

export default function ActivateOrganizationPage() {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('checking')
  const [link, setLink] = useState<{ id: string; token: string } | null>(null)
  const [org, setOrg] = useState<{ name: string; email: string } | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const [id, token] = window.location.hash.slice(1).split('.')
    if (!id || !token) {
      setError('This activation link is incomplete. Open it straight from your email.')
      setStage('invalid')
      return
    }
    setLink({ id, token })
    fetch('/api/organizations/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, token }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'This link could not be checked.')
        setOrg(data)
        setStage('ready')
      })
      .catch((e) => {
        setError(e.message)
        setStage('invalid')
      })
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!link || !org) return
    if (password.length < MIN_PASSWORD) return setError(`Use at least ${MIN_PASSWORD} characters.`)
    if (password !== confirm) return setError("The passwords don't match.")
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/organizations/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...link, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Activation did not go through. Try again.')
      // Drop the used token from the address bar and history
      window.history.replaceState(null, '', window.location.pathname)
      try {
        await signInWithEmailAndPassword(auth, data.email, password)
        router.push('/dashboard/organization')
      } catch {
        router.push('/login')
      }
    } catch (err: any) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-editorial-cream p-4">
      <div className="w-full max-w-md rounded-2xl border border-editorial-border bg-white p-5 shadow-sm sm:p-8">
        {stage === 'checking' && (
          <p className="flex items-center gap-2 text-sm text-editorial-muted" role="status">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking your link
          </p>
        )}

        {stage === 'invalid' && (
          <div className="space-y-4">
            <h1 className="font-display text-2xl font-bold text-editorial-navy">Link not valid</h1>
            <p className="text-sm text-editorial-ink">{error}</p>
            <Link href="/login" className="inline-flex min-h-[44px] items-center text-sm font-medium text-editorial-navy underline">
              Already activated? Log in
            </Link>
          </div>
        )}

        {stage === 'ready' && org && (
          <form onSubmit={submit} className="space-y-5">
            <div>
              <Building2 className="mb-3 h-8 w-8 text-editorial-navy" aria-hidden />
              <h1 className="font-display text-2xl font-bold text-editorial-navy">Activate {org.name}</h1>
              <p className="mt-1 break-words text-sm text-editorial-muted">You&apos;ll log in with {org.email}.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="org-password">Password</Label>
              <div className="relative">
                <Input
                  id="org-password"
                  type={show ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? 'Hide password' : 'Show password'}
                  className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-editorial-muted hover:text-editorial-navy"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-editorial-muted">At least {MIN_PASSWORD} characters.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="org-confirm">Confirm password</Label>
              <Input
                id="org-confirm"
                type={show ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
            <Button type="submit" disabled={busy} className="h-11 w-full bg-editorial-navy text-editorial-cream hover:bg-editorial-navy-deep">
              {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Activating</> : 'Activate account'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
