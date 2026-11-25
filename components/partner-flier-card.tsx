"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Loader2, RefreshCw, Share2 } from "lucide-react"
import { CARD_SIZE, renderPartnerCard, type PartnerCardFormat } from "@/lib/partner-card"
import toast from "react-hot-toast"

export interface PartnerFlierCardProps {
  variant?: "top-partner" | "regular"
  name: string
  amount: number
  photoURL?: string
  month: string
  year: number
  /** Project being celebrated. Omit for an overall "ZeroUp partner" card. */
  projectTitle?: string
  projectImageURL?: string
  customMessage?: string
  showDownload?: boolean
  className?: string
}

const FORMATS: { id: PartnerCardFormat; label: string }[] = [
  { id: "post", label: "Post" },
  { id: "story", label: "Story / Status" },
]

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
}

function supportsFileShare() {
  try {
    return !!navigator.canShare?.({ files: [new File([""], "card.png", { type: "image/png" })] })
  } catch {
    return false
  }
}

export function PartnerFlierCard({
  variant = "regular",
  name,
  amount,
  photoURL,
  month,
  year,
  projectTitle,
  projectImageURL,
  customMessage,
  showDownload = true,
  className = "",
}: PartnerFlierCardProps) {
  const [format, setFormat] = useState<PartnerCardFormat>("post")
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [isTouch, setIsTouch] = useState(false)
  const [canShare, setCanShare] = useState(false)

  useEffect(() => {
    setIsTouch(window.matchMedia("(pointer: coarse)").matches)
    setCanShare(supportsFileShare())
  }, [])

  const fileName = useMemo(() => {
    const slug = (name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "partner"
    return `zeroup-partner-${slug}-${month.toLowerCase()}-${year}-${format}.png`
  }, [name, month, year, format])

  // The image is made ahead of the tap: iOS only opens the share sheet directly
  // from a tap, with no waiting in between.
  useEffect(() => {
    let cancelled = false
    let url: string | null = null
    setFile(null)
    setFailed(false)
    const timer = setTimeout(async () => {
      try {
        const blob = await renderPartnerCard(
          { variant, name, amount, month, year, photoURL, projectTitle, projectImageURL, message: customMessage },
          format,
        )
        if (cancelled) return
        url = URL.createObjectURL(blob)
        setFile(new File([blob], fileName, { type: "image/png" }))
        setPreviewUrl(url)
      } catch (err) {
        console.error("Partner card could not be created:", err)
        if (!cancelled) setFailed(true)
      }
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
      // The old preview stays on screen until the next one is ready.
      const old = url
      if (old) setTimeout(() => URL.revokeObjectURL(old), 30000)
    }
  }, [variant, name, amount, month, year, photoURL, projectTitle, projectImageURL, customMessage, format, fileName, attempt])

  const share = async () => {
    if (!file) return
    try {
      await navigator.share({ files: [file] })
    } catch (err: any) {
      if (err?.name !== "AbortError") toast.error("Sharing didn't open. Press and hold the card to save it.")
    }
  }

  const download = () => {
    if (!file) return
    // iPhones save photos through the share sheet ("Save Image").
    if (isIOS() && canShare) return void share()
    const url = URL.createObjectURL(file)
    const link = document.createElement("a")
    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 60000)
    toast.success(isTouch ? "Saving your card. If it doesn't appear, press and hold the card." : "Card downloaded.")
  }

  const { w, h } = CARD_SIZE[format]

  return (
    <div className={`mx-auto w-full max-w-[420px] ${className}`}>
      {showDownload && (
        <div role="group" aria-label="Card size" className="mb-3 grid grid-cols-2 gap-1 rounded-lg border bg-muted p-1">
          {FORMATS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={format === f.id}
              onClick={() => setFormat(f.id)}
              className={`min-h-10 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                format === f.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      <div className="mx-auto" style={{ maxWidth: format === "story" ? 300 : undefined }}>
        <div className="relative w-full overflow-hidden rounded-xl bg-editorial-navy shadow-lg" style={{ aspectRatio: `${w} / ${h}` }}>
          {previewUrl && !failed && (
            // eslint-disable-next-line @next/next/no-img-element -- local blob; a plain <img> is what press-and-hold can save
            <img
              src={previewUrl}
              alt={`Partner card for ${name}`}
              className={`block h-full w-full object-contain transition-opacity ${file ? "opacity-100" : "opacity-40"}`}
            />
          )}
          {!file && !failed && (
            <div className="absolute inset-0 grid place-items-center text-editorial-cream" role="status">
              <span className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Making your card</span>
            </div>
          )}
          {failed && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center text-editorial-cream" role="alert">
              <div className="space-y-3">
                <p className="text-sm">Your card couldn&apos;t be made. Check your connection and try again.</p>
                <Button type="button" variant="secondary" onClick={() => setAttempt((a) => a + 1)}>
                  <RefreshCw className="mr-2 h-4 w-4" /> Try again
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showDownload && !failed && (
        <div className="mt-4 space-y-2" data-download-btn>
          <div className={`grid gap-2 ${canShare ? "grid-cols-2" : "grid-cols-1"}`}>
            <Button type="button" onClick={download} disabled={!file} className="h-12 w-full">
              <Download className="mr-2 h-4 w-4" /> Download
            </Button>
            {canShare && (
              <Button type="button" variant="outline" onClick={share} disabled={!file} className="h-12 w-full">
                <Share2 className="mr-2 h-4 w-4" /> Share
              </Button>
            )}
          </div>
          {isTouch && (
            <p className="text-center text-xs text-muted-foreground">You can also press and hold the card to save it.</p>
          )}
        </div>
      )}
    </div>
  )
}

// Modal version for showing partner flier in a dialog
interface PartnerFlierModalProps {
  trigger: React.ReactNode
  partner: {
    name: string
    amount: number
    photoURL?: string
    month?: string
    year?: number
  }
  variant?: "top-partner" | "regular"
  customMessage?: string
}

export function PartnerFlierModal({
  trigger,
  partner,
  variant = "regular",
  customMessage,
}: PartnerFlierModalProps) {
  const now = new Date()
  const month = partner.month || now.toLocaleString("default", { month: "long" })
  const year = partner.year || now.getFullYear()

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[92dvh] max-w-md overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="sr-only">
          <DialogTitle>Partner Recognition Card</DialogTitle>
        </DialogHeader>
        <PartnerFlierCard
          variant={variant}
          name={partner.name}
          amount={partner.amount}
          photoURL={partner.photoURL}
          month={month}
          year={year}
          customMessage={customMessage}
          showDownload={true}
        />
      </DialogContent>
    </Dialog>
  )
}
