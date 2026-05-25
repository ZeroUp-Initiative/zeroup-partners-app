"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { auth } from "@/lib/firebase/client"
import { useAuth } from "@/contexts/auth-context"
import ProtectedRoute from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { resolveTierStyle } from "@/lib/dreamers/tiers"
import { ArrowLeft, Camera, Loader2, CheckCircle2, XCircle, Crown, RotateCcw } from "lucide-react"

interface EventItem { id: string; title: string; reward: number; isActive: boolean }
interface ScannedProfile {
  id: string
  name: string
  username: string | null
  photoUrl: string | null
  memberSince: string
  partneredTotal: number
  tier: { name: string; style: string } | null
}

type Mode = "idle" | "scanning" | "profile" | "result"

function parseDreamerId(text: string): string | null {
  try {
    const u = new URL(text)
    const parts = u.pathname.split("/").filter(Boolean)
    const i = parts.indexOf("dreamer")
    if (i >= 0 && parts[i + 1]) return parts[i + 1]
    return parts.pop() || null
  } catch {
    return text.trim() || null
  }
}

function ScannerPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<EventItem[]>([])
  const [eventId, setEventId] = useState("")
  const [mode, setMode] = useState<Mode>("idle")
  const [profile, setProfile] = useState<ScannedProfile | null>(null)
  const [result, setResult] = useState<{ ok: boolean; already?: boolean; awarded?: number; message: string } | null>(null)
  const [checkingIn, setCheckingIn] = useState(false)
  const [camError, setCamError] = useState("")
  const scannerRef = useRef<any>(null)
  const processingRef = useRef(false)

  useEffect(() => {
    ;(async () => {
      const idToken = await auth?.currentUser?.getIdToken()
      const res = await fetch("/api/admin/events", { headers: { Authorization: `Bearer ${idToken}` } })
      const d = await res.json()
      const active = (d?.events || []).filter((e: EventItem) => e.isActive)
      setEvents(active)
      if (active.length === 1) setEventId(active[0].id)
    })().catch(() => {})
  }, [])

  const stopScanner = useCallback(async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop()
        await scannerRef.current.clear()
        scannerRef.current = null
      }
    } catch {
      /* ignore */
    }
  }, [])

  const onScan = useCallback(async (text: string) => {
    if (processingRef.current) return
    const id = parseDreamerId(text)
    if (!id) return
    processingRef.current = true
    await stopScanner()
    try {
      const res = await fetch(`/api/dreamer/${id}`)
      if (!res.ok) {
        setResult({ ok: false, message: "Not a valid Dreamer card." })
        setMode("result")
        return
      }
      const d = await res.json()
      setProfile({ id, ...d })
      setMode("profile")
    } catch {
      setResult({ ok: false, message: "Could not read that card." })
      setMode("result")
    } finally {
      processingRef.current = false
    }
  }, [stopScanner])

  // Start camera when entering scanning mode
  useEffect(() => {
    if (mode !== "scanning") return
    let cancelled = false
    ;(async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode")
        if (cancelled) return
        const html5 = new Html5Qrcode("qr-reader")
        scannerRef.current = html5
        await html5.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decoded: string) => onScan(decoded),
          () => {},
        )
      } catch (e: any) {
        setCamError(e?.message || "Couldn't start the camera. Check permissions.")
        setMode("idle")
      }
    })()
    return () => {
      cancelled = true
      stopScanner()
    }
  }, [mode, onScan, stopScanner])

  useEffect(() => () => { stopScanner() }, [stopScanner])

  const selectedEvent = events.find((e) => e.id === eventId)

  const checkIn = async () => {
    if (!profile || !eventId) return
    setCheckingIn(true)
    try {
      const idToken = await auth?.currentUser?.getIdToken()
      const res = await fetch("/api/dreamers/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ eventId, dreamerId: profile.id }),
      })
      const d = await res.json()
      if (!res.ok) {
        setResult({ ok: false, message: d.error || "Check-in failed." })
      } else if (d.already) {
        setResult({ ok: true, already: true, message: `${profile.name} was already checked in.` })
      } else {
        setResult({ ok: true, awarded: d.awarded, message: `${profile.name} checked in! +${(d.awarded || 0).toLocaleString()} DR` })
      }
      setMode("result")
    } catch {
      setResult({ ok: false, message: "Something went wrong." })
      setMode("result")
    } finally {
      setCheckingIn(false)
    }
  }

  const reset = () => {
    setProfile(null)
    setResult(null)
    setMode(eventId ? "scanning" : "idle")
  }

  if (!user || user.role !== "admin") return <p>You do not have permission to view this page.</p>

  const tierStyle = profile?.tier ? resolveTierStyle(profile.tier.style) : null

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <Link href="/admin/events" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Events
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Check-in Scanner</h1>
        <p className="text-sm text-muted-foreground">Scan a Dreamer's card to check them into an event.</p>
      </div>

      {/* Event picker */}
      <Card>
        <CardContent className="pt-6 space-y-2">
          <Label>Event</Label>
          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select an active event…</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>{e.title} ({e.reward.toLocaleString()} DR)</option>
            ))}
          </select>
          {events.length === 0 && <p className="text-xs text-muted-foreground">No active events. Create one first.</p>}
        </CardContent>
      </Card>

      {/* Scanner / states */}
      {mode === "idle" && (
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            {camError && <p className="text-sm text-destructive">{camError}</p>}
            <Camera className="w-12 h-12 mx-auto text-muted-foreground" />
            <Button className="w-full" disabled={!eventId} onClick={() => { setCamError(""); setMode("scanning") }}>
              Start scanning
            </Button>
            {!eventId && <p className="text-xs text-muted-foreground">Select an event to begin.</p>}
          </CardContent>
        </Card>
      )}

      {mode === "scanning" && (
        <Card>
          <CardHeader><CardTitle className="text-base">Point at the card's QR</CardTitle><CardDescription>{selectedEvent?.title}</CardDescription></CardHeader>
          <CardContent>
            <div id="qr-reader" className="w-full overflow-hidden rounded-lg" />
            <Button variant="outline" className="w-full mt-4" onClick={() => { stopScanner(); setMode("idle") }}>Cancel</Button>
          </CardContent>
        </Card>
      )}

      {mode === "profile" && profile && (
        <Card className="overflow-hidden">
          <div className="p-5 text-center" style={{ background: tierStyle?.gradient || "linear-gradient(135deg,#3b0764,#7c3aed)", color: tierStyle?.textOn === "dark" ? "#141414" : "#fff" }}>
            <div className="w-20 h-20 rounded-full mx-auto overflow-hidden ring-4 ring-white/40 bg-white/20 flex items-center justify-center mb-2">
              {profile.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.photoUrl} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold">{profile.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <h2 className="text-xl font-extrabold">{profile.name}</h2>
            {profile.username && <p className="opacity-80 text-sm">@{profile.username}</p>}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-sm font-semibold mt-2">
              <Crown className="w-4 h-4" /> {profile.tier ? `${profile.tier.name} Dreamer` : "ZeroUp Dreamer"}
            </div>
          </div>
          <CardContent className="pt-4 space-y-3">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total partnered</span><span className="font-semibold">₦{profile.partneredTotal.toLocaleString()}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Member since</span><span className="font-semibold">{profile.memberSince || "—"}</span></div>
            <Button className="w-full" onClick={checkIn} disabled={checkingIn}>
              {checkingIn ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Check in to {selectedEvent?.title}
            </Button>
            <Button variant="ghost" className="w-full" onClick={reset}>Cancel</Button>
          </CardContent>
        </Card>
      )}

      {mode === "result" && result && (
        <Card>
          <CardContent className="pt-6 text-center space-y-4">
            {result.ok ? <CheckCircle2 className="w-14 h-14 mx-auto text-green-500" /> : <XCircle className="w-14 h-14 mx-auto text-destructive" />}
            <p className="font-semibold text-lg">{result.message}</p>
            <Button className="w-full" onClick={reset}><RotateCcw className="w-4 h-4 mr-2" /> Scan next</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function ProtectedScannerPage() {
  return (
    <ProtectedRoute>
      <ScannerPage />
    </ProtectedRoute>
  )
}
