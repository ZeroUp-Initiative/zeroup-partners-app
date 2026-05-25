"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Camera, Loader2, CheckCircle2, XCircle, BadgePercent, RotateCcw, Crown } from "lucide-react"

interface VerifyResult {
  merchantName: string
  discount: string
  requiredTierName: string | null
  eligible: boolean
  dreamer: { name: string; tier: string | null }
}

type Mode = "idle" | "scanning" | "result" | "done"

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

export default function MerchantVerifyPage() {
  const [code, setCode] = useState("")
  const [mode, setMode] = useState<Mode>("idle")
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [dreamerId, setDreamerId] = useState("")
  const [redeeming, setRedeeming] = useState(false)
  const [doneMsg, setDoneMsg] = useState("")
  const [error, setError] = useState("")
  const scannerRef = useRef<any>(null)
  const processingRef = useRef(false)

  useEffect(() => {
    const m = new URLSearchParams(window.location.search).get("m")
    if (m) setCode(m.toUpperCase())
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
      const res = await fetch("/api/merchant/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchantCode: code, dreamerId: id }),
      })
      const d = await res.json()
      if (!res.ok) {
        setError(d.error || "Could not verify.")
        setMode("idle")
        return
      }
      setDreamerId(id)
      setResult(d)
      setMode("result")
    } catch {
      setError("Could not read that card.")
      setMode("idle")
    } finally {
      processingRef.current = false
    }
  }, [code, stopScanner])

  useEffect(() => {
    if (mode !== "scanning") return
    let cancelled = false
    ;(async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode")
        if (cancelled) return
        const html5 = new Html5Qrcode("merchant-qr")
        scannerRef.current = html5
        await html5.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 240, height: 240 } }, (t: string) => onScan(t), () => {})
      } catch (e: any) {
        setError(e?.message || "Couldn't start the camera.")
        setMode("idle")
      }
    })()
    return () => { cancelled = true; stopScanner() }
  }, [mode, onScan, stopScanner])

  useEffect(() => () => { stopScanner() }, [stopScanner])

  const redeem = async () => {
    setRedeeming(true)
    try {
      const res = await fetch("/api/merchant/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchantCode: code, dreamerId }),
      })
      const d = await res.json()
      setDoneMsg(d.message || (res.ok ? "Discount applied." : d.error || "Failed."))
      setMode("done")
    } catch {
      setDoneMsg("Something went wrong.")
      setMode("done")
    } finally {
      setRedeeming(false)
    }
  }

  const reset = () => { setResult(null); setDreamerId(""); setDoneMsg(""); setError(""); setMode("scanning") }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-md space-y-5">
        <div className="text-center">
          <BadgePercent className="w-10 h-10 mx-auto text-primary mb-2" />
          <h1 className="text-2xl font-bold">Dreamer Card Verify</h1>
          <p className="text-sm text-muted-foreground">Scan a Dreamer's card to apply their discount.</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-2">
            <Label>Merchant code</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Your verify code" className="font-mono" />
          </CardContent>
        </Card>

        {error && <p className="text-sm text-destructive text-center">{error}</p>}

        {(mode === "idle") && (
          <Card><CardContent className="pt-6 text-center space-y-4">
            <Camera className="w-12 h-12 mx-auto text-muted-foreground" />
            <Button className="w-full" disabled={!code.trim()} onClick={() => { setError(""); setMode("scanning") }}>Start scanning</Button>
            {!code.trim() && <p className="text-xs text-muted-foreground">Enter your merchant code to begin.</p>}
          </CardContent></Card>
        )}

        {mode === "scanning" && (
          <Card>
            <CardHeader><CardTitle className="text-base">Point at the card's QR</CardTitle></CardHeader>
            <CardContent>
              <div id="merchant-qr" className="w-full overflow-hidden rounded-lg" />
              <Button variant="outline" className="w-full mt-4" onClick={() => { stopScanner(); setMode("idle") }}>Cancel</Button>
            </CardContent>
          </Card>
        )}

        {mode === "result" && result && (
          <Card>
            <CardContent className="pt-6 text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-sm font-semibold">
                <Crown className="w-4 h-4" /> {result.dreamer.tier ? `${result.dreamer.tier} Dreamer` : "ZeroUp Dreamer"}
              </div>
              <p className="text-lg font-bold">{result.dreamer.name}</p>
              {result.eligible ? (
                <>
                  <CheckCircle2 className="w-12 h-12 mx-auto text-green-500" />
                  <p className="font-semibold text-green-600">Eligible — {result.discount}</p>
                  <Button className="w-full" onClick={redeem} disabled={redeeming}>
                    {redeeming ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BadgePercent className="w-4 h-4 mr-2" />}
                    Apply {result.discount}
                  </Button>
                </>
              ) : (
                <>
                  <XCircle className="w-12 h-12 mx-auto text-destructive" />
                  <p className="text-muted-foreground">Not eligible — requires {result.requiredTierName} tier or higher.</p>
                </>
              )}
              <Button variant="ghost" className="w-full" onClick={reset}>Scan next</Button>
            </CardContent>
          </Card>
        )}

        {mode === "done" && (
          <Card><CardContent className="pt-6 text-center space-y-4">
            <CheckCircle2 className="w-14 h-14 mx-auto text-green-500" />
            <p className="font-semibold text-lg">{doneMsg}</p>
            <Button className="w-full" onClick={reset}><RotateCcw className="w-4 h-4 mr-2" /> Scan next</Button>
          </CardContent></Card>
        )}
      </div>
    </div>
  )
}
