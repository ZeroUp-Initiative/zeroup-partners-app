'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import html2canvas from 'html2canvas'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/button'
import { Download, Loader2, Lock } from 'lucide-react'
import { resolveTierStyle, cardNameFor, type DreamTierConfig } from '@/lib/dreamers/tiers'

interface DreamCardProps {
  tier: DreamTierConfig
  name: string
  memberNumber: string
  memberSince: string
  qrValue: string
  locked?: boolean
  unlockHint?: string
  previewOnly?: boolean
}

export function DreamCard({ tier, name, memberNumber, memberSince, qrValue, locked, unlockHint, previewOnly }: DreamCardProps) {
  const frontRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLDivElement>(null)
  const [qr, setQr] = useState('')
  const [downloading, setDownloading] = useState<'front' | 'back' | null>(null)

  useEffect(() => {
    QRCode.toDataURL(qrValue, { margin: 1, width: 240, errorCorrectionLevel: 'M' })
      .then(setQr)
      .catch(() => {})
  }, [qrValue])

  const download = async (which: 'front' | 'back') => {
    const ref = which === 'front' ? frontRef : backRef
    if (!ref.current) return
    setDownloading(which)
    try {
      const canvas = await html2canvas(ref.current, { scale: 4, backgroundColor: null, useCORS: true, logging: false })
      const link = document.createElement('a')
      link.download = `zeroup-${tier.id}-dream-card-${which}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } finally {
      setDownloading(null)
    }
  }

  const style = resolveTierStyle(tier.style)
  const text = style.textOn === 'dark' ? '#141414' : '#ffffff'
  const sub = style.textOn === 'dark' ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.72)'
  const hairline = style.textOn === 'dark' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.16)'
  const stripText = style.textOn === 'dark' ? '#141414' : '#1f1f1f'

  // containerType makes child cqw units scale to the card's width — perfect on any screen.
  const faceStyle = { background: style.gradient, color: text, containerType: 'inline-size' } as CSSProperties

  const displayName = (name || 'Dreamer').toUpperCase()
  const tierUpper = tier.name.toUpperCase()

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {/* ─── FRONT ──────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div
          ref={frontRef}
          className="relative aspect-[856/540] w-full rounded-2xl shadow-2xl overflow-hidden"
          style={faceStyle}
        >
          {/* subtle sheen */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(105deg, rgba(255,255,255,0.16) 0%, transparent 35%, transparent 65%, rgba(255,255,255,0.08) 100%)' }}
          />
          {/* tier-name decoration (only big background element) */}
          <div
            className="absolute font-black leading-none select-none pointer-events-none whitespace-nowrap"
            style={{ right: '-2cqw', bottom: '-3cqw', fontSize: '26cqw', color: hairline, letterSpacing: '-0.04em' }}
          >
            {tierUpper}
          </div>

          {/* content */}
          <div className="relative h-full w-full flex flex-col justify-between" style={{ padding: '6cqw' }}>
            {/* top row — brand & tier */}
            <div className="flex items-start justify-between" style={{ gap: '4cqw' }}>
              <div className="min-w-0">
                <p className="font-extrabold leading-none" style={{ fontSize: '4cqw', letterSpacing: '0.15em' }}>
                  ZEROUP PARTNERS
                </p>
                <p style={{ color: sub, fontSize: '2.4cqw', letterSpacing: '0.22em', marginTop: '1cqw' }}>
                  DREAMERS COMMUNITY
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-extrabold leading-none" style={{ fontSize: '5cqw' }}>{tierUpper}</p>
                <p style={{ color: sub, fontSize: '2.2cqw', letterSpacing: '0.22em', marginTop: '1cqw' }}>MEMBER</p>
              </div>
            </div>

            {/* EMV chip */}
            <div
              className="rounded-md"
              style={{
                width: '13cqw',
                aspectRatio: '4 / 3',
                background: 'linear-gradient(135deg, #f7e7a6, #c8a93a 60%, #9c7d1f)',
                boxShadow: 'inset 0 0 0 0.3cqw rgba(0,0,0,0.2)',
              }}
            />

            {/* card number */}
            <p
              className="font-mono leading-none"
              style={{
                fontSize: '5cqw',
                letterSpacing: '0.08em',
                textShadow: '0 0.3cqw 0.3cqw rgba(0,0,0,0.25)',
              }}
            >
              {memberNumber}
            </p>

            {/* bottom row */}
            <div className="flex items-end justify-between" style={{ gap: '4cqw' }}>
              <div className="min-w-0">
                <p style={{ color: sub, fontSize: '2.1cqw', letterSpacing: '0.22em' }}>CARD HOLDER</p>
                <p className="font-semibold truncate" style={{ fontSize: '3.8cqw', letterSpacing: '0.04em', marginTop: '0.6cqw' }}>
                  {displayName}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p style={{ color: sub, fontSize: '2.1cqw', letterSpacing: '0.22em' }}>MEMBER SINCE</p>
                <p className="font-semibold" style={{ fontSize: '3.4cqw', marginTop: '0.6cqw' }}>{memberSince || '—'}</p>
              </div>
            </div>
          </div>

          {locked && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center text-center"
              style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', gap: '1cqw', padding: '5cqw' }}
            >
              <Lock className="w-7 h-7" />
              <p className="font-semibold" style={{ fontSize: '3cqw' }}>{unlockHint || 'Partner with ZeroUp to unlock'}</p>
            </div>
          )}
        </div>
        {!previewOnly && (
          <Button variant="outline" className="w-full" onClick={() => download('front')} disabled={locked || downloading !== null}>
            {downloading === 'front' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Download front
          </Button>
        )}
      </div>

      {/* ─── BACK ───────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div
          ref={backRef}
          className="relative aspect-[856/540] w-full rounded-2xl shadow-2xl overflow-hidden"
          style={faceStyle}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(105deg, rgba(255,255,255,0.12) 0%, transparent 40%, rgba(255,255,255,0.06) 100%)' }}
          />
          <div className="relative h-full w-full flex flex-col">
            {/* magnetic stripe */}
            <div style={{ marginTop: '5cqw', height: '17cqw', width: '100%', background: '#0b0b0b' }} />

            <div className="flex-1 flex min-h-0" style={{ padding: '5cqw', gap: '4cqw' }}>
              {/* left: signature + tier name + fine print */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <div className="rounded-sm" style={{ background: '#f4f4f5', padding: '1cqw 2cqw' }}>
                    <p
                      className="italic truncate"
                      style={{ color: stripText, fontSize: '3.6cqw', fontFamily: 'cursive', fontWeight: 600 }}
                    >
                      {name || 'Dreamer'}
                    </p>
                  </div>
                  <p style={{ color: sub, fontSize: '2cqw', letterSpacing: '0.2em', marginTop: '1cqw' }}>
                    AUTHORIZED SIGNATURE
                  </p>
                </div>
                <div>
                  <p className="font-bold" style={{ fontSize: '2.8cqw', letterSpacing: '0.2em' }}>
                    {cardNameFor(tier).toUpperCase()}
                  </p>
                  <p style={{ color: sub, fontSize: '2.1cqw', lineHeight: 1.4, marginTop: '0.6cqw' }}>
                    Certifies active membership in the ZeroUp Dreamers Community.
                  </p>
                </div>
              </div>

              {/* right: QR */}
              <div className="flex flex-col items-center justify-center flex-shrink-0">
                <div className="rounded-md" style={{ background: '#ffffff', padding: '1.2cqw' }}>
                  {qr ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={qr} alt="QR" style={{ width: '20cqw', height: '20cqw', display: 'block' }} />
                  ) : (
                    <div style={{ width: '20cqw', height: '20cqw' }} />
                  )}
                </div>
                <p style={{ color: sub, fontSize: '2cqw', letterSpacing: '0.18em', marginTop: '1cqw' }}>SCAN TO VERIFY</p>
              </div>
            </div>
          </div>
        </div>
        {!previewOnly && (
          <Button variant="outline" className="w-full" onClick={() => download('back')} disabled={locked || downloading !== null}>
            {downloading === 'back' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Download back
          </Button>
        )}
      </div>
    </div>
  )
}
